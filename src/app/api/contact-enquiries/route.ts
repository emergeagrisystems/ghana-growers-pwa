import { NextResponse } from "next/server";
import { validateContactEnquiry } from "@/lib/contactEnquiryContracts";
import {
  consumeContactEnquiryRateLimit,
  contactEnquirySecurity,
  createContactEnquiryReference,
  findExistingContactEnquiry,
  insertContactEnquiry
} from "@/lib/contactEnquirySecurity";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const conflictMessage = "This enquiry was already submitted with different information. Start a new enquiry to send the revised details.";

function safeError(message: string, status = 500, errors?: Record<string, string>) {
  return NextResponse.json({ ok: false, message, errors: errors ?? { form: message } }, { status });
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "public";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim()) {
    return safeError("Could not send your enquiry. Please check the form and try again.", 400);
  }

  const validation = validateContactEnquiry(body);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }
  if (!hasSupabaseAdminConfig()) {
    return safeError("Enquiries are temporarily unavailable. Please try again later.", 503);
  }

  const security = contactEnquirySecurity(validation.data, clientKey(request));
  if (!security) {
    return safeError("Enquiries are temporarily unavailable. Please try again later.", 503);
  }

  const existing = await findExistingContactEnquiry(security);
  if (existing.error) return safeError(existing.error, existing.status);
  if (existing.conflict) return safeError(conflictMessage, 409);
  if (existing.duplicate) return successResponse(validation.data.enquiryType, existing.reference, true);

  const rateLimit = await consumeContactEnquiryRateLimit(security.rateLimitKey);
  if (rateLimit.error) return safeError(rateLimit.error, rateLimit.status);

  const reference = createContactEnquiryReference(validation.data.enquiryType);
  const insert = await insertContactEnquiry({ payload: validation.data, security, reference }).catch(() => null);

  if (!insert || insert.error) {
    if (insert?.status === 409) {
      const concurrent = await findExistingContactEnquiry(security);
      if (concurrent.conflict) return safeError(conflictMessage, 409);
      if (concurrent.duplicate) return successResponse(validation.data.enquiryType, concurrent.reference, true);
    }

    console.error("Contact enquiry save failed", {
      route: "/api/contact-enquiries",
      feature: "contact_enquiries",
      code: insert?.status ?? "request_failed"
    });
    return safeError("Could not save your enquiry. Your entries are still here. Please try again.", insert?.status ?? 502);
  }

  return successResponse(validation.data.enquiryType, reference, false, 201);
}

function successResponse(enquiryType: "Contact" | "Partnership", reference: string | undefined, duplicate: boolean, status = 200) {
  return NextResponse.json({
    ok: true,
    duplicate,
    reference,
    message: enquiryType === "Partnership" ? "Partnership enquiry received" : "Message received"
  }, { status });
}
