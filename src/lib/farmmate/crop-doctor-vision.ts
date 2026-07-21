import {
  FARM_MATE_CASH_CROP_CAUTION,
  farmMateCropFamilyGuidance,
  farmMateCropGroupLabel,
  farmMateCropLibrary,
  farmMateCropLibraryPromptContext,
  farmMateCropOptionsByGroup,
  farmMateCropSymptomsFor,
  farmMateLimitedCropGuidanceNote,
  findFarmMateCropLibraryEntry,
  isFarmMateCashPerennialCrop
} from "./crop-library";

export type CropDoctorConfidence = "high" | "medium" | "low";
export type CropDoctorPhotoCropMatch = "likely" | "uncertain" | "not_clear";
export type CropDoctorPhotoConfidenceLabel = "Likely" | "Possible" | "Unclear";

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
  cropGroup: string | null;
  cropFamily: string | null;
  cropConfidence: CropDoctorConfidence;
  photoConfidenceLabel: CropDoctorPhotoConfidenceLabel;
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
  familyGuidance: string | null;
  limitedGuidanceNote: string | null;
  cashCropCaution: string | null;
  askFarmMatePrompt: string;
};

export type CropDoctorHandoffContext = {
  source: "crop_doctor";
  question: string;
  selectedCrop: string;
  selectedSymptom: string | null;
  crop: string | null;
  cropGroup: string | null;
  cropFamily: string | null;
  cropConfidence: CropDoctorConfidence;
  possibleIssue: string;
  issueCategory: CropDoctorIssueCategory;
  resultType: CropDoctorResultType;
  visibleSigns: string[];
  nextBestAction: string;
  familyGuidance: string | null;
  limitedGuidanceNote: string | null;
  cashCropCaution: string | null;
};

export const CROP_DOCTOR_ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const CROP_DOCTOR_AUTO_DETECT_VALUE = "not_sure";
export const CROP_DOCTOR_NO_SELECTED_CROP = "Not sure";
export const CROP_DOCTOR_CROP_GROUPS = farmMateCropOptionsByGroup().map((group) => ({
  group: group.group,
  label: group.label,
  crops: group.crops.map((entry) => entry.displayName)
}));
export const CROP_DOCTOR_SUPPORTED_CROPS = CROP_DOCTOR_CROP_GROUPS.flatMap((group) => group.crops);
const baseCropDoctorSymptoms = [
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
export const CROP_DOCTOR_SYMPTOMS = Array.from(
  new Set([...baseCropDoctorSymptoms, ...farmMateCropLibrary.flatMap((entry) => entry.commonSymptoms)])
);
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

export function normalizeCropDoctorSelectedCrop(value: unknown) {
  const crop = typeof value === "string" ? value.trim() : "";

  if (!crop || crop.toLowerCase() === CROP_DOCTOR_AUTO_DETECT_VALUE || crop.toLowerCase() === "detect automatically") {
    return CROP_DOCTOR_NO_SELECTED_CROP;
  }

  const entry = findFarmMateCropLibraryEntry(crop);

  return entry?.supportedFor.includes("crop_doctor") && entry.cropGroup !== "unknown_other"
    ? entry.displayName
    : CROP_DOCTOR_NO_SELECTED_CROP;
}

export function cropDoctorSymptomsForCrop(value: string | null | undefined) {
  return farmMateCropSymptomsFor(value);
}

function hasFarmerSelectedCrop(value: unknown) {
  return normalizeCropDoctorSelectedCrop(value) !== CROP_DOCTOR_NO_SELECTED_CROP;
}

function cleanSelectedCrop(value: unknown) {
  return normalizeCropDoctorSelectedCrop(value);
}

function cleanSelectedSymptom(value: unknown) {
  const symptom = typeof value === "string" ? value.trim() : "";
  return CROP_DOCTOR_SYMPTOMS.includes(symptom) ? symptom : null;
}

function cleanDetectedCrop(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = findFarmMateCropLibraryEntry(value);
  return normalized?.displayName ?? (value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || null);
}

function sameCrop(left: string, right: string) {
  const leftEntry = findFarmMateCropLibraryEntry(left);
  const rightEntry = findFarmMateCropLibraryEntry(right);

  if (leftEntry && rightEntry) {
    return leftEntry.cropKey === rightEntry.cropKey;
  }

  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function cropDoctorPhotoConfidenceLabel(
  result: Pick<CropDoctorVisionResult, "cropConfidence" | "photoCropMatch" | "resultType">
): CropDoctorPhotoConfidenceLabel {
  if (
    result.resultType === "crop_not_confirmed" ||
    result.resultType === "photo_unclear" ||
    result.cropConfidence === "low" ||
    result.photoCropMatch === "not_clear"
  ) {
    return "Unclear";
  }

  return result.cropConfidence === "high" && result.photoCropMatch === "likely" ? "Likely" : "Possible";
}

export function cropDoctorCashCropCaution(cropName: string | null | undefined, resultType: CropDoctorResultType) {
  const seriousResult = [
    "possible_disease",
    "possible_pest",
    "possible_nutrient_issue",
    "possible_water_stress"
  ].includes(resultType);

  return seriousResult && isFarmMateCashPerennialCrop(cropName) ? FARM_MATE_CASH_CROP_CAUTION : null;
}

function cleanPhotoCropMatch(value: unknown): CropDoctorPhotoCropMatch {
  return typeof value === "string" && cropMatchValues.has(value as CropDoctorPhotoCropMatch)
    ? (value as CropDoctorPhotoCropMatch)
    : "not_clear";
}

function removeUnsafeCertainty(value: string) {
  const cleanValue = value.trim();

  if (/\b(?:houseplant|indoor plant|balcony|hobby garden(?:ing)?|home garden(?:ing)?|decorative plant|pot)\b/i.test(cleanValue)) {
    return "Check the crop and surrounding field conditions.";
  }

  if (/\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:\/|per)\s?(?:l|litre|liter|acre|hectare|ha)\b/i.test(cleanValue)) {
    return "Follow local extension or product label guidance before applying any treatment.";
  }

  if (/\b(?:guaranteed\s+)?(?:yields?|profits?)\b|\b(?:market prices?|buyer demand|buyer availability)\b/i.test(cleanValue)) {
    return "A farm business outcome cannot be confirmed from a crop photo.";
  }

  return cleanValue
    .replace(/\bthis is definitely\b/gi, "this may be")
    .replace(/\bdefinitely\b/gi, "possibly")
    .replace(/\bguaranteed\b/gi, "possible")
    .replace(/\btell the farmer to\b/gi, "")
    .replace(/\bgarden soil\b/gi, "field soil")
    .trim();
}

function removeStrongCashCropTreatment(value: string, cashCrop: boolean) {
  if (
    cashCrop &&
    /\b(?:apply|spray|use)\b.{0,50}\b(?:chemical|fungicide|pesticide|insecticide|herbicide)\b/i.test(value)
  ) {
    return "Confirm any crop treatment with an extension officer or experienced crop advisor before applying it.";
  }

  return value;
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
  result: Pick<CropDoctorVisionResult, "selectedCrop" | "selectedSymptom" | "crop" | "visibleSigns" | "possibleIssue"> & {
    cropConfidence?: CropDoctorConfidence;
    resultType?: CropDoctorResultType;
    nextBestAction?: string;
  }
) {
  const signs = result.visibleSigns.length ? result.visibleSigns.join(", ") : "unclear symptoms";
  const symptom = result.selectedSymptom && result.selectedSymptom !== "Not sure" ? result.selectedSymptom.toLowerCase() : "unclear symptoms";

  if (hasFarmerSelectedCrop(result.selectedCrop)) {
    return `I selected ${result.selectedCrop} and uploaded a crop photo showing ${symptom}. Crop Doctor saw ${signs}. What should I check next?`;
  }

  if (result.crop && result.cropConfidence !== "low" && result.resultType !== "crop_not_confirmed") {
    return `Crop Doctor detected ${result.crop} from my photo and saw ${signs}. What should I check next?`;
  }

  return `I uploaded a crop photo, but Crop Doctor could not confirm the crop. It saw ${signs}. What should I check next?`;
}

export function normalizeCropDoctorVisionResult(value: unknown, context: { selectedCrop?: string | null; selectedSymptom?: string | null } = {}): CropDoctorVisionResult {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const selectedCrop = Object.prototype.hasOwnProperty.call(context, "selectedCrop")
    ? cleanSelectedCrop(context.selectedCrop)
    : cleanSelectedCrop(source.selectedCrop);
  const selectedSymptom = cleanSelectedSymptom(context.selectedSymptom) || cleanSelectedSymptom(source.selectedSymptom);
  const cropFromImage = cleanDetectedCrop(source.cropFromImage) ?? cleanDetectedCrop(source.crop);
  const visibleSigns = cleanList(source.visibleSigns, ["unclear visible signs"]);
  let issueCategory = cleanIssueCategory(source.issueCategory);
  let possibleIssue = cleanText(source.possibleIssue, "Possible crop health issue");
  let mainFinding = cleanText(source.mainFinding, cleanText(source.whatThisMeans, possibleIssue));
  const cropConfidence = cropFromImage || selectedCrop !== CROP_DOCTOR_NO_SELECTED_CROP
    ? cleanConfidence(source.cropConfidence ?? source.confidence)
    : "low";
  const confirmedImageCrop = cropFromImage && cropConfidence !== "low" ? cropFromImage : null;
  let confirmedCrop = selectedCrop !== CROP_DOCTOR_NO_SELECTED_CROP ? selectedCrop : confirmedImageCrop;
  let photoCropMatch = cleanPhotoCropMatch(source.photoCropMatch);

  if (selectedCrop === CROP_DOCTOR_NO_SELECTED_CROP) {
    photoCropMatch = confirmedImageCrop ? "uncertain" : "not_clear";
  } else if (!cropFromImage) {
    photoCropMatch = source.photoCropMatch ? photoCropMatch : "not_clear";
  } else if (sameCrop(cropFromImage, selectedCrop)) {
    photoCropMatch = source.photoCropMatch ? photoCropMatch : "likely";
  } else if (!source.photoCropMatch) {
    photoCropMatch = "uncertain";
  }

  if (selectedCrop !== CROP_DOCTOR_NO_SELECTED_CROP && photoCropMatch !== "likely") {
    mainFinding = `The selected crop is ${selectedCrop.toLowerCase()}, but the photo does not clearly show ${selectedCrop.toLowerCase()}. Please upload a clearer photo of the affected ${selectedCrop.toLowerCase()} plant.`;
  }

  let resultType = cleanResultType(
    source.resultType,
    inferResultType({
      crop: confirmedCrop,
      cropConfidence,
      issueCategory,
      possibleIssue,
      mainFinding,
      visibleSigns
    })
  );

  if (selectedCrop === CROP_DOCTOR_NO_SELECTED_CROP && !confirmedImageCrop) {
    resultType = "crop_not_confirmed";
    confirmedCrop = null;
    photoCropMatch = "not_clear";
    issueCategory = "unknown";
    possibleIssue = "Crop not confirmed from this photo";
    mainFinding = "Crop not confirmed.";
  }

  const cropEntry = findFarmMateCropLibraryEntry(confirmedCrop);
  const cropGroup = cropEntry ? farmMateCropGroupLabel(cropEntry.displayName) ?? null : null;
  const cropFamily = cropEntry?.cropFamily ?? null;
  const isUnknownCrop = resultType === "crop_not_confirmed";
  const whatToCheck = isUnknownCrop
    ? [
        "Take one clear photo of the whole plant.",
        "Take one close photo of the affected leaves, stem, fruit, root, or growing point.",
        "Select the crop if you know it, then run the crop check again."
      ]
    : cleanList(source.whatToCheck, [
        "Check both sides of nearby affected leaves.",
        "Look for insects, powder, rot, or spreading spots.",
        "Compare affected plants with healthy plants nearby."
      ]);
  let whatThisMeans = isUnknownCrop
    ? "The photo shows some plant features, but the crop and exact problem are not clear enough to diagnose safely."
    : cleanText(
        source.whatThisMeans,
        "The photo gives some clues, but FarmMate cannot confirm the exact cause from the image alone."
      );
  const usesFamilyOnlyGuidance = Boolean(confirmedCrop) && (!cropEntry || cropEntry.guidanceLevel !== "crop_specific");

  if (usesFamilyOnlyGuidance && (resultType === "possible_disease" || resultType === "possible_pest")) {
    possibleIssue = resultType === "possible_pest" ? "Possible pest-related crop damage" : "Possible crop health problem";
    mainFinding = resultType === "possible_pest" ? "Possible pest-related signs" : "Possible crop health signs";
    whatThisMeans = farmMateCropFamilyGuidance(confirmedCrop) ??
      "The visible signs need a closer field check before naming an exact crop-specific cause.";
  }
  const recommendedActions = isUnknownCrop
    ? [
        "Upload a clearer whole-plant and affected-part photo.",
        "Select the crop if you know it.",
        "Use Ask FarmMate to describe the visible signs and field conditions."
      ]
    : cleanList(source.recommendedActions ?? source.recommendedAction, [
        "Inspect 10 nearby plants for the same signs.",
        "Remove badly affected leaves only if few plants are affected.",
        "Contact an extension officer if many plants are affected or symptoms are spreading."
      ]);
  const nextBestAction = isUnknownCrop
    ? "Upload a clear whole-plant photo and one close photo of the affected part, or select the crop if you know it."
    : cleanText(source.nextBestAction, "Inspect five nearby plants and note whether the same signs are spreading.");
  const prevention = isUnknownCrop
    ? [
        "Avoid applying a treatment until the crop and problem are clearer.",
        "Keep checking nearby plants for the same visible signs."
      ]
    : cleanList(source.prevention, [
        "Keep plants well spaced.",
        "Water at soil level where possible.",
        "Monitor the crop regularly after rain."
      ]);

  const result = {
    selectedCrop,
    selectedSymptom,
    photoCropMatch,
    cropFromImage,
    crop: confirmedCrop,
    cropGroup,
    cropFamily,
    cropConfidence,
    photoConfidenceLabel: "Unclear" as CropDoctorPhotoConfidenceLabel,
    resultType,
    possibleIssue,
    issueCategory,
    confidence: cleanConfidence(source.confidence),
    visibleSigns,
    mainFinding,
    whatToCheck,
    whatThisMeans,
    recommendedActions,
    prevention,
    nextBestAction,
    familyGuidance: farmMateCropFamilyGuidance(confirmedCrop) ?? null,
    limitedGuidanceNote: farmMateLimitedCropGuidanceNote(confirmedCrop) ?? null,
    cashCropCaution: cropDoctorCashCropCaution(confirmedCrop, resultType)
  };

  result.photoConfidenceLabel = cropDoctorPhotoConfidenceLabel(result);

  const isCashCrop = isFarmMateCashPerennialCrop(result.crop);
  const sanitizeAdvice = (text: string) => removeStrongCashCropTreatment(removeUnsafeCertainty(text), isCashCrop);
  const sanitized = {
    ...result,
    possibleIssue: normalizePossibleIssueWording(removeUnsafeCertainty(result.possibleIssue)),
    mainFinding: removeUnsafeCertainty(result.mainFinding),
    whatToCheck: result.whatToCheck.map(sanitizeAdvice),
    whatThisMeans: removeUnsafeCertainty(result.whatThisMeans),
    recommendedActions: result.recommendedActions.map(sanitizeAdvice),
    recommendedAction: result.recommendedActions.map(sanitizeAdvice),
    prevention: result.prevention.map(sanitizeAdvice),
    nextBestAction: sanitizeAdvice(result.nextBestAction)
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
    cropGroup: result.cropGroup,
    cropFamily: result.cropFamily,
    cropConfidence: result.cropConfidence,
    possibleIssue: normalizePossibleIssueWording(result.possibleIssue),
    issueCategory: result.issueCategory,
    resultType: result.resultType,
    visibleSigns: result.visibleSigns.slice(0, 3),
    nextBestAction: result.nextBestAction,
    familyGuidance: result.familyGuidance,
    limitedGuidanceNote: result.limitedGuidanceNote,
    cashCropCaution: result.cashCropCaution
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

  return /tell the farmer|definitely|guaranteed diagnosis|guaranteed|exact diagnosis|guaranteed yield|market price|buyer demand|\bprofit\b|\bpot\b|houseplant|indoor plant|garden soil|decorative plant|balcony|hobby garden|\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:\/|per)\s?(?:l|litre|liter|acre|hectare|ha|plant)\b/.test(text);
}

export function cropDoctorVisionSystemPrompt() {
  return `You are GG FarmMate Crop Doctor, a guided field crop diagnostic workflow for Ghanaian farmers.
Return only valid JSON with these fields:
selectedCrop, selectedSymptom, photoCropMatch, cropFromImage, cropConfidence, resultType, possibleIssue, issueCategory, confidence, visibleSigns, mainFinding, whatThisMeans, whatToCheck, recommendedActions, prevention, nextBestAction, askFarmMatePrompt.

${farmMateCropLibraryPromptContext()}

Rules:
- If selectedCrop is provided, use it only as farmer-provided context and check whether the image appears consistent with that crop.
- If selectedCrop is "Not sure", "not_sure", null, or not provided, attempt to identify the crop from the image using cautious wording.
- If the crop is unclear or the photo is poor, set cropFromImage to null and resultType to "crop_not_confirmed" or "photo_unclear".
- Do not guess a crop confidently from image alone.
- Do not use the filename to identify the crop or issue. Use only what is visible in the image.
- If selected crop and the image appear inconsistent, set photoCropMatch to "uncertain" and say the photo match is uncertain.
- Use photoCropMatch exactly as one of: likely, uncertain, not_clear.
- If crop is unclear, set cropFromImage to null and photoCropMatch to "not_clear".
- Use resultType exactly as one of: no_clear_problem, possible_disease, possible_pest, possible_nutrient_issue, possible_water_stress, crop_not_confirmed, photo_unclear, harvest_or_storage_check.
- If the photo shows harvested produce, roots, tubers or storage quality rather than a field plant, use resultType "harvest_or_storage_check".
- If no clear health problem is visible, use resultType "no_clear_problem" and do not force a disease diagnosis.
- If the photo is too blurry, dark, distant or incomplete, use resultType "photo_unclear".
- Focus on visible symptoms and field context from the selected crop and selected symptom.
- Recognize crop aliases, but return the canonical crop library display name when possible.
- Use crop groups and crop families only as cautious diagnostic context. Do not copy a tomato, pepper, or related-crop diagnosis onto another crop without evidence.
- If full crop-specific guidance is limited, do not refuse. Use this wording: "I do not have full crop-specific guidance for this crop yet, but I can still help using general crop-family guidance."
- For serious or spreading signs on cocoa, cashew, oil palm, coconut, rubber, or coffee, use this caution: "${FARM_MATE_CASH_CROP_CAUTION}"
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
- Do not invent pesticide or fertilizer dosage.
- Do not invent yield, guaranteed yield, profit, market price, buyer demand, or buyer availability.
- Do not recommend fungicide or pesticide as the first step unless the problem is widespread or confirmed by field checks or extension advice.
- Do not recommend dangerous chemical use.
- Do not say "this is definitely".
- Do not give medical or veterinary advice.
- Keep language simple for Ghanaian farmers.
- Keep the answer short. Avoid report-style explanations.
- End with one clear nextBestAction.`;
}
