import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity } from "@/lib/adminActivity";
import { updateSupabaseRecord } from "@/lib/supabase/admin";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function filterFor(recordId: string) {
  const column = isUuid(recordId) ? "id" : "slug";
  return `${column}=eq.${encodeURIComponent(recordId)}`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    recordId?: string;
    entityName?: string;
    status?: "Draft" | "Published" | "Archived";
  };

  if (!body.recordId || !body.status) {
    return NextResponse.json({ error: "Story ID and status are required." }, { status: 400 });
  }

  const update = await updateSupabaseRecord("success_stories", filterFor(body.recordId), {
    status: body.status
  });

  if (update.error) {
    return NextResponse.json({ error: "Could not update success story status. Please try again." }, { status: update.status });
  }

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType: body.status === "Published" ? "Publish" : body.status === "Archived" ? "Archive" : "Edit",
    entityType: "Success Story",
    entityId: body.recordId,
    entityName: body.entityName || body.recordId
  });

  return NextResponse.json({ ok: true, record: update.data });
}
