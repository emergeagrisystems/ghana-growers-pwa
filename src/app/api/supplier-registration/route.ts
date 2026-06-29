import { NextResponse } from "next/server";
import {
  appendSupplierRegistrationToSheet,
  sendSupplierRegistrationEmail,
  validateSupplierRegistration
} from "@/lib/supplierRegistration";
import { uploadSupabaseStorageObject, insertSupabaseRecord, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedCertificateTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 5 * 1024 * 1024;
const maxCertificateSize = 8 * 1024 * 1024;

function supplierSubmissionError(message: string, status = 500) {
  return NextResponse.json({
    ok: false,
    errors: {
      form: message
    }
  }, { status });
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

  const integrations = {
    supabase: false,
    googleSheets: false,
    email: false
  };

  if (!hasSupabaseAdminConfig()) {
    return supplierSubmissionError(
      "Supplier applications are not configured on this server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then try again.",
      503
    );
  }

  const contactSlug = slugify(validation.data.contactPerson);

  if (body.logoImage instanceof File && body.logoImage.size > 0) {
    const upload = await uploadFile({
      file: body.logoImage,
      pathPrefix: `applications/${Date.now()}-${contactSlug}/logo`,
      allowedTypes: allowedImageTypes,
      maxSize: maxImageSize,
      errorField: "logoImageUrl",
      typeError: "Upload a JPG, PNG, or WEBP logo image.",
      sizeError: "Logo image must be 5MB or smaller."
    });

    if (upload.error) {
      return upload.error;
    }

    validation.data.logoImageUrl = upload.publicUrl ?? "";
  }

  const photoUrls = await uploadFiles({
    files: Array.isArray(body.productPhotos) ? body.productPhotos : body.productPhotos instanceof File ? [body.productPhotos] : [],
    pathPrefix: `applications/${Date.now()}-${contactSlug}/photos`,
    allowedTypes: allowedImageTypes,
    maxSize: maxImageSize,
    errorField: "photoUrls",
    typeError: "Upload JPG, PNG, or WEBP product/business photos.",
    sizeError: "Each product/business photo must be 5MB or smaller."
  });

  if (photoUrls.error) {
    return photoUrls.error;
  }

  validation.data.photoUrls = photoUrls.publicUrls;

  const certificateUrls = await uploadFiles({
    files: Array.isArray(body.certificates) ? body.certificates : body.certificates instanceof File ? [body.certificates] : [],
    pathPrefix: `applications/${Date.now()}-${contactSlug}/certificates`,
    allowedTypes: allowedCertificateTypes,
    maxSize: maxCertificateSize,
    errorField: "certificateUrls",
    typeError: "Upload certificates as PDF, JPG, PNG, or WEBP files.",
    sizeError: "Each certificate must be 8MB or smaller."
  });

  if (certificateUrls.error) {
    return certificateUrls.error;
  }

  validation.data.certificateUrls = certificateUrls.publicUrls;

  const application = await insertSupabaseRecord("supplier_applications", {
    name: validation.data.contactPerson,
    business_or_farm_name: validation.data.businessName || validation.data.companyName || null,
    phone: validation.data.phone,
    whatsapp_number: validation.data.whatsapp,
    email: validation.data.email,
    region: validation.data.region || validation.data.regionsServed[0] || null,
    district: validation.data.district,
    user_type: "Supplier",
    products_or_services: validation.data.productsServicesOffered,
    business_name: validation.data.businessName || validation.data.companyName,
    website_url: validation.data.websiteUrl || null,
    registration_number: validation.data.registrationNumber || null,
    categories: validation.data.categories,
    regions_served: validation.data.regionsServed,
    business_description: validation.data.businessDescription || null,
    years_in_business: validation.data.yearsInBusiness || null,
    logo_url: validation.data.logoImageUrl || null,
    photo_urls: validation.data.photoUrls,
    certificate_urls: validation.data.certificateUrls,
    gg_standard_agreement: validation.data.ggStandardAgreement,
    status: "Pending",
    notes: [
      `Supplier categories: ${validation.data.categories.join(", ") || validation.data.supplierCategory}`,
      `Regions served: ${validation.data.regionsServed.join(", ") || validation.data.deliveryCoverage}`,
      validation.data.websiteUrl ? `Website/social: ${validation.data.websiteUrl}` : "",
      validation.data.registrationNumber ? `Registration number: ${validation.data.registrationNumber}` : "",
      validation.data.yearsInBusiness ? `Years in business: ${validation.data.yearsInBusiness}` : "",
      validation.data.logoImageUrl ? `Logo/image: ${validation.data.logoImageUrl}` : "",
      validation.data.photoUrls.length ? `Product/business photos: ${validation.data.photoUrls.join(", ")}` : "",
      validation.data.certificateUrls.length ? `Certificates: ${validation.data.certificateUrls.join(", ")}` : "",
      validation.data.businessDescription ? `Business description: ${validation.data.businessDescription}` : "",
      validation.data.ggStandardAgreement ? "GG Quality Standard agreement: Yes" : ""
    ].filter(Boolean).join("\n")
  });

  if (application.error) {
    const isSchemaIssue = /column|schema|constraint|relation|table|violates|permission|policy|row-level|rls/i.test(application.error);
    const message = isSchemaIssue
      ? `Could not save supplier application. Check that migration 023_supplier_onboarding_fields.sql has been applied and that supplier_applications accepts service-role inserts. Supabase said: ${application.error}`
      : `Could not save supplier application. Supabase said: ${application.error}`;

    return supplierSubmissionError(message, application.status);
  }

  integrations.supabase = true;

  const sheetResult = await appendSupplierRegistrationToSheet(validation.data);
  integrations.googleSheets = sheetResult.configured;

  const emailResult = await sendSupplierRegistrationEmail(validation.data);
  integrations.email = emailResult.configured;

  return NextResponse.json({
    ok: true,
    message: "We've received your supplier application.",
    integrations
  });
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

  formData.forEach((value, key) => {
    appendRecordValue(record, key, value);
  });

  record.privacyAccepted = formData.get("privacyAccepted") === "on" || formData.get("privacyAccepted") === "true";
  record.ggStandardAgreement = formData.get("ggStandardAgreement") === "on" || formData.get("ggStandardAgreement") === "true";
  return record;
}

function imageExtension(contentType: string) {
  if (contentType === "application/pdf") {
    return "pdf";
  }

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

async function uploadFile({
  file,
  pathPrefix,
  allowedTypes,
  maxSize,
  errorField,
  typeError,
  sizeError
}: {
  file: File;
  pathPrefix: string;
  allowedTypes: Set<string>;
  maxSize: number;
  errorField: string;
  typeError: string;
  sizeError: string;
}) {
  if (!allowedTypes.has(file.type)) {
    return {
      error: NextResponse.json({ ok: false, errors: { [errorField]: typeError } }, { status: 400 }),
      publicUrl: ""
    };
  }

  if (file.size > maxSize) {
    return {
      error: NextResponse.json({ ok: false, errors: { [errorField]: sizeError } }, { status: 400 }),
      publicUrl: ""
    };
  }

  const extension = imageExtension(file.type);
  const upload = await uploadSupabaseStorageObject({
    bucket: "suppliers",
    path: `${pathPrefix}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`,
    contentType: file.type,
    body: await file.arrayBuffer()
  });

  if (upload.error || !upload.publicUrl) {
    const message = upload.error
      ? `Could not upload file. Supabase Storage said: ${upload.error}`
      : "Could not upload file. Please try again.";

    return {
      error: NextResponse.json({ ok: false, errors: { [errorField]: message } }, { status: upload.status }),
      publicUrl: ""
    };
  }

  return { publicUrl: upload.publicUrl };
}

async function uploadFiles(options: {
  files: File[];
  pathPrefix: string;
  allowedTypes: Set<string>;
  maxSize: number;
  errorField: string;
  typeError: string;
  sizeError: string;
}) {
  const publicUrls: string[] = [];

  for (let index = 0; index < options.files.length; index += 1) {
    const file = options.files[index];

    if (file.size === 0) {
      continue;
    }

    const upload = await uploadFile({
      ...options,
      file,
      pathPrefix: `${options.pathPrefix}/${index + 1}`
    });

    if (upload.error) {
      return { error: upload.error, publicUrls: [] };
    }

    if (upload.publicUrl) {
      publicUrls.push(upload.publicUrl);
    }
  }

  return { publicUrls };
}
