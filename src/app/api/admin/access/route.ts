import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { accessKey?: string };
  const submittedKey = body.accessKey?.trim();
  const adminKey = process.env.ADMIN_ACCESS_KEY;

  if (!adminKey || !submittedKey || submittedKey !== adminKey) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
