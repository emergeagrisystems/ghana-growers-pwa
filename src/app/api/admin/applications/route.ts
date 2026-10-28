import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getApplicationQueue, updateApplicationReview, updateApplicationStatus, updateSupplierEditorial, type ApplicationKind, type ApplicationStatus, type ApplicationVerificationDecision } from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedKinds = new Set<ApplicationKind>(["farmer", "buyer", "supplier"]);
const allowedStatuses = new Set<ApplicationStatus>(["Under Review", "Approved", "Rejected", "Converted"]);
const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

const queueErrorMessage: Record<ApplicationKind, string> = {
  farmer: "Could not load farmer applications. Please retry.",
  buyer: "Could not load buyer applications. Please retry.",
  supplier: "Could not load supplier applications. Please retry."
};

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401, headers: noStoreHeaders });
  }

  const kind = new URL(request.url).searchParams.get("kind") as ApplicationKind | null;

  if (!kind || !allowedKinds.has(kind)) {
    return NextResponse.json({ error: "A valid application kind is required." }, { status: 400, headers: noStoreHeaders });
  }

  const queue = await getApplicationQueue(kind);

  if (queue.state === "error") {
    console.error("Admin application queue failed to load", {
      route: "/api/admin/applications",
      applicationKind: kind,
      source: queue.source,
      code: "source_read_failed"
    });
    return NextResponse.json({
      kind,
      state: queue.state,
      error: queueErrorMessage[kind]
    }, { status: queue.status >= 500 ? queue.status : 502, headers: noStoreHeaders });
  }

  if (queue.state === "unavailable") {
    return NextResponse.json({
      kind,
      state: queue.state,
      applications: [],
      message: "Buyer applications are not available yet."
    }, { headers: noStoreHeaders });
  }

  return NextResponse.json({
    kind,
    state: queue.state,
    applications: queue.applications
  }, { headers: noStoreHeaders });
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
    action?: "status" | "review" | "supplier-editorial";
    verificationDecision?: ApplicationVerificationDecision;
    adminNotes?: string;
    corrections?: Record<string, unknown>;
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

  if (body.action === "review") {
    if ((body.kind !== "farmer" && body.kind !== "supplier") || !body.id || !body.verificationDecision) {
      return NextResponse.json({ error: "Application, ID and review decision are required." }, { status: 400 });
    }
    const allowedDecisions = new Set<ApplicationVerificationDecision>(["Not Reviewed", "Verified", "Rejected", "Needs Information"]);
    if (!allowedDecisions.has(body.verificationDecision)) return NextResponse.json({ error: "Choose a valid review decision." }, { status: 400 });
    const update = await updateApplicationReview({
      kind: body.kind,
      id: body.id,
      verificationDecision: body.verificationDecision,
      adminNotes: body.adminNotes,
      corrections: body.corrections,
      adminEmail: adminUser.email,
      entityName: body.entityName || body.id
    });
    return update.error
      ? NextResponse.json({ error: update.error }, { status: update.status })
      : NextResponse.json({ ok: true, record: update.data });
  }

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
