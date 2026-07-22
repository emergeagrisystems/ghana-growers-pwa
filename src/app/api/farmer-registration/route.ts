import { NextResponse } from "next/server";

export const runtime = "nodejs";

const unavailableMessage = "Farmer applications are temporarily unavailable while we improve the application process.";

export async function POST() {
  console.warn("Farmer application unavailable", {
    route: "/api/farmer-registration",
    feature: "farmer_applications",
    code: "source_unavailable"
  });

  return NextResponse.json(
    { ok: false, message: unavailableMessage, errors: { form: unavailableMessage } },
    { status: 503 }
  );
}
