import { NextResponse } from "next/server";
import { checkFarmMateCreditsForDevice, getFarmMateCreditsForDevice, recordFarmMateUsageForDevice } from "@/lib/farmmate/usage/server";
import type { FarmMateUsageTool } from "@/lib/farmmate/usage";

const allowedTools = new Set<FarmMateUsageTool>(["ask_farmmate", "crop_doctor"]);

function isTool(value: unknown): value is FarmMateUsageTool {
  return typeof value === "string" && allowedTools.has(value as FarmMateUsageTool);
}

async function parseRequest(request: Request) {
  const body = (await request.json().catch(() => null)) as { anonymousDeviceId?: unknown; tool?: unknown; action?: unknown } | null;

  if (!body || !isTool(body.tool)) {
    return null;
  }

  return body as { anonymousDeviceId?: unknown; tool: FarmMateUsageTool; action?: "status" | "record" };
}

export async function POST(request: Request) {
  const body = await parseRequest(request);

  if (!body) {
    return NextResponse.json({ ok: false, reason: "invalid_usage_request" }, { status: 400 });
  }

  if (body.action === "record") {
    const decision = await checkFarmMateCreditsForDevice({
      anonymousDeviceId: body.anonymousDeviceId,
      tool: body.tool
    });

    if (!decision.allowed) {
      return NextResponse.json({ ok: false, reason: decision.reason, credits: decision }, { status: 429 });
    }

    await recordFarmMateUsageForDevice({
      anonymousDeviceId: body.anonymousDeviceId,
      tool: body.tool
    });

    const credits = await getFarmMateCreditsForDevice({
      anonymousDeviceId: body.anonymousDeviceId,
      tool: body.tool
    });

    return NextResponse.json({ ok: true, credits });
  }

  const credits = await getFarmMateCreditsForDevice({
    anonymousDeviceId: body.anonymousDeviceId,
    tool: body.tool
  });

  return NextResponse.json({ ok: true, credits });
}
