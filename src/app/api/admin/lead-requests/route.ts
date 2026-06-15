import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getRecentLeadRequests, updateLeadRequestStatus, type LeadRequestStatus } from "@/lib/leadRequests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const leads = await getRecentLeadRequests(250);

  if (leads.error) {
    return NextResponse.json({ error: "Could not load lead requests." }, { status: leads.status });
  }

  return NextResponse.json({ leads: leads.data ?? [] });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { id?: string; status?: LeadRequestStatus };
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id || !body.status) {
    return NextResponse.json({ error: "Choose a lead and status." }, { status: 400 });
  }

  const update = await updateLeadRequestStatus({ id, status: body.status, adminEmail: adminUser.email });

  if (update.error) {
    return NextResponse.json({ error: update.error }, { status: update.status });
  }

  return NextResponse.json({ ok: true });
}
