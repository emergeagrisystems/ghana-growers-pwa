import { insertSupabaseRecord } from "../supabase/admin";

export const farmMatePilotFeedbackSuccessMessage =
  "Thank you for helping improve GG FarmMate. Your feedback will help us make it more useful for farmers.";

export const farmMatePilotFeedbackUnavailableMessage =
  "Thanks for testing GG FarmMate. Feedback submission is temporarily unavailable. Please try again later.";

export const farmMatePilotHelpfulnessOptions = [
  { label: "Yes", value: "yes" },
  { label: "Partly", value: "partly" },
  { label: "Not yet", value: "not_yet" }
] as const;

export const farmMatePilotWouldUseAgainOptions = [
  { label: "Yes", value: "yes" },
  { label: "Maybe", value: "maybe" },
  { label: "No", value: "no" }
] as const;

export type FarmMatePilotHelpfulness = (typeof farmMatePilotHelpfulnessOptions)[number]["value"];
export type FarmMatePilotWouldUseAgain = (typeof farmMatePilotWouldUseAgainOptions)[number]["value"];

export type FarmMatePilotFeedback = {
  nameOrNickname?: string;
  region?: string;
  mainCrop?: string;
  testedFeature: string;
  helpfulness: FarmMatePilotHelpfulness;
  confusion?: string;
  improvement?: string;
  wouldUseAgain: FarmMatePilotWouldUseAgain;
};

export type FarmMatePilotFeedbackValidation =
  | { ok: true; data: FarmMatePilotFeedback }
  | { ok: false; error: string; field?: string };

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeChoice<T extends string>(value: unknown, allowed: readonly T[]) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return allowed.includes(normalized as T) ? (normalized as T) : "";
}

export function sanitizeFarmMatePilotFeedback(input: unknown): FarmMatePilotFeedbackValidation {
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const testedFeature = cleanText(payload.testedFeature, 500);
  const helpfulness = normalizeChoice(
    payload.helpfulness,
    farmMatePilotHelpfulnessOptions.map((option) => option.value)
  );
  const wouldUseAgain = normalizeChoice(
    payload.wouldUseAgain,
    farmMatePilotWouldUseAgainOptions.map((option) => option.value)
  );

  if (!testedFeature) {
    return { ok: false, error: "Please tell us what you tested.", field: "testedFeature" };
  }

  if (!helpfulness) {
    return { ok: false, error: "Please choose whether FarmMate was helpful.", field: "helpfulness" };
  }

  if (!wouldUseAgain) {
    return { ok: false, error: "Please choose whether you would use FarmMate again.", field: "wouldUseAgain" };
  }

  const data: FarmMatePilotFeedback = {
    testedFeature,
    helpfulness,
    wouldUseAgain
  };

  const nameOrNickname = cleanText(payload.nameOrNickname, 120);
  const region = cleanText(payload.region, 120);
  const mainCrop = cleanText(payload.mainCrop, 120);
  const confusion = cleanText(payload.confusion, 800);
  const improvement = cleanText(payload.improvement, 800);

  if (nameOrNickname) data.nameOrNickname = nameOrNickname;
  if (region) data.region = region;
  if (mainCrop) data.mainCrop = mainCrop;
  if (confusion) data.confusion = confusion;
  if (improvement) data.improvement = improvement;

  return { ok: true, data };
}

export async function storeFarmMatePilotFeedback(feedback: FarmMatePilotFeedback) {
  const result = await insertSupabaseRecord("farmmate_pilot_feedback", {
    name_or_nickname: feedback.nameOrNickname ?? null,
    region: feedback.region ?? null,
    main_crop: feedback.mainCrop ?? null,
    tested_feature: feedback.testedFeature,
    helpfulness: feedback.helpfulness,
    confusion: feedback.confusion ?? null,
    improvement: feedback.improvement ?? null,
    would_use_again: feedback.wouldUseAgain
  });

  if (result.error) {
    return { ok: false as const, status: result.status, error: result.error };
  }

  return { ok: true as const, status: result.status };
}
