import { NextResponse } from "next/server";
import { publicSubmissionGate } from "@/lib/publicSubmissionAvailability";
import { createListingSubmission } from "@/lib/publicSubmissions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unavailable = publicSubmissionGate("listing-submissions");
  if (unavailable) return unavailable;

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ ok: false, error: "Invalid listing submission." }, { status: 400 });
  }

  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "public";
  const result = await createListingSubmission(formData, clientKey);

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    reference: "reference" in result ? result.reference : undefined,
    message: "message" in result ? result.message : "Your listing is not live yet. Ghana Growers will review the details and contact you if more information is needed."
  });
}
