import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recovery requests must originate in the browser so Supabase can retain the
// PKCE verifier across Vercel's protected-deployment sign-in round trip.
export async function POST() {
  const response = NextResponse.json(
    { error: "Request a new password from the Ghana Growers Admin Login page." },
    { status: 410 }
  );
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
