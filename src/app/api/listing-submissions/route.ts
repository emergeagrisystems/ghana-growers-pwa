import { NextResponse } from "next/server";
import { createListingSubmission } from "@/lib/publicSubmissions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ ok: false, error: "Invalid listing submission." }, { status: 400 });
  }

  const result = await createListingSubmission(formData);

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your submission has been received and will be reviewed by Ghana Growers."
  });
}
