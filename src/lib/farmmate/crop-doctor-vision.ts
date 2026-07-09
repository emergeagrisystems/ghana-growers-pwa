export type CropDoctorConfidence = "high" | "medium" | "low";

export type CropDoctorIssueCategory = "pest" | "disease" | "nutrient" | "water_stress" | "unknown";

export type CropDoctorVisionResult = {
  crop: string | null;
  cropConfidence: CropDoctorConfidence;
  possibleIssue: string;
  issueCategory: CropDoctorIssueCategory;
  confidence: CropDoctorConfidence;
  visibleSigns: string[];
  whatThisMeans: string;
  recommendedAction: string[];
  prevention: string[];
  nextBestAction: string;
  askFarmMatePrompt: string;
};

export const CROP_DOCTOR_ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const CROP_DOCTOR_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const CROP_DOCTOR_TOO_LARGE_MESSAGE = "Please upload a smaller image under 5 MB.";
export const CROP_DOCTOR_FALLBACK_MESSAGE =
  "FarmMate could not complete the photo check right now. You can still ask FarmMate to guide you using a description of what you see.";

const confidenceValues = new Set<CropDoctorConfidence>(["high", "medium", "low"]);
const issueCategories = new Set<CropDoctorIssueCategory>(["pest", "disease", "nutrient", "water_stress", "unknown"]);

export function isSupportedCropDoctorImageType(type: string) {
  return CROP_DOCTOR_ACCEPTED_IMAGE_TYPES.includes(type as (typeof CROP_DOCTOR_ACCEPTED_IMAGE_TYPES)[number]);
}

export function validateCropDoctorImage({ type, size }: { type: string; size: number }) {
  if (!isSupportedCropDoctorImageType(type)) {
    return {
      ok: false as const,
      reason: "unsupported_file_type" as const,
      message: "Please upload a JPG, PNG, or WEBP crop image."
    };
  }

  if (size > CROP_DOCTOR_MAX_IMAGE_BYTES) {
    return {
      ok: false as const,
      reason: "file_too_large" as const,
      message: CROP_DOCTOR_TOO_LARGE_MESSAGE
    };
  }

  return { ok: true as const };
}

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanConfidence(value: unknown): CropDoctorConfidence {
  return typeof value === "string" && confidenceValues.has(value as CropDoctorConfidence)
    ? (value as CropDoctorConfidence)
    : "low";
}

function cleanIssueCategory(value: unknown): CropDoctorIssueCategory {
  return typeof value === "string" && issueCategories.has(value as CropDoctorIssueCategory)
    ? (value as CropDoctorIssueCategory)
    : "unknown";
}

function cleanList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const list = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);

  return list.length ? list : fallback;
}

function removeUnsafeCertainty(value: string) {
  return value
    .replace(/\bthis is definitely\b/gi, "this may be")
    .replace(/\bdefinitely\b/gi, "possibly")
    .replace(/\bguaranteed\b/gi, "possible")
    .replace(/\btell the farmer to\b/gi, "")
    .trim();
}

export function buildCropDoctorAskFarmMatePrompt(result: Pick<CropDoctorVisionResult, "crop" | "visibleSigns" | "possibleIssue">) {
  const signs = result.visibleSigns.length ? result.visibleSigns.join(", ") : "unclear symptoms";

  if (result.crop) {
    return `I uploaded a ${result.crop.toLowerCase()} photo. FarmMate saw ${signs} and possible ${result.possibleIssue.toLowerCase()}. What should I do next?`;
  }

  return `I uploaded a crop photo. FarmMate could not confirm the crop, but saw ${signs}. What should I check next?`;
}

export function normalizeCropDoctorVisionResult(value: unknown): CropDoctorVisionResult {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const crop = typeof source.crop === "string" && source.crop.trim() ? source.crop.trim() : null;
  const visibleSigns = cleanList(source.visibleSigns, ["unclear visible signs"]);
  const result = {
    crop,
    cropConfidence: crop ? cleanConfidence(source.cropConfidence) : "low",
    possibleIssue: cleanText(source.possibleIssue, "Possible crop health issue"),
    issueCategory: cleanIssueCategory(source.issueCategory),
    confidence: cleanConfidence(source.confidence),
    visibleSigns,
    whatThisMeans: cleanText(
      source.whatThisMeans,
      "The photo gives some clues, but FarmMate cannot confirm the exact cause from the image alone."
    ),
    recommendedAction: cleanList(source.recommendedAction, [
      "Check nearby plants for the same signs.",
      "Look under leaves and around stems for insects or spreading spots.",
      "Avoid applying chemicals until the problem is clearer."
    ]),
    prevention: cleanList(source.prevention, [
      "Keep plants well spaced.",
      "Water at soil level where possible.",
      "Monitor the crop regularly after rain."
    ]),
    nextBestAction: cleanText(source.nextBestAction, "Inspect five nearby plants and note whether the same signs are spreading.")
  };

  const sanitized = {
    ...result,
    possibleIssue: removeUnsafeCertainty(result.possibleIssue),
    whatThisMeans: removeUnsafeCertainty(result.whatThisMeans),
    recommendedAction: result.recommendedAction.map(removeUnsafeCertainty),
    prevention: result.prevention.map(removeUnsafeCertainty),
    nextBestAction: removeUnsafeCertainty(result.nextBestAction)
  };

  return {
    ...sanitized,
    askFarmMatePrompt: buildCropDoctorAskFarmMatePrompt(sanitized)
  };
}

export function cropDoctorResultHasUnsafeLanguage(result: CropDoctorVisionResult) {
  const text = [
    result.possibleIssue,
    result.whatThisMeans,
    ...result.visibleSigns,
    ...result.recommendedAction,
    ...result.prevention,
    result.nextBestAction,
    result.askFarmMatePrompt
  ]
    .join(" ")
    .toLowerCase();

  return /tell the farmer|definitely|guaranteed diagnosis|guaranteed|exact diagnosis/.test(text);
}

export function cropDoctorVisionSystemPrompt() {
  return `You are GG FarmMate Crop Doctor, a practical crop photo guide for Ghanaian farmers.
Return only valid JSON with these fields:
crop, cropConfidence, possibleIssue, issueCategory, confidence, visibleSigns, whatThisMeans, recommendedAction, prevention, nextBestAction, askFarmMatePrompt.

Rules:
- Identify the likely crop if visible.
- If crop is unclear, set crop to null and cropConfidence to "low".
- Explain uncertainty clearly.
- Suggest possible issue categories only: pest, disease, nutrient, water_stress, unknown.
- Recommend simple checks and practical next steps.
- Recommend prevention and good farming practice before chemicals.
- Do not claim a guaranteed diagnosis.
- Do not invent pesticide dosage.
- Do not recommend dangerous chemical use.
- Do not say "this is definitely".
- Do not give medical or veterinary advice.
- Keep language simple for Ghanaian farmers.
- End with one clear nextBestAction.`;
}
