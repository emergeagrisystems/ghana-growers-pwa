import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { uploadSupabaseStorageObject } from "@/lib/supabase/admin";

const allowedBuckets = new Set(["farmers", "suppliers", "marketplace"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const bucket = formData?.get("bucket");

  if (!(file instanceof File) || typeof bucket !== "string") {
    return NextResponse.json({ error: "Image file and storage bucket are required." }, { status: 400 });
  }

  if (!allowedBuckets.has(bucket)) {
    return NextResponse.json({ error: "Unsupported image upload bucket." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP image." }, { status: 400 });
  }

  if (file.size > maxSize) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const extension = extensionByType[file.type] ?? "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName(file.name)}.${extension}`;
  const upload = await uploadSupabaseStorageObject({
    bucket,
    path,
    contentType: file.type,
    body: await file.arrayBuffer()
  });

  if (upload.error || !upload.publicUrl) {
    return NextResponse.json({ error: upload.error ?? "Image upload failed." }, { status: upload.status });
  }

  return NextResponse.json({
    ok: true,
    bucket,
    path: upload.path,
    publicUrl: upload.publicUrl
  });
}
