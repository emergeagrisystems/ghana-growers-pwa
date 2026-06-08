import { NextResponse } from "next/server";
import {
  checkAssistantUsageLimit,
  getAssistantClientId,
  validateAssistantQuestion
} from "@/lib/assistantUsageProtection";
import { createFarmerAssistantReply, type FarmerAssistantMessage } from "@/lib/farmerAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
    messages?: FarmerAssistantMessage[];
    sessionId?: string;
  };
  const question = body.question?.trim();
  const validationError = validateAssistantQuestion(question ?? "");

  if (validationError || !question) {
    return NextResponse.json({ error: validationError || "Please enter a farming question first." }, { status: 400 });
  }

  const usageResult = checkAssistantUsageLimit(getAssistantClientId(request, body.sessionId));

  if (!usageResult.ok) {
    return NextResponse.json(
      {
        error: usageResult.error,
        retryAfterSeconds: usageResult.retryAfterSeconds,
        provider: "openai",
        integrationReady: true
      },
      {
        status: usageResult.status,
        headers: {
          "Retry-After": String(usageResult.retryAfterSeconds)
        }
      }
    );
  }

  const messages = Array.isArray(body.messages)
    ? body.messages.filter((message) => {
        return (
          (message.role === "assistant" || message.role === "farmer") &&
          typeof message.text === "string" &&
          message.text.trim().length > 0
        );
      })
    : [];

  try {
    const answer = await createFarmerAssistantReply(question, messages);

    return NextResponse.json({
      answer,
      provider: "openai",
      integrationReady: true,
      remainingToday: usageResult.remainingToday
    });
  } catch (error) {
    const isMissingKey = error instanceof Error && error.message.includes("OPENAI_API_KEY");

    return NextResponse.json(
      {
        error: isMissingKey
          ? "The Farm Help Assistant is not configured in this deployment. Confirm OPENAI_API_KEY is set in Vercel and redeploy."
          : "The Farm Help Assistant is temporarily unavailable. Please try again shortly.",
        provider: "openai",
        integrationReady: false
      },
      { status: isMissingKey ? 503 : 502 }
    );
  }
}
