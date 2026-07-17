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
  "Crop Doctor AI is temporarily limited, but you can still ask FarmMate for guidance.";

export const FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE =
  "You can continue using GG FarmMate when your credits refresh. If something was confusing, please share feedback.";

export const FARM_MATE_FEEDBACK_CTA = {
  label: "Share feedback",
  href: "/farmer-hub/feedback"
} as const;

export function farmMateCreditLine(tool: FarmMateUsageTool, status?: FarmMateCreditStatus | null) {
  if (!status) {
    return tool === "ask_farmmate" ? "FarmMate Credits: checking Ask questions..." : "Crop Doctor Credits: checking checks...";
  }

  if (status.creditState === "temporarily_unavailable") {
    return tool === "ask_farmmate" ? "FarmMate Credits: temporarily unavailable" : "Crop Doctor Credits: temporarily unavailable";
  }

  if (status.isExhausted) {
    const refreshText = status.resetAt ? `refreshes in ${status.refreshInText}` : `refreshes ${status.refreshInText}`;

    if (tool === "ask_farmmate") {
      return `0 Ask questions remaining - ${refreshText}`;
    }

    return `0 checks remaining - ${refreshText}`;
  }

  if (tool === "ask_farmmate") {
    return `FarmMate Credits: ${status.remaining} Ask question${status.remaining === 1 ? "" : "s"} remaining - 5 free Ask FarmMate questions every 6 hours`;
  }

  return `Crop Doctor Credits: ${status.remaining} check${status.remaining === 1 ? "" : "s"} remaining`;
}

export function cropDoctorCreditMessage(decision: Pick<FarmMateCreditDecision, "reason" | "refreshInText">) {
  if (decision.reason === "usage_tracking_unavailable") {
    return CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE;
  }

  if (decision.reason === "rapid_submission") {
    return "FarmMate is still checking your last photo. Please wait a few seconds before trying again.";
  }

  return FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE;
}

export function askFarmMateCreditMessage(decision: Pick<FarmMateCreditDecision, "reason" | "refreshInText">) {
  if (decision.reason === "usage_tracking_unavailable") {
    return "FarmMate AI is temporarily limited, but you can still use the local guidance.";
  }

  if (decision.reason === "rapid_submission") {
    return "FarmMate is still catching up. Please wait a few seconds before asking again.";
  }

  return FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE;
}

export function shouldDisableCropDoctorAnalysis(status?: FarmMateCreditStatus | null) {
  return status?.creditState === "exhausted" || status?.creditState === "temporarily_unavailable";
}

export function shouldDisableCropDoctorUpload(status?: FarmMateCreditStatus | null) {
  return status?.creditState === "exhausted" || status?.creditState === "temporarily_unavailable";
}
