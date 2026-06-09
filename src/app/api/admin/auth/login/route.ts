import { NextResponse } from "next/server";
import { adminAuthCookieHeaders, signInAdminWithPassword } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await signInAdminWithPassword(email, password);

  if (!result.accessToken || !result.user) {
    return NextResponse.json({ error: result.error ?? "Admin login failed." }, { status: result.status ?? 401 });
  }

  const response = NextResponse.json({ ok: true, user: result.user });
  adminAuthCookieHeaders({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    maxAge: result.expiresIn
  }).forEach((cookie) => response.headers.append("Set-Cookie", cookie));

  return response;
}
