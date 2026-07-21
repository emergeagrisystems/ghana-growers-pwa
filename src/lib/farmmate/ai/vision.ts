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
      reason: "missing_api_key" | "openai_request_error" | "empty_response" | "invalid_response";
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
        model: process.env.OPENAI_VISION_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
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
    });

    if (!response.ok) {
      return { ok: false, reason: "openai_request_error", fallback: true };
    }

    const data = (await response.json()) as OpenAIResponsesApiResult;
    const text = extractOutputText(data);

    if (!text) {
      return { ok: false, reason: "empty_response", fallback: true };
    }

    const json = parseJsonObject(text);

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
  } catch {
    return { ok: false, reason: "openai_request_error", fallback: true };
  }
}
