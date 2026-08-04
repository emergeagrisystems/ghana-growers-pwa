import { NextResponse } from "next/server";
import {
  consumeFarmerApplicationRateLimit,
  farmerApplicationSecurity,
  findExistingFarmerApplication
} from "@/lib/farmerApplicationSubmissions";
import { createFarmerApplicationReference, validateFarmerRegistration } from "@/lib/farmerRegistration";
import {
  cleanupPrivateApplicationMedia,
  createFarmerApplication,
  uploadPrivateApplicationMedia
} from "@/lib/profileApplications";
import { validateApplicationMedia, type ApplicationMediaKind } from "@/lib/profileApplicationContracts";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type FarmerMediaGroup = "profile" | "farm" | "produce" | "documents";

type PendingMedia = {
  file: File;
  group: FarmerMediaGroup;
  kind: ApplicationMediaKind;
  errorField: string;
  label: string;
};

const inFlightSubmissionKeys = new Set<string>();

function safeError(message: string, status = 500, field = "form") {
  return NextResponse.json({ ok: false, message, errors: { [field]: message } }, { status });
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "public";
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("multipart/form-data")
    ? formDataToRecord(await request.formData().catch(() => new FormData()))
    : ((await request.json().catch(() => ({}))) as Record<string, unknown>);

  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim()) {
    return NextResponse.json({ ok: true, message: "Application received" });
  }

  const validation = validateFarmerRegistration(body);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  if (!hasSupabaseAdminConfig()) {
    return safeError("Farmer applications are temporarily unavailable. Please try again later.", 503);
  }

  const security = farmerApplicationSecurity(validation.data, clientKey(request));
  if (!security) {
    return safeError("Farmer applications are temporarily unavailable. Please try again later.", 503);
  }

  const existing = await findExistingFarmerApplication(security);
  if (existing.error) return safeError(existing.error, existing.status);
  if (existing.duplicate) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      message: "Application received",
      reference: existing.reference
    });
  }

  if (inFlightSubmissionKeys.has(security.submissionKey)) {
    return safeError("This application is already being submitted. Please wait a moment.", 409);
  }

  const rateLimit = await consumeFarmerApplicationRateLimit(security.rateLimitKey);
  if (rateLimit.error) return safeError(rateLimit.error, rateLimit.status);

  const mediaResult = pendingMedia(body);
  if (mediaResult.error) return safeError(mediaResult.error.message, 400, mediaResult.error.field);

  for (const item of mediaResult.items) {
    const fileValidation = validateApplicationMedia({
      contentType: item.file.type,
      size: item.file.size,
      kind: item.kind
    });
    if (!fileValidation.ok) {
      const message = fileValidation.code === "unsupported_type"
        ? `${item.label} must be a JPG, PNG, WEBP${item.kind === "document" ? ", or PDF" : ""} file.`
        : `${item.label} is too large.`;
      return safeError(message, 400, item.errorField);
    }
  }

  inFlightSubmissionKeys.add(security.submissionKey);
  try {
    return await saveApplication({ body: validation.data, media: mediaResult.items, security });
  } finally {
    inFlightSubmissionKeys.delete(security.submissionKey);
  }
}

async function saveApplication({
  body,
  media,
  security
}: {
  body: NonNullable<ReturnType<typeof validateFarmerRegistration>["data"]>;
  media: PendingMedia[];
  security: NonNullable<ReturnType<typeof farmerApplicationSecurity>>;
}) {
  const applicationId = crypto.randomUUID();
  const applicationReference = createFarmerApplicationReference();
  const uploadedPaths: string[] = [];
  let privateProfileImagePath: string | null = null;
  const privateFarmImagePaths: string[] = [];
  const privateProduceImagePaths: string[] = [];
  const privateDocumentPaths: string[] = [];

  for (const item of media) {
    let upload: Awaited<ReturnType<typeof uploadPrivateApplicationMedia>>;
    try {
      upload = await uploadPrivateApplicationMedia({
        kind: "farmer",
        applicationId,
        group: item.group,
        file: item.file,
        mediaKind: item.kind
      });
    } catch {
      await cleanupUploadedMedia(uploadedPaths, 502);
      return safeError(`Could not upload ${item.label.toLowerCase()}. Please try again.`, 502, item.errorField);
    }

    if (upload.error || !upload.path) {
      await cleanupUploadedMedia(uploadedPaths, upload.status);
      return safeError(
        `Could not upload ${item.label.toLowerCase()}. Please try again.`,
        upload.status >= 400 ? upload.status : 502,
        item.errorField
      );
    }

    uploadedPaths.push(upload.path);
    if (item.group === "profile") privateProfileImagePath = upload.path;
    if (item.group === "farm") privateFarmImagePaths.push(upload.path);
    if (item.group === "produce") privateProduceImagePaths.push(upload.path);
    if (item.group === "documents") privateDocumentPaths.push(upload.path);
  }

  const application = await createFarmerApplication({
    id: applicationId,
    applicant_name: body.applicantName,
    farm_name: body.farmName || null,
    phone_number: body.phoneNumber || body.whatsappNumber,
    whatsapp_number: body.whatsappNumber || null,
    email: body.email || null,
    region: body.region,
    district: body.district,
    location: body.farmLocation || null,
    farm_type: body.farmType,
    crops_products: body.cropsProducts,
    production_details: body.productionDetails || null,
    current_availability: body.currentAvailability || null,
    supply_frequency: body.supplyFrequency || null,
    harvest_season: body.harvestSeason || null,
    delivery_preference: body.deliveryPreference || null,
    application_message: body.applicationMessage || null,
    private_profile_image_path: privateProfileImagePath,
    private_farm_image_paths: privateFarmImagePaths,
    private_produce_image_paths: privateProduceImagePaths,
    private_document_paths: privateDocumentPaths,
    agreement_accepted: body.agreementAccepted,
    source: "public_farmer_application",
    source_metadata: {
      form_version: 1,
      application_reference: applicationReference,
      submission_key: security.submissionKey,
      dedupe_key: security.dedupeKey
    }
  }).catch(() => null);

  if (!application || application.error) {
    await cleanupUploadedMedia(uploadedPaths, application?.status ?? 502);
    console.error("Farmer application save failed", {
      route: "/api/farmer-registration",
      feature: "farmer_applications",
      code: application?.status ?? "request_failed"
    });
    return safeError("Could not save your farmer application. Please try again.", application?.status ?? 502);
  }

  return NextResponse.json({
    ok: true,
    message: "Application received",
    reference: applicationReference
  }, { status: 201 });
}

function pendingMedia(body: Record<string, unknown>): { items: PendingMedia[]; error?: { field: string; message: string } } {
  const profile = fileValues(body.profileImage);
  const farm = fileValues(body.farmImages);
  const produce = fileValues(body.produceImages);
  const documents = fileValues(body.documents);

  if (profile.length > 1) return { items: [], error: { field: "profileImage", message: "Choose one main farmer or farm image." } };
  if (farm.length > 4) return { items: [], error: { field: "farmImages", message: "Choose up to four farm images." } };
  if (produce.length > 4) return { items: [], error: { field: "produceImages", message: "Choose up to four produce images." } };
  if (documents.length > 3) return { items: [], error: { field: "documents", message: "Choose up to three supporting documents." } };

  return {
    items: [
      ...profile.map((file): PendingMedia => ({ file, group: "profile", kind: "image", errorField: "profileImage", label: "Main image" })),
      ...farm.map((file): PendingMedia => ({ file, group: "farm", kind: "image", errorField: "farmImages", label: "Farm image" })),
      ...produce.map((file): PendingMedia => ({ file, group: "produce", kind: "image", errorField: "produceImages", label: "Produce image" })),
      ...documents.map((file): PendingMedia => ({ file, group: "documents", kind: "document", errorField: "documents", label: "Supporting document" }))
    ]
  };
}

function fileValues(value: unknown) {
  const values = Array.isArray(value) ? value : value instanceof File ? [value] : [];
  return values.filter((item): item is File => item instanceof File && item.size > 0);
}

async function cleanupUploadedMedia(paths: string[], status: number) {
  if (paths.length === 0) return;
  const cleanup = await cleanupPrivateApplicationMedia("farmer", paths);
  if (cleanup.failedCount > 0) {
    console.error("Farmer application media cleanup failed", {
      route: "/api/farmer-registration",
      feature: "farmer-application-media",
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

function formDataToRecord(formData: FormData) {
  const record: Record<string, unknown> = {};
  formData.forEach((value, key) => appendRecordValue(record, key, value));
  record.agreementAccepted = formData.get("agreementAccepted") === "on"
    || formData.get("agreementAccepted") === "true";
  return record;
}
