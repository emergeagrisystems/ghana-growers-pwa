import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity } from "@/lib/adminActivity";
import { selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FarmerCleanupRow = {
  id: string;
  slug: string | null;
  farm_name: string;
  source: string | null;
  status: string | null;
};

function nonTallyFarmers(rows: FarmerCleanupRow[]) {
  return rows.filter((row) => row.status !== "Archived" && row.source !== "Tally Import");
}

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const farmers = await selectSupabaseRecords<FarmerCleanupRow>(
    "farmers",
    "select=id,slug,farm_name,source,status&limit=5000"
  );

  if (farmers.error) {
    return NextResponse.json({ error: "Could not read farmers for cleanup." }, { status: farmers.status });
  }

  const rows = farmers.data ?? [];
  const targets = nonTallyFarmers(rows);

  return NextResponse.json({
    ok: true,
    totalFarmers: rows.length,
    nonTallyCount: targets.length,
    tallyImportCount: rows.filter((row) => row.source === "Tally Import").length,
    targets: targets.slice(0, 25)
  });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const farmers = await selectSupabaseRecords<FarmerCleanupRow>(
    "farmers",
    "select=id,slug,farm_name,source,status&limit=5000"
  );

  if (farmers.error) {
    return NextResponse.json({ error: "Could not read farmers for cleanup." }, { status: farmers.status });
  }

  const targets = nonTallyFarmers(farmers.data ?? []);

  if (targets.length === 0) {
    return NextResponse.json({ ok: true, archived: 0, targets: [] });
  }

  const filter = `id=in.(${targets.map((target) => encodeURIComponent(target.id)).join(",")})`;
  const update = await updateSupabaseRecord("farmers", filter, {
    status: "Archived"
  });

  if (update.error) {
    return NextResponse.json({ error: "Could not archive manual/test farmers." }, { status: update.status });
  }

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType: "Archive",
    entityType: "Farmer",
    entityId: targets.map((target) => target.slug || target.id).join(","),
    entityName: `${targets.length} manual/test farmer${targets.length === 1 ? "" : "s"}`
  });

  return NextResponse.json({
    ok: true,
    archived: targets.length,
    targets
  });
}
