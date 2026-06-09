import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { updateSupabaseRecord } from "@/lib/supabase/admin";

type ArchiveSection = "farmers" | "suppliers" | "marketplace" | "buyer-requests" | "market-prices" | "learn";

const archiveTargets: Record<ArchiveSection, { table: string; filterColumn: "id" | "slug" }> = {
  farmers: { table: "farmers", filterColumn: "slug" },
  suppliers: { table: "suppliers", filterColumn: "slug" },
  marketplace: { table: "marketplace_listings", filterColumn: "slug" },
  "buyer-requests": { table: "buyer_requests", filterColumn: "id" },
  "market-prices": { table: "market_prices", filterColumn: "id" },
  learn: { table: "learn_articles", filterColumn: "slug" }
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function filterFor(recordId: string, filterColumn: "id" | "slug") {
  const column = filterColumn === "slug" && isUuid(recordId) ? "id" : filterColumn;
  return `${column}=eq.${encodeURIComponent(recordId)}`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { section?: ArchiveSection; recordId?: string };

  if (!body.section || !body.recordId || !archiveTargets[body.section]) {
    return NextResponse.json({ error: "Admin section and record ID are required." }, { status: 400 });
  }

  const target = archiveTargets[body.section];
  const update = await updateSupabaseRecord(target.table, filterFor(body.recordId, target.filterColumn), {
    status: "Archived"
  });

  if (update.error) {
    return NextResponse.json({ error: "Could not archive this record. Please try again." }, { status: update.status });
  }

  return NextResponse.json({ ok: true, record: update.data });
}
