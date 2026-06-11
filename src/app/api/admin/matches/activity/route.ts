import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity, type AdminActionType } from "@/lib/adminActivity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const matchActions: AdminActionType[] = ["View", "Contact", "Close"];

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

  if (!body?.action || !matchActions.includes(body.action)) {
    return NextResponse.json({ error: "Unsupported match activity." }, { status: 400 });
  }

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType: body.action,
    entityType: "Match Opportunity",
    entityId: body.matchId ?? null,
    entityName: body.entityName ?? "Buyer request match"
  });

  return NextResponse.json({ ok: true });
}
