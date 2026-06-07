import { NextResponse } from "next/server";
import {
  appendSupplierRegistrationToSheet,
  sendSupplierRegistrationEmail,
  validateSupplierRegistration
} from "@/lib/supplierRegistration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const validation = validateSupplierRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    googleSheets: false,
    email: false
  };

  const sheetResult = await appendSupplierRegistrationToSheet(validation.data);
  integrations.googleSheets = sheetResult.configured;

  const emailResult = await sendSupplierRegistrationEmail(validation.data);
  integrations.email = emailResult.configured;

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your supplier registration has been submitted.",
    integrations
  });
}
