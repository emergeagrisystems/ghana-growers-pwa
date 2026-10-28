import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import type { SupplierRegistrationPayload } from "@/lib/supplierRegistration";
import { callSupabaseRpc, selectSupabaseRecords } from "@/lib/supabase/admin";

type PendingMedia = { file: File; group: string; kind: "image" | "document" };
type ExistingApplicationRow = {
  id: string;
  status?: string | null;
  source_metadata?: Record<string, unknown> | null;
};
type RateLimitResult = { allowed?: boolean; reset_at?: string };

export type SupplierApplicationSecurity = {
  applicationId: string;
  submissionKey: string;
  payloadFingerprint: string;
  dedupeKey: string;
  rateLimitKey: string;
};

const windowSeconds = 10 * 60;
const maxApplicationsPerWindow = 3;

function secret() {
  return process.env.LEAD_REQUEST_RATE_LIMIT_SECRET?.trim() || "";
}

function digest(key: string, parts: string[]) {
  return key.length >= 32 ? createHmac("sha256", key).update(parts.join("|")).digest("hex") : "";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
}

function deterministicUuid(hash: string) {
  if (!/^[0-9a-f]{64}$/i.test(hash)) return "";
  const hex = hash.toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

export async function supplierApplicationSecurity(
  payload: SupplierRegistrationPayload,
  clientKey: string,
  media: PendingMedia[]
): Promise<SupplierApplicationSecurity | null> {
  const key = secret();
  const submissionKey = digest(key, ["supplier-application-submission", payload.submissionToken]);
  const applicationId = deterministicUuid(submissionKey);
  const mediaFingerprints = await Promise.all(media.map(async (item) => ({
    group: item.group,
    kind: item.kind,
    contentType: item.file.type,
    size: item.file.size,
    digest: createHash("sha256").update(Buffer.from(await item.file.arrayBuffer())).digest("hex")
  })));
  const payloadFingerprint = digest(key, ["supplier-application-payload-v1", JSON.stringify({
    businessName: payload.businessName,
    contactPerson: payload.contactPerson,
    phone: payload.phone,
    whatsapp: payload.whatsapp,
    email: payload.email,
    websiteUrl: payload.websiteUrl,
    registrationNumber: payload.registrationNumber,
    region: payload.region,
    district: payload.district,
    categories: [...payload.categories].sort(),
    regionsServed: [...payload.regionsServed].sort(),
    productsServicesOffered: payload.productsServicesOffered,
    businessDescription: payload.businessDescription,
    yearsInBusiness: payload.yearsInBusiness,
    ggStandardAgreement: payload.ggStandardAgreement,
    privacyAccepted: payload.privacyAccepted,
    media: mediaFingerprints
  })]);
  const contact = payload.phone || payload.whatsapp || payload.email;
  const dedupeKey = digest(key, [
    "supplier-application-dedupe",
    normalize(payload.businessName || payload.companyName),
    normalize(payload.contactPerson),
    normalize(contact),
    normalize(payload.region || payload.regionsServed[0] || "")
  ]);
  const requestFingerprint = digest(key, ["supplier-application-fingerprint", clientKey || "public"]);
  const rateLimitKey = digest(key, ["supplier-application-rate-limit", normalize(contact), requestFingerprint]);

  return applicationId && submissionKey && payloadFingerprint && dedupeKey && rateLimitKey
    ? { applicationId, submissionKey, payloadFingerprint, dedupeKey, rateLimitKey }
    : null;
}

function metadataValue(row: ExistingApplicationRow | undefined, key: string) {
  const value = row?.source_metadata?.[key];
  return typeof value === "string" ? value : "";
}

export async function findExistingSupplierApplication(security: SupplierApplicationSecurity) {
  const byToken = await selectSupabaseRecords<ExistingApplicationRow>(
    "supplier_applications",
    `select=id,status,source_metadata&source_metadata->>submission_key=eq.${encodeURIComponent(security.submissionKey)}&limit=1`
  ).catch(() => null);
  if (!byToken || byToken.error) return { status: byToken?.status ?? 503, error: "Supplier applications are temporarily unavailable. Please try again later." };

  const tokenMatch = byToken.data?.[0];
  if (tokenMatch) {
    return metadataValue(tokenMatch, "payload_fingerprint") === security.payloadFingerprint
      ? { status: 200, duplicate: true as const, reference: metadataValue(tokenMatch, "application_reference") || undefined }
      : { status: 409, conflict: true as const };
  }

  const byDedupe = await selectSupabaseRecords<ExistingApplicationRow>(
    "supplier_applications",
    `select=id,status,source_metadata&source_metadata->>dedupe_key=eq.${encodeURIComponent(security.dedupeKey)}&status=not.in.(Rejected,Converted)&order=created_at.desc&limit=1`
  ).catch(() => null);
  if (!byDedupe || byDedupe.error) return { status: byDedupe?.status ?? 503, error: "Supplier applications are temporarily unavailable. Please try again later." };
  const duplicate = byDedupe.data?.[0];
  return duplicate
    ? { status: 200, duplicate: true as const, reference: metadataValue(duplicate, "application_reference") || undefined }
    : { status: 200 };
}

export async function consumeSupplierApplicationRateLimit(rateLimitKey: string) {
  const result = await callSupabaseRpc<RateLimitResult>("consume_lead_request_rate_limit", {
    p_request_key: rateLimitKey,
    p_window_seconds: windowSeconds,
    p_max_attempts: maxApplicationsPerWindow
  }).catch(() => null);
  if (!result || result.error) return { status: result?.status ?? 503, error: "Supplier applications are temporarily unavailable. Please try again later." };
  if (!result.data?.allowed) return { status: 429, error: "Too many attempts. Please wait before trying again." };
  return { status: 200 };
}

export function createSupplierApplicationReference(date = new Date(), entropy = randomBytes(4)) {
  return `GGS-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${entropy.toString("hex").toUpperCase()}`;
}
