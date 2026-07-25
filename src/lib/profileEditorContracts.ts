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
  complete: boolean;
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

export function farmerPublicationChecks(record: FarmerProfileRecord): PublicationCheck[] {
  return [
    { key: "farm-name", label: "Public farm name", complete: hasText(record.farm_name) },
    { key: "slug", label: "Valid public URL slug", complete: isValidPublicProfileSlug(record.slug) },
    { key: "location", label: "Region and public location", complete: hasText(record.region) && (hasText(record.district) || hasText(record.farm_location)) },
    { key: "farm-type", label: "Farm type", complete: farmerFarmTypes.includes(record.farm_type as (typeof farmerFarmTypes)[number]) },
    { key: "products", label: "At least one crop or product", complete: uniqueTextValues(record.products).length > 0 },
    { key: "description", label: "Public description", complete: hasText(record.description) },
    { key: "image", label: "Approved main image or approved no-photo state", complete: hasApprovedPhoto(record.profile_image_url, record.launch_checklist) },
    { key: "verified", label: "Verification status is Verified", complete: record.verification_status === "Verified" },
    { key: "launch-ready", label: "Launch Ready is marked", complete: record.launch_ready === true },
    { key: "non-demo", label: "Record is not demo or placeholder data", complete: !isDemoProfileOrigin(record.source) }
  ];
}

export function supplierPublicationChecks(record: SupplierProfileRecord): PublicationCheck[] {
  return [
    { key: "company-name", label: "Public company name", complete: hasText(record.company_name) },
    { key: "slug", label: "Valid public URL slug", complete: isValidPublicProfileSlug(record.slug) },
    { key: "category", label: "Approved supplier category", complete: normalizeSupplierCategories([record.category]).length > 0 },
    { key: "products", label: "At least one product or service", complete: uniqueTextValues(record.products_services).length > 0 },
    { key: "service-area", label: "Service coverage area", complete: hasText(record.service_coverage_area) },
    { key: "description", label: "Enough public details to generate a business description", complete: hasText(record.region) && hasText(record.district) },
    { key: "image", label: "Approved public image or approved no-photo state", complete: hasApprovedPhoto(record.profile_image_url || record.logo_url, record.launch_checklist) },
    { key: "verified", label: "Verification status is Verified", complete: record.verification_status === "Verified" },
    { key: "non-demo", label: "Record is not demo or placeholder data", complete: !isDemoProfileOrigin(record.source) }
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
