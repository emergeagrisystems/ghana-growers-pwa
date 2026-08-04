import { createHmac, randomBytes } from "node:crypto";
import type { ContactEnquiryPayload, ContactEnquiryType } from "./contactEnquiryContracts";

function hmacDigest(secret: string, parts: string[]) {
  if (secret.length < 32) return "";
  return createHmac("sha256", secret).update(parts.join("|")).digest("hex");
}

export function contactEnquirySubmissionKey(submissionToken: string, secret: string) {
  return hmacDigest(secret, ["contact-enquiry-submission", submissionToken]);
}

export function contactEnquiryPayloadFingerprint(payload: ContactEnquiryPayload, secret: string) {
  return hmacDigest(secret, ["contact-enquiry-payload-v1", JSON.stringify({
    enquiryType: payload.enquiryType,
    name: payload.name,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    organisation: payload.organisation,
    subject: payload.subject,
    website: payload.website,
    message: payload.message
  })]);
}

export function contactEnquiryRateLimitKey({
  enquiryType,
  email,
  clientKey,
  secret
}: {
  enquiryType: ContactEnquiryType;
  email: string;
  clientKey: string;
  secret: string;
}) {
  const requestFingerprint = hmacDigest(secret, ["contact-enquiry-client", clientKey || "public"]);
  return hmacDigest(secret, ["contact-enquiry-rate-limit", enquiryType, email.toLowerCase(), requestFingerprint]);
}

export function contactEnquiryId(submissionKey: string) {
  if (!/^[0-9a-f]{64}$/i.test(submissionKey)) return "";
  const hex = submissionKey.toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

export function createContactEnquiryReference(
  enquiryType: ContactEnquiryType,
  date = new Date(),
  entropy = randomBytes(4)
) {
  const prefix = enquiryType === "Partnership" ? "GGP" : "GGC";
  const day = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${day}-${entropy.toString("hex").toUpperCase()}`;
}
