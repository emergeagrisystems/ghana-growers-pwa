import { NextResponse } from "next/server";
import {
  appendBuyerRegistrationToSheet,
  sendBuyerRegistrationEmail,
  validateBuyerRegistration
} from "@/lib/buyerRegistration";
import { insertApplication } from "@/lib/applications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const validation = validateBuyerRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    supabase: false,
    googleSheets: false,
    email: false
  };

  const application = await insertApplication("buyer", {
    name: validation.data.name,
    business_or_farm_name: validation.data.businessName,
    phone: validation.data.phone,
    whatsapp_number: validation.data.whatsapp,
    email: validation.data.email,
    region: validation.data.region,
    district: "",
    user_type: "Buyer",
    products_or_services: validation.data.productsInterestedIn,
    notes: [
      validation.data.additionalNotes,
      `Buyer type: ${validation.data.buyerType}`,
      `Typical volume: ${validation.data.typicalPurchaseVolume}`,
      `Frequency: ${validation.data.purchaseFrequency}`
    ].filter(Boolean).join("\n")
  });

  if (application.error) {
    return NextResponse.json({ ok: false, errors: { name: "Could not save application. Please try again." } }, { status: application.status });
  }

  integrations.supabase = true;

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
