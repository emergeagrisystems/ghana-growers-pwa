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
    return "soon";
  }

  const diffMs = Math.max(0, new Date(resetAt).getTime() - now.getTime());
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.ceil((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  if (hours <= 0) {
    return `${Math.max(1, minutes)} minute${minutes === 1 ? "" : "s"}`;
  }

  return minutes > 0 ? `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}` : `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function getFarmMateCreditStatus(tool: FarmMateUsageTool, events: FarmMateUsageEvent[], now = new Date()): FarmMateCreditStatus {
  const config = FARM_MATE_TOOL_LIMITS[tool];
  const recentEvents = eventsInsideWindow(events.filter((event) => event.tool === tool), now);
  const used = recentEvents.length;
  const remaining = Math.max(0, config.limit - used);
  const oldestEvent = recentEvents[0];
  const resetAt = oldestEvent ? new Date(eventTime(oldestEvent) + FARM_MATE_USAGE_WINDOW_MS).toISOString() : null;

  return {
    tool,
    label: config.label,
    limit: config.limit,
    remaining,
    used,
    windowHours: FARM_MATE_USAGE_WINDOW_HOURS,
    resetAt,
    refreshInText: formatRefreshIn(resetAt, now),
    isExhausted: remaining <= 0
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
    allowed: false,
    reason: "usage_tracking_unavailable"
  };
}
