import "server-only";

import { createHash } from "node:crypto";
import {
  buildFarmerProfileDraft,
  buildSupplierProfileDraft,
  privateApplicationMediaPath,
  PROFILE_APPLICATION_MEDIA,
  type ApplicationMediaKind,
  type FarmerApplicationForConversion,
  type ProfileApplicationKind,
  type SupplierApplicationForConversion,
  validateApplicationMedia
} from "@/lib/profileApplicationContracts";
import { convertApprovedApplication, type ConversionStore } from "@/lib/profileApplicationConversion";
import {
  createSupabaseStorageSignedUrl,
  deleteSupabaseStorageObject,
  downloadSupabaseStorageObject,
  insertSupabaseRecord,
  selectSupabaseRecords,
  updateSupabaseRecord,
  uploadSupabaseStorageObject,
  type SelectResponse
} from "@/lib/supabase/admin";

export type FarmerApplicationInsert = FarmerApplicationForConversion & {
  id: string;
  other_products?: string | null;
  production_details?: string | null;
  harvest_season?: string | null;
  application_message?: string | null;
  private_profile_image_path?: string | null;
  private_farm_image_paths?: string[];
  private_produce_image_paths?: string[];
  private_document_paths?: string[];
  agreement_accepted: boolean;
  source?: string | null;
  source_metadata?: Record<string, unknown>;
};

export type SupplierApplicationInsert = SupplierApplicationForConversion & {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  user_type: "Supplier";
  products_or_services: string;
  business_description?: string | null;
  registration_number?: string | null;
  years_in_business?: string | null;
  email?: string | null;
  private_logo_path?: string | null;
  private_photo_paths?: string[];
  private_certificate_paths?: string[];
  private_document_paths?: string[];
  gg_standard_agreement: boolean;
  notes?: string | null;
  source?: string | null;
  source_metadata?: Record<string, unknown>;
};

export type FarmerApplicationAdminRow = FarmerApplicationForConversion & {
  status: string;
  review_state: string;
  verification_decision: string;
  launch_ready: boolean;
  application_message?: string | null;
  admin_notes?: string | null;
  private_profile_image_path?: string | null;
  private_farm_image_paths?: string[] | null;
  private_produce_image_paths?: string[] | null;
  private_document_paths?: string[] | null;
  linked_farmer_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierApplicationAdminRow = SupplierApplicationForConversion & {
  status: string;
  review_state: string;
  verification_decision: string;
  launch_ready: boolean;
  business_description?: string | null;
  registration_number?: string | null;
  years_in_business?: string | null;
  email?: string | null;
  gg_standard_agreement?: boolean | null;
  notes?: string | null;
  admin_notes?: string | null;
  private_logo_path?: string | null;
  private_photo_paths?: string[] | null;
  private_certificate_paths?: string[] | null;
  private_document_paths?: string[] | null;
  linked_supplier_id?: string | null;
  created_at: string;
  updated_at: string;
};

const farmerAdminColumns = [
  "id", "applicant_name", "farm_name", "phone_number", "whatsapp_number", "email", "region", "district", "location",
  "farm_type", "crops_products", "farm_size", "farming_experience", "current_availability", "supply_frequency",
  "delivery_preference", "application_message", "private_profile_image_path", "private_farm_image_paths",
  "private_produce_image_paths", "private_document_paths", "status", "review_state", "verification_decision", "launch_ready",
  "admin_notes", "linked_farmer_id", "created_at", "updated_at"
].join(",");

const supplierAdminColumns = [
  "id", "name", "business_or_farm_name", "business_name", "contact_person", "phone", "whatsapp_number", "email", "region",
  "district", "products_or_services", "categories", "normalized_categories", "regions_served", "business_description",
  "website_url", "registration_number", "years_in_business", "gg_standard_agreement", "notes", "private_logo_path",
  "private_photo_paths", "private_certificate_paths", "private_document_paths", "status", "review_state", "verification_decision",
  "launch_ready", "admin_notes", "linked_supplier_id", "created_at", "updated_at"
].join(",");

export async function createFarmerApplication(payload: FarmerApplicationInsert) {
  return insertSupabaseRecord("farmer_applications", {
    ...payload,
    status: "New",
    review_state: "Pending Review",
    verification_decision: "Not Reviewed",
    launch_ready: false
  });
}

export async function createSupplierApplication(payload: SupplierApplicationInsert) {
  return insertSupabaseRecord("supplier_applications", {
    ...payload,
    status: "Pending",
    review_state: "Pending Review",
    verification_decision: "Not Reviewed",
    launch_ready: false,
    launch_status: "Needs Improvement",
    homepage_candidate: false,
    marketplace_featured: false,
    story_candidate: false,
    logo_url: null,
    photo_urls: [],
    certificate_urls: []
  });
}

export async function uploadPrivateApplicationMedia({
  kind,
  applicationId,
  group,
  file,
  mediaKind
}: {
  kind: ProfileApplicationKind;
  applicationId: string;
  group: "profile" | "farm" | "produce" | "logo" | "photos" | "certificates" | "documents";
  file: File;
  mediaKind: ApplicationMediaKind;
}) {
  const validation = validateApplicationMedia({ contentType: file.type, size: file.size, kind: mediaKind });
  if (!validation.ok) {
    return { status: 400, error: validation.code };
  }

  const path = privateApplicationMediaPath({
    applicationId,
    group,
    objectId: crypto.randomUUID(),
    contentType: file.type
  });
  const upload = await uploadSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA[kind].bucket,
    path,
    contentType: file.type,
    body: await file.arrayBuffer(),
    publicUrl: false
  });

  return upload.error || !upload.path
    ? { status: upload.status, error: "upload_failed" }
    : { status: upload.status, path: upload.path };
}

export async function cleanupPrivateApplicationMedia(kind: ProfileApplicationKind, paths: string[]) {
  const results = await Promise.all(paths.map((path) => deleteSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA[kind].bucket,
    path
  })));
  return { failedCount: results.filter((result) => result.error).length };
}

export function loadProfileApplicationsForAdmin(kind: "farmer"): Promise<SelectResponse<FarmerApplicationAdminRow>>;
export function loadProfileApplicationsForAdmin(kind: "supplier"): Promise<SelectResponse<SupplierApplicationAdminRow>>;
export function loadProfileApplicationsForAdmin(kind: ProfileApplicationKind): Promise<SelectResponse<FarmerApplicationAdminRow | SupplierApplicationAdminRow>>;
export async function loadProfileApplicationsForAdmin(kind: ProfileApplicationKind): Promise<SelectResponse<FarmerApplicationAdminRow | SupplierApplicationAdminRow>> {
  const table = kind === "farmer" ? "farmer_applications" : "supplier_applications";
  const columns = kind === "farmer" ? farmerAdminColumns : supplierAdminColumns;
  return kind === "farmer"
    ? selectSupabaseRecords<FarmerApplicationAdminRow>(table, `select=${columns}&order=created_at.desc&limit=500`)
    : selectSupabaseRecords<SupplierApplicationAdminRow>(table, `select=${columns}&order=created_at.desc&limit=500`);
}

export function loadProfileApplicationForAdmin(kind: "farmer", applicationId: string): Promise<SelectResponse<FarmerApplicationAdminRow>>;
export function loadProfileApplicationForAdmin(kind: "supplier", applicationId: string): Promise<SelectResponse<SupplierApplicationAdminRow>>;
export function loadProfileApplicationForAdmin(kind: ProfileApplicationKind, applicationId: string): Promise<SelectResponse<FarmerApplicationAdminRow | SupplierApplicationAdminRow>>;
export async function loadProfileApplicationForAdmin(kind: ProfileApplicationKind, applicationId: string): Promise<SelectResponse<FarmerApplicationAdminRow | SupplierApplicationAdminRow>> {
  const table = kind === "farmer" ? "farmer_applications" : "supplier_applications";
  const columns = kind === "farmer" ? farmerAdminColumns : supplierAdminColumns;
  return kind === "farmer"
    ? selectSupabaseRecords<FarmerApplicationAdminRow>(table, `select=${columns}&id=eq.${encodeURIComponent(applicationId)}&limit=1`)
    : selectSupabaseRecords<SupplierApplicationAdminRow>(table, `select=${columns}&id=eq.${encodeURIComponent(applicationId)}&limit=1`);
}

function privateMediaPaths(kind: ProfileApplicationKind, record: FarmerApplicationAdminRow | SupplierApplicationAdminRow) {
  if (kind === "farmer") {
    const farmer = record as FarmerApplicationAdminRow;
    return [
      farmer.private_profile_image_path,
      ...(farmer.private_farm_image_paths ?? []),
      ...(farmer.private_produce_image_paths ?? []),
      ...(farmer.private_document_paths ?? [])
    ].filter((path): path is string => Boolean(path));
  }

  const supplier = record as SupplierApplicationAdminRow;
  return [
    supplier.private_logo_path,
    ...(supplier.private_photo_paths ?? []),
    ...(supplier.private_certificate_paths ?? []),
    ...(supplier.private_document_paths ?? [])
  ].filter((path): path is string => Boolean(path));
}

function approvedImagePaths(kind: ProfileApplicationKind, record: FarmerApplicationAdminRow | SupplierApplicationAdminRow) {
  if (kind === "farmer") {
    const farmer = record as FarmerApplicationAdminRow;
    return [
      farmer.private_profile_image_path,
      ...(farmer.private_farm_image_paths ?? []),
      ...(farmer.private_produce_image_paths ?? [])
    ].filter((path): path is string => Boolean(path));
  }

  const supplier = record as SupplierApplicationAdminRow;
  return [supplier.private_logo_path, ...(supplier.private_photo_paths ?? [])]
    .filter((path): path is string => Boolean(path));
}

export async function createPrivateApplicationMediaPreview({
  kind,
  applicationId,
  path
}: {
  kind: ProfileApplicationKind;
  applicationId: string;
  path: string;
}) {
  if (!path.startsWith(`${applicationId}/`)) {
    return { status: 400, error: "invalid_media_path" };
  }

  const application = await loadProfileApplicationForAdmin(kind, applicationId);
  const record = application.data?.[0];
  if (application.error || !record) {
    return { status: application.status, error: "application_unavailable" };
  }

  if (!privateMediaPaths(kind, record).includes(path)) {
    return { status: 404, error: "media_not_found" };
  }

  return createSupabaseStorageSignedUrl({
    bucket: PROFILE_APPLICATION_MEDIA[kind].bucket,
    path,
    expiresIn: 300
  });
}

function conversionStore(): ConversionStore {
  return {
    async loadApplication(kind, applicationId) {
      const table = kind === "farmer" ? "farmer_applications" : "supplier_applications";
      const linkedColumn = kind === "farmer" ? "linked_farmer_id" : "linked_supplier_id";
      const result = await selectSupabaseRecords<Record<string, unknown>>(
        table,
        `select=id,status,${linkedColumn}&id=eq.${encodeURIComponent(applicationId)}&limit=1`
      );
      const row = result.data?.[0];
      return {
        status: result.status,
        error: result.error,
        data: row ? {
          id: String(row.id),
          status: String(row.status ?? ""),
          linkedProfileId: typeof row[linkedColumn] === "string" ? row[linkedColumn] as string : null
        } : undefined
      };
    },
    async findProfileBySource(kind, applicationId) {
      const table = kind === "farmer" ? "farmers" : "suppliers";
      const result = await selectSupabaseRecords<{ id: string }>(
        table,
        `select=id&source_application_id=eq.${encodeURIComponent(applicationId)}&limit=1`
      );
      return { status: result.status, error: result.error, profileId: result.data?.[0]?.id };
    },
    async createProfile(kind, profile) {
      const table = kind === "farmer" ? "farmers" : "suppliers";
      const profileId = crypto.randomUUID();
      const result = await insertSupabaseRecord(table, { ...profile, id: profileId });
      return { status: result.status, error: result.error, profileId: result.error ? undefined : profileId };
    },
    async linkApplication(kind, applicationId, profileId) {
      const table = kind === "farmer" ? "farmer_applications" : "supplier_applications";
      const linkedColumn = kind === "farmer" ? "linked_farmer_id" : "linked_supplier_id";
      const result = await updateSupabaseRecord(table, `id=eq.${encodeURIComponent(applicationId)}&status=eq.Approved`, {
        [linkedColumn]: profileId,
        status: "Converted",
        review_state: "Decision Recorded",
        converted_at: new Date().toISOString()
      });
      return {
        status: result.data ? result.status : 409,
        error: result.error ?? (result.data ? undefined : "Application is no longer approved for conversion.")
      };
    }
  };
}

export async function convertFarmerApplicationToProfile(applicationId: string) {
  const applicationResult = await loadProfileApplicationForAdmin("farmer", applicationId);
  const application = applicationResult.data?.[0];
  if (applicationResult.error || !application) {
    return { status: applicationResult.status, error: applicationResult.error ?? "Application not found." };
  }

  return convertApprovedApplication({
    kind: "farmer",
    applicationId,
    profile: buildFarmerProfileDraft(application),
    store: conversionStore()
  });
}

export async function convertSupplierApplicationToProfile(applicationId: string) {
  const applicationResult = await loadProfileApplicationForAdmin("supplier", applicationId);
  const application = applicationResult.data?.[0];
  if (applicationResult.error || !application) {
    return { status: applicationResult.status, error: applicationResult.error ?? "Application not found." };
  }

  const draft = buildSupplierProfileDraft(application);
  if (!draft.ok) return { status: 422, error: draft.error };

  return convertApprovedApplication({
    kind: "supplier",
    applicationId,
    profile: draft.data,
    store: conversionStore()
  });
}

type FarmerPublicMediaField = "profile_image_url" | "farm_photo_urls" | "produce_photo_urls";
type SupplierPublicMediaField = "profile_image_url" | "logo_url";

export async function promoteApprovedApplicationImage({
  kind,
  applicationId,
  sourcePath,
  profileId,
  profileField,
  approved
}: {
  kind: ProfileApplicationKind;
  applicationId: string;
  sourcePath: string;
  profileId: string;
  profileField: FarmerPublicMediaField | SupplierPublicMediaField;
  approved: boolean;
}) {
  if (!approved) return { status: 400, error: "Image approval is required." };
  if (!sourcePath.startsWith(`${applicationId}/`)) return { status: 400, error: "Invalid application media." };

  const allowedFields = kind === "farmer"
    ? new Set<FarmerPublicMediaField>(["profile_image_url", "farm_photo_urls", "produce_photo_urls"])
    : new Set<SupplierPublicMediaField>(["profile_image_url", "logo_url"]);
  if (!Array.from(allowedFields as ReadonlySet<string>).includes(profileField)) {
    return { status: 400, error: "Invalid public media field." };
  }

  const applicationResult = await loadProfileApplicationForAdmin(kind, applicationId);
  const application = applicationResult.data?.[0];
  if (applicationResult.error || !application || !approvedImagePaths(kind, application).includes(sourcePath)) {
    return { status: 404, error: "Approved application image was not found." };
  }

  const linkedProfileId = kind === "farmer"
    ? (application as FarmerApplicationAdminRow).linked_farmer_id
    : (application as SupplierApplicationAdminRow).linked_supplier_id;
  if (linkedProfileId !== profileId) {
    return { status: 409, error: "Application is not linked to this profile." };
  }

  const source = await downloadSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA[kind].bucket,
    path: sourcePath
  });
  if (source.error || !source.body || !source.contentType) {
    return { status: source.status, error: "Approved application image could not be loaded." };
  }

  const validation = validateApplicationMedia({ contentType: source.contentType, size: source.body.byteLength, kind: "image" });
  if (!validation.ok) return { status: 400, error: "Only approved images can be promoted." };

  const extension = source.contentType === "image/png" ? "png" : source.contentType === "image/webp" ? "webp" : "jpg";
  const sourceKey = createHash("sha256").update(sourcePath).digest("hex").slice(0, 16);
  const destinationPath = `approved-applications/${applicationId}/${profileId}/${profileField}/${sourceKey}.${extension}`;
  const upload = await uploadSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA[kind].publicBucket,
    path: destinationPath,
    contentType: source.contentType,
    body: source.body,
    publicUrl: true
  });
  if (upload.error || !upload.path || !upload.publicUrl) {
    return { status: upload.status, error: "Approved image could not be copied." };
  }

  const verified = await downloadSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA[kind].publicBucket,
    path: upload.path
  });
  const sourceDigest = createHash("sha256").update(Buffer.from(source.body)).digest("hex");
  const verifiedDigest = verified.body
    ? createHash("sha256").update(Buffer.from(verified.body)).digest("hex")
    : null;
  if (verified.error || verifiedDigest !== sourceDigest || verified.contentType !== source.contentType) {
    await deleteSupabaseStorageObject({ bucket: PROFILE_APPLICATION_MEDIA[kind].publicBucket, path: upload.path });
    return { status: 502, error: "Approved image copy could not be verified." };
  }

  const profileTable = kind === "farmer" ? "farmers" : "suppliers";
  const current = await selectSupabaseRecords<Record<string, unknown>>(
    profileTable,
    `select=${profileField}&id=eq.${encodeURIComponent(profileId)}&limit=1`
  );
  if (current.error || !current.data?.[0]) {
    await deleteSupabaseStorageObject({ bucket: PROFILE_APPLICATION_MEDIA[kind].publicBucket, path: upload.path });
    return { status: current.status, error: "Profile media reference could not be loaded." };
  }

  const existingValue = current.data[0][profileField];
  const nextValue = Array.isArray(existingValue)
    ? Array.from(new Set([...existingValue.filter((value): value is string => typeof value === "string"), upload.publicUrl]))
    : upload.publicUrl;
  const updated = await updateSupabaseRecord(profileTable, `id=eq.${encodeURIComponent(profileId)}`, {
    [profileField]: nextValue
  });
  if (updated.error) {
    const cleanup = await deleteSupabaseStorageObject({ bucket: PROFILE_APPLICATION_MEDIA[kind].publicBucket, path: upload.path });
    if (cleanup.error) {
      console.error("Profile media compensation failed", { feature: "profile_media_promotion", code: cleanup.status });
    }
    return { status: updated.status, error: "Profile media reference could not be updated." };
  }

  return { status: 200, path: upload.path, publicUrl: upload.publicUrl };
}
