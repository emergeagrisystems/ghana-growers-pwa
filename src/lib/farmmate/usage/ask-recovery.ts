import crypto from "node:crypto";
import { callSupabaseRpc, hasSupabaseAdminConfig } from "../../supabase/admin";
import { canUseMemoryUsageFallback } from "./rules";
import { checkFarmMateCreditsForDevice, getAnonymousUserHash, recordFarmMateUsageForDevice } from "./server";

const RPC_TIMEOUT_MS = 5_000;

export type AskReservationDecision =
  | "reserved_new"
  | "reserved_retry"
  | "resume_guided"
  | "already_processed"
  | "in_progress"
  | "retry_exhausted"
  | "rapid_submission"
  | "credits_exhausted"
  | "recovery_expired"
  | "question_mismatch"
  | "invalid_request"
  | "usage_tracking_unavailable";

export type AskReservation = {
  decision: AskReservationDecision;
  eventId?: string;
  attemptCount?: number;
  newCredit?: boolean;
};

type RpcReservation = {
  decision?: string;
  event_id?: string;
  attempt_count?: number;
  new_credit?: boolean;
};

const decisions = new Set<AskReservationDecision>([
  "reserved_new", "reserved_retry", "resume_guided", "already_processed", "in_progress",
  "retry_exhausted", "rapid_submission", "credits_exhausted", "recovery_expired",
  "question_mismatch", "invalid_request"
]);

function privateDigest(anonymousUserHash: string, value: string) {
  const key = process.env.FARMMATE_USAGE_HASH_SALT?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return "";
  return crypto.createHmac("sha256", key).update(`${anonymousUserHash}:${value}`).digest("hex");
}

function identity(anonymousDeviceId: unknown, consultationId: string) {
  const anonymousUserHash = getAnonymousUserHash(anonymousDeviceId);
  return {
    anonymousUserHash,
    consultationKey: privateDigest(anonymousUserHash, consultationId)
  };
}

async function callBooleanRpc(name: string, payload: Record<string, unknown>) {
  try {
    const result = await callSupabaseRpc<boolean>(name, payload, { signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
    return !result.error && result.data === true;
  } catch {
    return false;
  }
}

export async function reserveFarmMateAsk({
  anonymousDeviceId,
  consultationId,
  originalQuestion,
  guided,
  completeImmediately = false
}: {
  anonymousDeviceId: unknown;
  consultationId: string;
  originalQuestion: string;
  guided: boolean;
  completeImmediately?: boolean;
}): Promise<AskReservation> {
  const { anonymousUserHash, consultationKey } = identity(anonymousDeviceId, consultationId);
  const questionFingerprint = privateDigest(anonymousUserHash, originalQuestion.trim());
  if (!anonymousUserHash || !consultationKey || !questionFingerprint) {
    return { decision: "usage_tracking_unavailable" };
  }

  // Local development retains the old in-memory path. Protected Preview and
  // Production fail closed if the durable database function is unavailable.
  if (!hasSupabaseAdminConfig() && canUseMemoryUsageFallback()) {
    const credit = await checkFarmMateCreditsForDevice({ anonymousDeviceId, tool: "ask_farmmate" });
    if (!credit.allowed) return { decision: credit.reason ?? "usage_tracking_unavailable" };
    const record = await recordFarmMateUsageForDevice({ anonymousDeviceId, tool: "ask_farmmate", requestId: consultationId });
    return record.recorded && record.eventId
      ? { decision: "reserved_new", eventId: record.eventId, attemptCount: 1, newCredit: true }
      : { decision: record.replayed ? "already_processed" : "usage_tracking_unavailable" };
  }

  try {
    const result = await callSupabaseRpc<RpcReservation>("reserve_farmmate_ask", {
      p_anonymous_user_hash: anonymousUserHash,
      p_consultation_key: consultationKey,
      p_question_fingerprint: questionFingerprint,
      p_guided: guided,
      p_complete_immediately: completeImmediately
    }, { signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
    if (result.error || !result.data || !decisions.has(result.data.decision as AskReservationDecision)) {
      return { decision: "usage_tracking_unavailable" };
    }
    return {
      decision: result.data.decision as AskReservationDecision,
      eventId: result.data.event_id,
      attemptCount: result.data.attempt_count,
      newCredit: result.data.new_credit
    };
  } catch {
    return { decision: "usage_tracking_unavailable" };
  }
}

export async function beginFarmMateAskGeneration({ anonymousDeviceId, consultationId, eventId }: {
  anonymousDeviceId: unknown;
  consultationId: string;
  eventId: string;
}) {
  const { anonymousUserHash, consultationKey } = identity(anonymousDeviceId, consultationId);
  if (!anonymousUserHash || !consultationKey) return null;
  if (!hasSupabaseAdminConfig() && canUseMemoryUsageFallback()) return 1;
  try {
    const result = await callSupabaseRpc<{ started?: boolean; attempt_count?: number }>("begin_farmmate_ask_generation", {
      p_anonymous_user_hash: anonymousUserHash,
      p_consultation_key: consultationKey,
      p_event_id: eventId
    }, { signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
    return !result.error && result.data?.started && Number.isInteger(result.data.attempt_count)
      ? result.data.attempt_count!
      : null;
  } catch {
    return null;
  }
}

export async function settleFarmMateAsk({ anonymousDeviceId, consultationId, eventId, attemptCount, success }: {
  anonymousDeviceId: unknown;
  consultationId: string;
  eventId: string;
  attemptCount: number;
  success: boolean;
}) {
  const { anonymousUserHash, consultationKey } = identity(anonymousDeviceId, consultationId);
  if (!anonymousUserHash || !consultationKey) return false;
  if (!hasSupabaseAdminConfig() && canUseMemoryUsageFallback()) return true;
  return callBooleanRpc("settle_farmmate_ask", {
    p_anonymous_user_hash: anonymousUserHash,
    p_consultation_key: consultationKey,
    p_event_id: eventId,
    p_attempt_count: attemptCount,
    p_success: success
  });
}

export async function acknowledgeFarmMateAsk({ anonymousDeviceId, consultationId, eventId, attemptCount }: {
  anonymousDeviceId: unknown;
  consultationId: string;
  eventId: string;
  attemptCount: number;
}) {
  const { anonymousUserHash, consultationKey } = identity(anonymousDeviceId, consultationId);
  if (!anonymousUserHash || !consultationKey) return false;
  if (!hasSupabaseAdminConfig() && canUseMemoryUsageFallback()) return true;
  return callBooleanRpc("acknowledge_farmmate_ask", {
    p_anonymous_user_hash: anonymousUserHash,
    p_consultation_key: consultationKey,
    p_event_id: eventId,
    p_attempt_count: attemptCount
  });
}
