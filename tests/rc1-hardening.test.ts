import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind } from "typescript";
import * as usageRules from "../src/lib/farmmate/usage/rules";
import * as crypto from "node:crypto";
import { legacyFarmToolGate } from "../src/lib/farmmate/legacy-tool-access";
import { mamaGPublicText } from "../src/lib/farmmate/public-name";
import { boundedJsonRequest, createFarmMateRequestGate, FarmMateRequestTimeout } from "../src/lib/farmmate/request-limits";
import { generateFarmMateNaturalAnswer } from "../src/lib/farmmate/ai/service";
import { analyzeCropDoctorImageWithOpenAI } from "../src/lib/farmmate/ai/vision";
import { buildFarmMateResponse } from "../src/lib/farmmate/decision-engine";
import { explicitChemicalSafetyAnswer } from "../src/lib/farmmate/chemical-safety";
import { replayFarmMateRequest } from "../src/lib/farmmate/request-replay";

async function main() {
  assert.equal(mamaGPublicText("Ask FarmMate: FarmMate AI is temporarily limited."), "Ask Mama G: Mama G AI is temporarily limited.");
  assert.equal(mamaGPublicText("/api/farmmate/ask ask_farmmate"), "/api/farmmate/ask ask_farmmate");
  let calls = 0;
  let signal: AbortSignal | null | undefined;
  const stalled: typeof fetch = async (_input, init) => {
    calls += 1;
    signal = init?.signal;
    return new Promise<Response>(() => undefined);
  };
  await assert.rejects(boundedJsonRequest("https://mock.invalid", {}, 10, stalled), FarmMateRequestTimeout);
  assert.equal(signal?.aborted, true, "timeout aborts upstream");
  assert.equal(calls, 1, "timeout never retries automatically");

  let lateResponse!: (response: Response) => void;
  const late: typeof fetch = async () => new Promise<Response>((resolve) => { lateResponse = resolve; });
  await assert.rejects(boundedJsonRequest("https://mock.invalid", {}, 10, late), FarmMateRequestTimeout);
  lateResponse(new Response(JSON.stringify({ answer: "late answer" })));

  const stalledBody: typeof fetch = async () => ({ json: () => new Promise(() => undefined) }) as Response;
  await assert.rejects(boundedJsonRequest("https://mock.invalid", {}, 10, stalledBody), FarmMateRequestTimeout);
  const normal: typeof fetch = async () => new Response(JSON.stringify({ answer: "complete" }));
  assert.equal((await boundedJsonRequest<{ answer: string }>("https://mock.invalid", {}, 50, normal)).data.answer, "complete");

  const gate = createFarmMateRequestGate();
  const first = gate.start();
  assert.notEqual(first, null);
  assert.equal(gate.start(), null, "same-tick duplicate is refused");
  gate.invalidate();
  const next = gate.start();
  assert.equal(gate.isCurrent(first!), false, "replaced response is stale");
  gate.finish(first!);
  assert.equal(gate.isCurrent(next!), true, "late completion cannot clear new lock");
  gate.finish(next!);
  assert.notEqual(gate.start(), null, "manual retry after completion is allowed");

  let executions = 0;
  let complete!: () => void;
  const operation = async () => {
    executions += 1;
    await new Promise<void>((resolve) => { complete = resolve; });
    return Response.json({ ok: true, answer: "one model result" });
  };
  const firstRequest = replayFarmMateRequest("same-request", "same-device", operation);
  const duplicateRequest = replayFarmMateRequest("same-request", "same-device", operation);
  await Promise.resolve();
  const competing = await replayFarmMateRequest("different-request", "same-device", operation);
  assert.equal(competing.status, 409, "parallel new requests for same device rejected");
  complete();
  assert.deepEqual(await (await firstRequest).json(), await (await duplicateRequest).json());
  await replayFarmMateRequest("same-request", "same-device", operation);
  assert.equal(executions, 1, "network/manual replay uses same result, no repeated paid operation");

  const rows = new Set<string>();
  const usageExports: Record<string, (...args: any[]) => Promise<any>> = {};
  const usageCode = transpileModule(readFileSync("src/lib/farmmate/usage/server.ts", "utf8"), { compilerOptions: { module: ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  runInNewContext(usageCode, {
    exports: usageExports,
    process: { env: { NODE_ENV: "production", FARMMATE_USAGE_HASH_SALT: "isolated-mock" } },
    console, AbortSignal,
    require: (path: string) => {
      if (path === "node:crypto") return crypto;
      if (path === "./rules") return usageRules;
      if (path === "../../supabase/admin") return {
        hasSupabaseAdminConfig: () => true,
        insertSupabaseRecord: async (_table: string, row: { id: string }, options: { signal: AbortSignal }) => {
          assert.ok(options.signal, "usage operation has a bounded abort signal");
          if (rows.has(row.id)) return { status: 409, error: "duplicate key" };
          rows.add(row.id);
          return { status: 201, data: row };
        }
      };
      throw new Error(`Unexpected dependency: ${path}`);
    }
  });
  const usageInput = { anonymousDeviceId: "mock-device", tool: "ask_farmmate", requestId: "fm-mock-initial-consultation" };
  assert.equal((await usageExports.recordFarmMateUsageForDevice(usageInput)).recorded, true);
  const replayUsage = await usageExports.recordFarmMateUsageForDevice(usageInput);
  assert.equal(replayUsage.recorded, false);
  assert.equal(replayUsage.replayed, true);
  assert.equal(rows.size, 1, "same initial consultation cannot add a second initial usage row");

  for (const file of ["farmer-assistant", "crop-health", "crop-health-reports"]) {
    const routeExports: Record<string, (...args: any[]) => Promise<Response>> = {};
    const code = transpileModule(readFileSync(`src/app/api/${file}/route.ts`, "utf8"), { compilerOptions: { module: ModuleKind.CommonJS } }).outputText;
    runInNewContext(code, {
      exports: routeExports,
      require: (path: string) => path === "@/lib/farmmate/legacy-tool-access" ? { legacyFarmToolGate } : {},
      Response
    });
    const request = { json() { throw new Error("Closed endpoint must not parse request"); }, formData() { throw new Error("Closed endpoint must not accept photo"); } };
    assert.equal((await routeExports.POST(request)).status, 503);
    if (routeExports.GET) assert.equal((await routeExports.GET(request)).status, 503);
  }

  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalTimeout = globalThis.setTimeout;
  const input = {
    farmerQuestion: "My maize leaves are yellow",
    brain: buildFarmMateResponse("My maize leaves are yellow"),
    farmerAnswers: [],
    localStructuredResponse: []
  };
  try {
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = async () => { throw new Error("Unexpected network call"); };
    assert.deepEqual(await generateFarmMateNaturalAnswer(input), { ok: false, reason: "missing_api_key", fallback: true });
    assert.deepEqual(await analyzeCropDoctorImageWithOpenAI({ mimeType: "image/png", base64Image: "test" }), { ok: false, reason: "missing_api_key", fallback: true });

    process.env.OPENAI_API_KEY = "mock-only-not-a-credential";
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    assert.equal((await generateFarmMateNaturalAnswer(input)).ok, false);
    assert.equal((await analyzeCropDoctorImageWithOpenAI({ mimeType: "image/png", base64Image: "test" })).ok, false);

    globalThis.fetch = async () => new Response(JSON.stringify({ output_text: "not JSON" }));
    assert.deepEqual(await analyzeCropDoctorImageWithOpenAI({ mimeType: "image/png", base64Image: "test" }), { ok: false, reason: "invalid_response", fallback: true });

    globalThis.setTimeout = ((callback: (...args: unknown[]) => void) => originalTimeout(callback, 10)) as typeof setTimeout;
    globalThis.fetch = stalled;
    assert.deepEqual(await generateFarmMateNaturalAnswer(input), { ok: false, reason: "model_timeout", fallback: true });
    assert.deepEqual(await analyzeCropDoctorImageWithOpenAI({ mimeType: "image/png", base64Image: "test" }), { ok: false, reason: "model_timeout", fallback: true });
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalTimeout;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }

  for (const prompt of ["Tell me the exact pesticide dosage to spray on my tomato leaves. I want to double the label rate to kill pests faster.", "Can I double the label dose of pesticide on maize?", "Can I mix two pesticides in my sprayer?"]) {
    const answer = explicitChemicalSafetyAnswer(prompt);
    assert.ok(answer);
    assert.ok(answer?.startsWith("Do not exceed the product label rate"));
    assert.ok(answer.includes("qualified local extension officer"));
    assert.equal(/\d/.test(answer), false, "no invented numeric rates");
  }
  assert.equal(explicitChemicalSafetyAnswer("My maize leaves are yellow"), null);
  console.log("PASS RC1 hardening: mocked timeout, body stall, unavailable/missing model, no automatic retry, duplicate/stale response gate, and explicit chemical safety.");
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
