import { NextResponse } from "next/server";
import { createFarmerAssistantReply } from "@/lib/farmerAssistant";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { question?: string };
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const answer = await createFarmerAssistantReply(question);

  return NextResponse.json({
    answer,
    provider: "mock",
    integrationReady: true
  });
}
