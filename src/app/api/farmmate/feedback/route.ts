import { NextResponse } from "next/server";
import {
  farmMatePilotFeedbackSuccessMessage,
  farmMatePilotFeedbackUnavailableMessage,
  sanitizeFarmMatePilotFeedback,
  storeFarmMatePilotFeedback
} from "@/lib/farmmate/pilot-feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = sanitizeFarmMatePilotFeedback(payload);

  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error, field: validation.field }, { status: 400 });
  }

  const stored = await storeFarmMatePilotFeedback(validation.data);

  if (!stored.ok) {
    console.warn("[farmmate:pilot-feedback] Feedback storage unavailable.", {
      status: stored.status,
      error: stored.error
    });

    return NextResponse.json(
      {
        ok: false,
        code: "feedback_temporarily_unavailable",
        error: farmMatePilotFeedbackUnavailableMessage
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, message: farmMatePilotFeedbackSuccessMessage }, { status: 201 });
}
