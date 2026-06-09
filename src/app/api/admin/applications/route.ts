import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getApplications, updateApplicationStatus, type ApplicationKind, type ApplicationStatus } from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedKinds = new Set<ApplicationKind>(["farmer", "buyer", "supplier"]);
const allowedStatuses = new Set<ApplicationStatus>(["Under Review", "Approved", "Rejected", "Converted"]);

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const applications = await getApplications();

  return NextResponse.json(applications);
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    kind?: ApplicationKind;
    id?: string;
    status?: ApplicationStatus;
    entityName?: string;
  };

  if (!body.kind || !allowedKinds.has(body.kind) || !body.id || !body.status || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: "Application type, ID, and valid status are required." }, { status: 400 });
  }

  const update = await updateApplicationStatus({
    kind: body.kind,
    id: body.id,
    status: body.status,
    adminEmail: adminUser.email,
    entityName: body.entityName || body.id
  });

  if (update.error) {
    return NextResponse.json({ error: "Could not update application. Please try again." }, { status: update.status });
  }

  return NextResponse.json({ ok: true, record: update.data });
}
