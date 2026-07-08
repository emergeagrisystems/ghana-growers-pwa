import crypto from "node:crypto";
import { hasSupabaseAdminConfig, insertSupabaseRecord, selectSupabaseRecords } from "../../supabase/admin";
import { getFarmMateCreditDecision, getFarmMateCreditStatus, FARM_MATE_USAGE_WINDOW_MS } from "./rules";
import type { FarmMateCreditDecision, FarmMateCreditStatus, FarmMateUsageEvent, FarmMateUsageTool } from "./types";

type FarmMateUsageEventRow = {
  id: string;
  anonymous_user_hash: string;
  tool: FarmMateUsageTool;
  created_at: string;
};

const memoryEvents: Array<FarmMateUsageEventRow> = [];

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

  if (hasSupabaseAdminConfig()) {
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
        storage: "supabase" as const,
        events: (result.data ?? []).map(rowToEvent)
      };
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("FarmMate usage Supabase read failed; using memory fallback.", result.error);
    }
  }

  pruneMemoryEvents(now);

  return {
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
      return "supabase" as const;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("FarmMate usage Supabase write failed; using memory fallback.", result.error);
    }
  }

  memoryEvents.push({
    id: `memory-${memoryEvents.length + 1}`,
    ...payload
  });

  return "memory" as const;
}

export async function getFarmMateCreditsForDevice({
  anonymousDeviceId,
  tool,
  now = new Date()
}: {
  anonymousDeviceId: unknown;
  tool: FarmMateUsageTool;
  now?: Date;
}): Promise<FarmMateCreditStatus & { storage: "supabase" | "memory" | "none" }> {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);

  if (!anonymousUserHash) {
    return {
      ...getFarmMateCreditStatus(tool, [], now),
      storage: "none"
    };
  }

  const usage = await readUsageEvents(anonymousUserHash, tool, now);

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
}): Promise<FarmMateCreditDecision & { storage: "supabase" | "memory" | "none" }> {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);

  if (!anonymousUserHash) {
    return {
      ...getFarmMateCreditDecision(tool, [], now),
      storage: "none"
    };
  }

  const usage = await readUsageEvents(anonymousUserHash, tool, now);

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

  const storage = await writeUsageEvent(anonymousUserHash, tool, now);

  return {
    recorded: true,
    storage
  };
}
