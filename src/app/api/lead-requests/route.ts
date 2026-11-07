import { NextResponse } from "next/server";
import { publicSubmissionGate } from "@/lib/publicSubmissionAvailability";
import { insertLeadRequest } from "@/lib/leadRequests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "public"
  );
}

export async function POST(request: Request) {
  const unavailable = publicSubmissionGate("lead-requests");
  if (unavailable) return unavailable;

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const sources: Record<string, string> = { farmer_profile: "Farmer", supplier_profile: "Supplier", generic_sourcing: "Buyer Request" };
  if (typeof payload.requestSource !== "string" || sources[payload.requestSource] !== payload.sourceType) {
    return NextResponse.json({ error: "This connection source is unavailable." }, { status: 400 });
  }
  const insert = await insertLeadRequest(payload, clientKey(request));

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json(
    {
      ok: true,
      reference: "reference" in insert ? insert.reference : undefined,
      message: "message" in insert ? insert.message : "Thank you. Ghana Growers has received your request."
    },
    { status: "duplicate" in insert && insert.duplicate ? 200 : 201 }
  );
}
