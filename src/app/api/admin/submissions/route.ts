import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  convertBuyerRequestSubmission,
  convertListingSubmission,
  getPublicSubmissions,
  updateSubmissionStatus,
  type BuyerRequestSubmission,
  type ListingSubmission,
  type SubmissionKind,
  type SubmissionStatus
} from "@/lib/publicSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedKinds = new Set<SubmissionKind>(["listing", "buyer-request"]);
const allowedStatuses = new Set<SubmissionStatus>(["Under Review", "Approved", "Rejected"]);

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  return NextResponse.json(await getPublicSubmissions());
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
  };

  if (!body.kind || !allowedKinds.has(body.kind) || !body.id || !body.status || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: "Submission type, ID, and valid status are required." }, { status: 400 });
  }

  const update = await updateSubmissionStatus({
    kind: body.kind,
    id: body.id,
    status: body.status,
    adminEmail: adminUser.email,
    entityName: body.entityName || body.id
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

  const body = (await request.json().catch(() => ({}))) as {
    kind?: SubmissionKind;
    submission?: ListingSubmission | BuyerRequestSubmission;
  };

  if (body.kind === "listing" && body.submission) {
    const insert = await convertListingSubmission(body.submission as ListingSubmission, adminUser.email);

    if (insert.error) {
      return NextResponse.json({ error: "Could not convert listing submission." }, { status: insert.status });
    }

    return NextResponse.json({ ok: true, record: insert.data });
  }

  if (body.kind === "buyer-request" && body.submission) {
    const insert = await convertBuyerRequestSubmission(body.submission as BuyerRequestSubmission, adminUser.email);

    if (insert.error) {
      return NextResponse.json({ error: "Could not convert buyer request submission." }, { status: insert.status });
    }

    return NextResponse.json({ ok: true, record: insert.data });
  }

  return NextResponse.json({ error: "Submission type and record are required." }, { status: 400 });
}
