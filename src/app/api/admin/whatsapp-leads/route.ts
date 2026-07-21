import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminOptionalSourceFailure, resolveAdminOptionalSource } from "@/lib/adminOptionalSources";
import { getRecentWhatsAppLeads } from "@/lib/whatsappLeads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const sourceTable = "whatsapp_leads";
const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const query = await getRecentWhatsAppLeads(250).catch(() => null);

  if (!query) {
    logAdminOptionalSourceFailure({
      route: "/api/admin/whatsapp-leads",
      feature: "WhatsApp click tracking",
      table: sourceTable,
      status: 503,
      code: "OPTIONAL_SOURCE_READ_FAILED"
    });
    return NextResponse.json({
      error: "WhatsApp click activity could not be loaded. Please try again.",
      code: "OPTIONAL_SOURCE_READ_FAILED",
      retryable: true
    }, { status: 503, headers: noStoreHeaders });
  }

  const source = resolveAdminOptionalSource(query);

  if (source.state === "unavailable") {
    return NextResponse.json({
      leads: [],
      availability: "unavailable",
      message: "WhatsApp click tracking is not available yet."
    }, { headers: noStoreHeaders });
  }

  if (source.state === "error") {
    logAdminOptionalSourceFailure({
      route: "/api/admin/whatsapp-leads",
      feature: "WhatsApp click tracking",
      table: sourceTable,
      status: source.status,
      code: source.code
    });
    return NextResponse.json({
      error: "WhatsApp click activity could not be loaded. Please try again.",
      code: source.code,
      retryable: true
    }, { status: source.status, headers: noStoreHeaders });
  }

  return NextResponse.json({ leads: source.data, availability: "available" }, { headers: noStoreHeaders });
}
