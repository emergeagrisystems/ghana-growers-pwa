import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  collectHqApprovalCounts,
  consumeHqIntegrationNonce,
  createHqIntegrationSignature,
  hqApprovalCountsPath,
  hqSignaturePayload,
  verifyHqIntegrationRequest,
  type HqApprovalCountSources,
  type HqNonceConsumer
} from "../src/lib/hqApprovalCounts";
import {
  hqApprovalCountsPrelaunchPath,
  isHqApprovalCountsPrelaunchRoute
} from "../src/lib/prelaunchAccess";
import { callSupabaseRpc } from "../src/lib/supabase/admin";

const secret = "hq-integration-test-secret-that-is-at-least-thirty-two-characters";
const nowMs = Date.UTC(2026, 6, 26, 16, 0, 0);
const timestamp = String(Math.floor(nowMs / 1000));
const nonce = "123e4567-e89b-42d3-a456-426614174000";
const secondNonce = "123e4567-e89b-42d3-a456-426614174001";

function validSignature(requestNonce = nonce, requestTimestamp = timestamp) {
  return createHqIntegrationSignature({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp: requestTimestamp,
    nonce: requestNonce,
    secret
  });
}

function atomicNonceConsumer(): HqNonceConsumer {
  const seen = new Set<string>();

  return async (nonceValue) => {
    await Promise.resolve();

    if (seen.has(nonceValue)) {
      return false;
    }

    seen.add(nonceValue);
    return true;
  };
}

async function authorizeOnce({
  requestNonce,
  signature,
  consume
}: {
  requestNonce: string;
  signature: string;
  consume: HqNonceConsumer;
}) {
  const verified = verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    nonce: requestNonce,
    signature,
    secret,
    nowMs
  });

  if (!verified) {
    return false;
  }

  return consumeHqIntegrationNonce({
    nonce: requestNonce,
    timestamp,
    consume
  });
}

function sources(overrides: Partial<HqApprovalCountSources> = {}): HqApprovalCountSources {
  return {
    farmerProfileApplicationsPending: async () => 4,
    importedFarmersPendingReview: async () => 7,
    supplierApplicationsPending: async () => 3,
    ...overrides
  };
}

test("accepts a valid HMAC signature", () => {
  assert.equal(
    hqSignaturePayload("GET", hqApprovalCountsPath, timestamp, nonce),
    `GET\n${hqApprovalCountsPath}\n${timestamp}\n${nonce}`
  );
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    nonce,
    signature: validSignature(),
    secret,
    nowMs
  }), true);
});

test("rejects a missing signature", () => {
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    nonce,
    signature: null,
    secret,
    nowMs
  }), false);
});

test("rejects an incorrect signature", () => {
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    nonce,
    signature: "0".repeat(64),
    secret,
    nowMs
  }), false);
});

test("rejects an expired timestamp", () => {
  const expiredTimestamp = String(Math.floor((nowMs - (5 * 60 * 1000) - 1_000) / 1000));
  const expiredSignature = createHqIntegrationSignature({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp: expiredTimestamp,
    nonce,
    secret
  });

  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp: expiredTimestamp,
    nonce,
    signature: expiredSignature,
    secret,
    nowMs
  }), false);
});

test("first valid request succeeds and an identical replay is rejected", async () => {
  const consume = atomicNonceConsumer();
  const signature = validSignature();

  assert.equal(await authorizeOnce({ requestNonce: nonce, signature, consume }), true);
  assert.equal(await authorizeOnce({ requestNonce: nonce, signature, consume }), false);
});

test("two simultaneous identical requests produce exactly one success", async () => {
  const consume = atomicNonceConsumer();
  const signature = validSignature();
  const results = await Promise.all([
    authorizeOnce({ requestNonce: nonce, signature, consume }),
    authorizeOnce({ requestNonce: nonce, signature, consume })
  ]);

  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(results.filter((accepted) => !accepted).length, 1);
});

test("server-side RPC calls bypass the Next.js data cache", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let cachedResponse: Response | undefined;
  let databaseCalls = 0;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  globalThis.fetch = async (_input, init) => {
    if (init?.cache !== "no-store" && cachedResponse) {
      return cachedResponse.clone();
    }

    databaseCalls += 1;
    const response = Response.json(databaseCalls === 1);

    if (init?.cache !== "no-store") {
      cachedResponse = response.clone();
    }

    return response;
  };

  try {
    const first = await callSupabaseRpc<boolean>("consume_hq_integration_nonce", {
      p_nonce_value: nonce,
      p_expires_at: new Date(nowMs + (5 * 60 * 1000)).toISOString()
    });
    const replay = await callSupabaseRpc<boolean>("consume_hq_integration_nonce", {
      p_nonce_value: nonce,
      p_expires_at: new Date(nowMs + (5 * 60 * 1000)).toISOString()
    });

    assert.equal(first.data, true);
    assert.equal(replay.data, false);
    assert.equal(databaseCalls, 2);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
  }
});

test("same timestamp with different valid nonces succeeds", async () => {
  const consume = atomicNonceConsumer();

  const results = await Promise.all([
    authorizeOnce({ requestNonce: nonce, signature: validSignature(nonce), consume }),
    authorizeOnce({ requestNonce: secondNonce, signature: validSignature(secondNonce), consume })
  ]);

  assert.deepEqual(results, [true, true]);
});

test("signature verification fails if the nonce changes", () => {
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    nonce: secondNonce,
    signature: validSignature(nonce),
    secret,
    nowMs
  }), false);
});

test("missing, malformed, and oversized nonces are rejected", () => {
  for (const invalidNonce of [null, "not-a-uuid", `${nonce}0`]) {
    assert.equal(verifyHqIntegrationRequest({
      method: "GET",
      requestPath: hqApprovalCountsPath,
      timestamp,
      nonce: invalidNonce,
      signature: validSignature(),
      secret,
      nowMs
    }), false);
  }
});

test("returns all successful counts with independent availability", async () => {
  const generatedAt = new Date("2026-07-26T16:00:00.000Z");
  const result = await collectHqApprovalCounts(sources(), { now: () => generatedAt });

  assert.equal(result.completeFailure, false);
  assert.deepEqual(result.response, {
    farmerProfileApplicationsPending: 4,
    importedFarmersPendingReview: 7,
    supplierApplicationsPending: 3,
    generatedAt: generatedAt.toISOString(),
    availability: {
      farmerProfileApplicationsPending: "available",
      importedFarmersPendingReview: "available",
      supplierApplicationsPending: "available"
    }
  });
});

test("marks one failed source unavailable without zeroing it or hiding successful counts", async () => {
  const result = await collectHqApprovalCounts(sources({
    importedFarmersPendingReview: async () => { throw new Error("source failed"); }
  }));

  assert.equal(result.completeFailure, false);
  assert.equal(result.response.farmerProfileApplicationsPending, 4);
  assert.equal(result.response.importedFarmersPendingReview, null);
  assert.equal(result.response.supplierApplicationsPending, 3);
  assert.equal(result.response.availability.importedFarmersPendingReview, "unavailable");
});

test("marks a complete source failure unavailable and suitable for HTTP 503", async () => {
  const unavailable = async () => { throw new Error("source failed"); };
  const result = await collectHqApprovalCounts({
    farmerProfileApplicationsPending: unavailable,
    importedFarmersPendingReview: unavailable,
    supplierApplicationsPending: unavailable
  });

  assert.equal(result.completeFailure, true);
  assert.equal(result.response.farmerProfileApplicationsPending, null);
  assert.equal(result.response.importedFarmersPendingReview, null);
  assert.equal(result.response.supplierApplicationsPending, null);
  assert.deepEqual(Object.values(result.response.availability), ["unavailable", "unavailable", "unavailable"]);
});

test("response contract contains no private applicant fields", async () => {
  const result = await collectHqApprovalCounts(sources());
  const topLevelKeys = Object.keys(result.response).sort();
  const serialized = JSON.stringify(result.response);

  assert.deepEqual(topLevelKeys, [
    "availability",
    "farmerProfileApplicationsPending",
    "generatedAt",
    "importedFarmersPendingReview",
    "supplierApplicationsPending"
  ]);
  assert.doesNotMatch(serialized, /"(?:id|name|applicant_name|email|phone|telephone|notes|media|media_path|private_profile_image_path)"\s*:/i);
});

test("prelaunch gate exempts only the exact protected HQ approval-counts pathname", () => {
  assert.equal(hqApprovalCountsPrelaunchPath, hqApprovalCountsPath);
  assert.equal(isHqApprovalCountsPrelaunchRoute(hqApprovalCountsPath), true);

  for (const pathname of [
    "/api/integrations/hq",
    "/api/integrations/hq/approval-counts/extra",
    "/api/integrations/other/approval-counts",
    "/api/approval-counts"
  ]) {
    assert.equal(isHqApprovalCountsPrelaunchRoute(pathname), false, pathname);
  }
});

test("HQ exemption leaves public pages and unrelated API paths on their existing decisions", () => {
  for (const pathname of [
    "/",
    "/about",
    "/marketplace",
    "/farmer-hub",
    "/farmer-hub/feedback",
    "/admin",
    "/api/admin/farmers",
    "/api/farmmate/ask",
    "/api/waitlist",
    "/api/integrations/other",
    "/api/administer"
  ]) {
    assert.equal(isHqApprovalCountsPrelaunchRoute(pathname), false, pathname);
  }
});

test("middleware uses pathname-only exact HQ exemption without broad API allowlisting", () => {
  const middleware = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
  const prelaunchAccess = readFileSync(join(process.cwd(), "src/lib/prelaunchAccess.ts"), "utf8");

  assert.match(middleware, /const \{ pathname \} = request\.nextUrl/);
  assert.match(middleware, /isAllowedPrelaunchRoute\(pathname\)/);
  assert.match(middleware, /isPublicFarmMatePilotRoute\(pathname\)/);
  assert.match(middleware, /isControlledPrelaunchRoute\(pathname\)/);
  assert.match(prelaunchAccess, /return pathname === hqApprovalCountsPrelaunchPath/);
  assert.doesNotMatch(prelaunchAccess, /pathname\.startsWith\(["']\/api(?:\/integrations)?/);
});

test("route remains GET-only, no-store, signed, rate-limited, and without permissive CORS", () => {
  const route = readFileSync(join(process.cwd(), "src/app/api/integrations/hq/approval-counts/route.ts"), "utf8");
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260726183000_hq_integration_rate_limit.sql"), "utf8");
  const nonceMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260726210000_hq_integration_nonce_replay_protection.sql"), "utf8");

  assert.match(route, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE|OPTIONS)/);
  assert.match(route, /process\.env\.HQ_INTEGRATION_SECRET/);
  assert.match(route, /x-hq-timestamp/);
  assert.match(route, /x-hq-nonce/);
  assert.match(route, /x-hq-signature/);
  assert.match(route, /"Cache-Control": "no-store, max-age=0"/);
  assert.doesNotMatch(route, /Access-Control-Allow-Origin/i);
  assert.match(route, /consume_hq_integration_rate_limit/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all .* from public, anon, authenticated/i);
  assert.match(migration, /grant execute .* to service_role/i);
  assert.match(route, /consume_hq_integration_nonce/);
  assert.match(nonceMigration, /nonce_value uuid primary key/i);
  assert.match(nonceMigration, /on conflict \(nonce_value\) do nothing/i);
  assert.match(nonceMigration, /where expires_at <= v_now/i);
  assert.match(nonceMigration, /enable row level security/i);
  assert.match(nonceMigration, /revoke all .* from public, anon, authenticated/i);
  assert.match(nonceMigration, /grant execute .* to service_role/i);
  assert.match(route, /NextResponse\.json/);
  assert.match(route, /genericResponse\("Unauthorized", 401\)/);
  assert.match(route, /genericResponse\("Service unavailable", 503\)/);
  assert.doesNotMatch(route, /console\.|logger\.|HQ_INTEGRATION_SECRET\s*[,)]/);
});
