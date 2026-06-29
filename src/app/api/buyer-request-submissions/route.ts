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
    message: "We have received your sourcing request."
  });
}
