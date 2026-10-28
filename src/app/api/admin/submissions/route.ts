import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  getPublicListingSubmissions,
  getPublicSubmissions,
  updateListingSellerAssociation,
  updateSubmissionStatus,
  type SubmissionKind,
  type SubmissionStatus
} from "@/lib/publicSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedKinds = new Set<SubmissionKind>(["listing", "buyer-request"]);
const allowedStatuses = new Set<SubmissionStatus>(["New", "Needs Information", "Under Review", "Approved", "Paused", "Rejected", "Expired"]);

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const kind = searchParams.get("kind");

  return NextResponse.json(kind === "listing" ? await getPublicListingSubmissions() : await getPublicSubmissions(), {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    kind?: SubmissionKind;
    id?: string;
    status?: SubmissionStatus;
    entityName?: string;
    adminNotes?: string;
    sellerMessage?: string;
    currentHistory?: Array<Record<string, unknown>> | null;
    action?: "status" | "seller-association";
    sellerKind?: "farmer" | "supplier";
    profileId?: string;
  };

  if (body.action === "seller-association") {
    if (body.kind !== "listing" || !body.id || !body.sellerKind || !body.profileId) {
      return NextResponse.json({ error: "Listing, seller type and profile ID are required." }, { status: 400 });
    }
    const result = await updateListingSellerAssociation({
      submissionId: body.id,
      sellerKind: body.sellerKind,
      profileId: body.profileId,
      adminEmail: adminUser.email
    });
    return result.error
      ? NextResponse.json({ error: result.error }, { status: result.status })
      : NextResponse.json({ ok: true, record: result.data });
  }

  if (!body.kind || !allowedKinds.has(body.kind) || !body.id || !body.status || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: "Submission type, ID, and valid status are required." }, { status: 400 });
  }

  const update = await updateSubmissionStatus({
    kind: body.kind,
    id: body.id,
    status: body.status,
    adminEmail: adminUser.email,
    entityName: body.entityName || body.id,
    adminNotes: body.adminNotes,
    sellerMessage: body.sellerMessage,
    currentHistory: body.currentHistory
  });

  if (update.error) {
    return NextResponse.json({ error: "Could not update submission. Please try again." }, { status: update.status });
  }

  return NextResponse.json({ ok: true, record: update.data });
}

export async function POST(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  return NextResponse.json({
    error: "Stage 1 intake review cannot publish or convert submissions into Stage 2 records."
  }, { status: 409 });
}
