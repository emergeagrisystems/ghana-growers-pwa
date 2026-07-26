import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { selectSupabaseRecords } from "@/lib/supabase/admin";

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
  return rows.filter((row) => row.status !== "Archived" && row.source !== "Tally Import" && row.source !== "Founding Farmer");
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
    foundingFarmerCount: rows.filter((row) => row.source === "Founding Farmer").length,
    targets: targets.slice(0, 25)
  });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Bulk farmer status changes are disabled. Review farmers individually in the dedicated profile editor." },
    { status: 409 }
  );
}
