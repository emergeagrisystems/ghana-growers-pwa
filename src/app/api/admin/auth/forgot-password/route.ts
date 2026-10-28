import { NextResponse } from "next/server";
import { requestAdminPasswordReset } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function recoveryOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const branchUrl = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_BRANCH_URL?.trim() : undefined;
  if (!branchUrl) return requestOrigin;

  try {
    const candidate = new URL(`https://${branchUrl}`);
    return candidate.protocol === "https:" && candidate.hostname.endsWith(".vercel.app") ? candidate.origin : requestOrigin;
  } catch {
    return requestOrigin;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const result = await requestAdminPasswordReset(email, `${recoveryOrigin(request)}/admin/reset-password`);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, message: "Password reset instructions have been sent if this admin account exists." });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
