import { ghanaRegions } from "../data/ghanaRegions";
import { supplierCategories } from "../data/supplierCategories";

export const PROFILE_APPLICATION_MEDIA = {
  farmer: {
    bucket: "farmer-application-media",
    publicBucket: "farmers"
  },
  supplier: {
    bucket: "supplier-application-media",
    publicBucket: "suppliers"
  }
} as const;

export const APPLICATION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const APPLICATION_DOCUMENT_TYPES = [...APPLICATION_IMAGE_TYPES, "application/pdf"] as const;
export const APPLICATION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const APPLICATION_DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;

export type ProfileApplicationKind = keyof typeof PROFILE_APPLICATION_MEDIA;
export type ApplicationMediaKind = "image" | "document";

const supplierCategoryAliases: Record<string, (typeof supplierCategories)[number]> = {
  fertilizer: "Fertilizers",
  machinery: "Farm Equipment",
  irrigation: "Irrigation Systems",
  "logistics & transport": "Logistics",
  "storage & cold chain": "Storage",
  finance: "Financial Services",
  insurance: "Financial Services",
  "agricultural services": "Agricultural Consulting"
};

function normalizeFromVocabulary(values: string[], vocabulary: readonly string[], aliases: Record<string, string> = {}) {
  const vocabularyByKey = new Map(vocabulary.map((value) => [value.toLowerCase(), value]));

  return Array.from(new Set(values.flatMap((value) => {
    const key = value.trim().toLowerCase();
    const normalized = vocabularyByKey.get(key) ?? aliases[key];
    return normalized ? [normalized] : [];
  })));
}

export function normalizeSupplierCategories(values: string[]) {
  return normalizeFromVocabulary(values, supplierCategories, supplierCategoryAliases);
}

export function unsupportedSupplierCategories(values: string[]) {
  return values.filter((value) => normalizeSupplierCategories([value]).length === 0);
}

export function normalizeServiceAreas(values: string[]) {
  return normalizeFromVocabulary(values, ghanaRegions);
}

export function unsupportedServiceAreas(values: string[]) {
  return values.filter((value) => normalizeServiceAreas([value]).length === 0);
}

export function validateApplicationMedia({
  contentType,
  size,
  kind
}: {
  contentType: string;
  size: number;
  kind: ApplicationMediaKind;
}) {
  const allowedTypes = kind === "image" ? APPLICATION_IMAGE_TYPES : APPLICATION_DOCUMENT_TYPES;
  const maxBytes = kind === "image" ? APPLICATION_IMAGE_MAX_BYTES : APPLICATION_DOCUMENT_MAX_BYTES;

  if (!(allowedTypes as readonly string[]).includes(contentType)) {
    return { ok: false as const, code: "unsupported_type" as const };
  }

  if (!Number.isSafeInteger(size) || size <= 0 || size > maxBytes) {
    return { ok: false as const, code: "invalid_size" as const };
  }

  return { ok: true as const };
}

export function applicationMediaExtension(contentType: string) {
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export function privateApplicationMediaPath({
  applicationId,
  group,
  objectId,
  contentType
}: {
  applicationId: string;
  group: "profile" | "farm" | "produce" | "logo" | "photos" | "certificates" | "documents";
  objectId: string;
  contentType: string;
}) {
  return `${applicationId}/${group}/${objectId}.${applicationMediaExtension(contentType)}`;
}

export type FarmerApplicationForConversion = {
  id: string;
  applicant_name: string;
  farm_name?: string | null;
  phone_number: string;
  whatsapp_number?: string | null;
  email?: string | null;
  region: string;
  district: string;
  location?: string | null;
  farm_type: "Crop" | "Livestock" | "Mixed";
  crops_products?: string[] | null;
  farm_size?: string | null;
  farming_experience?: string | null;
  current_availability?: string | null;
  supply_frequency?: string | null;
  delivery_preference?: string | null;
};

export type SupplierApplicationForConversion = {
  id: string;
  business_name?: string | null;
  business_or_farm_name?: string | null;
  name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  region?: string | null;
  district?: string | null;
  categories?: string[] | null;
  normalized_categories?: string[] | null;
  regions_served?: string[] | null;
  products_or_services?: string | null;
  website_url?: string | null;
};

export function splitProductsAndServices(value?: string | null) {
  return Array.from(new Set((value ?? "")
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)))
    .slice(0, 40);
}

export function buildFarmerProfileDraft(application: FarmerApplicationForConversion) {
  const farmName = application.farm_name?.trim() || application.applicant_name.trim();

  return {
    slug: null,
    farmer_name: application.applicant_name.trim(),
    farm_name: farmName,
    region: application.region.trim(),
    district: application.district.trim(),
    farm_type: application.farm_type,
    products: application.crops_products ?? [],
    farm_size: application.farm_size?.trim() || null,
    whatsapp_number: application.whatsapp_number?.trim() || null,
    phone_number: application.phone_number.trim(),
    email: application.email?.trim() || null,
    farm_location: application.location?.trim() || null,
    farming_experience: application.farming_experience?.trim() || null,
    currently_harvesting: application.current_availability?.trim() || null,
    supply_frequency: application.supply_frequency?.trim() || null,
    delivery_preference: application.delivery_preference?.trim() || null,
    verification_status: "Pending Verification",
    profile_image_url: null,
    description: null,
    status: "Pending",
    source: "farmer_application",
    source_application_id: application.id,
    is_featured: false,
    launch_status: "Needs Improvement",
    homepage_candidate: false,
    marketplace_featured: false,
    story_candidate: false,
    launch_ready: false,
    document_urls: [],
    farm_photo_urls: [],
    produce_photo_urls: []
  };
}

export function buildSupplierProfileDraft(application: SupplierApplicationForConversion) {
  const companyName = application.business_name?.trim() || application.business_or_farm_name?.trim() || "";
  const contactPerson = application.contact_person?.trim() || application.name?.trim() || "";
  const region = application.region?.trim() || application.regions_served?.[0]?.trim() || "";
  const district = application.district?.trim() || "";
  const categories = normalizeSupplierCategories([
    ...(application.normalized_categories ?? []),
    ...(application.categories ?? [])
  ]);

  if (!companyName || !contactPerson || !region || !district || categories.length === 0) {
    return { ok: false as const, error: "Application needs complete company, contact, location, and category details before conversion." };
  }

  return {
    ok: true as const,
    data: {
      slug: null,
      company_name: companyName,
      contact_person: contactPerson,
      region,
      district,
      category: categories[0],
      products_services: splitProductsAndServices(application.products_or_services),
      service_coverage_area: normalizeServiceAreas(application.regions_served ?? []).join(", ") || null,
      whatsapp_number: application.whatsapp_number?.trim() || null,
      phone: application.phone?.trim() || null,
      website: application.website_url?.trim() || null,
      verification_status: "Pending Verification",
      logo_url: null,
      profile_image_url: null,
      status: "Pending",
      source: "supplier_application",
      source_application_id: application.id,
      is_featured: false,
      launch_ready: false,
      launch_status: "Needs Improvement",
      profile_review_status: "Needs Review",
      gg_standard_status: "Pending",
      homepage_candidate: false,
      marketplace_featured: false,
      story_candidate: false
    }
  };
}
