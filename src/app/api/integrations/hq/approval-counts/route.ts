import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import {
  collectHqApprovalCounts,
  consumeHqIntegrationNonce,
  hqApprovalCountsPath,
  verifyHqIntegrationRequest,
  type HqApprovalCountSources
} from "@/lib/hqApprovalCounts";
import { callSupabaseRpc, countSupabaseRecords } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };
const pendingApplicationQuery = new URLSearchParams({
  select: "id",
  status: "in.(New,Pending,Under Review)"
}).toString();
const importedFarmerReviewQuery = new URLSearchParams({
  select: "id",
  or: "(source.ilike.*tally*,source.ilike.*founding*)",
  status: "not.in.(Archived,Active)",
  verification_status: "neq.Verified"
}).toString();
const hqRateLimitWindowSeconds = 60;
const hqRateLimitMaxRequests = 60;
const hqRateLimitTimeoutMs = 2_000;
const hqReplayProtectionTimeoutMs = 2_000;

type RateLimitResult = {
  allowed?: boolean;
  reset_at?: string;
};

function genericResponse(
  error: "Unauthorized" | "Too many requests" | "Service unavailable",
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error },
    { status, headers: { ...noStoreHeaders, ...headers } }
  );
}

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

function retryAfterSeconds(resetAt?: string) {
  const resetTime = resetAt ? new Date(resetAt).getTime() : Number.NaN;
  return Number.isFinite(resetTime) ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000)) : hqRateLimitWindowSeconds;
}

async function enforceRateLimit(secret: string) {
  const requestKey = createHmac("sha256", secret).update("hq-approval-counts-rate-limit").digest("hex");
  const result = await withTimeout(
    (signal) => callSupabaseRpc<RateLimitResult>("consume_hq_integration_rate_limit", {
      p_request_key: requestKey,
      p_window_seconds: hqRateLimitWindowSeconds,
      p_max_attempts: hqRateLimitMaxRequests
    }, { signal }),
    hqRateLimitTimeoutMs
  ).catch(() => null);

  if (!result || result.error) {
    return { status: "unavailable" as const };
  }

  return result.data?.allowed
    ? { status: "allowed" as const }
    : { status: "limited" as const, retryAfter: retryAfterSeconds(result.data?.reset_at) };
}

async function enforceReplayProtection(nonce: string, timestamp: string) {
  const consumed = await withTimeout(
    (signal) => consumeHqIntegrationNonce({
      nonce,
      timestamp,
      signal,
      consume: async (nonceValue, expiresAt, requestSignal) => {
        const result = await callSupabaseRpc<boolean>("consume_hq_integration_nonce", {
          p_nonce_value: nonceValue,
          p_expires_at: expiresAt
        }, { signal: requestSignal });

        if (result.error || typeof result.data !== "boolean") {
          throw new Error("Replay protection is unavailable.");
        }

        return result.data;
      }
    }),
    hqReplayProtectionTimeoutMs
  ).catch(() => null);

  if (consumed === null) {
    return { status: "unavailable" as const };
  }

  return consumed
    ? { status: "accepted" as const }
    : { status: "replayed" as const };
}

async function exactCount(table: string, query: string, signal: AbortSignal) {
  const result = await countSupabaseRecords(table, query, { signal });

  if (result.error || result.count === undefined) {
    throw new Error("Approval count source unavailable.");
  }

  return result.count;
}

const countSources: HqApprovalCountSources = {
  farmerProfileApplicationsPending: (signal) => exactCount("farmer_applications", pendingApplicationQuery, signal),
  importedFarmersPendingReview: (signal) => exactCount("farmers", importedFarmerReviewQuery, signal),
  supplierApplicationsPending: (signal) => exactCount("supplier_applications", pendingApplicationQuery, signal)
};

export async function GET(request: Request) {
  const secret = process.env.HQ_INTEGRATION_SECRET ?? "";

  if (secret.length < 32) {
    return genericResponse("Service unavailable", 503);
  }

  const url = new URL(request.url);
  const timestamp = request.headers.get("x-hq-timestamp");
  const nonce = request.headers.get("x-hq-nonce");
  const authorized = verifyHqIntegrationRequest({
    method: request.method,
    requestPath: url.pathname,
    timestamp,
    nonce,
    signature: request.headers.get("x-hq-signature"),
    secret
  });

  if (!authorized || !timestamp || !nonce || request.method !== "GET" || url.pathname !== hqApprovalCountsPath) {
    return genericResponse("Unauthorized", 401);
  }

  const rateLimit = await enforceRateLimit(secret);

  if (rateLimit.status === "unavailable") {
    return genericResponse("Service unavailable", 503);
  }

  if (rateLimit.status === "limited") {
    return genericResponse("Too many requests", 429, { "Retry-After": String(rateLimit.retryAfter) });
  }

  const replayProtection = await enforceReplayProtection(nonce, timestamp);

  if (replayProtection.status === "unavailable") {
    return genericResponse("Service unavailable", 503);
  }

  if (replayProtection.status === "replayed") {
    return genericResponse("Unauthorized", 401);
  }

  try {
    const result = await collectHqApprovalCounts(countSources);
    return NextResponse.json(result.response, {
      status: result.completeFailure ? 503 : 200,
      headers: noStoreHeaders
    });
  } catch {
    return genericResponse("Service unavailable", 503);
  }
}
