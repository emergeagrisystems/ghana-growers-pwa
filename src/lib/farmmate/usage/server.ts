import crypto from "node:crypto";
import { hasSupabaseAdminConfig, insertSupabaseRecord, selectSupabaseRecords } from "../../supabase/admin";
import { canUseMemoryUsageFallback, getFarmMateCreditDecision, getFarmMateCreditStatus, FARM_MATE_USAGE_WINDOW_MS, usageTrackingUnavailableDecision } from "./rules";
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
  const cutoff = now.getTime() - FARM_MATE_USAGE_WINDOW_MS - 60_000;

  for (let index = memoryEvents.length - 1; index >= 0; index -= 1) {
    if (new Date(memoryEvents[index].created_at).getTime() < cutoff) {
      memoryEvents.splice(index, 1);
    }
  }
}

async function readUsageEvents(anonymousUserHash: string, tool: FarmMateUsageTool, now = new Date()) {
  const windowStart = new Date(now.getTime() - FARM_MATE_USAGE_WINDOW_MS).toISOString();
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
    anonymous_user_hash: anonymousUserHash,
    tool,
    created_at: now.toISOString()
  };

  if (hasSupabaseAdminConfig()) {
    const result = await insertSupabaseRecord("farmmate_usage_events", payload);

    if (!result.error) {
      return { recorded: true as const, storage: "supabase" as const };
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

  memoryEvents.push({
    id: `memory-${memoryEvents.length + 1}`,
    ...payload
  });

  return { recorded: true as const, storage: "memory" as const };
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
    storage: writeResult.storage
  };
}
