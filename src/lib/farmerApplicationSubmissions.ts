import "server-only";

import {
  farmerApplicationDedupeKey,
  farmerApplicationRateLimitKey,
  farmerApplicationSubmissionKey,
  type FarmerRegistrationPayload
} from "@/lib/farmerRegistration";
import { callSupabaseRpc, selectSupabaseRecords } from "@/lib/supabase/admin";

type RateLimitResult = {
  allowed?: boolean;
  reset_at?: string;
};

type ExistingApplicationRow = {
  id: string;
  status: string;
  source_metadata?: Record<string, unknown> | null;
};

export type FarmerApplicationSecurity = {
  submissionKey: string;
  dedupeKey: string;
  rateLimitKey: string;
};

const farmerApplicationWindowSeconds = 10 * 60;
const maxFarmerApplicationsPerWindow = 3;

function applicationSecret() {
  return process.env.LEAD_REQUEST_RATE_LIMIT_SECRET?.trim() || "";
}

export function farmerApplicationSecurity(
  payload: FarmerRegistrationPayload,
  clientKey: string
): FarmerApplicationSecurity | null {
  const secret = applicationSecret();
  const contact = payload.phoneNumber || payload.whatsappNumber;
  const submissionKey = farmerApplicationSubmissionKey(payload.submissionToken, secret);
  const dedupeKey = farmerApplicationDedupeKey({
    applicantName: payload.applicantName,
    farmName: payload.farmName,
    contact,
    region: payload.region,
    secret
  });
  const rateLimitKey = farmerApplicationRateLimitKey({ contact, clientKey, secret });

  return submissionKey && dedupeKey && rateLimitKey
    ? { submissionKey, dedupeKey, rateLimitKey }
    : null;
}

function metadataString(metadata: Record<string, unknown> | null | undefined, field: string) {
  const value = metadata?.[field];
  return typeof value === "string" ? value : "";
}

export async function findExistingFarmerApplication(security: FarmerApplicationSecurity) {
  const recent = await selectSupabaseRecords<ExistingApplicationRow>(
    "farmer_applications",
    "select=id,status,source_metadata&order=created_at.desc&limit=200"
  ).catch(() => null);

  if (!recent || recent.error) {
    return { status: recent?.status ?? 503, error: "Farmer applications are temporarily unavailable. Please try again later." };
  }

  const existing = recent.data?.find((row) => {
    const metadata = row.source_metadata;
    if (metadataString(metadata, "submission_key") === security.submissionKey) return true;

    const stillOpen = !["Rejected", "Converted"].includes(row.status);
    return stillOpen && metadataString(metadata, "dedupe_key") === security.dedupeKey;
  });

  return existing
    ? {
        status: 200,
        duplicate: true as const,
        reference: metadataString(existing.source_metadata, "application_reference") || undefined
      }
    : { status: 200 };
}

function retryMinutes(resetAt?: string) {
  const resetTime = resetAt ? new Date(resetAt).getTime() : Number.NaN;
  return Number.isFinite(resetTime)
    ? Math.max(1, Math.ceil((resetTime - Date.now()) / 60000))
    : 10;
}

export async function consumeFarmerApplicationRateLimit(rateLimitKey: string) {
  const result = await callSupabaseRpc<RateLimitResult>("consume_lead_request_rate_limit", {
    p_request_key: rateLimitKey,
    p_window_seconds: farmerApplicationWindowSeconds,
    p_max_attempts: maxFarmerApplicationsPerWindow
  }).catch(() => null);

  if (!result || result.error) {
    return {
      status: result?.status ?? 503,
      error: "Farmer applications are temporarily unavailable. Please try again later."
    };
  }

  if (!result.data?.allowed) {
    const minutes = retryMinutes(result.data?.reset_at);
    return {
      status: 429,
      error: `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before trying again.`
    };
  }

  return { status: 200 };
}
