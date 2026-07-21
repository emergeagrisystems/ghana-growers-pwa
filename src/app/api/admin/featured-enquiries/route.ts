import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminOptionalSourceFailure, resolveAdminOptionalSource } from "@/lib/adminOptionalSources";
import { getFeaturedEnquiries, updateFeaturedEnquiryStatus, type FeaturedEnquiryStatus } from "@/lib/featuredEnquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const sourceTable = "featured_membership_enquiries";
const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const query = await getFeaturedEnquiries(250).catch(() => null);

  if (!query) {
    logAdminOptionalSourceFailure({
      route: "/api/admin/featured-enquiries",
      feature: "featured enquiries",
      table: sourceTable,
      status: 503,
      code: "OPTIONAL_SOURCE_READ_FAILED"
    });
    return NextResponse.json({
      error: "Featured enquiries could not be loaded. Please try again.",
      code: "OPTIONAL_SOURCE_READ_FAILED",
      retryable: true
    }, { status: 503, headers: noStoreHeaders });
  }

  const source = resolveAdminOptionalSource(query);

  if (source.state === "unavailable") {
    return NextResponse.json({
      enquiries: [],
      availability: "unavailable",
      message: "Featured enquiry requests are not available yet."
    }, { headers: noStoreHeaders });
  }

  if (source.state === "error") {
    logAdminOptionalSourceFailure({
      route: "/api/admin/featured-enquiries",
      feature: "featured enquiries",
      table: sourceTable,
      status: source.status,
      code: source.code
    });
    return NextResponse.json({
      error: "Featured enquiries could not be loaded. Please try again.",
      code: source.code,
      retryable: true
    }, { status: source.status, headers: noStoreHeaders });
  }

  return NextResponse.json({ enquiries: source.data, availability: "available" }, { headers: noStoreHeaders });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { id?: string; status?: FeaturedEnquiryStatus };
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id || !body.status) {
    return NextResponse.json({ error: "Choose an enquiry and status." }, { status: 400 });
  }

  const update = await updateFeaturedEnquiryStatus({ id, status: body.status, adminEmail: adminUser.email });

  if (update.error) {
    return NextResponse.json({ error: update.error }, { status: update.status });
  }

  return NextResponse.json({ ok: true });
}
