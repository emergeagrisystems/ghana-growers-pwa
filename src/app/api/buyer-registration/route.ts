import { NextResponse } from "next/server";
import {
  appendBuyerRegistrationToSheet,
  sendBuyerRegistrationEmail,
  validateBuyerRegistration
} from "@/lib/buyerRegistration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const validation = validateBuyerRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    googleSheets: false,
    email: false
  };

  const sheetResult = await appendBuyerRegistrationToSheet(validation.data);
  integrations.googleSheets = sheetResult.configured;

  const emailResult = await sendBuyerRegistrationEmail(validation.data);
  integrations.email = emailResult.configured;

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your buyer registration has been submitted.",
    integrations
  });
}
