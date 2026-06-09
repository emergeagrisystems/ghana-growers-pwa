import { NextResponse } from "next/server";
import { createBuyerRequestSubmission } from "@/lib/publicSubmissions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await createBuyerRequestSubmission(body);

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your submission has been received and will be reviewed by Ghana Growers."
  });
}
