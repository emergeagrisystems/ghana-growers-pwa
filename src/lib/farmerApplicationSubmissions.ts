import "server-only";

import { createHash } from "node:crypto";
import {
  farmerApplicationId,
  farmerApplicationDedupeKey,
  farmerApplicationPayloadFingerprint,
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
  applicationId: string;
  submissionKey: string;
  payloadFingerprint: string;
  dedupeKey: string;
  rateLimitKey: string;
};

export type FarmerApplicationFingerprintMedia = {
  file: File;
  group: string;
  kind: "image" | "document";
};

const farmerApplicationWindowSeconds = 10 * 60;
const maxFarmerApplicationsPerWindow = 3;

function applicationSecret() {
  return process.env.LEAD_REQUEST_RATE_LIMIT_SECRET?.trim() || "";
}

export async function farmerApplicationSecurity(
  payload: FarmerRegistrationPayload,
  clientKey: string,
  media: FarmerApplicationFingerprintMedia[]
): Promise<FarmerApplicationSecurity | null> {
  const secret = applicationSecret();
  const contact = payload.phoneNumber || payload.whatsappNumber;
  const submissionKey = farmerApplicationSubmissionKey(payload.submissionToken, secret);
  const applicationId = farmerApplicationId(submissionKey);
  const mediaFingerprints = await Promise.all(media.map(async (item) => ({
    group: item.group,
    kind: item.kind,
    contentType: item.file.type,
    size: item.file.size,
    digest: createHash("sha256").update(Buffer.from(await item.file.arrayBuffer())).digest("hex")
  })));
  const payloadFingerprint = farmerApplicationPayloadFingerprint(payload, mediaFingerprints, secret);
  const dedupeKey = farmerApplicationDedupeKey({
    applicantName: payload.applicantName,
    farmName: payload.farmName,
    contact,
    region: payload.region,
    secret
  });
  const rateLimitKey = farmerApplicationRateLimitKey({ contact, clientKey, secret });

  return applicationId && submissionKey && payloadFingerprint && dedupeKey && rateLimitKey
    ? { applicationId, submissionKey, payloadFingerprint, dedupeKey, rateLimitKey }
    : null;
}

function metadataString(metadata: Record<string, unknown> | null | undefined, field: string) {
  const value = metadata?.[field];
  return typeof value === "string" ? value : "";
}

export async function findExistingFarmerApplication(security: FarmerApplicationSecurity) {
  const byToken = await selectSupabaseRecords<ExistingApplicationRow>(
    "farmer_applications",
    `select=id,status,source_metadata&source_metadata->>submission_key=eq.${encodeURIComponent(security.submissionKey)}&limit=1`
  ).catch(() => null);

  if (!byToken || byToken.error) {
    return { status: byToken?.status ?? 503, error: "Farmer applications are temporarily unavailable. Please try again later." };
  }

  const tokenApplication = byToken.data?.[0];
  if (tokenApplication) {
    const storedFingerprint = metadataString(tokenApplication.source_metadata, "payload_fingerprint");
    if (!storedFingerprint || storedFingerprint !== security.payloadFingerprint) {
      return { status: 409, conflict: true as const };
    }

    return {
      status: 200,
      duplicate: true as const,
      reference: metadataString(tokenApplication.source_metadata, "application_reference") || undefined
    };
  }

  const byDedupeKey = await selectSupabaseRecords<ExistingApplicationRow>(
    "farmer_applications",
    `select=id,status,source_metadata&source_metadata->>dedupe_key=eq.${encodeURIComponent(security.dedupeKey)}&status=not.in.(Rejected,Converted)&order=created_at.desc&limit=1`
  ).catch(() => null);

  if (!byDedupeKey || byDedupeKey.error) {
    return { status: byDedupeKey?.status ?? 503, error: "Farmer applications are temporarily unavailable. Please try again later." };
  }

  const duplicate = byDedupeKey.data?.[0];
  return duplicate
    ? {
        status: 200,
        duplicate: true as const,
        reference: metadataString(duplicate.source_metadata, "application_reference") || undefined
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
