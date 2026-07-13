import type { FarmMateBrainResponse } from "../decision-engine";

export type FarmMateFarmerAnswer = {
  question: string;
  answer: string;
};

export type FarmMateLocalResponseCard = {
  title: string;
  body: string[];
};

export type FarmMateAiInput = {
  farmerQuestion: string;
  brain: FarmMateBrainResponse;
  farmerAnswers: FarmMateFarmerAnswer[];
  localStructuredResponse: FarmMateLocalResponseCard[];
};

export type FarmMateAiSuccess = {
  ok: true;
  answer: string;
};

export type FarmMateAiFailureReason =
  | "missing_api_key"
  | "openai_request_error"
  | "empty_response"
  | "incomplete_response";

export type FarmMateAiFailure = {
  ok: false;
  reason: FarmMateAiFailureReason;
  fallback: true;
};

export type FarmMateAiResult = FarmMateAiSuccess | FarmMateAiFailure;
