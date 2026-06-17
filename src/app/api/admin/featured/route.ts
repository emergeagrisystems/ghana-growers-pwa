import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity, type AdminActionType, type AdminEntityType } from "@/lib/adminActivity";
import { updateSupabaseRecord } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeaturedSection = "farmers" | "suppliers" | "marketplace";

const sectionConfig: Record<FeaturedSection, { table: string; entityType: AdminEntityType }> = {
  farmers: { table: "farmers", entityType: "Farmer" },
  suppliers: { table: "suppliers", entityType: "Supplier" },
  marketplace: { table: "marketplace_listings", entityType: "Marketplace Listing" }
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function recordFilter(recordId: string) {
  const column = isUuid(recordId) ? "id" : "slug";
  return `${column}=eq.${encodeURIComponent(recordId)}`;
}

function cleanDate(value?: string) {
  return value?.trim() ? value.trim().slice(0, 10) : null;
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    section?: FeaturedSection;
    recordId?: string;
    entityName?: string;
    action?: "mark" | "remove" | "note";
    featuredUntil?: string;
    featuredNote?: string;
  };
  const section = payload.section;
  const config = section ? sectionConfig[section] : undefined;
  const recordId = payload.recordId?.trim();

  if (!config || !recordId || !payload.action) {
    return NextResponse.json({ error: "Choose a valid featured record and action." }, { status: 400 });
  }

  const updatePayload =
    payload.action === "remove"
      ? { is_featured: false, featured_until: null, featured_note: payload.featuredNote?.trim() || null }
      : {
          is_featured: true,
          featured_until: cleanDate(payload.featuredUntil),
          featured_note: payload.featuredNote?.trim() || null
        };

  const update = await updateSupabaseRecord(config.table, recordFilter(recordId), updatePayload);

  if (update.error) {
    return NextResponse.json({ error: "Could not update featured settings." }, { status: update.status });
  }

  const actionType: AdminActionType =
    payload.action === "remove"
      ? "Removed Featured"
      : payload.action === "note"
        ? "Featured Note Updated"
        : "Marked Featured";

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType,
    entityType: config.entityType,
    entityId: recordId,
    entityName: payload.entityName || "Record"
  });

  return NextResponse.json({ ok: true, record: update.data });
}

