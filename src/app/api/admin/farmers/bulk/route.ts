import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity } from "@/lib/adminActivity";
import { selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FarmerBulkAction = "active" | "pending-review" | "under-review" | "verified" | "founding" | "archive";
type FarmerBulkRow = {
  id: string;
  slug: string | null;
  farm_name: string;
};

const actionLabels: Record<FarmerBulkAction, string> = {
  active: "Active",
  "pending-review": "Pending Review",
  "under-review": "Under Review",
  verified: "Verified",
  founding: "Founding Farmer",
  archive: "Archived"
};

function payloadForAction(action: FarmerBulkAction, adminEmail: string) {
  const today = new Date().toISOString().slice(0, 10);

  if (action === "active") {
    return { status: "Active" };
  }

  if (action === "pending-review") {
    return { status: "Pending Review", verification_status: "Pending", verification_date: null, verified_by: null };
  }

  if (action === "under-review") {
    return { verification_status: "Under Review", verification_date: null, verified_by: null };
  }

  if (action === "verified") {
    return { verification_status: "Verified", verification_date: today, verified_by: adminEmail };
  }

  if (action === "founding") {
    return { status: "Active", source: "Founding Farmer" };
  }

  return { status: "Archived" };
}

function activityAction(action: FarmerBulkAction) {
  if (action === "archive") {
    return "Archive" as const;
  }

  if (action === "verified") {
    return "Verify" as const;
  }

  return "Edit" as const;
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: FarmerBulkAction; recordIds?: string[] };
  const action = body.action;
  const recordIds = Array.from(new Set((body.recordIds ?? []).map((id) => id.trim()).filter(Boolean)));

  if (!action || !Object.keys(actionLabels).includes(action) || recordIds.length === 0) {
    return NextResponse.json({ error: "Choose farmers and a valid bulk action." }, { status: 400 });
  }

  const farmers = await selectSupabaseRecords<FarmerBulkRow>(
    "farmers",
    "select=id,slug,farm_name&limit=5000"
  );

  if (farmers.error) {
    return NextResponse.json({ error: "Could not read selected farmers." }, { status: farmers.status });
  }

  const selected = (farmers.data ?? []).filter((farmer) => recordIds.includes(farmer.id) || (farmer.slug ? recordIds.includes(farmer.slug) : false));

  if (selected.length === 0) {
    return NextResponse.json({ error: "Selected farmers could not be found." }, { status: 404 });
  }

  const filter = `id=in.(${selected.map((farmer) => encodeURIComponent(farmer.id)).join(",")})`;
  const update = await updateSupabaseRecord("farmers", filter, payloadForAction(action, adminUser.email));

  if (update.error) {
    return NextResponse.json({ error: "Could not update selected farmers." }, { status: update.status });
  }

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType: activityAction(action),
    entityType: "Farmer",
    entityId: selected.map((farmer) => farmer.slug || farmer.id).join(","),
    entityName: `${selected.length} farmers as ${actionLabels[action]}`
  });

  return NextResponse.json({
    ok: true,
    updated: selected.length,
    status: actionLabels[action],
    recordIds
  });
}
