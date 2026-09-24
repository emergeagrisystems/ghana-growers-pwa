import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Farmer workflow changes must be completed in the dedicated Farmer Profile editor." },
    { status: 409 }
  );
}
