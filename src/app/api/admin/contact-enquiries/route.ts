import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import type { ContactEnquiryType } from "@/lib/contactEnquiryContracts";
import { loadContactEnquiriesForAdmin } from "@/lib/contactEnquiriesAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401, headers: noStoreHeaders });
  }

  const value = new URL(request.url).searchParams.get("type");
  const enquiryType = value === "Contact" || value === "Partnership" ? value as ContactEnquiryType : undefined;
  if (value && !enquiryType) {
    return NextResponse.json({ error: "A valid enquiry type is required." }, { status: 400, headers: noStoreHeaders });
  }

  const result = await loadContactEnquiriesForAdmin(enquiryType).catch(() => null);
  if (!result || result.error) {
    console.error("Admin contact enquiry queue failed to load", {
      route: "/api/admin/contact-enquiries",
      feature: "contact_enquiries",
      code: result?.status ?? "request_failed"
    });
    return NextResponse.json({ error: "Could not load contact and partnership enquiries. Please retry." }, {
      status: result?.status && result.status >= 500 ? result.status : 502,
      headers: noStoreHeaders
    });
  }

  return NextResponse.json({ enquiries: result.data ?? [] }, { headers: noStoreHeaders });
}
