import { NextResponse } from "next/server";
import {
  cleanupPrivateApplicationMedia,
  createSupplierApplication,
  uploadPrivateApplicationMedia
} from "@/lib/profileApplications";
import { validateApplicationMedia, type ApplicationMediaKind } from "@/lib/profileApplicationContracts";
import {
  appendSupplierRegistrationToSheet,
  sendSupplierRegistrationEmail,
  validateSupplierRegistration
} from "@/lib/supplierRegistration";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SupplierMediaGroup = "logo" | "photos" | "certificates";

type PendingMedia = {
  file: File;
  group: SupplierMediaGroup;
  kind: ApplicationMediaKind;
  errorField: "logoImageUrl" | "photoUrls" | "certificateUrls";
  typeError: string;
  sizeError: string;
};

function supplierSubmissionError(message: string, status = 500) {
  return NextResponse.json({ ok: false, errors: { form: message } }, { status });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("multipart/form-data")
    ? await formDataToRecord(await request.formData().catch(() => new FormData()))
    : ((await request.json().catch(() => ({}))) as Record<string, unknown>);
  const validation = validateSupplierRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  if (!hasSupabaseAdminConfig()) {
    return supplierSubmissionError("Supplier applications are temporarily unavailable. Please try again later.", 503);
  }

  const media = pendingMedia(body);
  for (const item of media) {
    const fileValidation = validateApplicationMedia({
      contentType: item.file.type,
      size: item.file.size,
      kind: item.kind
    });
    if (!fileValidation.ok) {
      const message = fileValidation.code === "unsupported_type" ? item.typeError : item.sizeError;
      return NextResponse.json({ ok: false, errors: { [item.errorField]: message } }, { status: 400 });
    }
  }

  const applicationId = crypto.randomUUID();
  const uploadedPaths: string[] = [];
  let privateLogoPath: string | null = null;
  const privatePhotoPaths: string[] = [];
  const privateCertificatePaths: string[] = [];

  for (const item of media) {
    let upload: Awaited<ReturnType<typeof uploadPrivateApplicationMedia>>;
    try {
      upload = await uploadPrivateApplicationMedia({
        kind: "supplier",
        applicationId,
        group: item.group,
        file: item.file,
        mediaKind: item.kind
      });
    } catch {
      await cleanupUploadedMedia(uploadedPaths, 502);
      return NextResponse.json({
        ok: false,
        errors: { [item.errorField]: "Could not upload this file. Please try again." }
      }, { status: 502 });
    }

    if (upload.error || !upload.path) {
      await cleanupUploadedMedia(uploadedPaths, upload.status);
      return NextResponse.json({
        ok: false,
        errors: { [item.errorField]: "Could not upload this file. Please try again." }
      }, { status: upload.status >= 400 ? upload.status : 502 });
    }

    uploadedPaths.push(upload.path);
    if (item.group === "logo") privateLogoPath = upload.path;
    if (item.group === "photos") privatePhotoPaths.push(upload.path);
    if (item.group === "certificates") privateCertificatePaths.push(upload.path);
  }

  validation.data.logoImageUrl = "";
  validation.data.photoUrls = [];
  validation.data.certificateUrls = [];

  const application = await createSupplierApplication({
    id: applicationId,
    name: validation.data.contactPerson,
    business_or_farm_name: validation.data.businessName || validation.data.companyName || null,
    business_name: validation.data.businessName || validation.data.companyName || null,
    contact_person: validation.data.contactPerson,
    phone: validation.data.phone,
    whatsapp_number: validation.data.whatsapp || null,
    email: validation.data.email || null,
    region: validation.data.region || validation.data.regionsServed[0] || null,
    district: validation.data.district || null,
    user_type: "Supplier",
    products_or_services: validation.data.productsServicesOffered,
    website_url: validation.data.websiteUrl || null,
    registration_number: validation.data.registrationNumber || null,
    categories: validation.data.categories,
    normalized_categories: validation.data.categories,
    regions_served: validation.data.regionsServed,
    business_description: validation.data.businessDescription || null,
    years_in_business: validation.data.yearsInBusiness || null,
    private_logo_path: privateLogoPath,
    private_photo_paths: privatePhotoPaths,
    private_certificate_paths: privateCertificatePaths,
    private_document_paths: [],
    gg_standard_agreement: validation.data.ggStandardAgreement,
    source: "public_supplier_application",
    source_metadata: { form_version: 3 },
    notes: [
      `Supplier categories: ${validation.data.categories.join(", ")}`,
      `Regions served: ${validation.data.regionsServed.join(", ")}`,
      privateLogoPath ? "Private logo received: Yes" : "",
      privatePhotoPaths.length ? `Private product/business photos received: ${privatePhotoPaths.length}` : "",
      privateCertificatePaths.length ? `Private certificates received: ${privateCertificatePaths.length}` : ""
    ].filter(Boolean).join("\n")
  }).catch(() => null);

  if (!application || application.error) {
    await cleanupUploadedMedia(uploadedPaths, application?.status ?? 502);
    console.error("Supplier application save failed", {
      route: "/api/supplier-registration",
      feature: "supplier_applications",
      code: application?.status ?? "request_failed"
    });
    return supplierSubmissionError("Could not save your supplier application. Please try again.", application?.status ?? 502);
  }

  const integrations = { supabase: true, googleSheets: false, email: false };
  try {
    const sheetResult = await appendSupplierRegistrationToSheet(validation.data);
    integrations.googleSheets = sheetResult.configured;
  } catch {
    console.warn("Supplier application notification failed", {
      route: "/api/supplier-registration",
      feature: "google_sheets",
      code: "notification_failed"
    });
  }

  try {
    const emailResult = await sendSupplierRegistrationEmail(validation.data);
    integrations.email = emailResult.configured;
  } catch {
    console.warn("Supplier application notification failed", {
      route: "/api/supplier-registration",
      feature: "email",
      code: "notification_failed"
    });
  }

  return NextResponse.json({
    ok: true,
    message: "We've received your supplier application.",
    integrations
  });
}

function pendingMedia(body: Record<string, unknown>): PendingMedia[] {
  const logo = body.logoImage instanceof File && body.logoImage.size > 0 ? [body.logoImage] : [];
  const photos = fileValues(body.productPhotos);
  const certificates = fileValues(body.certificates);

  return [
    ...logo.map((file): PendingMedia => ({
      file,
      group: "logo",
      kind: "image",
      errorField: "logoImageUrl",
      typeError: "Upload a JPG, PNG, or WEBP logo image.",
      sizeError: "Logo image must be 5MB or smaller."
    })),
    ...photos.map((file): PendingMedia => ({
      file,
      group: "photos",
      kind: "image",
      errorField: "photoUrls",
      typeError: "Upload JPG, PNG, or WEBP product/business photos.",
      sizeError: "Each product/business photo must be 5MB or smaller."
    })),
    ...certificates.map((file): PendingMedia => ({
      file,
      group: "certificates",
      kind: "document",
      errorField: "certificateUrls",
      typeError: "Upload certificates as PDF, JPG, PNG, or WEBP files.",
      sizeError: "Each certificate must be 8MB or smaller."
    }))
  ];
}

function fileValues(value: unknown) {
  const values = Array.isArray(value) ? value : value instanceof File ? [value] : [];
  return values.filter((item): item is File => item instanceof File && item.size > 0);
}

async function cleanupUploadedMedia(paths: string[], status: number) {
  if (paths.length === 0) return;
  const cleanup = await cleanupPrivateApplicationMedia("supplier", paths);
  if (cleanup.failedCount > 0) {
    console.error("Supplier application media cleanup failed", {
      route: "/api/supplier-registration",
      feature: "supplier-application-media",
      code: status,
      failedCount: cleanup.failedCount
    });
  }
}

function appendRecordValue(record: Record<string, unknown>, key: string, value: FormDataEntryValue) {
  const existing = record[key];
  if (existing === undefined) {
    record[key] = value;
    return;
  }
  record[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
}

async function formDataToRecord(formData: FormData) {
  const record: Record<string, unknown> = {};
  formData.forEach((value, key) => appendRecordValue(record, key, value));
  record.privacyAccepted = formData.get("privacyAccepted") === "on" || formData.get("privacyAccepted") === "true";
  record.ggStandardAgreement = formData.get("ggStandardAgreement") === "on" || formData.get("ggStandardAgreement") === "true";
  return record;
}
