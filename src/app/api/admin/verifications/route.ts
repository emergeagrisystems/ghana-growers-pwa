import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity, type AdminEntityType } from "@/lib/adminActivity";
import { updateSupabaseRecord } from "@/lib/supabase/admin";

type VerificationSubject = "farmer" | "supplier" | "buyer";
type VerificationStatus = "Pending" | "Under Review" | "Verified" | "Rejected";

const targetTables: Record<VerificationSubject, { table: string; filterColumn: "slug" | "id" }> = {
  farmer: { table: "farmers", filterColumn: "slug" },
  supplier: { table: "suppliers", filterColumn: "slug" },
  buyer: { table: "buyer_requests", filterColumn: "id" }
};

const entityTypes: Record<VerificationSubject, AdminEntityType> = {
  farmer: "Farmer",
  supplier: "Supplier",
  buyer: "Buyer Request"
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    subject?: VerificationSubject;
    recordId?: string;
    status?: VerificationStatus;
    verifiedBy?: string;
    verificationNotes?: string;
    entityName?: string;
  };

  if (!body.subject || !body.recordId || !body.status || !targetTables[body.subject]) {
    return NextResponse.json({ error: "Verification subject, record ID, and status are required." }, { status: 400 });
  }
  if (body.subject === "farmer") {
    return NextResponse.json(
      { error: "Open the dedicated Farmer Profile editor to change verification status." },
      { status: 409 }
    );
  }

  const target = targetTables[body.subject];
  const verificationDate = body.status === "Verified" ? new Date().toISOString().slice(0, 10) : null;
  const verifiedBy = body.status === "Verified" ? body.verifiedBy || adminUser.email : null;
  const filter = `${target.filterColumn}=eq.${encodeURIComponent(body.recordId)}`;
  const update = await updateSupabaseRecord(target.table, filter, {
    verification_status: body.status,
    verification_date: verificationDate,
    verified_by: verifiedBy,
    verification_notes: body.verificationNotes?.trim() || null
  });

  if (update.error) {
    return NextResponse.json({ error: update.error }, { status: update.status });
  }

  if (body.status === "Verified") {
    await logAdminActivity({
      adminEmail: adminUser.email,
      actionType: "Verify",
      entityType: entityTypes[body.subject],
      entityId: body.recordId,
      entityName: body.entityName || body.recordId
    });
  }

  return NextResponse.json({ ok: true, record: update.data });
}
