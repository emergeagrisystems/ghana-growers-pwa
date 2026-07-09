import type { FarmMateCreditDecision, FarmMateCreditStatus, FarmMateUsageEvent, FarmMateUsageTool } from "./types";

export const FARM_MATE_USAGE_WINDOW_HOURS = 12;
export const FARM_MATE_USAGE_WINDOW_MS = FARM_MATE_USAGE_WINDOW_HOURS * 60 * 60 * 1000;
export const FARM_MATE_RAPID_SUBMISSION_MS = 3500;

export const FARM_MATE_TOOL_LIMITS: Record<FarmMateUsageTool, { label: string; limit: number }> = {
  ask_farmmate: {
    label: "Ask questions",
    limit: 5
  },
  crop_doctor: {
    label: "analyses",
    limit: 2
  }
};

function eventTime(event: FarmMateUsageEvent) {
  return new Date(event.createdAt).getTime();
}

export function eventsInsideWindow(events: FarmMateUsageEvent[], now = new Date()) {
  const windowStart = now.getTime() - FARM_MATE_USAGE_WINDOW_MS;

  return events
    .filter((event) => {
      const createdAt = eventTime(event);
      return Number.isFinite(createdAt) && createdAt > windowStart && createdAt <= now.getTime();
    })
    .sort((a, b) => eventTime(a) - eventTime(b));
}

export function formatRefreshIn(resetAt: string | null, now = new Date()) {
  if (!resetAt) {
    return `within ${FARM_MATE_USAGE_WINDOW_HOURS} hours`;
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
  const recentEvents = eventsInsideWindow(events.filter((event) => event.tool === tool), now);
  const used = recentEvents.length;
  const remaining = Math.max(0, config.limit - used);
  const oldestEvent = recentEvents[0];
  const resetAt = oldestEvent ? new Date(eventTime(oldestEvent) + FARM_MATE_USAGE_WINDOW_MS).toISOString() : null;
  const isExhausted = remaining <= 0;

  return {
    tool,
    label: config.label,
    limit: config.limit,
    remaining,
    used,
    windowHours: FARM_MATE_USAGE_WINDOW_HOURS,
    resetAt,
    refreshInText: formatRefreshIn(resetAt, now),
    isExhausted,
    creditState: isExhausted ? "exhausted" : "available"
  };
}

export function getFarmMateCreditDecision(tool: FarmMateUsageTool, events: FarmMateUsageEvent[], now = new Date()): FarmMateCreditDecision {
  const status = getFarmMateCreditStatus(tool, events, now);
  const recentEvents = eventsInsideWindow(events.filter((event) => event.tool === tool), now);
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
    return `FarmMate Credits: ${status.remaining} Ask question${status.remaining === 1 ? "" : "s"} remaining`;
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

  const refreshText = decision.refreshInText.startsWith("within ") ? `refresh ${decision.refreshInText}` : `refresh in ${decision.refreshInText}`;
  return `You've used your free Crop Doctor checks for now. Your credits ${refreshText}.`;
}

export function shouldDisableCropDoctorAnalysis(status?: FarmMateCreditStatus | null) {
  return status?.creditState === "exhausted" || status?.creditState === "temporarily_unavailable";
}

export function shouldDisableCropDoctorUpload(status?: FarmMateCreditStatus | null) {
  return status?.creditState === "exhausted" || status?.creditState === "temporarily_unavailable";
}
