import { NextResponse } from "next/server";
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
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const insert = await insertLeadRequest(payload, clientKey(request));

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json(
    {
      ok: true,
      message: "message" in insert ? insert.message : "Thank you. Ghana Growers has received your request."
    },
    { status: "duplicate" in insert && insert.duplicate ? 200 : 201 }
  );
}
