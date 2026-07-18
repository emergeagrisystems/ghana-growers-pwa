export type CropDoctorConfidence = "high" | "medium" | "low";
export type CropDoctorPhotoCropMatch = "likely" | "uncertain" | "not_clear";

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
  selectedCrop: string;
  selectedSymptom: string | null;
  photoCropMatch: CropDoctorPhotoCropMatch;
  cropFromImage: string | null;
  crop: string | null;
  cropConfidence: CropDoctorConfidence;
  resultType: CropDoctorResultType;
  possibleIssue: string;
  issueCategory: CropDoctorIssueCategory;
  confidence: CropDoctorConfidence;
  visibleSigns: string[];
  mainFinding: string;
  whatToCheck: string[];
  whatThisMeans: string;
  recommendedActions: string[];
  recommendedAction: string[];
  prevention: string[];
  nextBestAction: string;
  askFarmMatePrompt: string;
};

export type CropDoctorHandoffContext = {
  source: "crop_doctor";
  question: string;
  selectedCrop: string;
  selectedSymptom: string | null;
  crop: string | null;
  cropConfidence: CropDoctorConfidence;
  possibleIssue: string;
  issueCategory: CropDoctorIssueCategory;
  resultType: CropDoctorResultType;
  visibleSigns: string[];
  nextBestAction: string;
};

export const CROP_DOCTOR_ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const CROP_DOCTOR_SUPPORTED_CROPS = ["Maize", "Cassava", "Tomato", "Pepper", "Plantain", "Yam", "Onion", "Okra", "Cucumber", "Garden eggs", "Not sure"] as const;
export const CROP_DOCTOR_SYMPTOMS = [
  "Yellow leaves",
  "Spots on leaves",
  "Holes in leaves",
  "Leaves curling",
  "Wilting",
  "Stunted growth",
  "Fruit problem",
  "Insects or pests",
  "Roots or tubers problem",
  "Not sure"
] as const;
export const CROP_DOCTOR_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const CROP_DOCTOR_TOO_LARGE_MESSAGE = "Please upload a smaller image under 5 MB.";
export const CROP_DOCTOR_FALLBACK_MESSAGE =
  "FarmMate could not complete the photo check right now. You can still ask FarmMate to guide you using a description of what you see.";

const confidenceValues = new Set<CropDoctorConfidence>(["high", "medium", "low"]);
const issueCategories = new Set<CropDoctorIssueCategory>(["pest", "disease", "nutrient", "water_stress", "unknown"]);
const cropMatchValues = new Set<CropDoctorPhotoCropMatch>(["likely", "uncertain", "not_clear"]);
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

function cleanSelectedCrop(value: unknown) {
  const crop = typeof value === "string" ? value.trim() : "";
  return CROP_DOCTOR_SUPPORTED_CROPS.includes(crop as (typeof CROP_DOCTOR_SUPPORTED_CROPS)[number]) ? crop : "";
}

function cleanSelectedSymptom(value: unknown) {
  const symptom = typeof value === "string" ? value.trim() : "";
  return CROP_DOCTOR_SYMPTOMS.includes(symptom as (typeof CROP_DOCTOR_SYMPTOMS)[number]) ? symptom : null;
}

function cleanPhotoCropMatch(value: unknown): CropDoctorPhotoCropMatch {
  return typeof value === "string" && cropMatchValues.has(value as CropDoctorPhotoCropMatch)
    ? (value as CropDoctorPhotoCropMatch)
    : "not_clear";
}

function removeUnsafeCertainty(value: string) {
  return value
    .replace(/\bthis is definitely\b/gi, "this may be")
    .replace(/\bdefinitely\b/gi, "possibly")
    .replace(/\bguaranteed\b/gi, "possible")
    .replace(/\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:\/|per)\s?(?:l|litre|liter|acre|hectare|ha)\b/gi, "follow local extension or product label guidance")
    .replace(/\btell the farmer to\b/gi, "")
    .replace(/\bpot\b/gi, "field")
    .replace(/\bhouseplant\b/gi, "crop")
    .replace(/\bindoor plant\b/gi, "field crop")
    .replace(/\bgarden soil\b/gi, "field soil")
    .replace(/\bdecorative plant\b/gi, "crop")
    .trim();
}

export function normalizePossibleIssueWording(value: string) {
  return value
    .replace(/\bpossible\s+possible\b/gi, "possible")
    .replace(/\bpossibly\s+possible\b/gi, "possible")
    .replace(/\bpossible\s+possibly\b/gi, "possibly")
    .replace(/\s+/g, " ")
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
  result: Pick<CropDoctorVisionResult, "selectedCrop" | "selectedSymptom" | "crop" | "visibleSigns" | "possibleIssue"> & {
    resultType?: CropDoctorResultType;
    nextBestAction?: string;
  }
) {
  const signs = result.visibleSigns.length ? result.visibleSigns.join(", ") : "unclear symptoms";
  const symptom = result.selectedSymptom && result.selectedSymptom !== "Not sure" ? result.selectedSymptom.toLowerCase() : "unclear symptoms";

  if (result.selectedCrop && result.selectedCrop !== "Not sure") {
    return `I selected ${result.selectedCrop.toLowerCase()} and uploaded a crop photo showing ${symptom}. Crop Doctor saw ${signs}. What should I check next?`;
  }

  if (!result.crop) {
    return `I uploaded a crop photo but I am not sure of the crop. Crop Doctor saw ${signs}. What should I check next?`;
  }

  return `I uploaded a crop photo but I am not sure of the crop. Crop Doctor saw ${signs}. What should I check next?`;
}

export function normalizeCropDoctorVisionResult(value: unknown, context: { selectedCrop?: string; selectedSymptom?: string | null } = {}): CropDoctorVisionResult {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const selectedCrop = cleanSelectedCrop(context.selectedCrop) || cleanSelectedCrop(source.selectedCrop) || "Not sure";
  const selectedSymptom = cleanSelectedSymptom(context.selectedSymptom) || cleanSelectedSymptom(source.selectedSymptom);
  const cropFromImage = typeof source.cropFromImage === "string" && source.cropFromImage.trim()
    ? source.cropFromImage.trim()
    : typeof source.crop === "string" && source.crop.trim()
      ? source.crop.trim()
      : null;
  const crop = selectedCrop !== "Not sure" ? selectedCrop : cropFromImage;
  const visibleSigns = cleanList(source.visibleSigns, ["unclear visible signs"]);
  const issueCategory = cleanIssueCategory(source.issueCategory);
  const possibleIssue = cleanText(source.possibleIssue, "Possible crop health issue");
  let mainFinding = cleanText(source.mainFinding, cleanText(source.whatThisMeans, possibleIssue));
  const cropConfidence = crop ? cleanConfidence(source.cropConfidence) : "low";
  let photoCropMatch = cleanPhotoCropMatch(source.photoCropMatch);

  if (selectedCrop === "Not sure") {
    photoCropMatch = cropFromImage ? "uncertain" : "not_clear";
  } else if (!cropFromImage) {
    photoCropMatch = source.photoCropMatch ? photoCropMatch : "not_clear";
  } else if (cropFromImage.toLowerCase() === selectedCrop.toLowerCase()) {
    photoCropMatch = source.photoCropMatch ? photoCropMatch : "likely";
  } else if (!source.photoCropMatch) {
    photoCropMatch = "uncertain";
  }

  if (selectedCrop !== "Not sure" && photoCropMatch !== "likely") {
    mainFinding = `The selected crop is ${selectedCrop.toLowerCase()}, but the photo does not clearly show ${selectedCrop.toLowerCase()}. Please upload a clearer photo of the affected ${selectedCrop.toLowerCase()} plant.`;
  }

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
    selectedCrop,
    selectedSymptom,
    photoCropMatch,
    cropFromImage,
    crop,
    cropConfidence,
    resultType,
    possibleIssue,
    issueCategory,
    confidence: cleanConfidence(source.confidence),
    visibleSigns,
    mainFinding,
    whatToCheck: cleanList(source.whatToCheck, [
      "Check both sides of nearby affected leaves.",
      "Look for insects, powder, rot, or spreading spots.",
      "Compare affected plants with healthy plants nearby."
    ]),
    whatThisMeans: cleanText(
      source.whatThisMeans,
      "The photo gives some clues, but FarmMate cannot confirm the exact cause from the image alone."
    ),
    recommendedActions: cleanList(source.recommendedActions ?? source.recommendedAction, [
      "Inspect 10 nearby plants for the same signs.",
      "Remove badly affected leaves only if few plants are affected.",
      "Contact an extension officer if many plants are affected or symptoms are spreading."
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
    possibleIssue: normalizePossibleIssueWording(removeUnsafeCertainty(result.possibleIssue)),
    mainFinding: removeUnsafeCertainty(result.mainFinding),
    whatToCheck: result.whatToCheck.map(removeUnsafeCertainty),
    whatThisMeans: removeUnsafeCertainty(result.whatThisMeans),
    recommendedActions: result.recommendedActions.map(removeUnsafeCertainty),
    recommendedAction: result.recommendedActions.map(removeUnsafeCertainty),
    prevention: result.prevention.map(removeUnsafeCertainty),
    nextBestAction: removeUnsafeCertainty(result.nextBestAction)
  };

  return {
    ...sanitized,
    askFarmMatePrompt: buildCropDoctorAskFarmMatePrompt(sanitized)
  };
}

export function buildCropDoctorHandoffContext(result: CropDoctorVisionResult): CropDoctorHandoffContext {
  return {
    source: "crop_doctor",
    question: result.askFarmMatePrompt,
    selectedCrop: result.selectedCrop,
    selectedSymptom: result.selectedSymptom,
    crop: result.crop,
    cropConfidence: result.cropConfidence,
    possibleIssue: normalizePossibleIssueWording(result.possibleIssue),
    issueCategory: result.issueCategory,
    resultType: result.resultType,
    visibleSigns: result.visibleSigns.slice(0, 3),
    nextBestAction: result.nextBestAction
  };
}

export function cropDoctorResultHasUnsafeLanguage(result: CropDoctorVisionResult) {
  const text = [
    result.possibleIssue,
    result.mainFinding,
    result.whatThisMeans,
    result.selectedCrop,
    result.selectedSymptom ?? "",
    result.photoCropMatch,
    result.cropFromImage ?? "",
    ...result.whatToCheck,
    ...result.visibleSigns,
    ...result.recommendedActions,
    ...result.prevention,
    result.nextBestAction,
    result.askFarmMatePrompt
  ]
    .join(" ")
    .toLowerCase();

  return /tell the farmer|definitely|guaranteed diagnosis|guaranteed|exact diagnosis|\bpot\b|houseplant|indoor plant|garden soil|decorative plant|\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:\/|per)\s?(?:l|litre|liter|acre|hectare|ha)\b/.test(text);
}

export function cropDoctorVisionSystemPrompt() {
  return `You are GG FarmMate Crop Doctor, a guided field crop diagnostic workflow for Ghanaian farmers.
Return only valid JSON with these fields:
selectedCrop, selectedSymptom, photoCropMatch, cropFromImage, resultType, possibleIssue, issueCategory, confidence, visibleSigns, mainFinding, whatToCheck, recommendedActions, prevention, nextBestAction, askFarmMatePrompt.

Rules:
- Use the farmer-selected crop and selected symptom as primary context.
- If selectedCrop is "Not sure", try cautious crop identification only and set cropFromImage when visible.
- Do not guess crop confidently from image alone.
- Do not use the filename to identify the crop or issue. Use only what is visible in the image.
- If selected crop and the image appear inconsistent, set photoCropMatch to "uncertain" and say the photo match is uncertain.
- Use photoCropMatch exactly as one of: likely, uncertain, not_clear.
- If crop is unclear, set cropFromImage to null and photoCropMatch to "not_clear".
- Use resultType exactly as one of: no_clear_problem, possible_disease, possible_pest, possible_nutrient_issue, possible_water_stress, crop_not_confirmed, photo_unclear, harvest_or_storage_check.
- If the photo shows harvested produce, roots, tubers or storage quality rather than a field plant, use resultType "harvest_or_storage_check".
- If no clear health problem is visible, use resultType "no_clear_problem" and do not force a disease diagnosis.
- If the photo is too blurry, dark, distant or incomplete, use resultType "photo_unclear".
- Focus on visible symptoms and field context from the selected crop and selected symptom.
- Explain uncertainty clearly.
- Suggest possible issue categories only: pest, disease, nutrient, water_stress, unknown.
- Keep visibleSigns, whatToCheck, recommendedActions and prevention to maximum 3 short bullet strings each.
- Keep mainFinding short, practical and specific to what is visible.
- For field disease signs, mainFinding should be a farmer-friendly headline such as "Possible maize rust symptoms".
- Recommend simple checks and practical next steps.
- Recommend prevention and good farming practice before chemicals.
- Think like a field crop advisor, not a home gardening assistant.
- Use farmer-scale language: field, crop, plants nearby, affected leaves, plot, farm, extension officer, harvest, seedlings.
- Avoid home gardening language: pot, houseplant, indoor plant, garden soil, decorative plant.
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
