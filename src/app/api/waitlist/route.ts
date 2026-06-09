import { NextResponse } from "next/server";
import { insertApplication, type ApplicationKind } from "@/lib/applications";

export const runtime = "nodejs";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = clean(body.name);
  const phone = clean(body.phone);
  const whatsapp = clean(body.whatsapp);
  const email = clean(body.email);
  const userType = clean(body.userType);

  if (!name || !phone || !whatsapp || !email || !["Farmer", "Buyer", "Supplier"].includes(userType)) {
    return NextResponse.json({ ok: false, error: "Name, phone, WhatsApp, email, and user type are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const kind = userType.toLowerCase() as ApplicationKind;
  const application = await insertApplication(kind, {
    name,
    business_or_farm_name: "",
    phone,
    whatsapp_number: whatsapp,
    email,
    region: "",
    district: "",
    user_type: userType as "Farmer" | "Buyer" | "Supplier",
    products_or_services: "",
    notes: "Pre-launch waiting list submission."
  });

  if (application.error) {
    return NextResponse.json({ ok: false, error: "Could not save your waiting list request. Please try again." }, { status: application.status });
  }

  return NextResponse.json({ ok: true, message: "Thank you. Your interest has been saved for launch follow-up." });
}
