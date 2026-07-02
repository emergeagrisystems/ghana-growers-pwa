import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { uploadSupabaseStorageObject } from "@/lib/supabase/admin";

const allowedBuckets = new Set(["farmers", "suppliers", "marketplace", "stories"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function classifyUploadError(error: string, status: number, bucket: string) {
  const lower = error.toLowerCase();

  if (lower.includes("not configured")) {
    return {
      category: "Supabase unavailable",
      message: "Supabase Storage is not configured on the server.",
      diagnostic: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server."
    };
  }

  if (lower.includes("bucket") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return {
      category: "Storage bucket missing",
      message: `Storage upload failed. The "${bucket}" bucket is missing or unavailable.`,
      diagnostic: error
    };
  }

  if (lower.includes("permission") || lower.includes("policy") || lower.includes("row-level") || lower.includes("rls")) {
    return {
      category: "Permission denied",
      message: `Storage upload failed. Check Supabase Storage policies for the "${bucket}" bucket.`,
      diagnostic: error
    };
  }

  return {
    category: "Image upload failed",
    message: "Image upload failed.",
    diagnostic: error || `Supabase Storage returned HTTP ${status}.`
  };
}

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
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
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
    const classified = classifyUploadError(upload.error ?? "Supabase Storage did not return a public URL.", upload.status, bucket);
    console.error("[Admin Upload Error]", {
      bucket,
      path,
      status: upload.status,
      category: classified.category,
      error: upload.error
    });

    return NextResponse.json(
      {
        error: classified.message,
        category: classified.category,
        diagnostic: classified.diagnostic,
        bucket
      },
      { status: upload.status }
    );
  }

  return NextResponse.json({
    ok: true,
    bucket,
    path: upload.path,
    publicUrl: upload.publicUrl
  });
}
