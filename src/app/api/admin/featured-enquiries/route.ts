import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getFeaturedEnquiries, updateFeaturedEnquiryStatus, type FeaturedEnquiryStatus } from "@/lib/featuredEnquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const enquiries = await getFeaturedEnquiries(250);

  if (enquiries.error) {
    return NextResponse.json({ error: "Could not load featured enquiries." }, { status: enquiries.status });
  }

  return NextResponse.json({ enquiries: enquiries.data ?? [] });
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

