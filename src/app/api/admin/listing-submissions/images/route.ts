import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { downloadSupabaseStorageObject } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSafeStoragePath(path: string) {
  return Boolean(path) && !path.startsWith("/") && !path.includes("..") && !path.includes("\\");
}

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const path = new URL(request.url).searchParams.get("path")?.trim() ?? "";

  if (!isSafeStoragePath(path)) {
    return NextResponse.json({ error: "Valid image path is required." }, { status: 400 });
  }

  const image = await downloadSupabaseStorageObject({
    bucket: "listing-submissions",
    path
  });

  if (image.error || !image.body) {
    return NextResponse.json({ error: "Could not load submission image." }, { status: image.status });
  }

  return new Response(image.body, {
    status: 200,
    headers: {
      "Content-Type": image.contentType ?? "application/octet-stream",
      "Cache-Control": "private, no-store"
    }
  });
}
