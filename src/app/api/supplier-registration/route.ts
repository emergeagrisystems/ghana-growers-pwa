import { NextResponse } from "next/server";
import {
  appendSupplierRegistrationToSheet,
  sendSupplierRegistrationEmail,
  validateSupplierRegistration
} from "@/lib/supplierRegistration";
import { insertApplication } from "@/lib/applications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const validation = validateSupplierRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    supabase: false,
    googleSheets: false,
    email: false
  };

  const application = await insertApplication("supplier", {
    name: validation.data.contactPerson,
    business_or_farm_name: validation.data.companyName,
    phone: validation.data.phone,
    whatsapp_number: validation.data.whatsapp,
    email: validation.data.email,
    region: validation.data.region,
    district: "",
    user_type: "Supplier",
    products_or_services: validation.data.productsServicesOffered,
    notes: [
      validation.data.description,
      `Supplier category: ${validation.data.supplierCategory}`,
      validation.data.website ? `Website: ${validation.data.website}` : ""
    ].filter(Boolean).join("\n")
  });

  if (application.error) {
    return NextResponse.json({ ok: false, errors: { companyName: "Could not save application. Please try again." } }, { status: application.status });
  }

  integrations.supabase = true;

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
