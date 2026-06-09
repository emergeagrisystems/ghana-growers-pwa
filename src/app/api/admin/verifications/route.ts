import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { updateSupabaseRecord } from "@/lib/supabase/admin";

type VerificationSubject = "farmer" | "supplier" | "buyer";
type VerificationStatus = "Pending" | "Under Review" | "Verified" | "Rejected";

const targetTables: Record<VerificationSubject, { table: string; filterColumn: "slug" | "id" }> = {
  farmer: { table: "farmers", filterColumn: "slug" },
  supplier: { table: "suppliers", filterColumn: "slug" },
  buyer: { table: "buyer_requests", filterColumn: "id" }
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    subject?: VerificationSubject;
    recordId?: string;
    status?: VerificationStatus;
    verifiedBy?: string;
    verificationNotes?: string;
  };

  if (!body.subject || !body.recordId || !body.status || !targetTables[body.subject]) {
    return NextResponse.json({ error: "Verification subject, record ID, and status are required." }, { status: 400 });
  }

  const target = targetTables[body.subject];
  const verificationDate = body.status === "Verified" ? new Date().toISOString().slice(0, 10) : null;
  const verifiedBy = body.status === "Verified" ? body.verifiedBy || "Ghana Growers Admin" : null;
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

  return NextResponse.json({ ok: true, record: update.data });
}
