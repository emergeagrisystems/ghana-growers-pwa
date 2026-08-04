import "server-only";

import type { ContactEnquiryPayload, ContactEnquiryType } from "@/lib/contactEnquiryContracts";
import {
  contactEnquiryId,
  contactEnquiryPayloadFingerprint,
  contactEnquiryRateLimitKey,
  contactEnquirySubmissionKey,
  createContactEnquiryReference
} from "@/lib/contactEnquirySignatures";
import { callSupabaseRpc, insertSupabaseRecord, selectSupabaseRecords } from "@/lib/supabase/admin";

export { createContactEnquiryReference } from "@/lib/contactEnquirySignatures";

type ExistingEnquiryRow = {
  public_reference: string;
  payload_fingerprint: string;
};

type RateLimitResult = {
  allowed?: boolean;
  reset_at?: string;
};

export type ContactEnquirySecurity = {
  enquiryId: string;
  submissionKey: string;
  payloadFingerprint: string;
  rateLimitKey: string;
};

const rateLimitWindowSeconds = 10 * 60;
const maxEnquiriesPerWindow = 5;

function enquirySecret() {
  return process.env.LEAD_REQUEST_RATE_LIMIT_SECRET?.trim() || "";
}

export function contactEnquirySecurity(
  payload: ContactEnquiryPayload,
  clientKey: string
): ContactEnquirySecurity | null {
  const secret = enquirySecret();
  const submissionKey = contactEnquirySubmissionKey(payload.submissionToken, secret);
  const payloadFingerprint = contactEnquiryPayloadFingerprint(payload, secret);
  const rateLimitKey = contactEnquiryRateLimitKey({
    enquiryType: payload.enquiryType,
    email: payload.email,
    clientKey,
    secret
  });
  const enquiryId = contactEnquiryId(submissionKey);

  return submissionKey && payloadFingerprint && rateLimitKey && enquiryId
    ? { enquiryId, submissionKey, payloadFingerprint, rateLimitKey }
    : null;
}

export async function findExistingContactEnquiry(security: ContactEnquirySecurity) {
  const result = await selectSupabaseRecords<ExistingEnquiryRow>(
    "contact_enquiries",
    `select=public_reference,payload_fingerprint&submission_key=eq.${encodeURIComponent(security.submissionKey)}&limit=1`
  ).catch(() => null);

  if (!result || result.error) {
    return { status: result?.status ?? 503, error: "Enquiries are temporarily unavailable. Please try again later." };
  }

  const existing = result.data?.[0];
  if (!existing) return { status: 200 };
  if (existing.payload_fingerprint !== security.payloadFingerprint) {
    return { status: 409, conflict: true as const };
  }

  return { status: 200, duplicate: true as const, reference: existing.public_reference };
}

function retryMinutes(resetAt?: string) {
  const resetTime = resetAt ? new Date(resetAt).getTime() : Number.NaN;
  return Number.isFinite(resetTime) ? Math.max(1, Math.ceil((resetTime - Date.now()) / 60000)) : 10;
}

export async function consumeContactEnquiryRateLimit(rateLimitKey: string) {
  const result = await callSupabaseRpc<RateLimitResult>("consume_lead_request_rate_limit", {
    p_request_key: rateLimitKey,
    p_window_seconds: rateLimitWindowSeconds,
    p_max_attempts: maxEnquiriesPerWindow
  }).catch(() => null);

  if (!result || result.error) {
    return { status: result?.status ?? 503, error: "Enquiries are temporarily unavailable. Please try again later." };
  }
  if (!result.data?.allowed) {
    const minutes = retryMinutes(result.data?.reset_at);
    return { status: 429, error: `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before trying again.` };
  }

  return { status: 200 };
}

export async function insertContactEnquiry({
  payload,
  security,
  reference
}: {
  payload: ContactEnquiryPayload;
  security: ContactEnquirySecurity;
  reference: string;
}) {
  return insertSupabaseRecord("contact_enquiries", {
    id: security.enquiryId,
    public_reference: reference,
    submission_key: security.submissionKey,
    payload_fingerprint: security.payloadFingerprint,
    enquiry_type: payload.enquiryType,
    name: payload.name,
    email: payload.email,
    phone_whatsapp: payload.phone || null,
    organisation: payload.organisation || null,
    subject_interest: payload.subject || null,
    website: payload.website || null,
    message: payload.message,
    status: "New",
    source_path: payload.enquiryType === "Partnership" ? "/partner-with-us" : "/contact"
  });
}
