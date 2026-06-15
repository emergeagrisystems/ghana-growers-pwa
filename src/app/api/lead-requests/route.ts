import { NextResponse } from "next/server";
import { insertLeadRequest } from "@/lib/leadRequests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const insert = await insertLeadRequest(payload);

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
