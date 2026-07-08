import { NextResponse } from "next/server";
import { generateFarmMateNaturalAnswer, type FarmMateAiInput } from "@/lib/farmmate/ai";
import { checkFarmMateCreditsForDevice, getFarmMateCreditsForDevice, recordFarmMateUsageForDevice } from "@/lib/farmmate/usage/server";

function isFarmMateAiInput(value: unknown): value is FarmMateAiInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<FarmMateAiInput>;

  return (
    typeof input.farmerQuestion === "string" &&
    Boolean(input.brain) &&
    Array.isArray(input.farmerAnswers) &&
    Array.isArray(input.localStructuredResponse)
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json", fallback: true }, { status: 400 });
  }

  if (!isFarmMateAiInput(payload)) {
    return NextResponse.json({ ok: false, reason: "invalid_farmmate_context", fallback: true }, { status: 400 });
  }

  if (!payload.farmerQuestion.trim()) {
    return NextResponse.json({ ok: false, reason: "empty_question", fallback: true }, { status: 400 });
  }

  const anonymousDeviceId = (payload as FarmMateAiInput & { anonymousDeviceId?: unknown }).anonymousDeviceId;
  const creditDecision = await checkFarmMateCreditsForDevice({
    anonymousDeviceId,
    tool: "ask_farmmate"
  });

  if (!creditDecision.allowed) {
    const usageUnavailable = creditDecision.reason === "usage_tracking_unavailable";

    return NextResponse.json(
      {
        ok: false,
        reason: creditDecision.reason,
        fallback: true,
        credits: creditDecision,
        message:
          usageUnavailable
            ? "FarmMate AI is temporarily limited, but you can still use the local guidance."
            : creditDecision.reason === "rapid_submission"
            ? "FarmMate is still catching up. Please wait a few seconds before asking again."
            : `You've used your free FarmMate AI questions for now. Your credits refresh in ${creditDecision.refreshInText}. You can still use FarmMate tools and learning tips.`
      },
      { status: usageUnavailable ? 503 : 429 }
    );
  }

  const result = await generateFarmMateNaturalAnswer(payload);

  if (!result.ok) {
    const credits = await getFarmMateCreditsForDevice({
      anonymousDeviceId,
      tool: "ask_farmmate"
    });

    return NextResponse.json({ ...result, credits });
  }

  const recordResult = await recordFarmMateUsageForDevice({
    anonymousDeviceId,
    tool: "ask_farmmate"
  });

  const credits = await getFarmMateCreditsForDevice({
    anonymousDeviceId,
    tool: "ask_farmmate"
  });

  if (!recordResult.recorded) {
    return NextResponse.json(
      {
        ok: false,
        reason: "usage_tracking_unavailable",
        fallback: true,
        credits,
        usageRecorded: false,
        message: "FarmMate AI is temporarily limited, but you can still use the local guidance."
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ...result, credits, usageRecorded: recordResult.recorded });
}
