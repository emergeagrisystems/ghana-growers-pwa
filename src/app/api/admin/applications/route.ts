import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getApplications, updateApplicationStatus, updateSupplierEditorial, type ApplicationKind, type ApplicationStatus } from "@/lib/applications";

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

  if (applications.error) {
    console.error("Admin application queues failed to load", {
      route: "/api/admin/applications",
      feature: "profile_applications",
      code: "load_failed"
    });
    return NextResponse.json({
      error: "Could not load application queues. Please retry.",
      diagnostics: applications.diagnostics
    }, { status: 502 });
  }

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
    action?: "status" | "supplier-editorial";
    editorial?: {
      launchStatus?: string;
      homepageCandidate?: boolean;
      marketplaceFeatured?: boolean;
      storyCandidate?: boolean;
      editorialNotes?: string;
      launchChecklist?: Record<string, boolean>;
      launchReady?: boolean;
    };
  };

  if (body.action === "supplier-editorial") {
    if (body.kind !== "supplier" || !body.id || !body.editorial) {
      return NextResponse.json({ error: "Supplier application ID and editorial decision are required." }, { status: 400 });
    }

    const update = await updateSupplierEditorial({
      id: body.id,
      adminEmail: adminUser.email,
      entityName: body.entityName || body.id,
      editorial: {
        launchStatus: body.editorial.launchStatus || "Needs Improvement",
        homepageCandidate: body.editorial.homepageCandidate === true,
        marketplaceFeatured: body.editorial.marketplaceFeatured === true,
        storyCandidate: body.editorial.storyCandidate === true,
        editorialNotes: body.editorial.editorialNotes || "",
        launchChecklist: body.editorial.launchChecklist || {},
        launchReady: body.editorial.launchReady === true
      }
    });

    if (update.error) {
      return NextResponse.json({ error: "Could not save supplier editorial decision. Check the supplier_applications migration." }, { status: update.status });
    }

    return NextResponse.json({ ok: true, record: update.data, message: "Supplier editorial decision saved." });
  }

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
