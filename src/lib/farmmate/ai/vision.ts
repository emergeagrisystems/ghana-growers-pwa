import { randomUUID } from "node:crypto";
import {
  cropDoctorVisionSystemPrompt,
  normalizeCropDoctorSelectedCrop,
  normalizeCropDoctorVisionResult,
  type CropDoctorVisionResult
} from "../crop-doctor-vision";
import {
  FARM_MATE_CASH_CROP_CAUTION,
  farmMateCropGroupLabels,
  findFarmMateCropLibraryEntry
} from "../crop-library";
import { boundedJsonRequest, FARM_MATE_VISION_TIMEOUT_MS, FarmMateRequestTimeout } from "../request-limits";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5";

type OpenAIResponsesApiResult = {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  error?: { code?: string; type?: string } | null;
  usage?: { output_tokens?: number; output_tokens_details?: { reasoning_tokens?: number } } | null;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type VisionDiagnostic = {
  correlationId: string;
  model: string;
  httpStatus: number | null;
  httpStatusClass: string | null;
  providerStatus: string;
  incompleteReason: string;
  outputLength: number;
  outputTokens: number | null;
  reasoningTokens: number | null;
  timeoutClassification: "none" | "bounded_timeout";
  normalizedErrorCategory: string;
};

function logVisionDiagnostic(fields: VisionDiagnostic) {
  if (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "codex/p09-rc1" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") === "https://ecluxmyxqofkbzcyurlf.supabase.co"
  ) {
    // No request/response body, image, headers, device ID, or provider message.
    console.info("[P09-RC1 Crop Doctor AI]", JSON.stringify(fields));
  }
}

function safeProviderStatus(value: string | undefined) {
  return ["completed", "incomplete", "failed", "cancelled", "in_progress", "queued"].includes(value ?? "")
    ? value!
    : "unknown";
}

function safeIncompleteReason(value: string | undefined) {
  return ["max_output_tokens", "max_tokens", "content_filter"].includes(value ?? "") ? value! : "other_or_none";
}

function providerErrorCategory(status: number, data: OpenAIResponsesApiResult) {
  if (data.error?.code === "model_not_found") return "model_unavailable";
  if (status === 401 || status === 403) return "authentication_or_permission";
  if (status === 429) return "rate_or_quota";
  if (status >= 500) return "provider_server";
  if (status >= 400) return "provider_request";
  return "none";
}

export type CropDoctorVisionInput = {
  mimeType: string;
  base64Image: string;
  selectedCrop?: string | null;
  selectedSymptom?: string | null;
};

export type CropDoctorVisionAiResult =
  | {
      ok: true;
      result: CropDoctorVisionResult;
    }
  | {
      ok: false;
      reason: "missing_api_key" | "model_timeout" | "openai_request_error" | "empty_response" | "invalid_response";
      fallback: true;
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

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

export async function analyzeCropDoctorImageWithOpenAI(input: CropDoctorVisionInput): Promise<CropDoctorVisionAiResult> {
  const correlationId = randomUUID();
  const configuredModel = process.env.OPENAI_VISION_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  const model = /^(?:gpt-[a-z0-9._-]{1,70}|o[1-9][a-z0-9._-]{0,70})$/i.test(configuredModel)
    ? configuredModel
    : "unclassified_model";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const selectedCrop = normalizeCropDoctorSelectedCrop(input.selectedCrop);
  const selectedSymptom = input.selectedSymptom?.trim() || "Not sure";
  const selectedCropEntry = findFarmMateCropLibraryEntry(selectedCrop);
  const selectedCropLibraryContext = selectedCropEntry
    ? `Crop library context: ${selectedCropEntry.displayName}; group ${farmMateCropGroupLabels[selectedCropEntry.cropGroup]}; family ${selectedCropEntry.cropFamily ?? "not assigned"}; aliases ${selectedCropEntry.aliases.slice(0, 6).join(", ")}; common symptom checks ${selectedCropEntry.commonSymptoms.slice(0, 6).join(", ")}. ${selectedCropEntry.guidanceLevel === "crop_specific" ? "Use available crop-specific context cautiously." : "Use general crop-family guidance and do not invent an exact crop-specific disease."} ${selectedCropEntry.cropGroup === "cash_perennial" ? FARM_MATE_CASH_CROP_CAUTION : ""}`
    : "The crop is not confirmed in the local crop library. Use general visible-sign guidance and do not invent an exact crop-specific disease.";
  const cropInstruction =
    selectedCrop === "Not sure"
      ? "The farmer did not identify the crop. Attempt to identify the crop from the photo cautiously, but return crop_not_confirmed if the crop is unclear."
      : `The farmer says the crop is ${selectedCrop}. Treat this as context only and check whether the image appears consistent with that crop.`;

  if (!apiKey) {
    logVisionDiagnostic({ correlationId, model, httpStatus: null, httpStatusClass: null, providerStatus: "unknown", incompleteReason: "other_or_none", outputLength: 0, outputTokens: null, reasoningTokens: null, timeoutClassification: "none", normalizedErrorCategory: "missing_api_key" });
    return { ok: false, reason: "missing_api_key", fallback: true };
  }

  try {
    const { response, data } = await boundedJsonRequest<OpenAIResponsesApiResult>(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: configuredModel,
        instructions: cropDoctorVisionSystemPrompt(),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  `Analyze this crop photo for visible field crop health signs or harvest/storage quality. ${cropInstruction} ${selectedCropLibraryContext} Farmer-selected crop: ${selectedCrop}. Farmer-selected symptom: ${selectedSymptom}. Return only the requested JSON. Do not force a disease diagnosis. Be cautious, brief and practical.`
              },
              {
                type: "input_image",
                image_url: `data:${input.mimeType};base64,${input.base64Image}`
              }
            ]
          }
        ],
        max_output_tokens: 600
      })
    }, FARM_MATE_VISION_TIMEOUT_MS);

    const text = extractOutputText(data);
    const json = text ? parseJsonObject(text) : null;
    const normalizedErrorCategory = !response.ok
      ? providerErrorCategory(response.status, data)
      : data.status === "incomplete"
        ? "provider_incomplete"
        : !text
          ? "empty_response"
          : !json
            ? "invalid_output_json"
            : "none";
    logVisionDiagnostic({
      correlationId,
      model,
      httpStatus: response.status,
      httpStatusClass: `${Math.floor(response.status / 100)}xx`,
      providerStatus: safeProviderStatus(data.status),
      incompleteReason: safeIncompleteReason(data.incomplete_details?.reason),
      outputLength: text.length,
      outputTokens: data.usage?.output_tokens ?? null,
      reasoningTokens: data.usage?.output_tokens_details?.reasoning_tokens ?? null,
      timeoutClassification: "none",
      normalizedErrorCategory
    });

    if (!response.ok) {
      return { ok: false, reason: "openai_request_error", fallback: true };
    }

    if (!text) {
      return { ok: false, reason: "empty_response", fallback: true };
    }

    if (!json) {
      return { ok: false, reason: "invalid_response", fallback: true };
    }

    return {
      ok: true,
      result: normalizeCropDoctorVisionResult(json, {
        selectedCrop,
        selectedSymptom
      })
    };
  } catch (error) {
    const timedOut = error instanceof FarmMateRequestTimeout;
    logVisionDiagnostic({ correlationId, model, httpStatus: null, httpStatusClass: null, providerStatus: "unknown", incompleteReason: "other_or_none", outputLength: 0, outputTokens: null, reasoningTokens: null, timeoutClassification: timedOut ? "bounded_timeout" : "none", normalizedErrorCategory: timedOut ? "model_timeout" : error instanceof SyntaxError ? "invalid_provider_json" : "transport_or_unknown" });
    return { ok: false, reason: timedOut ? "model_timeout" : "openai_request_error", fallback: true };
  }
}
