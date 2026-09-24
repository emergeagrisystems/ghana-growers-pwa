import { NextResponse } from "next/server";
import { publicSubmissionGate } from "@/lib/publicSubmissionAvailability";
import { insertFeaturedEnquiry } from "@/lib/featuredEnquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unavailable = publicSubmissionGate("featured-enquiries");
  if (unavailable) return unavailable;

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const insert = await insertFeaturedEnquiry(payload);

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

