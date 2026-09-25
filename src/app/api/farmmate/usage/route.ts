import { NextResponse } from "next/server";
import { isValidFarmMateConsultationId } from "@/lib/farmmate/consultation";
import { reserveFarmMateAsk } from "@/lib/farmmate/usage/ask-recovery";
import { checkFarmMateCreditsForDevice, getFarmMateCreditsForDevice, recordFarmMateUsageForDevice } from "@/lib/farmmate/usage/server";
import type { FarmMateUsageTool } from "@/lib/farmmate/usage";

const allowedTools = new Set<FarmMateUsageTool>(["ask_farmmate", "crop_doctor"]);

function isTool(value: unknown): value is FarmMateUsageTool {
  return typeof value === "string" && allowedTools.has(value as FarmMateUsageTool);
}

async function parseRequest(request: Request) {
  const body = (await request.json().catch(() => null)) as { anonymousDeviceId?: unknown; tool?: unknown; action?: unknown; consultationId?: unknown; originalQuestion?: unknown } | null;

  if (!body || !isTool(body.tool)) {
    return null;
  }

  return body as { anonymousDeviceId?: unknown; tool: FarmMateUsageTool; action?: "status" | "record"; consultationId?: unknown; originalQuestion?: unknown };
}

export async function POST(request: Request) {
  const body = await parseRequest(request);

  if (!body) {
    return NextResponse.json({ ok: false, reason: "invalid_usage_request" }, { status: 400 });
  }

  if (body.action === "record") {
    if (body.tool === "ask_farmmate") {
      if (!isValidFarmMateConsultationId(body.consultationId) ||
        typeof body.originalQuestion !== "string" || !body.originalQuestion.trim() || body.originalQuestion.length > 500) {
        return NextResponse.json({ ok: false, reason: "invalid_usage_request" }, { status: 400 });
      }
      const reservation = await reserveFarmMateAsk({
        anonymousDeviceId: body.anonymousDeviceId,
        consultationId: body.consultationId,
        originalQuestion: body.originalQuestion,
        guided: false,
        completeImmediately: true
      });
      if (reservation.decision !== "reserved_new" && reservation.decision !== "reserved_retry" &&
        reservation.decision !== "already_processed") {
        return NextResponse.json({ ok: false, reason: reservation.decision }, {
          status: reservation.decision === "usage_tracking_unavailable" ? 503 : 429
        });
      }
      const credits = await getFarmMateCreditsForDevice({ anonymousDeviceId: body.anonymousDeviceId, tool: body.tool });
      return NextResponse.json({ ok: true, credits, usageRecorded: reservation.newCredit === true });
    }
    const decision = await checkFarmMateCreditsForDevice({
      anonymousDeviceId: body.anonymousDeviceId,
      tool: body.tool
    });

    if (!decision.allowed) {
      return NextResponse.json(
        { ok: false, reason: decision.reason, credits: decision },
        { status: decision.reason === "usage_tracking_unavailable" ? 503 : 429 }
      );
    }

    const record = await recordFarmMateUsageForDevice({
      anonymousDeviceId: body.anonymousDeviceId,
      tool: body.tool
    });

    if (!record.recorded) {
      return NextResponse.json(
        {
          ok: false,
          reason: "usage_tracking_unavailable",
          credits: {
            ...decision,
            allowed: false,
            reason: "usage_tracking_unavailable",
            storage: record.storage
          }
        },
        { status: 503 }
      );
    }

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
