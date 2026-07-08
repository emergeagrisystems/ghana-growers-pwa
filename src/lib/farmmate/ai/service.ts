import { FARM_MATE_SYSTEM_PROMPT } from "./system-prompt";
import type { FarmMateAiInput, FarmMateAiResult } from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5";

type OpenAIResponsesApiResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function extractOutputText(data: OpenAIResponsesApiResult) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n")
    .trim();
}

function buildVoiceLayerInput(input: FarmMateAiInput) {
  const payload = {
    instruction:
      "Rewrite the local FarmMate Brain response into a short, natural answer. Do not add facts, prices, pesticide dosages, diagnoses, or recommendations that are not present in this context.",
    farmerQuestion: input.farmerQuestion,
    detectedIntent: input.brain.intent,
    crop: input.brain.resolvedCrop ?? input.brain.intent.cropName ?? null,
    decisionFlow: input.brain.flow ?? null,
    farmerAnswers: input.farmerAnswers,
    recommendedAction: input.brain.flow?.recommendation.recommendedAction ?? null,
    safetyRules: input.brain.flow?.safetyRules ?? [],
    nextBestAction: input.brain.nextBestAction,
    localStructuredResponse: input.localStructuredResponse,
    responseRules: [
      "Keep the answer concise and conversational.",
      "Use the farmer's answers when explaining the recommendation.",
      "If information is still missing, ask one clear follow-up question.",
      "If Crop Doctor is the next best action, say that a clear photo will help.",
      "End with exactly one clear next step."
    ]
  };

  if (process.env.NODE_ENV === "development") {
    console.info("FarmMate OpenAI payload crop:", payload.crop ?? "none");
    console.info("FarmMate OpenAI payload intent:", input.brain.intent.intent);
    console.info("FarmMate OpenAI payload specialist:", input.brain.routerResult?.selectedSpecialist ?? "none");
    console.info("FarmMate OpenAI payload flow crop/context:", input.brain.flow?.requiredInformation.crop ?? "none");
    console.info("FarmMate OpenAI payload decision flow:", input.brain.flow?.id ?? "fallback");
  }

  return JSON.stringify(payload, null, 2);
}

export async function generateFarmMateNaturalAnswer(input: FarmMateAiInput): Promise<FarmMateAiResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return { ok: false, reason: "missing_api_key", fallback: true };
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
        instructions: FARM_MATE_SYSTEM_PROMPT,
        input: buildVoiceLayerInput(input),
        max_output_tokens: 420
      })
    });

    if (!response.ok) {
      return { ok: false, reason: "openai_request_error", fallback: true };
    }

    const data = (await response.json()) as OpenAIResponsesApiResult;
    const answer = extractOutputText(data);

    if (!answer) {
      return { ok: false, reason: "empty_response", fallback: true };
    }

    return { ok: true, answer };
  } catch {
    return { ok: false, reason: "openai_request_error", fallback: true };
  }
}
