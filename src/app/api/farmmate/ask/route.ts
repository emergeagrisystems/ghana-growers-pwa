import { NextResponse } from "next/server";
import { generateFarmMateNaturalAnswer, type FarmMateAiInput } from "@/lib/farmmate/ai";

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

  const result = await generateFarmMateNaturalAnswer(payload);

  return NextResponse.json(result);
}
