import "server-only";

import { logAdminActivity, type AdminActionType } from "@/lib/adminActivity";
import {
  farmerProfileReadiness,
  featuredIsCurrentlyPublic,
  isSafePublicProfileImage,
  normalizeRecordArrays,
  profileIsPubliclyEligible,
  publicationChecks,
  supplierCategoryReview,
  uniqueTextValues,
  type FarmerProfileRecord,
  type ProfileEditorKind,
  type ProfileEditorRecord,
  type ProfileTransition,
  type PublicationCheck,
  type SupplierProfileRecord
} from "@/lib/profileEditorContracts";
import {
  loadProfileApplicationForAdmin,
  type FarmerApplicationAdminRow,
  type SupplierApplicationAdminRow
} from "@/lib/profileApplications";
import { isValidPublicProfileSlug } from "@/lib/publicProfileEligibility";
import {
  mapFarmerPublicProfile,
  mapSupplierPublicProfile,
  type SupabaseFarmer,
  type SupabaseSupplier
} from "@/lib/supabase/publicData";
import { selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

const farmerColumns = [
  "id", "slug", "farmer_name", "farm_name", "region", "district", "farm_type", "products", "farm_size",
  "whatsapp_number", "verification_status", "profile_image_url", "description", "status", "created_at", "updated_at", "verification_date",
  "verified_by", "verification_notes", "source", "phone_number", "email", "farm_location", "farming_experience",
  "currently_harvesting", "supply_frequency", "delivery_preference", "payment_preference", "is_featured",
  "featured_until", "featured_note", "launch_status", "editorial_notes", "launch_ready", "launch_checklist",
  "document_urls", "gg_standard_status", "farm_photo_urls", "produce_photo_urls", "source_application_id"
].join(",");

const supplierColumns = [
  "id", "slug", "company_name", "contact_person", "region", "district", "category", "products_services",
  "service_coverage_area", "whatsapp_number", "phone", "website", "verification_status", "logo_url", "status",
  "created_at", "updated_at", "is_featured", "featured_until", "featured_note", "launch_ready", "launch_status",
  "source_application_id", "verification_date", "verified_by", "verification_notes", "gg_standard_status",
  "profile_review_status", "profile_image_url", "source", "editorial_notes", "launch_checklist"
].join(",");

const farmerEditableFields = new Set([
  "slug", "farmer_name", "farm_name", "region", "district", "farm_type", "products", "farm_size", "whatsapp_number",
  "profile_image_url", "description", "verification_notes", "phone_number", "email", "farm_location", "farming_experience",
  "currently_harvesting", "supply_frequency", "delivery_preference", "payment_preference", "featured_until", "featured_note",
  "launch_status", "editorial_notes", "launch_checklist", "gg_standard_status", "farm_photo_urls", "produce_photo_urls"
]);

const supplierEditableFields = new Set([
  "slug", "company_name", "contact_person", "region", "district", "category", "products_services", "service_coverage_area",
  "whatsapp_number", "phone", "website", "logo_url", "profile_image_url", "verification_notes", "featured_until",
  "featured_note", "launch_status", "profile_review_status", "editorial_notes", "launch_checklist", "gg_standard_status"
]);

const arrayFields = new Set(["products", "farm_photo_urls", "produce_photo_urls", "products_services"]);
const nullableTextFields = new Set([
  "slug", "farmer_name", "farm_size", "whatsapp_number", "profile_image_url", "description", "verification_notes", "phone_number",
  "email", "farm_location", "farming_experience", "currently_harvesting", "supply_frequency", "delivery_preference",
  "payment_preference", "featured_until", "featured_note", "editorial_notes", "service_coverage_area", "phone", "website", "logo_url"
]);

export type PrivateMediaItem = {
  path: string;
  group: "profile" | "farm" | "produce" | "logo" | "photos" | "certificates" | "documents";
  label: string;
  promotable: boolean;
};

export type ProfileSourceHistory = {
  applicationId: string;
  status: string;
  createdAt: string;
  privateMedia: PrivateMediaItem[];
  privateContactName?: string;
  privateEmail?: string;
  privateNotes?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function profileFilter(recordKey: string) {
  return `${isUuid(recordKey) ? "id" : "slug"}=eq.${encodeURIComponent(recordKey)}&limit=1`;
}

export async function loadAdminProfile(kind: ProfileEditorKind, recordKey: string): Promise<{ record?: ProfileEditorRecord; status: number; error?: string }> {
  const table = kind === "farmer" ? "farmers" : "suppliers";
  const columns = kind === "farmer" ? farmerColumns : supplierColumns;
  const result = await selectSupabaseRecords<ProfileEditorRecord>(table, `select=${columns}&${profileFilter(recordKey)}`);
  const record = result.data?.[0];

  if (result.error) return { status: result.status, error: result.error };
  if (!record) return { status: 404, error: `${kind === "farmer" ? "Farmer" : "Supplier"} profile was not found.` };
  return { status: 200, record: normalizeRecordArrays(record) };
}

function mediaItems(kind: ProfileEditorKind, application: FarmerApplicationAdminRow | SupplierApplicationAdminRow): PrivateMediaItem[] {
  if (kind === "farmer") {
    const farmer = application as FarmerApplicationAdminRow;
    return [
      ...(farmer.private_profile_image_path ? [{ path: farmer.private_profile_image_path, group: "profile" as const, label: "Application profile image", promotable: true }] : []),
      ...(farmer.private_farm_image_paths ?? []).map((path, index) => ({ path, group: "farm" as const, label: `Farm image ${index + 1}`, promotable: true })),
      ...(farmer.private_produce_image_paths ?? []).map((path, index) => ({ path, group: "produce" as const, label: `Produce image ${index + 1}`, promotable: true })),
      ...(farmer.private_document_paths ?? []).map((path, index) => ({ path, group: "documents" as const, label: `Private document ${index + 1}`, promotable: false }))
    ];
  }

  const supplier = application as SupplierApplicationAdminRow;
  return [
    ...(supplier.private_logo_path ? [{ path: supplier.private_logo_path, group: "logo" as const, label: "Application logo", promotable: true }] : []),
    ...(supplier.private_photo_paths ?? []).map((path, index) => ({ path, group: "photos" as const, label: `Business image ${index + 1}`, promotable: true })),
    ...(supplier.private_certificate_paths ?? []).map((path, index) => ({ path, group: "certificates" as const, label: `Private certificate ${index + 1}`, promotable: false })),
    ...(supplier.private_document_paths ?? []).map((path, index) => ({ path, group: "documents" as const, label: `Private document ${index + 1}`, promotable: false }))
  ];
}

async function loadSourceHistory(kind: ProfileEditorKind, record: ProfileEditorRecord): Promise<ProfileSourceHistory | null> {
  if (!record.source_application_id) return null;
  const result = await loadProfileApplicationForAdmin(kind, record.source_application_id);
  const application = result.data?.[0];
  if (!application) return null;

  return {
    applicationId: application.id,
    status: application.status,
    createdAt: application.created_at,
    privateMedia: mediaItems(kind, application),
    privateContactName: kind === "farmer"
      ? (application as FarmerApplicationAdminRow).applicant_name
      : (application as SupplierApplicationAdminRow).contact_person ?? (application as SupplierApplicationAdminRow).name ?? undefined,
    privateEmail: application.email ?? undefined,
    privateNotes: application.admin_notes ?? undefined
  };
}

function publicPreview(kind: ProfileEditorKind, record: ProfileEditorRecord) {
  return kind === "farmer"
    ? mapFarmerPublicProfile(record as FarmerProfileRecord & SupabaseFarmer)
    : mapSupplierPublicProfile(record as SupplierProfileRecord & SupabaseSupplier);
}

export async function evaluateProfileReadiness(
  kind: ProfileEditorKind,
  record: ProfileEditorRecord
): Promise<PublicationCheck[]> {
  const checks = publicationChecks(kind, record);
  const slugCheck = checks.find((check) => check.key === "slug");
  if (!slugCheck?.complete || !record.slug) return checks;

  const table = kind === "farmer" ? "farmers" : "suppliers";
  const duplicate = await selectSupabaseRecords<{ id: string }>(
    table,
    `select=id&slug=eq.${encodeURIComponent(record.slug)}&id=neq.${encodeURIComponent(record.id)}&limit=1`
  );
  if (duplicate.error) {
    return checks.map((check) => check.key === "slug"
      ? { ...check, state: "needs-review", complete: false, label: "Unique public URL slug could not be confirmed" }
      : check);
  }
  if (duplicate.data?.length) {
    return checks.map((check) => check.key === "slug"
      ? { ...check, state: "needs-review", complete: false, label: "Public URL slug is already in use" }
      : check);
  }
  return checks;
}

export async function profileEditorPayload(kind: ProfileEditorKind, recordKey: string) {
  const loaded = await loadAdminProfile(kind, recordKey);
  if (!loaded.record) return loaded;
  const record = loaded.record;
  const checks = await evaluateProfileReadiness(kind, record);
  const eligible = kind === "farmer"
    ? farmerProfileReadiness(record as FarmerProfileRecord, checks).publiclyEligible
    : profileIsPubliclyEligible(kind, record);

  return {
    status: 200,
    data: {
      kind,
      record,
      sourceHistory: await loadSourceHistory(kind, record),
      preview: publicPreview(kind, record),
      eligibility: {
        eligible,
        checks,
        hiddenReasons: checks.filter((check) => !check.complete).map((check) => check.label),
        featuredPublic: featuredIsCurrentlyPublic(kind, record)
      },
      categoryReview: kind === "supplier" ? supplierCategoryReview((record as SupplierProfileRecord).category) : null
    }
  };
}

function cleanChecklist(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"));
}

function validateChanges(kind: ProfileEditorKind, changes: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  if ("verified_by" in changes || "verification_date" in changes) {
    errors.verification = "Verification identity and date are set only by the protected Verify action.";
  }
  if ("slug" in changes && changes.slug && (typeof changes.slug !== "string" || !isValidPublicProfileSlug(changes.slug))) {
    errors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  }
  if ("farm_type" in changes && !["Crop", "Livestock", "Mixed"].includes(String(changes.farm_type))) {
    errors.farm_type = "Choose Crop, Livestock, or Mixed.";
  }
  if (kind === "supplier" && "category" in changes && !String(changes.category ?? "").trim()) {
    errors.category = "Supplier category cannot be blank.";
  }
  if ("featured_until" in changes && changes.featured_until && !/^\d{4}-\d{2}-\d{2}$/.test(String(changes.featured_until))) {
    errors.featured_until = "Use a valid date.";
  }
  for (const field of ["profile_image_url", "logo_url"] as const) {
    if (field in changes && changes[field] && !isSafePublicProfileImage(String(changes[field]))) {
      errors[field] = "Use an approved public image URL. Private application media must be promoted through the review action.";
    }
  }
  for (const field of ["farm_photo_urls", "produce_photo_urls"] as const) {
    if (field in changes && uniqueTextValues(changes[field]).some((value) => !isSafePublicProfileImage(value))) {
      errors[field] = "Gallery items must use approved public image URLs.";
    }
  }
  return errors;
}

function sanitizedChanges(kind: ProfileEditorKind, changes: Record<string, unknown>) {
  const allowed = kind === "farmer" ? farmerEditableFields : supplierEditableFields;
  const output: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(changes)) {
    if (!allowed.has(field)) continue;
    if (arrayFields.has(field)) {
      output[field] = uniqueTextValues(value);
    } else if (field === "launch_checklist") {
      const checklist = cleanChecklist(value);
      if (checklist) output[field] = checklist;
    } else if (kind === "supplier" && field === "category" && typeof value === "string") {
      const review = supplierCategoryReview(value.trim());
      output[field] = review.requiresReview ? value.trim() : review.normalized;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      output[field] = nullableTextFields.has(field) && !trimmed ? null : trimmed;
    }
  }
  return output;
}

export async function saveAdminProfile({
  kind,
  recordKey,
  changes,
  adminEmail
}: {
  kind: ProfileEditorKind;
  recordKey: string;
  changes: Record<string, unknown>;
  adminEmail: string;
}) {
  const errors = validateChanges(kind, changes);
  if (Object.keys(errors).length) return { status: 400, errors, error: "Correct the highlighted fields before saving." };
  const patch = sanitizedChanges(kind, changes);
  if (!Object.keys(patch).length) return profileEditorPayload(kind, recordKey);

  const loaded = await loadAdminProfile(kind, recordKey);
  if (!loaded.record) return loaded;
  const table = kind === "farmer" ? "farmers" : "suppliers";
  const update = await updateSupabaseRecord(table, `id=eq.${encodeURIComponent(loaded.record.id)}`, patch);
  if (update.error) return { status: update.status, error: "Profile changes could not be saved." };

  await logAdminActivity({
    adminEmail,
    actionType: "Edit",
    entityType: kind === "farmer" ? "Farmer" : "Supplier",
    entityId: loaded.record.id,
    entityName: kind === "farmer" ? (loaded.record as FarmerProfileRecord).farm_name : (loaded.record as SupplierProfileRecord).company_name
  });
  return profileEditorPayload(kind, loaded.record.id);
}

function transitionPatch(kind: ProfileEditorKind, transition: ProfileTransition, adminEmail: string) {
  switch (transition) {
    case "under-review":
      return kind === "supplier"
        ? { verification_status: "Under Review", profile_review_status: "In Review", status: "Pending" }
        : { verification_status: "Under Review", status: "Pending Review" };
    case "verify":
      return { verification_status: "Verified", verification_date: new Date().toISOString(), verified_by: adminEmail };
    case "launch-ready":
      return { launch_ready: true };
    case "activate":
      return { status: "Active" };
    case "pause":
      return { status: "Archived" };
    case "feature":
      return { is_featured: true };
    case "unfeature":
      return { is_featured: false };
  }
}

function transitionAction(transition: ProfileTransition): AdminActionType {
  if (transition === "verify") return "Verify";
  if (transition === "activate") return "Publish";
  if (transition === "pause") return "Archive";
  if (transition === "feature") return "Marked Featured";
  if (transition === "unfeature") return "Removed Featured";
  return "Review";
}

export async function transitionAdminProfile({
  kind,
  recordKey,
  transition,
  adminEmail
}: {
  kind: ProfileEditorKind;
  recordKey: string;
  transition: ProfileTransition;
  adminEmail: string;
}) {
  const loaded = await loadAdminProfile(kind, recordKey);
  if (!loaded.record) return loaded;
  const record = loaded.record;
  const checks = await evaluateProfileReadiness(kind, record);

  if (transition === "verify" && record.verification_status === "Verified") {
    return profileEditorPayload(kind, record.id);
  }

  if (transition === "activate") {
    const missing = checks.filter((check) => check.required && !check.complete && check.key !== "status");
    if (missing.length) return { status: 409, error: "This profile is not ready to publish.", checks };
  }
  if (transition === "launch-ready") {
    const missing = checks.filter((check) => !check.complete && !["status", "verified", "launch-ready"].includes(check.key));
    if (missing.length) {
      return {
        status: 409,
        error: `Complete the public profile before marking it Launch Ready. Still needed: ${missing.map((check) => check.label).join(", ")}.`,
        checks
      };
    }
  }
  if (transition === "feature" && kind === "farmer") {
    const readiness = farmerProfileReadiness(record as FarmerProfileRecord, checks);
    if (!readiness.publiclyEligible) {
      return { status: 409, error: "This farmer must be fully eligible for the public directory before featuring.", checks };
    }
    if (!readiness.canFeature) {
      return { status: 409, error: "Set a current Featured until date before featuring this farmer.", checks };
    }
  }

  const patch = transitionPatch(kind, transition, adminEmail);
  const unchanged = Object.entries(patch).every(([key, value]) => record[key as keyof ProfileEditorRecord] === value);
  if (!unchanged) {
    const table = kind === "farmer" ? "farmers" : "suppliers";
    const update = await updateSupabaseRecord(table, `id=eq.${encodeURIComponent(record.id)}`, patch);
    if (update.error) return { status: update.status, error: "Profile status could not be updated." };
    await logAdminActivity({
      adminEmail,
      actionType: transitionAction(transition),
      entityType: kind === "farmer" ? "Farmer" : "Supplier",
      entityId: record.id,
      entityName: kind === "farmer" ? (record as FarmerProfileRecord).farm_name : (record as SupplierProfileRecord).company_name
    });
  }
  return profileEditorPayload(kind, record.id);
}
