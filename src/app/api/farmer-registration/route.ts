import { NextResponse } from "next/server";
import {
  appendFarmerRegistrationToSheet,
  sendFarmerRegistrationEmail,
  validateFarmerRegistration
} from "@/lib/farmerRegistration";
import { insertApplication } from "@/lib/applications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const validation = validateFarmerRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    supabase: false,
    googleSheets: false,
    email: false
  };

  const application = await insertApplication("farmer", {
    name: validation.data.fullName,
    business_or_farm_name: validation.data.farmName,
    phone: validation.data.phoneNumber,
    whatsapp_number: validation.data.whatsappNumber,
    email: validation.data.emailAddress,
    region: validation.data.region,
    district: validation.data.district,
    user_type: "Farmer",
    products_or_services: validation.data.products,
    notes: [
      validation.data.additionalNotes,
      `Farm size: ${validation.data.farmSizeAcres} acres`,
      `Farm type: ${validation.data.farmType}`,
      `Expected harvest: ${validation.data.expectedHarvestPeriod}`
    ].filter(Boolean).join("\n")
  });

  if (application.error) {
    return NextResponse.json({ ok: false, errors: { fullName: "Could not save application. Please try again." } }, { status: application.status });
  }

  integrations.supabase = true;

  const sheetResult = await appendFarmerRegistrationToSheet(validation.data);
  integrations.googleSheets = sheetResult.configured;

  const emailResult = await sendFarmerRegistrationEmail(validation.data);
  integrations.email = emailResult.configured;

  return NextResponse.json({
    ok: true,
    message: "Thank you. Ghana Growers has received your farmer registration. The team will review your details before publishing or matching your profile.",
    integrations
  });
}
