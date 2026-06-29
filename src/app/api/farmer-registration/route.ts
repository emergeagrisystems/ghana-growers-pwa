import { NextResponse } from "next/server";
import {
  appendFarmerRegistrationToSheet,
  sendFarmerRegistrationEmail,
  validateFarmerRegistration
} from "@/lib/farmerRegistration";
import { hasSupabaseAdminConfig, insertSupabaseRecord, uploadSupabaseStorageObject } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 5 * 1024 * 1024;

function farmerSubmissionError(message: string, status = 500) {
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
  const validation = validateFarmerRegistration(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const integrations = {
    supabase: false,
    googleSheets: false,
    email: false
  };

  if (!hasSupabaseAdminConfig()) {
    return farmerSubmissionError(
      "Farmer applications are not configured on this server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then try again.",
      503
    );
  }

  const farmerSlug = slugify(validation.data.farmerName);
  const uploadBase = `applications/${Date.now()}-${farmerSlug}`;

  if (body.farmerPhoto instanceof File && body.farmerPhoto.size > 0) {
    const upload = await uploadFile({
      file: body.farmerPhoto,
      pathPrefix: `${uploadBase}/farmer-photo`,
      errorField: "farmerPhotoUrl",
      typeError: "Upload a JPG, PNG, or WEBP farmer photo.",
      sizeError: "Farmer photo must be 5MB or smaller."
    });

    if (upload.error) {
      return upload.error;
    }

    validation.data.farmerPhotoUrl = upload.publicUrl ?? "";
  }

  const farmPhotoUrls = await uploadFiles({
    files: Array.isArray(body.farmPhotos) ? body.farmPhotos : body.farmPhotos instanceof File ? [body.farmPhotos] : [],
    pathPrefix: `${uploadBase}/farm-photos`,
    errorField: "farmPhotoUrls",
    typeError: "Upload JPG, PNG, or WEBP farm photos.",
    sizeError: "Each farm photo must be 5MB or smaller."
  });

  if (farmPhotoUrls.error) {
    return farmPhotoUrls.error;
  }

  validation.data.farmPhotoUrls = farmPhotoUrls.publicUrls;

  const producePhotoUrls = await uploadFiles({
    files: Array.isArray(body.producePhotos) ? body.producePhotos : body.producePhotos instanceof File ? [body.producePhotos] : [],
    pathPrefix: `${uploadBase}/produce-photos`,
    errorField: "producePhotoUrls",
    typeError: "Upload JPG, PNG, or WEBP produce photos.",
    sizeError: "Each produce photo must be 5MB or smaller."
  });

  if (producePhotoUrls.error) {
    return producePhotoUrls.error;
  }

  validation.data.producePhotoUrls = producePhotoUrls.publicUrls;

  const application = await insertSupabaseRecord("farmer_applications", {
    name: validation.data.farmerName,
    business_or_farm_name: validation.data.farmName || null,
    phone: validation.data.phoneNumber,
    whatsapp_number: validation.data.whatsappNumber || validation.data.phoneNumber,
    email: validation.data.emailAddress || "",
    region: validation.data.region,
    district: validation.data.districtTown,
    user_type: "Farmer",
    products_or_services: [validation.data.mainCrops, validation.data.otherProduce].filter(Boolean).join(", "),
    farmer_name: validation.data.farmerName,
    farm_name: validation.data.farmName || null,
    farm_size: validation.data.farmSize || null,
    main_crops: validation.data.mainCrops,
    other_produce: validation.data.otherProduce || null,
    current_availability: validation.data.currentAvailability,
    harvest_season: validation.data.harvestSeason || null,
    farm_description: validation.data.farmDescription,
    has_available_produce: validation.data.hasAvailableProduce,
    farmer_photo_url: validation.data.farmerPhotoUrl || null,
    farm_photo_urls: validation.data.farmPhotoUrls,
    produce_photo_urls: validation.data.producePhotoUrls,
    agreement: validation.data.agreement,
    status: "Pending",
    notes: [
      `Farm size: ${validation.data.farmSize || "Not provided"}`,
      `Farm type: ${validation.data.farmType}`,
      `Current availability: ${validation.data.currentAvailability}`,
      `Harvest season: ${validation.data.harvestSeason || "Not provided"}`,
      `Has available produce: ${validation.data.hasAvailableProduce}`,
      validation.data.otherProduce ? `Other produce: ${validation.data.otherProduce}` : "",
      validation.data.farmerPhotoUrl ? `Farmer photo: ${validation.data.farmerPhotoUrl}` : "",
      validation.data.farmPhotoUrls.length ? `Farm photos: ${validation.data.farmPhotoUrls.join(", ")}` : "",
      validation.data.producePhotoUrls.length ? `Produce photos: ${validation.data.producePhotoUrls.join(", ")}` : "",
      validation.data.farmDescription ? `Farm description: ${validation.data.farmDescription}` : "",
      validation.data.agreement ? "Marketplace and quality guidelines agreement: Yes" : ""
    ].filter(Boolean).join("\n")
  });

  if (application.error) {
    const isSchemaIssue = /column|schema|constraint|relation|table|violates|permission|policy|row-level|rls/i.test(application.error);
    const message = isSchemaIssue
      ? `Could not save farmer application. Check that migration 024_farmer_onboarding_fields.sql has been applied and that farmer_applications accepts service-role inserts. Supabase said: ${application.error}`
      : `Could not save farmer application. Supabase said: ${application.error}`;

    return farmerSubmissionError(message, application.status);
  }

  integrations.supabase = true;

  const sheetResult = await appendFarmerRegistrationToSheet(validation.data);
  integrations.googleSheets = sheetResult.configured;

  const emailResult = await sendFarmerRegistrationEmail(validation.data);
  integrations.email = emailResult.configured;

  return NextResponse.json({
    ok: true,
    message: "We've received your farmer application.",
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

  record.agreement = formData.get("agreement") === "on" || formData.get("agreement") === "true";
  record.privacyAccepted = record.agreement;
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
    .slice(0, 48) || "farmer";
}

async function uploadFile({
  file,
  pathPrefix,
  errorField,
  typeError,
  sizeError
}: {
  file: File;
  pathPrefix: string;
  errorField: string;
  typeError: string;
  sizeError: string;
}) {
  if (!allowedImageTypes.has(file.type)) {
    return {
      error: NextResponse.json({ ok: false, errors: { [errorField]: typeError } }, { status: 400 }),
      publicUrl: ""
    };
  }

  if (file.size > maxImageSize) {
    return {
      error: NextResponse.json({ ok: false, errors: { [errorField]: sizeError } }, { status: 400 }),
      publicUrl: ""
    };
  }

  const extension = imageExtension(file.type);
  const upload = await uploadSupabaseStorageObject({
    bucket: "farmers",
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
