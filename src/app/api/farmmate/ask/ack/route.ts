import { NextResponse } from "next/server";
import { isValidFarmMateConsultationId } from "@/lib/farmmate/consultation";
import { acknowledgeFarmMateAsk } from "@/lib/farmmate/usage/ask-recovery";

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 2_000) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > 2_000) return NextResponse.json({ ok: false }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body.anonymousDeviceId !== "string" || body.anonymousDeviceId.length > 160 ||
    !isValidFarmMateConsultationId(body.consultationId) ||
    typeof body.eventId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.eventId) ||
    ![1, 2].includes(Number(body.attemptCount))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const acknowledged = await acknowledgeFarmMateAsk({
    anonymousDeviceId: body.anonymousDeviceId,
    consultationId: body.consultationId,
    eventId: body.eventId,
    attemptCount: Number(body.attemptCount)
  });
  return NextResponse.json({ ok: acknowledged }, { status: acknowledged ? 200 : 409 });
}
