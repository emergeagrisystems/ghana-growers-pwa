import type { FarmMateCreditDecision, FarmMateCreditStatus, FarmMateUsageEvent, FarmMateUsageTool } from "./types";

export const FARM_MATE_MAX_USAGE_WINDOW_HOURS = 12;
export const FARM_MATE_MAX_USAGE_WINDOW_MS = FARM_MATE_MAX_USAGE_WINDOW_HOURS * 60 * 60 * 1000;
export const FARM_MATE_RAPID_SUBMISSION_MS = 3500;

export const FARM_MATE_TOOL_LIMITS: Record<FarmMateUsageTool, { label: string; limit: number; windowHours: number }> = {
  ask_farmmate: {
    label: "Ask questions",
    limit: 5,
    windowHours: 6
  },
  crop_doctor: {
    label: "analyses",
    limit: 2,
    windowHours: 12
  }
};

export function farmMateUsageWindowMs(tool: FarmMateUsageTool) {
  return FARM_MATE_TOOL_LIMITS[tool].windowHours * 60 * 60 * 1000;
}

function eventTime(event: FarmMateUsageEvent) {
  return new Date(event.createdAt).getTime();
}

export function eventsInsideWindow(tool: FarmMateUsageTool, events: FarmMateUsageEvent[], now = new Date()) {
  const windowStart = now.getTime() - farmMateUsageWindowMs(tool);

  return events
    .filter((event) => {
      const createdAt = eventTime(event);
      return Number.isFinite(createdAt) && createdAt > windowStart && createdAt <= now.getTime();
    })
    .sort((a, b) => eventTime(a) - eventTime(b));
}

export function formatRefreshIn(resetAt: string | null, now = new Date(), windowHours = FARM_MATE_MAX_USAGE_WINDOW_HOURS) {
  if (!resetAt) {
    return `within ${windowHours} hours`;
  }

  const diffMs = Math.max(0, new Date(resetAt).getTime() - now.getTime());
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.ceil((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  if (hours <= 0) {
    return `${Math.max(1, minutes)}m`;
  }

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function getFarmMateCreditStatus(tool: FarmMateUsageTool, events: FarmMateUsageEvent[], now = new Date()): FarmMateCreditStatus {
  const config = FARM_MATE_TOOL_LIMITS[tool];
  const windowMs = farmMateUsageWindowMs(tool);
  const recentEvents = eventsInsideWindow(tool, events.filter((event) => event.tool === tool), now);
  const used = recentEvents.length;
  const remaining = Math.max(0, config.limit - used);
  const oldestEvent = recentEvents[0];
  const resetAt = oldestEvent ? new Date(eventTime(oldestEvent) + windowMs).toISOString() : null;
  const isExhausted = remaining <= 0;

  return {
    tool,
    label: config.label,
    limit: config.limit,
    remaining,
    used,
    windowHours: config.windowHours,
    resetAt,
    refreshInText: formatRefreshIn(resetAt, now, config.windowHours),
    isExhausted,
    creditState: isExhausted ? "exhausted" : "available"
  };
}

export function getFarmMateCreditDecision(tool: FarmMateUsageTool, events: FarmMateUsageEvent[], now = new Date()): FarmMateCreditDecision {
  const status = getFarmMateCreditStatus(tool, events, now);
  const recentEvents = eventsInsideWindow(tool, events.filter((event) => event.tool === tool), now);
  const latestEvent = recentEvents[recentEvents.length - 1];

  if (status.isExhausted) {
    return {
      ...status,
      allowed: false,
      reason: "credits_exhausted"
    };
  }

  if (latestEvent && now.getTime() - eventTime(latestEvent) < FARM_MATE_RAPID_SUBMISSION_MS) {
    return {
      ...status,
      allowed: false,
      reason: "rapid_submission"
    };
  }

  return {
    ...status,
    allowed: true
  };
}

export function isCountableFarmMateSubmission(message: string) {
  return message.trim().length > 0;
}

export function canUseMemoryUsageFallback(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv !== "production";
}

export function usageTrackingUnavailableDecision(tool: FarmMateUsageTool, now = new Date()): FarmMateCreditDecision {
  return {
    ...getFarmMateCreditStatus(tool, [], now),
    remaining: 0,
    isExhausted: true,
    creditState: "temporarily_unavailable",
    allowed: false,
    reason: "usage_tracking_unavailable"
  };
}

export const CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT =
  "I do not have Crop Doctor checks available right now. Can you guide me on what to check from my crop photo?";

export const CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE =
  "The photo analysis finished, but Crop Doctor could not confirm whether its check was recorded. Check your remaining checks before retrying, or ask Mama G what to look for.";

export const CROP_DOCTOR_EXHAUSTED_MESSAGE =
  "No Crop Doctor checks are left in this 12-hour window. You can ask Mama G or wait for checks to reset.";

export const FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE =
  "Your Ask Mama G questions will be available again when the 6-hour window resets.";

export const FARM_MATE_FEEDBACK_CTA = {
  label: "Share feedback",
  href: "/farmer-hub/feedback"
} as const;

export function farmMateCreditLine(tool: FarmMateUsageTool, status?: FarmMateCreditStatus | null) {
  if (!status) {
    return tool === "ask_farmmate" ? "Checking Ask Mama G questions..." : "Checking Crop Doctor checks...";
  }

  if (status.creditState === "temporarily_unavailable") {
    return tool === "ask_farmmate" ? "Ask question balance unavailable. Try again shortly." : "Crop Doctor check balance unavailable. Try again shortly.";
  }

  if (status.isExhausted) {
    const refreshText = status.resetAt ? `resets in ${status.refreshInText}` : `resets ${status.refreshInText}`;

    if (tool === "ask_farmmate") {
      return `0 of ${status.limit} Ask Mama G questions left · ${refreshText}`;
    }

    return `0 of ${status.limit} Crop Doctor checks left · ${refreshText}`;
  }

  if (tool === "ask_farmmate") {
    return `${status.remaining} of ${status.limit} Ask Mama G questions left · Resets every ${status.windowHours} hours`;
  }

  return `${status.remaining} of ${status.limit} Crop Doctor checks left · Resets every ${status.windowHours} hours`;
}

export function cropDoctorCreditMessage(decision: Pick<FarmMateCreditDecision, "reason" | "refreshInText">) {
  if (decision.reason === "usage_tracking_unavailable") {
    return "Crop Doctor could not check your balance, so no photo check started and no credit was used. Try again shortly.";
  }

  if (decision.reason === "rapid_submission") {
    return "Crop Doctor is still checking your last photo. Wait a few seconds before trying again; no second check has started.";
  }

  return CROP_DOCTOR_EXHAUSTED_MESSAGE;
}

export function askFarmMateCreditMessage(decision: Pick<FarmMateCreditDecision, "reason" | "refreshInText">) {
  if (decision.reason === "usage_tracking_unavailable") {
    return "Mama G could not check your question balance. No new answer started. Try again shortly.";
  }

  if (decision.reason === "rapid_submission") {
    return "Mama G is still handling your last question. Wait a few seconds before asking again.";
  }

  return FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE;
}

export function shouldDisableCropDoctorAnalysis(status?: FarmMateCreditStatus | null) {
  return status?.creditState === "exhausted" || status?.creditState === "temporarily_unavailable";
}

export function shouldDisableCropDoctorUpload(status?: FarmMateCreditStatus | null) {
  return status?.creditState === "exhausted" || status?.creditState === "temporarily_unavailable";
}
