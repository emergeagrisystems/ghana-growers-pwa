import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getRecentWhatsAppLeads } from "@/lib/whatsappLeads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const leads = await getRecentWhatsAppLeads(250);

  if (leads.error) {
    return NextResponse.json({ error: "Could not load WhatsApp leads." }, { status: leads.status });
  }

  return NextResponse.json({ leads: leads.data ?? [] });
}
