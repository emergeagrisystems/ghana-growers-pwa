import { NextResponse } from "next/server";
import { insertSupabaseRecord, uploadSupabaseStorageObject } from "@/lib/supabase/admin";
import { supabaseServerAuthHeaders } from "@/lib/supabase/serverAuthHeaders";
import type { CropHealthResult } from "@/lib/cropHealth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

type CropHealthReportRow = {
  id: string;
  session_id: string;
  image_url: string;
  diagnosis: string;
  confidence: number;
  severity: string | null;
  symptoms: string | null;
  recommendations: string | null;
  provider: string | null;
  created_at: string;
  report_date?: string;
};

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "crop-report";
}

function extensionFor(type: string) {
  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function fetchReports(sessionId: string) {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return { rows: [], error: "Supabase is not configured on the server.", status: 503 };
  }

  const endpoint = new URL(`${url.replace(/\/$/, "")}/rest/v1/crop_health_reports`);
  endpoint.searchParams.set("select", "id,session_id,image_url,diagnosis,confidence,severity,symptoms,recommendations,provider,created_at");
  endpoint.searchParams.set("session_id", `eq.${sessionId}`);
  endpoint.searchParams.set("order", "created_at.desc");
  endpoint.searchParams.set("limit", "12");

  const response = await fetch(endpoint, {
    headers: supabaseServerAuthHeaders(serviceRoleKey),
    cache: "no-store"
  }).catch(() => null);

  const result = (await response?.json().catch(() => [])) as CropHealthReportRow[] | { message?: string } | null;

  if (!response?.ok || !Array.isArray(result)) {
    return {
      rows: [],
      error: !Array.isArray(result) ? result?.message : "Could not load crop health reports.",
      status: response?.status ?? 502
    };
  }

  return { rows: result.map((row) => ({ ...row, report_date: row.created_at })), status: 200 };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  const result = await fetchReports(sessionId);

  if (result.error) {
    return NextResponse.json({ error: result.error, reports: [] }, { status: result.status });
  }

  return NextResponse.json({ reports: result.rows });
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("photo");
  const sessionId = formData?.get("sessionId");
  const diagnosis = formData?.get("diagnosis");

  if (!(file instanceof File) || typeof sessionId !== "string" || typeof diagnosis !== "string") {
    return NextResponse.json({ error: "Photo, session ID, and diagnosis result are required." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP image." }, { status: 400 });
  }

  if (file.size > maxSize) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  let parsedDiagnosis: CropHealthResult;

  try {
    parsedDiagnosis = JSON.parse(diagnosis) as CropHealthResult;
  } catch {
    return NextResponse.json({ error: "Diagnosis result could not be read." }, { status: 400 });
  }

  if (!parsedDiagnosis.possibleIssue || typeof parsedDiagnosis.confidence !== "number") {
    return NextResponse.json({ error: "Diagnosis result is incomplete." }, { status: 400 });
  }
  const path = `${sessionId}/${Date.now()}-${safeName(file.name)}.${extensionFor(file.type)}`;
  const upload = await uploadSupabaseStorageObject({
    bucket: "crop-health-reports",
    path,
    contentType: file.type,
    body: await file.arrayBuffer()
  });

  if (upload.error || !upload.publicUrl) {
    return NextResponse.json({ error: upload.error ?? "Image upload failed." }, { status: upload.status });
  }

  const insert = await insertSupabaseRecord("crop_health_reports", {
    session_id: sessionId,
    image_url: upload.publicUrl,
    diagnosis: parsedDiagnosis.possibleIssue,
    confidence: parsedDiagnosis.confidence,
    severity: parsedDiagnosis.severity ?? null,
    symptoms: parsedDiagnosis.symptoms ?? null,
    recommendations: parsedDiagnosis.recommendedAction,
    provider: parsedDiagnosis.provider ?? null
  });

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  const inserted = insert.data as Record<string, unknown> | undefined;
  const report = inserted ? { ...inserted, report_date: String(inserted.created_at ?? new Date().toISOString()) } : undefined;

  return NextResponse.json({ ok: true, report });
}
