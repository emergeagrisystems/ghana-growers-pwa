export type FarmMateUsageTool = "ask_farmmate" | "crop_doctor";

export type FarmMateUsageEvent = {
  tool: FarmMateUsageTool;
  createdAt: string;
};

export type FarmMateCreditState = "available" | "exhausted" | "temporarily_unavailable";

export type FarmMateCreditStatus = {
  tool: FarmMateUsageTool;
  label: string;
  limit: number;
  remaining: number;
  used: number;
  windowHours: number;
  resetAt: string | null;
  refreshInText: string;
  isExhausted: boolean;
  creditState: FarmMateCreditState;
};

export type FarmMateCreditDecision = FarmMateCreditStatus & {
  allowed: boolean;
  reason?: "credits_exhausted" | "rapid_submission" | "usage_tracking_unavailable";
};
