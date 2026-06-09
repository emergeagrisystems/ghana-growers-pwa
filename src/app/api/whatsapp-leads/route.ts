import { NextResponse } from "next/server";
import { insertWhatsAppLead } from "@/lib/whatsappLeads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const insert = await insertWhatsAppLead(payload, request.headers.get("user-agent"));

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
