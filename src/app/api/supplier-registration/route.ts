import { NextResponse } from "next/server";
import {
  appendSupplierRegistrationToSheet,
  sendSupplierRegistrationEmail,
  validateSupplierRegistration
} from "@/lib/supplierRegistration";
import { insertApplication } from "@/lib/applications";
import { uploadSupabaseStorageObject } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("multipart/form-data")
    ? await formDataToRecord(await request.formData().catch(() => new FormData()))
    : ((await request.json().catch(() => ({}))) as Record<string, unknown>);

  const validation = validateSupplierRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    supabase: false,
    googleSheets: false,
    email: false
  };

  if (body.logoImage instanceof File && body.logoImage.size > 0) {
    if (!allowedImageTypes.has(body.logoImage.type)) {
      return NextResponse.json({ ok: false, errors: { logoImageUrl: "Upload a JPG, PNG, or WEBP image." } }, { status: 400 });
    }

    if (body.logoImage.size > maxImageSize) {
      return NextResponse.json({ ok: false, errors: { logoImageUrl: "Logo/image must be 5MB or smaller." } }, { status: 400 });
    }

    const extension = imageExtension(body.logoImage.type);
    const upload = await uploadSupabaseStorageObject({
      bucket: "suppliers",
      path: `applications/${Date.now()}-${slugify(validation.data.contactPerson)}.${extension}`,
      contentType: body.logoImage.type,
      body: await body.logoImage.arrayBuffer()
    });

    if (upload.error || !upload.publicUrl) {
      return NextResponse.json({ ok: false, errors: { logoImageUrl: "Could not upload image. Please try again." } }, { status: upload.status });
    }

    validation.data.logoImageUrl = upload.publicUrl;
  }

  const application = await insertApplication("supplier", {
    name: validation.data.contactPerson,
    business_or_farm_name: validation.data.companyName || null,
    phone: validation.data.phone,
    whatsapp_number: validation.data.whatsapp,
    email: validation.data.email,
    region: validation.data.region,
    district: validation.data.district,
    user_type: "Supplier",
    products_or_services: validation.data.productsServicesOffered,
    notes: [
      `Supplier category: ${validation.data.supplierCategory}`,
      `Delivery coverage: ${validation.data.deliveryCoverage}`,
      validation.data.website ? `Website: ${validation.data.website}` : "",
      validation.data.logoImageUrl ? `Logo/image: ${validation.data.logoImageUrl}` : "",
      validation.data.description ? `Additional notes: ${validation.data.description}` : ""
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

async function formDataToRecord(formData: FormData) {
  const record: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    record[key] = value;
  });

  record.privacyAccepted = formData.get("privacyAccepted") === "on" || formData.get("privacyAccepted") === "true";
  return record;
}

function imageExtension(contentType: string) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "supplier";
}
