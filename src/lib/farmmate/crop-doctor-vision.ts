export type CropDoctorConfidence = "high" | "medium" | "low";

export type CropDoctorIssueCategory = "pest" | "disease" | "nutrient" | "water_stress" | "unknown";

export type CropDoctorResultType =
  | "no_clear_problem"
  | "possible_disease"
  | "possible_pest"
  | "possible_nutrient_issue"
  | "possible_water_stress"
  | "crop_not_confirmed"
  | "photo_unclear"
  | "harvest_or_storage_check";

export type CropDoctorVisionResult = {
  crop: string | null;
  cropConfidence: CropDoctorConfidence;
  resultType: CropDoctorResultType;
  possibleIssue: string;
  issueCategory: CropDoctorIssueCategory;
  confidence: CropDoctorConfidence;
  visibleSigns: string[];
  mainFinding: string;
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
const resultTypes = new Set<CropDoctorResultType>([
  "no_clear_problem",
  "possible_disease",
  "possible_pest",
  "possible_nutrient_issue",
  "possible_water_stress",
  "crop_not_confirmed",
  "photo_unclear",
  "harvest_or_storage_check"
]);

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

function cleanResultType(value: unknown, fallback: CropDoctorResultType): CropDoctorResultType {
  return typeof value === "string" && resultTypes.has(value as CropDoctorResultType)
    ? (value as CropDoctorResultType)
    : fallback;
}

function cleanList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const list = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);

  return list.length ? list : fallback;
}

function removeUnsafeCertainty(value: string) {
  return value
    .replace(/\bthis is definitely\b/gi, "this may be")
    .replace(/\bdefinitely\b/gi, "possibly")
    .replace(/\bguaranteed\b/gi, "possible")
    .replace(/\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:\/|per)\s?(?:l|litre|liter|acre|hectare|ha)\b/gi, "follow local extension or product label guidance")
    .replace(/\btell the farmer to\b/gi, "")
    .trim();
}

function inferResultType({
  crop,
  cropConfidence,
  issueCategory,
  possibleIssue,
  mainFinding,
  visibleSigns
}: {
  crop: string | null;
  cropConfidence: CropDoctorConfidence;
  issueCategory: CropDoctorIssueCategory;
  possibleIssue: string;
  mainFinding: string;
  visibleSigns: string[];
}): CropDoctorResultType {
  const text = [possibleIssue, mainFinding, ...visibleSigns].join(" ").toLowerCase();

  if (!crop || cropConfidence === "low") {
    return "crop_not_confirmed";
  }

  if (/unclear|blur|dark|too far|not clear|poor photo/.test(text)) {
    return "photo_unclear";
  }

  if (/harvest|storage|stored|root|roots|tuber|tubers|produce|market|cassava root/.test(text)) {
    return "harvest_or_storage_check";
  }

  if (/no clear|no obvious|normal|healthy|no disease|no visible disease/.test(text)) {
    return "no_clear_problem";
  }

  if (issueCategory === "pest") {
    return "possible_pest";
  }

  if (issueCategory === "nutrient") {
    return "possible_nutrient_issue";
  }

  if (issueCategory === "water_stress") {
    return "possible_water_stress";
  }

  if (issueCategory === "disease") {
    return "possible_disease";
  }

  return "no_clear_problem";
}

export function cropDoctorResultHeading(result: Pick<CropDoctorVisionResult, "resultType">) {
  switch (result.resultType) {
    case "no_clear_problem":
      return "No clear problem visible";
    case "harvest_or_storage_check":
      return "Harvest or storage check";
    case "crop_not_confirmed":
      return "Crop not confirmed";
    case "photo_unclear":
      return "Photo not clear enough";
    case "possible_pest":
      return "Possible pest";
    case "possible_nutrient_issue":
      return "Possible nutrient issue";
    case "possible_water_stress":
      return "Possible water stress";
    case "possible_disease":
    default:
      return "Possible disease";
  }
}

export function cropDoctorResultHeadline(result: Pick<CropDoctorVisionResult, "resultType" | "mainFinding">) {
  if (
    result.resultType === "no_clear_problem" ||
    result.resultType === "harvest_or_storage_check" ||
    result.resultType === "crop_not_confirmed" ||
    result.resultType === "photo_unclear"
  ) {
    return cropDoctorResultHeading(result);
  }

  return result.mainFinding;
}

export function cropDoctorResultBadge(result: Pick<CropDoctorVisionResult, "resultType" | "confidence">) {
  if (result.resultType === "photo_unclear" || result.resultType === "crop_not_confirmed") {
    return "Photo unclear";
  }

  if (result.resultType === "no_clear_problem" || result.resultType === "harvest_or_storage_check") {
    return "No clear issue";
  }

  if (result.resultType === "possible_disease") {
    return "Possible disease";
  }

  if (result.confidence === "high") {
    return "Check nearby plants";
  }

  return "Needs field check";
}

export function buildCropDoctorAskFarmMatePrompt(
  result: Pick<CropDoctorVisionResult, "crop" | "visibleSigns" | "possibleIssue"> & {
    resultType?: CropDoctorResultType;
    nextBestAction?: string;
  }
) {
  const signs = result.visibleSigns.length ? result.visibleSigns.join(", ") : "unclear symptoms";

  if (!result.crop) {
    return "I uploaded a crop photo. Crop Doctor could not confirm the crop. What should I check next?";
  }

  if (result.resultType === "no_clear_problem" || result.resultType === "harvest_or_storage_check") {
    if (result.crop.toLowerCase() === "cassava") {
      return "I uploaded a cassava photo. Crop Doctor did not see a clear disease problem, but recommended checking the roots for rot or bad smell. What should I do next?";
    }

    return `I uploaded a ${result.crop.toLowerCase()} photo. Crop Doctor did not see a clear disease problem, but recommended checking the crop carefully. What should I do next?`;
  }

  if (result.crop) {
    return `I uploaded a ${result.crop.toLowerCase()} photo. FarmMate saw ${signs} and possible ${result.possibleIssue.toLowerCase()}. What should I do next?`;
  }

  return "I uploaded a crop photo. Crop Doctor could not confirm the crop. What should I check next?";
}

export function normalizeCropDoctorVisionResult(value: unknown): CropDoctorVisionResult {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const crop = typeof source.crop === "string" && source.crop.trim() ? source.crop.trim() : null;
  const visibleSigns = cleanList(source.visibleSigns, ["unclear visible signs"]);
  const issueCategory = cleanIssueCategory(source.issueCategory);
  const possibleIssue = cleanText(source.possibleIssue, "Possible crop health issue");
  const mainFinding = cleanText(source.mainFinding, cleanText(source.whatThisMeans, possibleIssue));
  const cropConfidence = crop ? cleanConfidence(source.cropConfidence) : "low";
  const resultType = cleanResultType(
    source.resultType,
    inferResultType({
      crop,
      cropConfidence,
      issueCategory,
      possibleIssue,
      mainFinding,
      visibleSigns
    })
  );
  const result = {
    crop,
    cropConfidence,
    resultType,
    possibleIssue,
    issueCategory,
    confidence: cleanConfidence(source.confidence),
    visibleSigns,
    mainFinding,
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
    mainFinding: removeUnsafeCertainty(result.mainFinding),
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
    result.mainFinding,
    result.whatThisMeans,
    ...result.visibleSigns,
    ...result.recommendedAction,
    ...result.prevention,
    result.nextBestAction,
    result.askFarmMatePrompt
  ]
    .join(" ")
    .toLowerCase();

  return /tell the farmer|definitely|guaranteed diagnosis|guaranteed|exact diagnosis|\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:\/|per)\s?(?:l|litre|liter|acre|hectare|ha)\b/.test(text);
}

export function cropDoctorVisionSystemPrompt() {
  return `You are GG FarmMate Crop Doctor, a practical crop photo guide for Ghanaian farmers.
Return only valid JSON with these fields:
crop, cropConfidence, resultType, possibleIssue, issueCategory, confidence, visibleSigns, mainFinding, whatThisMeans, recommendedAction, prevention, nextBestAction, askFarmMatePrompt.

Rules:
- Identify the likely crop if visible.
- Do not use the filename to identify the crop or issue. Use only what is visible in the image.
- If crop is unclear, set crop to null and cropConfidence to "low".
- Use resultType exactly as one of: no_clear_problem, possible_disease, possible_pest, possible_nutrient_issue, possible_water_stress, crop_not_confirmed, photo_unclear, harvest_or_storage_check.
- If the photo shows harvested produce, roots, tubers or storage quality rather than a field plant, use resultType "harvest_or_storage_check".
- If no clear health problem is visible, use resultType "no_clear_problem" and do not force a disease diagnosis.
- If the photo is too blurry, dark, distant or incomplete, use resultType "photo_unclear".
- Explain uncertainty clearly.
- Suggest possible issue categories only: pest, disease, nutrient, water_stress, unknown.
- Keep visibleSigns, recommendedAction and prevention to maximum 3 short bullet strings each.
- Keep mainFinding short, practical and specific to what is visible.
- For field disease signs, mainFinding should be a farmer-friendly headline such as "Possible maize rust symptoms".
- Recommend simple checks and practical next steps.
- Recommend prevention and good farming practice before chemicals.
- Use "possible" language when uncertain.
- Do not claim a guaranteed diagnosis.
- Do not invent pesticide dosage.
- Do not recommend fungicide or pesticide as the first step unless the problem is widespread or confirmed by field checks or extension advice.
- Do not recommend dangerous chemical use.
- Do not say "this is definitely".
- Do not give medical or veterinary advice.
- Keep language simple for Ghanaian farmers.
- Keep the answer short. Avoid report-style explanations.
- End with one clear nextBestAction.`;
}
