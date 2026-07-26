import { supplierCategories } from "../data/supplierCategories";
import { normalizeSupplierCategories, unsupportedSupplierCategories } from "./profileApplicationContracts";
import { isDemoProfileOrigin, isValidPublicProfileSlug } from "./publicProfileEligibility";

export type ProfileEditorKind = "farmer" | "supplier";
export type ProfileTransition = "under-review" | "verify" | "launch-ready" | "activate" | "pause" | "feature" | "unfeature";

export const farmerFarmTypes = ["Crop", "Livestock", "Mixed"] as const;
export const farmerVerificationStatuses = ["Pending Verification", "Under Review", "Verified", "Rejected", "Needs Follow-up"] as const;
export const profileStatuses = ["Pending", "Pending Review", "Active", "Archived"] as const;
export const launchStatuses = ["Public Farmer", "Featured Farmer", "Founding Farmer 2026", "Needs Improvement", "Hold"] as const;
export const supplierLaunchStatuses = ["Public Supplier", "Featured Supplier", "Founding Supplier 2026", "Needs Improvement", "Hold"] as const;
export const supplierReviewStatuses = ["Needs Review", "In Review", "Ready", "Hold"] as const;
export const ggStandardStatuses = ["Pending", "Member", "Suspended"] as const;
export const approvedSupplierCategories = supplierCategories;

export type FarmerProfileRecord = {
  id: string;
  slug: string | null;
  farmer_name: string | null;
  farm_name: string;
  region: string;
  district: string;
  farm_type: string;
  products: string[];
  farm_size: string | null;
  whatsapp_number: string | null;
  profile_image_url: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  verification_date: string | null;
  verification_status: string;
  verified_by: string | null;
  verification_notes: string | null;
  source: string | null;
  phone_number: string | null;
  email: string | null;
  farm_location: string | null;
  farming_experience: string | null;
  currently_harvesting: string | null;
  supply_frequency: string | null;
  delivery_preference: string | null;
  payment_preference: string | null;
  is_featured: boolean;
  featured_until: string | null;
  featured_note: string | null;
  launch_status: string;
  editorial_notes: string | null;
  launch_ready: boolean;
  launch_checklist: Record<string, boolean>;
  document_urls: string[];
  gg_standard_status: string | null;
  farm_photo_urls: string[];
  produce_photo_urls: string[];
  source_application_id: string | null;
};

export type SupplierProfileRecord = {
  id: string;
  slug: string | null;
  company_name: string;
  contact_person: string;
  region: string;
  district: string;
  category: string;
  products_services: string[];
  service_coverage_area: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  website: string | null;
  verification_status: string;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  featured_until: string | null;
  featured_note: string | null;
  launch_ready: boolean;
  launch_status: string;
  source_application_id: string | null;
  verification_date: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  gg_standard_status: string;
  profile_review_status: string;
  profile_image_url: string | null;
  source: string | null;
  editorial_notes: string | null;
  launch_checklist: Record<string, boolean>;
};

export type ProfileEditorRecord = FarmerProfileRecord | SupplierProfileRecord;

export type PublicationCheck = {
  key: string;
  label: string;
  state: "passed" | "missing" | "needs-review";
  required: boolean;
  complete: boolean;
};

export type FarmerReadinessRecommendation = "complete-public-profile" | "review-public-preview" | "public-profile-ready";

export type FarmerProfileReadiness = {
  checks: PublicationCheck[];
  complete: number;
  total: number;
  missing: PublicationCheck[];
  recommendation: FarmerReadinessRecommendation;
  publiclyEligible: boolean;
  canMarkLaunchReady: boolean;
  canFeature: boolean;
};

export function uniqueTextValues(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,;]+/) : [];
  return Array.from(new Set(values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)));
}

export function normalizeRecordArrays<T extends ProfileEditorRecord>(record: T): T {
  if ("farm_name" in record) {
    return {
      ...record,
      products: uniqueTextValues(record.products),
      farm_photo_urls: uniqueTextValues(record.farm_photo_urls),
      produce_photo_urls: uniqueTextValues(record.produce_photo_urls),
      document_urls: uniqueTextValues(record.document_urls),
      launch_checklist: record.launch_checklist && typeof record.launch_checklist === "object" ? record.launch_checklist : {}
    } as T;
  }
  return {
    ...record,
    products_services: uniqueTextValues(record.products_services),
    launch_checklist: record.launch_checklist && typeof record.launch_checklist === "object" ? record.launch_checklist : {}
  } as T;
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

export function isSafePublicProfileImage(value?: string | null) {
  const image = value?.trim();
  if (!image || /(?:farmer|supplier)-application-media/i.test(image) || /\/private\//i.test(image)) return false;
  if (image.startsWith("/")) return true;
  try {
    const url = new URL(image);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function hasApprovedPhoto(profileImage: string | null, checklist: Record<string, boolean>) {
  return isSafePublicProfileImage(profileImage) || checklist.approvedNoPhoto === true;
}

function check(
  key: string,
  label: string,
  state: PublicationCheck["state"],
  required = true
): PublicationCheck {
  return { key, label, state, required, complete: state === "passed" };
}

function textState(value?: string | null): PublicationCheck["state"] {
  return hasText(value) ? "passed" : "missing";
}

function imageState(profileImage: string | null, checklist: Record<string, boolean>): PublicationCheck["state"] {
  if (hasApprovedPhoto(profileImage, checklist)) return "passed";
  return hasText(profileImage) ? "needs-review" : "missing";
}

export function farmerPublicationChecks(
  record: FarmerProfileRecord,
  options: { slugUnique?: boolean | null } = {}
): PublicationCheck[] {
  const locationState = !hasText(record.region) && !hasText(record.district) && !hasText(record.farm_location)
    ? "missing"
    : hasText(record.region) && (hasText(record.district) || hasText(record.farm_location))
      ? "passed"
      : "needs-review";
  const slugState = !hasText(record.slug)
    ? "missing"
    : !isValidPublicProfileSlug(record.slug)
      ? "needs-review"
      : options.slugUnique === false || options.slugUnique === null
        ? "needs-review"
        : "passed";
  const slugLabel = options.slugUnique === false
    ? "Public URL slug is already in use"
    : options.slugUnique === null
      ? "Unique public URL slug could not be confirmed"
      : "Valid unique public URL slug";

  return [
    check("status", "Account/Profile Status is Active", record.status === "Active" ? "passed" : "needs-review"),
    check("farm-name", "Public farm name", textState(record.farm_name)),
    check("slug", slugLabel, slugState),
    check("location", "Region and public location", locationState),
    check("farm-type", "Farm type", !hasText(record.farm_type) ? "missing" : farmerFarmTypes.includes(record.farm_type as (typeof farmerFarmTypes)[number]) ? "passed" : "needs-review"),
    check("products", "At least one crop or product", uniqueTextValues(record.products).length > 0 ? "passed" : "missing"),
    check("description", "Public description", textState(record.description)),
    check("image", "Approved main image or explicitly approved no-photo state", imageState(record.profile_image_url, record.launch_checklist)),
    check("verified", "Verification status is Verified", record.verification_status === "Verified" ? "passed" : "needs-review"),
    check("launch-ready", "Launch Ready approval", record.launch_ready === true ? "passed" : "needs-review"),
    check("non-demo", "Record is not demo or placeholder data", !isDemoProfileOrigin(record.source) ? "passed" : "needs-review")
  ];
}

export function farmerProfileReadiness(
  record: FarmerProfileRecord,
  checks = farmerPublicationChecks(record)
): FarmerProfileReadiness {
  const missing = checks.filter((item) => !item.complete);
  const publiclyEligible = profileIsPubliclyEligible("farmer", record) && missing.length === 0;
  const missingBeforeLaunchApproval = missing.filter((item) => item.key !== "launch-ready");
  const launchReadinessPrerequisites = missing.filter((item) => !["status", "verified", "launch-ready"].includes(item.key));
  const canMarkLaunchReady = record.launch_ready !== true && launchReadinessPrerequisites.length === 0;
  const featuredExpiry = record.featured_until?.trim();
  const hasCurrentFeaturedExpiry = Boolean(
    featuredExpiry && /^\d{4}-\d{2}-\d{2}$/.test(featuredExpiry) && new Date(`${featuredExpiry}T23:59:59`).getTime() >= Date.now()
  );
  const recommendation: FarmerReadinessRecommendation = publiclyEligible
    ? "public-profile-ready"
    : missingBeforeLaunchApproval.length === 0 && missing.some((item) => item.key === "launch-ready")
      ? "review-public-preview"
      : "complete-public-profile";

  return {
    checks,
    complete: checks.length - missing.length,
    total: checks.length,
    missing,
    recommendation,
    publiclyEligible,
    canMarkLaunchReady,
    canFeature: publiclyEligible && hasCurrentFeaturedExpiry
  };
}

export function supplierPublicationChecks(record: SupplierProfileRecord): PublicationCheck[] {
  const normalizedCategories = normalizeSupplierCategories([record.category]);
  const categoryState = !hasText(record.category)
    ? "missing"
    : unsupportedSupplierCategories([record.category]).length > 0 || normalizedCategories.length === 0
      ? "needs-review"
      : "passed";
  const serviceAreaState = hasText(record.service_coverage_area) || hasText(record.region) || hasText(record.district)
    ? "passed"
    : "missing";
  const descriptionState = !hasText(record.region) && !hasText(record.district)
    ? "missing"
    : hasText(record.region) && hasText(record.district)
      ? "passed"
      : "needs-review";
  return [
    check("company-name", "Public company name", textState(record.company_name)),
    check("slug", "Valid unique public URL slug", !hasText(record.slug) ? "missing" : isValidPublicProfileSlug(record.slug) ? "passed" : "needs-review"),
    check("category", "Approved supplier category", categoryState),
    check("products", "At least one product or service", uniqueTextValues(record.products_services).length > 0 ? "passed" : "missing"),
    check("service-area", "Service coverage or public location", serviceAreaState),
    check("description", "Public business description", descriptionState),
    check("image", "Approved public image or explicitly approved no-photo state", imageState(record.profile_image_url || record.logo_url, record.launch_checklist)),
    check("verified", "Verification status is Verified", record.verification_status === "Verified" ? "passed" : "needs-review"),
    check("launch-ready", "Launch readiness is marked", record.launch_ready === true ? "passed" : "needs-review"),
    check("non-demo", "Record is not demo or placeholder data", !isDemoProfileOrigin(record.source) ? "passed" : "needs-review")
  ];
}

export function publicationChecks(kind: ProfileEditorKind, record: ProfileEditorRecord) {
  return kind === "farmer" ? farmerPublicationChecks(record as FarmerProfileRecord) : supplierPublicationChecks(record as SupplierProfileRecord);
}

export function supplierCategoryReview(value: string) {
  const normalized = normalizeSupplierCategories([value]);
  return { normalized: normalized[0] ?? value, requiresReview: unsupportedSupplierCategories([value]).length > 0 };
}

export function profileIsPubliclyEligible(kind: ProfileEditorKind, record: ProfileEditorRecord) {
  if (kind === "farmer") {
    const farmer = record as FarmerProfileRecord;
    return farmer.status === "Active" && farmer.verification_status === "Verified" && farmer.launch_ready === true && isValidPublicProfileSlug(farmer.slug) && !isDemoProfileOrigin(farmer.source);
  }
  const supplier = record as SupplierProfileRecord;
  return supplier.status === "Active" && supplier.verification_status === "Verified" && isValidPublicProfileSlug(supplier.slug) && !isDemoProfileOrigin(supplier.source);
}

export function featuredIsCurrentlyPublic(kind: ProfileEditorKind, record: ProfileEditorRecord, now = new Date()) {
  const until = record.featured_until;
  const current = !until || new Date(`${until}T23:59:59`).getTime() >= now.getTime();
  return profileIsPubliclyEligible(kind, record) && record.is_featured === true && current;
}
