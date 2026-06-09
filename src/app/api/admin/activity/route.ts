import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getRecentAdminActivity } from "@/lib/adminActivity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const activity = await getRecentAdminActivity(25);

  if (activity.error) {
    return NextResponse.json({ error: "Could not load admin activity." }, { status: activity.status });
  }

  return NextResponse.json({ activity: activity.data ?? [] });
}
