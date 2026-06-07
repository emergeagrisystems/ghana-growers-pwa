import { NextResponse } from "next/server";
import {
  appendFarmerRegistrationToSheet,
  sendFarmerRegistrationEmail,
  validateFarmerRegistration
} from "@/lib/farmerRegistration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const validation = validateFarmerRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    googleSheets: false,
    email: false
  };

  const sheetResult = await appendFarmerRegistrationToSheet(validation.data);
  integrations.googleSheets = sheetResult.configured;

  const emailResult = await sendFarmerRegistrationEmail(validation.data);
  integrations.email = emailResult.configured;

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your farmer registration has been submitted.",
    integrations
  });
}
