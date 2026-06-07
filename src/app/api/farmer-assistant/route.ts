import { NextResponse } from "next/server";
import { createFarmerAssistantReply, type FarmerAssistantMessage } from "@/lib/farmerAssistant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
    messages?: FarmerAssistantMessage[];
  };
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  if (question.length > 1200) {
    return NextResponse.json({ error: "Question is too long. Please keep it under 1,200 characters." }, { status: 400 });
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
      integrationReady: true
    });
  } catch (error) {
    const isMissingKey = error instanceof Error && error.message.includes("OPENAI_API_KEY");

    return NextResponse.json(
      {
        error: isMissingKey
          ? "The AI Farmer Assistant is not configured yet. Add OPENAI_API_KEY on the server."
          : "The AI Farmer Assistant is temporarily unavailable. Please try again shortly.",
        provider: "openai",
        integrationReady: false
      },
      { status: isMissingKey ? 503 : 502 }
    );
  }
}
