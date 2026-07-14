import { NextResponse } from "next/server";
import { createBuyerRequestSubmission } from "@/lib/publicSubmissions";

export const runtime = "nodejs";

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "public"
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await createBuyerRequestSubmission(body, clientKey(request));

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    message: "message" in result ? result.message : "We have received your sourcing request."
  }, { status: "duplicate" in result && result.duplicate ? 200 : 201 });
}
