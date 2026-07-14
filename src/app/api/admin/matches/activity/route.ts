import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity, type AdminActionType } from "@/lib/adminActivity";
import { selectSupabaseRecords } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const matchActions: AdminActionType[] = ["View", "Review", "Contact", "Close"];

export async function POST(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: AdminActionType;
    matchId?: string;
    entityName?: string;
  } | null;

  const matchId = typeof body?.matchId === "string" ? body.matchId.trim() : "";
  const entityName = typeof body?.entityName === "string" ? body.entityName.trim() : "";

  if (!body?.action || !matchActions.includes(body.action) || !matchId || !entityName) {
    return NextResponse.json({ error: "Unsupported match activity." }, { status: 400 });
  }

  const existing = await selectSupabaseRecords<{ id: string }>(
    "admin_activity_log",
    [
      "select=id",
      `entity_type=eq.${encodeURIComponent("Match Opportunity")}`,
      `entity_id=eq.${encodeURIComponent(matchId)}`,
      `action_type=eq.${encodeURIComponent(body.action)}`,
      "limit=1"
    ].join("&")
  );

  if (existing.data?.[0]) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const logged = await logAdminActivity({
    adminEmail: adminUser.email,
    actionType: body.action,
    entityType: "Match Opportunity",
    entityId: matchId,
    entityName
  });

  if (!logged.ok) {
    return NextResponse.json({ error: "Could not record match activity." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
