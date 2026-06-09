import { NextResponse } from "next/server";
import { clearAdminAuthCookieHeaders } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminAuthCookieHeaders().forEach((cookie) => response.headers.append("Set-Cookie", cookie));

  return response;
}
