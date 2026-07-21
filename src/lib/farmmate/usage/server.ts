import crypto from "node:crypto";
import { hasSupabaseAdminConfig, insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "../../supabase/admin";
import { canUseMemoryUsageFallback, farmMateUsageWindowMs, getFarmMateCreditDecision, getFarmMateCreditStatus, FARM_MATE_MAX_USAGE_WINDOW_MS, usageTrackingUnavailableDecision } from "./rules";
import type { FarmMateCreditDecision, FarmMateCreditStatus, FarmMateUsageEvent, FarmMateUsageTool } from "./types";

type FarmMateUsageEventRow = {
  id: string;
  anonymous_user_hash: string;
  tool: FarmMateUsageTool;
  created_at: string;
};

const memoryEvents: Array<FarmMateUsageEventRow> = [];

type UsageStorage = "supabase" | "memory" | "none" | "unavailable";

function warnUsage(message: string, detail?: unknown) {
  if (detail) {
    console.warn(`[FarmMate Credits] ${message}`, detail);
    return;
  }

  console.warn(`[FarmMate Credits] ${message}`);
}

export function hashAnonymousDeviceId(deviceId: string) {
  const salt = process.env.FARMMATE_USAGE_HASH_SALT?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "ghana-growers-farmmate-v1";

  return crypto.createHash("sha256").update(`${salt}:${deviceId}`).digest("hex");
}

function cleanDeviceId(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

export function getAnonymousUserHash(value: unknown) {
  const deviceId = cleanDeviceId(value);

  if (!deviceId) {
    return "";
  }

  return hashAnonymousDeviceId(deviceId);
}

function rowToEvent(row: FarmMateUsageEventRow): FarmMateUsageEvent {
  return {
    tool: row.tool,
    createdAt: row.created_at
  };
}

function pruneMemoryEvents(now = new Date()) {
  const cutoff = now.getTime() - FARM_MATE_MAX_USAGE_WINDOW_MS - 60_000;

  for (let index = memoryEvents.length - 1; index >= 0; index -= 1) {
    if (new Date(memoryEvents[index].created_at).getTime() < cutoff) {
      memoryEvents.splice(index, 1);
    }
  }
}

async function readUsageEvents(anonymousUserHash: string, tool: FarmMateUsageTool, now = new Date()) {
  const windowStart = new Date(now.getTime() - farmMateUsageWindowMs(tool)).toISOString();
  const supabaseConfigured = hasSupabaseAdminConfig();

  if (supabaseConfigured) {
    const query = [
      `anonymous_user_hash=eq.${encodeURIComponent(anonymousUserHash)}`,
      `tool=eq.${encodeURIComponent(tool)}`,
      `created_at=gte.${encodeURIComponent(windowStart)}`,
      "order=created_at.asc",
      "select=id,anonymous_user_hash,tool,created_at"
    ].join("&");
    const result = await selectSupabaseRecords<FarmMateUsageEventRow>("farmmate_usage_events", query);

    if (!result.error) {
      return {
        ok: true as const,
        storage: "supabase" as const,
        events: (result.data ?? []).map(rowToEvent)
      };
    }

    const missingTable = /farmmate_usage_events|does not exist|schema cache|relation/i.test(result.error);
    warnUsage(missingTable ? "Usage table missing or unavailable during usage check." : "Usage check failed.", result.error);

    if (!canUseMemoryUsageFallback()) {
      return {
        ok: false as const,
        storage: "unavailable" as const,
        events: [],
        error: result.error
      };
    }
  } else {
    warnUsage("Supabase config missing for usage tracking.");

    if (!canUseMemoryUsageFallback()) {
      return {
        ok: false as const,
        storage: "unavailable" as const,
        events: [],
        error: "missing_supabase_config"
      };
    }

    warnUsage("Using in-memory FarmMate Credits fallback for local development.");
  }

  pruneMemoryEvents(now);

  return {
    ok: true as const,
    storage: "memory" as const,
    events: memoryEvents
      .filter((event) => event.anonymous_user_hash === anonymousUserHash && event.tool === tool)
      .map(rowToEvent)
  };
}

async function writeUsageEvent(anonymousUserHash: string, tool: FarmMateUsageTool, now = new Date()) {
  const payload = {
    id: crypto.randomUUID(),
    anonymous_user_hash: anonymousUserHash,
    tool,
    created_at: now.toISOString()
  };

  if (hasSupabaseAdminConfig()) {
    const result = await insertSupabaseRecord("farmmate_usage_events", payload);

    if (!result.error) {
      return { recorded: true as const, storage: "supabase" as const, eventId: payload.id };
    }

    const missingTable = /farmmate_usage_events|does not exist|schema cache|relation/i.test(result.error);
    warnUsage(missingTable ? "Usage table missing or unavailable during usage write." : "Usage write failed.", result.error);

    if (!canUseMemoryUsageFallback()) {
      return { recorded: false as const, storage: "unavailable" as const, error: result.error };
    }
  } else {
    warnUsage("Supabase config missing for usage tracking write.");

    if (!canUseMemoryUsageFallback()) {
      return { recorded: false as const, storage: "unavailable" as const, error: "missing_supabase_config" };
    }

    warnUsage("Using in-memory FarmMate Credits write fallback for local development.");
  }

  memoryEvents.push(payload);

  return { recorded: true as const, storage: "memory" as const, eventId: payload.id };
}

async function rotateUsageEventId(anonymousUserHash: string, eventId: string, nextEventId: string) {
  if (hasSupabaseAdminConfig()) {
    const filter = [
      `id=eq.${encodeURIComponent(eventId)}`,
      `anonymous_user_hash=eq.${encodeURIComponent(anonymousUserHash)}`,
      "tool=eq.ask_farmmate"
    ].join("&");
    const result = await updateSupabaseRecord("farmmate_usage_events", filter, { id: nextEventId });

    if (!result.error && result.data?.id === nextEventId) {
      return { rotated: true as const, replayed: false as const, storage: "supabase" as const, eventId: nextEventId };
    }

    if (!result.error) {
      const replayQuery = [
        `id=eq.${encodeURIComponent(nextEventId)}`,
        `anonymous_user_hash=eq.${encodeURIComponent(anonymousUserHash)}`,
        "tool=eq.ask_farmmate",
        "select=id,anonymous_user_hash,tool,created_at",
        "limit=1"
      ].join("&");
      const replayResult = await selectSupabaseRecords<FarmMateUsageEventRow>("farmmate_usage_events", replayQuery);

      if (!replayResult.error && replayResult.data?.some((row) => row.id === nextEventId)) {
        return { rotated: true as const, replayed: true as const, storage: "supabase" as const, eventId: nextEventId };
      }

      if (!replayResult.error) {
        return { rotated: false as const, storage: "supabase" as const };
      }

      warnUsage("FarmMate consultation replay could not be checked.", replayResult.error);

      if (!canUseMemoryUsageFallback()) {
        return { rotated: false as const, storage: "unavailable" as const };
      }
    }

    warnUsage("FarmMate consultation continuation could not be claimed.", result.error);

    if (!canUseMemoryUsageFallback()) {
      return { rotated: false as const, storage: "unavailable" as const };
    }
  }

  const memoryEvent = memoryEvents.find(
    (event) => event.id === eventId && event.anonymous_user_hash === anonymousUserHash && event.tool === "ask_farmmate"
  );

  if (!memoryEvent) {
    const replayedMemoryEvent = memoryEvents.some(
      (event) => event.id === nextEventId && event.anonymous_user_hash === anonymousUserHash && event.tool === "ask_farmmate"
    );

    return replayedMemoryEvent
      ? { rotated: true as const, replayed: true as const, storage: "memory" as const, eventId: nextEventId }
      : { rotated: false as const, storage: "memory" as const };
  }

  memoryEvent.id = nextEventId;
  return { rotated: true as const, replayed: false as const, storage: "memory" as const, eventId: nextEventId };
}

export async function getFarmMateCreditsForDevice({
  anonymousDeviceId,
  tool,
  now = new Date()
}: {
  anonymousDeviceId: unknown;
  tool: FarmMateUsageTool;
  now?: Date;
}): Promise<FarmMateCreditStatus & { storage: UsageStorage }> {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);

  if (!anonymousUserHash) {
    return {
      ...getFarmMateCreditStatus(tool, [], now),
      storage: "none"
    };
  }

  const usage = await readUsageEvents(anonymousUserHash, tool, now);

  if (!usage.ok) {
    return {
      ...getFarmMateCreditStatus(tool, [], now),
      remaining: 0,
      isExhausted: true,
      creditState: "temporarily_unavailable",
      storage: usage.storage
    };
  }

  return {
    ...getFarmMateCreditStatus(tool, usage.events, now),
    storage: usage.storage
  };
}

export async function checkFarmMateCreditsForDevice({
  anonymousDeviceId,
  tool,
  now = new Date()
}: {
  anonymousDeviceId: unknown;
  tool: FarmMateUsageTool;
  now?: Date;
}): Promise<FarmMateCreditDecision & { storage: UsageStorage }> {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);

  if (!anonymousUserHash) {
    return {
      ...getFarmMateCreditDecision(tool, [], now),
      storage: "none"
    };
  }

  const usage = await readUsageEvents(anonymousUserHash, tool, now);

  if (!usage.ok) {
    return {
      ...usageTrackingUnavailableDecision(tool, now),
      storage: usage.storage
    };
  }

  return {
    ...getFarmMateCreditDecision(tool, usage.events, now),
    storage: usage.storage
  };
}

export async function recordFarmMateUsageForDevice({
  anonymousDeviceId,
  tool,
  now = new Date()
}: {
  anonymousDeviceId: unknown;
  tool: FarmMateUsageTool;
  now?: Date;
}) {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);

  if (!anonymousUserHash) {
    return {
      recorded: false,
      storage: "none" as const
    };
  }

  const writeResult = await writeUsageEvent(anonymousUserHash, tool, now);

  return {
    recorded: writeResult.recorded,
    storage: writeResult.storage,
    eventId: "eventId" in writeResult ? writeResult.eventId : undefined
  };
}

export async function claimFarmMateConsultationContinuation({
  anonymousDeviceId,
  eventId,
  nextEventId
}: {
  anonymousDeviceId: unknown;
  eventId: string;
  nextEventId: string;
}) {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);

  if (!anonymousUserHash || !eventId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nextEventId)) {
    return { claimed: false as const, storage: "none" as const };
  }

  const result = await rotateUsageEventId(anonymousUserHash, eventId, nextEventId);

  return result.rotated
    ? { claimed: true as const, replayed: result.replayed, storage: result.storage, eventId: result.eventId }
    : { claimed: false as const, storage: result.storage };
}
