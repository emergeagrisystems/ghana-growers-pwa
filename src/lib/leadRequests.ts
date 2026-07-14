import { createHmac } from "node:crypto";
import { logAdminActivity } from "@/lib/adminActivity";
import { cleanFarmerLocation, farmerProducts, isPublicFarmerProfile } from "@/lib/farmerDirectory";
import {
  formatMarketplaceLocation,
  isDemoMarketplaceListing,
  isMarketplaceListingPublicStatus,
  marketplaceAvailability,
  titleCaseMarketplaceValue
} from "@/lib/marketplace/publicListings";
import { marketplacePriceLine, marketplaceQuantityLabel, marketplaceQuantityLine, usesCustomMarketplaceUnit } from "@/lib/marketplace/trade";
import { cleanSupplierLocation, isPublicSupplierProfile, supplierProducts } from "@/lib/supplierDirectory";
import { callSupabaseRpc, insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";
import type { FarmerProfile, Product, SupplierProfile } from "@/types";

export type LeadRequestStatus = "New" | "Contacted" | "Negotiating" | "Completed" | "Lost";
export type LeadRequestSourceType = "Farmer" | "Supplier" | "Marketplace Listing" | "Supplier Listing" | "Buyer Request";
export type LeadRequestSource = "marketplace_listing" | "farmer_profile" | "supplier_profile" | "generic_sourcing" | "legacy";

export type LeadRequestSnapshot = {
  product?: string;
  seller?: string;
  location?: string;
  pricePackage?: string;
  listedQuantity?: string;
  quantityLabel?: string;
  availability?: string;
  category?: string;
  source?: string;
  marketplaceListingId?: string;
};

export type LeadRequestRecord = {
  id: string;
  created_at: string;
  requester_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  product_interest: string;
  quantity_needed: string | null;
  message: string | null;
  source_type: LeadRequestSourceType;
  source_id: string;
  source_name: string;
  source_page: string | null;
  status: LeadRequestStatus;
  request_source?: LeadRequestSource | null;
  marketplace_listing_id?: string | null;
  farmer_profile_id?: string | null;
  supplier_profile_id?: string | null;
  source_slug?: string | null;
  company_name?: string | null;
  whatsapp_same_as_phone?: boolean | null;
  delivery_location?: string | null;
  required_by?: string | null;
  listing_snapshot?: LeadRequestSnapshot | null;
};

type LeadRequestInsertPayload = {
  requester_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  product_interest: string;
  quantity_needed: string | null;
  message: string | null;
  source_type: LeadRequestSourceType;
  source_id: string;
  source_name: string;
  source_page: string | null;
  status: LeadRequestStatus;
  request_source: LeadRequestSource;
  marketplace_listing_id?: string | null;
  farmer_profile_id?: string | null;
  supplier_profile_id?: string | null;
  source_slug?: string | null;
  company_name?: string | null;
  whatsapp_same_as_phone: boolean;
  delivery_location: string;
  required_by?: string | null;
  listing_snapshot?: LeadRequestSnapshot | null;
  request_dedupe_key: string;
};

type MarketplaceListingRow = {
  id: string;
  slug: string | null;
  product_name: string;
  category: string;
  region: string;
  district: string;
  seller_name: string;
  seller_type: string | null;
  owner_type: "Farmer" | "Supplier" | "Admin" | string | null;
  owner_id: string | null;
  owner_name: string | null;
  farmer_id?: string | null;
  supplier_id?: string | null;
  quantity: string;
  unit: string;
  availability: string;
  price_range: string | null;
  selling_method?: Product["sellingMethod"] | null;
  selling_unit?: string | null;
  custom_unit_label?: string | null;
  custom_unit_reviewed?: boolean | null;
  unit_size_value?: Product["unitSizeValue"] | null;
  unit_size_measure?: string | null;
  unit_size_approximate?: boolean | null;
  price_amount?: Product["priceAmount"] | null;
  price_currency?: string | null;
  price_basis?: string | null;
  units_available?: Product["unitsAvailable"] | null;
  total_quantity_value?: Product["totalQuantityValue"] | null;
  total_quantity_measure?: string | null;
  minimum_order_value?: Product["minimumOrderValue"] | null;
  minimum_order_unit?: string | null;
  supply_frequency?: string | null;
  available_from_date?: string | null;
  grade_description?: string | null;
  delivery_details?: string | null;
  record_source?: string | null;
  source_submission_id?: string | null;
  image_url?: string | null;
  whatsapp_number?: string | null;
  verification_status?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type FarmerRow = {
  id: string;
  slug: string | null;
  farmer_name: string | null;
  farm_name: string;
  region: string;
  district: string;
  farm_type: FarmerProfile["farmType"] | string;
  products: string[] | null;
  verification_status: string | null;
  status: string | null;
  source: string | null;
};

type SupplierRow = {
  id: string;
  slug: string | null;
  company_name: string;
  contact_person: string | null;
  region: string;
  district: string;
  category: SupplierProfile["supplierCategory"] | string;
  products_services: string[] | null;
  verification_status: string | null;
  status: string | null;
};

type RateLimitResult = {
  allowed?: boolean;
  remaining?: number;
  reset_at?: string;
};

type TrustedSource = {
  request_source: LeadRequestSource;
  source_type: LeadRequestSourceType;
  source_id: string;
  source_name: string;
  source_slug: string | null;
  trustedProductInterest: string;
  marketplace_listing_id?: string | null;
  farmer_profile_id?: string | null;
  supplier_profile_id?: string | null;
  listing_snapshot?: LeadRequestSnapshot | null;
  productOptions?: string[];
};

type TrustedSourceResult = TrustedSource | { error: string };

type VerifiedMarketplaceListing = {
  row: MarketplaceListingRow;
  product: Product;
  snapshot: LeadRequestSnapshot;
  sourceType: "Marketplace Listing" | "Supplier Listing";
  sourceName: string;
  sourceSlug: string | null;
  sellerName: string;
  location: string;
};

type VerifiedMarketplaceListingResult = VerifiedMarketplaceListing | { error: string };

const allowedSourceTypes = new Set<LeadRequestSourceType>(["Farmer", "Supplier", "Marketplace Listing", "Supplier Listing", "Buyer Request"]);
const allowedStatuses = new Set<LeadRequestStatus>(["New", "Contacted", "Negotiating", "Completed", "Lost"]);
const leadRequestWindowSeconds = 10 * 60;
const maxLeadRequestsPerWindow = 5;
const dedupeWindowMinutes = 30;

function clean(value: unknown, limit = 300) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanLong(value: unknown, limit = 1200) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanPhone(value: unknown) {
  return clean(value, 80).replace(/[^\d+]/g, "").slice(0, 24);
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function dateValue(value: unknown) {
  const cleaned = clean(value, 24);

  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : "";
}

function sourceToken(...values: Array<string | null | undefined>) {
  return values.join(" ").toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function leadRequestHmacSecret() {
  const secret = process.env.LEAD_REQUEST_RATE_LIMIT_SECRET?.trim() || "";

  return secret.length >= 32 ? secret : "";
}

function hmacDigest(parts: string[]) {
  const secret = leadRequestHmacSecret();

  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret).update(parts.join("|")).digest("hex");
}

function hashedRequestFingerprint(clientKey: string) {
  return hmacDigest(["lead-request-fingerprint", clientKey || "public"]);
}

export function leadRequestRateLimitKey({
  phone,
  whatsapp,
  clientKey
}: {
  phone: string;
  whatsapp: string;
  clientKey: string;
}) {
  return hmacDigest([
    "lead-request-rate-limit",
    phone || whatsapp || "unknown-contact",
    hashedRequestFingerprint(clientKey)
  ]);
}

export function leadRequestDedupeKey(payload: {
  request_source: LeadRequestSource;
  source_id: string;
  product_interest: string;
  phone: string;
  whatsapp: string;
  delivery_location: string;
  quantity_needed?: string | null;
}) {
  return hmacDigest([
    "lead-request-dedupe",
    payload.request_source,
    sourceToken(payload.source_id),
    sourceToken(payload.product_interest),
    payload.phone || payload.whatsapp || "unknown-contact",
    sourceToken(payload.delivery_location),
    sourceToken(payload.quantity_needed ?? "")
  ]);
}

function retryMinutes(resetAt?: string) {
  const resetTime = resetAt ? new Date(resetAt).getTime() : Number.NaN;

  if (!Number.isFinite(resetTime)) {
    return 10;
  }

  return Math.max(1, Math.ceil((resetTime - Date.now()) / 60000));
}

async function consumeDurableLeadRequestRateLimit(key: string) {
  const result = await callSupabaseRpc<RateLimitResult>("consume_lead_request_rate_limit", {
    p_request_key: key,
    p_window_seconds: leadRequestWindowSeconds,
    p_max_attempts: maxLeadRequestsPerWindow
  });

  if (result.error) {
    return {
      status: result.status,
      error: "Could not accept your request right now. Please try again in a few minutes."
    };
  }

  if (!result.data?.allowed) {
    const minutes = retryMinutes(result.data?.reset_at);

    return {
      status: 429,
      error: `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before sending another request.`
    };
  }

  return { status: result.status };
}

function listingSelectFields() {
  return [
    "id",
    "slug",
    "product_name",
    "category",
    "region",
    "district",
    "seller_name",
    "seller_type",
    "owner_type",
    "owner_id",
    "owner_name",
    "farmer_id",
    "supplier_id",
    "quantity",
    "unit",
    "availability",
    "price_range",
    "selling_method",
    "selling_unit",
    "custom_unit_label",
    "custom_unit_reviewed",
    "unit_size_value",
    "unit_size_measure",
    "unit_size_approximate",
    "price_amount",
    "price_currency",
    "price_basis",
    "units_available",
    "total_quantity_value",
    "total_quantity_measure",
    "minimum_order_value",
    "minimum_order_unit",
    "supply_frequency",
    "available_from_date",
    "grade_description",
    "delivery_details",
    "record_source",
    "source_submission_id",
    "image_url",
    "whatsapp_number",
    "verification_status",
    "status",
    "created_at"
  ].join(",");
}

function productFromListingRow(row: MarketplaceListingRow): Product {
  return {
    id: row.slug ?? row.id,
    name: row.product_name,
    category: row.category,
    location: row.district,
    region: row.region,
    seller: row.owner_name || row.seller_name,
    description: "",
    quantity: row.quantity,
    unit: row.unit,
    priceRange: row.price_range ?? undefined,
    sellingMethod: row.selling_method ?? undefined,
    sellingUnit: row.selling_unit ?? undefined,
    customUnitLabel: row.custom_unit_label ?? undefined,
    customUnitReviewed: Boolean(row.custom_unit_reviewed),
    unitSizeValue: row.unit_size_value ?? undefined,
    unitSizeMeasure: row.unit_size_measure ?? undefined,
    unitSizeApproximate: Boolean(row.unit_size_approximate),
    priceAmount: row.price_amount ?? undefined,
    priceCurrency: row.price_currency ?? undefined,
    priceBasis: row.price_basis ?? undefined,
    unitsAvailable: row.units_available ?? undefined,
    totalQuantityValue: row.total_quantity_value ?? undefined,
    totalQuantityMeasure: row.total_quantity_measure ?? undefined,
    minimumOrderValue: row.minimum_order_value ?? undefined,
    minimumOrderUnit: row.minimum_order_unit ?? undefined,
    supplyFrequency: row.supply_frequency ?? undefined,
    availableFromDate: row.available_from_date ?? undefined,
    gradeDescription: row.grade_description ?? undefined,
    deliveryDetails: row.delivery_details ?? undefined,
    recordSource: row.record_source ?? undefined,
    sourceSubmissionId: row.source_submission_id ?? undefined,
    image: row.image_url ?? "",
    available: row.availability,
    datePosted: row.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    verificationStatus: row.verification_status ?? undefined,
    status: row.status ?? undefined,
    whatsappNumber: row.whatsapp_number ?? undefined,
    ownerType: row.owner_type === "Supplier" || row.owner_type === "Admin" ? row.owner_type : "Farmer",
    ownerId: row.owner_id ?? row.farmer_id ?? row.supplier_id ?? undefined,
    ownerName: row.owner_name ?? row.seller_name
  };
}

async function listingSubmissionStatus(row: MarketplaceListingRow) {
  if (!row.source_submission_id && row.record_source !== "public_submission") {
    return "";
  }

  const query = row.source_submission_id
    ? `select=id,status,published_listing_id&id=eq.${encodeURIComponent(row.source_submission_id)}&limit=1`
    : `select=id,status,published_listing_id&published_listing_id=eq.${encodeURIComponent(row.id)}&limit=1`;
  const result = await selectSupabaseRecords<{ id: string; status: string; published_listing_id: string | null }>("listing_submissions", query);

  return result.data?.[0]?.status ?? "";
}

function profileQuery(value: string, select: string) {
  if (isUuid(value)) {
    return `select=${select}&or=(id.eq.${encodeURIComponent(value)},slug.eq.${encodeURIComponent(value)})&limit=1`;
  }

  return `select=${select}&slug=eq.${encodeURIComponent(value)}&limit=1`;
}

function farmerProfileFromRow(row: FarmerRow): FarmerProfile {
  return {
    id: row.id,
    slug: row.slug ?? slugify(row.farm_name),
    farmName: row.farm_name,
    contactName: row.farmer_name ?? row.farm_name,
    region: row.region,
    district: row.district,
    products: row.products ?? [],
    farmType: row.farm_type === "Livestock" || row.farm_type === "Mixed" ? row.farm_type : "Crop",
    farmSize: "",
    capacityVolume: "",
    availabilityStatus: row.status ?? "",
    description: "",
    harvestSeason: "",
    photos: [],
    verificationStatus: row.verification_status ?? "Pending Verification",
    source: row.source ?? undefined,
    whatsappMessage: ""
  };
}

function supplierProfileFromRow(row: SupplierRow): SupplierProfile {
  return {
    id: row.id,
    slug: row.slug ?? slugify(row.company_name),
    companyName: row.company_name,
    contactPerson: row.contact_person ?? row.company_name,
    supplierCategory: row.category as SupplierProfile["supplierCategory"],
    region: row.region,
    district: row.district,
    productsServices: row.products_services ?? [],
    shortDescription: "",
    companyOverview: "",
    serviceCoverageArea: "",
    photos: [],
    phone: "",
    verificationStatus: row.verification_status ?? "Pending Verification",
    status: row.status ?? undefined,
    whatsappMessage: ""
  };
}

async function getPublicFarmerBySource(sourceId: string) {
  const result = await selectSupabaseRecords<FarmerRow>(
    "farmers",
    profileQuery(sourceId, "id,slug,farmer_name,farm_name,region,district,farm_type,products,verification_status,status,source")
  );
  const row = result.data?.[0];

  if (!row || row.status !== "Active") {
    return null;
  }

  const profile = farmerProfileFromRow(row);

  return isPublicFarmerProfile(profile) ? profile : null;
}

async function getPublicSupplierBySource(sourceId: string) {
  const result = await selectSupabaseRecords<SupplierRow>(
    "suppliers",
    profileQuery(sourceId, "id,slug,company_name,contact_person,region,district,category,products_services,verification_status,status")
  );
  const row = result.data?.[0];

  if (!row || row.status !== "Active") {
    return null;
  }

  const profile = supplierProfileFromRow(row);

  return isPublicSupplierProfile(profile) ? profile : null;
}

async function publicOwnerForListing(row: MarketplaceListingRow) {
  const ownerType = row.owner_type === "Supplier" ? "Supplier" : "Farmer";

  if (row.record_source === "public_submission" || row.source_submission_id) {
    return { ok: true, sourceType: ownerType === "Supplier" ? "Supplier Listing" : "Marketplace Listing" } as const;
  }

  if (ownerType === "Supplier") {
    const source = row.supplier_id ?? row.owner_id ?? slugify(row.owner_name || row.seller_name);
    const supplier = await getPublicSupplierBySource(source);

    return supplier ? { ok: true, sourceType: "Supplier Listing" as const } : { ok: false };
  }

  const source = row.farmer_id ?? row.owner_id ?? slugify(row.owner_name || row.seller_name);
  const farmer = await getPublicFarmerBySource(source);

  return farmer ? { ok: true, sourceType: "Marketplace Listing" as const } : { ok: false };
}

async function getVerifiedMarketplaceListing(sourceId: string): Promise<VerifiedMarketplaceListingResult> {
  const query = isUuid(sourceId)
    ? `select=${listingSelectFields()}&or=(id.eq.${encodeURIComponent(sourceId)},slug.eq.${encodeURIComponent(sourceId)})&limit=1`
    : `select=${listingSelectFields()}&slug=eq.${encodeURIComponent(sourceId)}&limit=1`;
  const result = await selectSupabaseRecords<MarketplaceListingRow>("marketplace_listings", query);
  const row = result.data?.[0];

  if (!row) {
    return { error: "This marketplace listing is not available for requests." };
  }

  const product = productFromListingRow(row);
  const submissionStatus = await listingSubmissionStatus(row);

  if (submissionStatus) {
    product.sourceSubmissionStatus = submissionStatus;
  }

  if (!isMarketplaceListingPublicStatus(product)) {
    return { error: "This marketplace listing is not available for requests." };
  }

  if ((row.source_submission_id || row.record_source === "public_submission") && submissionStatus !== "Published") {
    return { error: "This marketplace listing is not available for requests." };
  }

  if (usesCustomMarketplaceUnit(product) && !product.customUnitReviewed) {
    return { error: "This marketplace listing is still being reviewed." };
  }

  if (isDemoMarketplaceListing(product)) {
    return { error: "This marketplace listing is not available for public requests." };
  }

  const owner = await publicOwnerForListing(row);

  if (!owner.ok) {
    return { error: "This listing owner is not available for public requests." };
  }

  const ownerSourceType: "Marketplace Listing" | "Supplier Listing" =
    owner.sourceType === "Supplier Listing" ? "Supplier Listing" : "Marketplace Listing";
  const sellerName = titleCaseMarketplaceValue(row.owner_name || row.seller_name);
  const productName = titleCaseMarketplaceValue(row.product_name.replace(/\bYelloe\b/gi, "Yellow"));
  const location = formatMarketplaceLocation(row.district, row.region);
  const snapshot: LeadRequestSnapshot = {
    product: productName,
    seller: sellerName,
    location,
    pricePackage: marketplacePriceLine(product),
    listedQuantity: marketplaceQuantityLine(product),
    quantityLabel: marketplaceQuantityLabel(product),
    availability: marketplaceAvailability(row.availability),
    category: titleCaseMarketplaceValue(row.category),
    source: "marketplace_listing",
    marketplaceListingId: row.id
  };

  return {
    row,
    product,
    snapshot,
    sourceType: ownerSourceType,
    sourceName: productName,
    sourceSlug: row.slug,
    sellerName,
    location
  };
}

function sourceFromLegacyType(sourceType: LeadRequestSourceType, sourceId: string): LeadRequestSource {
  if (sourceType === "Marketplace Listing" || sourceType === "Supplier Listing") {
    return "marketplace_listing";
  }

  if (sourceType === "Farmer") {
    return sourceId === "general-produce-request" ? "generic_sourcing" : "farmer_profile";
  }

  if (sourceType === "Supplier") {
    return "supplier_profile";
  }

  if (sourceType === "Buyer Request") {
    return "generic_sourcing";
  }

  return "legacy";
}

function duplicateInsertError(message?: string) {
  return Boolean(message && /duplicate|unique|lead_requests_dedupe_recent_idx/i.test(message));
}

function trustedProductSelection(requestedProduct: string, productOptions?: string[]) {
  const options = productOptions?.map((option) => option.trim()).filter(Boolean) ?? [];

  if (options.length === 0) {
    return requestedProduct;
  }

  const allowed = new Map(options.map((option) => [sourceToken(option), option]));
  const requested = requestedProduct
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => allowed.get(sourceToken(value)))
    .filter((value): value is string => Boolean(value));
  const uniqueRequested = Array.from(new Set(requested));

  return uniqueRequested.length > 0 ? uniqueRequested.join(", ") : options.slice(0, 3).join(", ");
}

async function duplicateLeadRequestWarning(dedupeKey: string) {
  const since = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000).toISOString();
  const recent = await selectSupabaseRecords<Pick<LeadRequestRecord, "id" | "status" | "created_at">>(
    "lead_requests",
    `select=id,status,created_at&request_dedupe_key=eq.${encodeURIComponent(dedupeKey)}&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1`
  );

  if (recent.error) {
    return "";
  }

  return recent.data?.[0] ? "Ghana Growers has already received this request. We will review the earlier request first." : "";
}

async function resolveTrustedSource(payload: Record<string, unknown>): Promise<TrustedSourceResult> {
  const sourceType = clean(payload.sourceType) as LeadRequestSourceType;
  const rawSourceId = clean(payload.sourceId, 160);
  const sourceName = clean(payload.sourceName);
  const requestSource = (clean(payload.requestSource) as LeadRequestSource) || sourceFromLegacyType(sourceType, rawSourceId);

  if (!allowedSourceTypes.has(sourceType)) {
    return { error: "Choose a valid connection source." };
  }

  if (!rawSourceId && requestSource !== "generic_sourcing") {
    return { error: "Choose a valid connection source." };
  }

  if (requestSource === "marketplace_listing") {
    const listing = await getVerifiedMarketplaceListing(rawSourceId);

    if ("error" in listing) {
      return listing;
    }

    const listingSourceType: LeadRequestSourceType = listing.sourceType === "Supplier Listing" ? "Supplier Listing" : "Marketplace Listing";

    return {
      request_source: "marketplace_listing" as const,
      source_type: listingSourceType,
      source_id: listing.row.id,
      source_name: listing.sourceName,
      marketplace_listing_id: listing.row.id,
      source_slug: listing.sourceSlug ?? null,
      listing_snapshot: listing.snapshot,
      trustedProductInterest: listing.sourceName
    };
  }

  if (requestSource === "farmer_profile") {
    const farmer = await getPublicFarmerBySource(rawSourceId);

    if (!farmer) {
      return { error: "This farmer profile is not available for requests." };
    }

    return {
      request_source: "farmer_profile" as const,
      source_type: "Farmer" as const,
      source_id: farmer.id ?? rawSourceId,
      source_name: farmer.farmName,
      farmer_profile_id: farmer.id ?? null,
      source_slug: farmer.slug,
      trustedProductInterest: "",
      listing_snapshot: {
        seller: farmer.farmName,
        location: cleanFarmerLocation(farmer),
        source: "farmer_profile"
      } satisfies LeadRequestSnapshot,
      productOptions: farmerProducts(farmer)
    };
  }

  if (requestSource === "supplier_profile") {
    const supplier = await getPublicSupplierBySource(rawSourceId);

    if (!supplier) {
      return { error: "This supplier profile is not available for requests." };
    }

    return {
      request_source: "supplier_profile" as const,
      source_type: "Supplier" as const,
      source_id: supplier.id ?? rawSourceId,
      source_name: supplier.companyName,
      supplier_profile_id: supplier.id ?? null,
      source_slug: supplier.slug,
      trustedProductInterest: "",
      listing_snapshot: {
        seller: supplier.companyName,
        location: cleanSupplierLocation(supplier),
        source: "supplier_profile"
      } satisfies LeadRequestSnapshot,
      productOptions: supplierProducts(supplier)
    };
  }

  return {
    request_source: "generic_sourcing" as const,
    source_type: "Buyer Request" as const,
    source_id: rawSourceId || "generic-sourcing",
    source_name: sourceName || "Generic Sourcing Request",
    source_slug: null,
    trustedProductInterest: ""
  };
}

export async function normalizeLeadRequestPayload(payload: Record<string, unknown>, clientKey = "public") {
  const requesterName = clean(payload.requesterName ?? payload.buyerName);
  const phone = cleanPhone(payload.phone ?? payload.phoneNumber);
  const whatsappSameAsPhone = booleanValue(payload.whatsappSameAsPhone);
  const whatsapp = whatsappSameAsPhone ? phone : cleanPhone(payload.whatsapp ?? payload.whatsappNumber);
  const deliveryLocation = clean(payload.deliveryLocation ?? payload.location ?? payload.district);
  const legacyLocation = deliveryLocation;
  const productInterest = clean(payload.productInterest ?? payload.productNeeded);
  const quantityNeeded = clean(payload.quantityNeeded ?? payload.quantity);
  const message = cleanLong(payload.message ?? payload.additionalNotes ?? payload.notes);
  const sourcePage = clean(payload.sourcePage, 500);
  const companyName = clean(payload.companyName);
  const requiredBy = dateValue(payload.requiredBy ?? payload.deadline);
  const honeypot = clean(payload.companyWebsite);

  if (honeypot) {
    return { error: "Submission could not be accepted.", status: 400 };
  }

  if (!requesterName || !phone || !whatsapp || !deliveryLocation || !productInterest) {
    return { error: "Please complete all required fields.", status: 400 };
  }

  const trustedSource = await resolveTrustedSource(payload);

  if ("error" in trustedSource) {
    return { error: trustedSource.error, status: 400 };
  }

  const trustedProductInterest =
    trustedSource.trustedProductInterest ||
    trustedProductSelection(productInterest, "productOptions" in trustedSource ? trustedSource.productOptions : undefined);
  const requestDedupeKey = leadRequestDedupeKey({
    request_source: trustedSource.request_source,
    source_id: trustedSource.source_id,
    product_interest: trustedProductInterest,
    phone,
    whatsapp,
    delivery_location: deliveryLocation,
    quantity_needed: quantityNeeded
  });
  const rateLimitKey = leadRequestRateLimitKey({ phone, whatsapp, clientKey });

  if (!requestDedupeKey || !rateLimitKey) {
    return {
      error: "Connection requests are temporarily unavailable. Please try again later.",
      status: 503
    };
  }

  return {
    data: {
      requester_name: requesterName,
      phone,
      whatsapp,
      location: legacyLocation,
      product_interest: trustedProductInterest,
      quantity_needed: quantityNeeded || null,
      message: message || null,
      source_type: trustedSource.source_type,
      source_id: trustedSource.source_id,
      source_name: trustedSource.source_name,
      source_page: sourcePage || null,
      status: "New" as LeadRequestStatus,
      request_source: trustedSource.request_source,
      marketplace_listing_id: "marketplace_listing_id" in trustedSource ? trustedSource.marketplace_listing_id : null,
      farmer_profile_id: "farmer_profile_id" in trustedSource ? trustedSource.farmer_profile_id : null,
      supplier_profile_id: "supplier_profile_id" in trustedSource ? trustedSource.supplier_profile_id : null,
      source_slug: trustedSource.source_slug,
      company_name: companyName || null,
      whatsapp_same_as_phone: whatsappSameAsPhone,
      delivery_location: deliveryLocation,
      required_by: requiredBy || null,
      listing_snapshot: "listing_snapshot" in trustedSource ? trustedSource.listing_snapshot : null,
      request_dedupe_key: requestDedupeKey
    } satisfies LeadRequestInsertPayload,
    rateLimitKey
  };
}

export async function insertLeadRequest(payload: Record<string, unknown>, clientKey = "public") {
  const normalized = await normalizeLeadRequestPayload(payload, clientKey);

  if ("error" in normalized) {
    return { status: normalized.status, error: normalized.error };
  }

  const duplicateWarning = await duplicateLeadRequestWarning(normalized.data.request_dedupe_key);

  if (duplicateWarning) {
    return { status: 200, duplicate: true, message: duplicateWarning };
  }

  const rateLimit = await consumeDurableLeadRequestRateLimit(normalized.rateLimitKey);

  if (rateLimit.error) {
    return { status: rateLimit.status, error: rateLimit.error };
  }

  const insert = await insertSupabaseRecord("lead_requests", normalized.data);

  if (!insert.error) {
    await logAdminActivity({
      adminEmail: "Public submission",
      actionType: "Create",
      entityType: "Lead Request",
      entityId: (insert.data as { id?: string } | undefined)?.id ?? null,
      entityName: `${normalized.data.requester_name} requested ${normalized.data.source_name}`
    });
  } else if (duplicateInsertError(insert.error)) {
    return {
      status: 200,
      duplicate: true,
      message: "Ghana Growers has already received this request. We will review the earlier request first."
    };
  }

  return insert;
}

export async function createGenericSourcingLeadRequest(body: Record<string, unknown>, clientKey = "public") {
  return insertLeadRequest(
    {
      ...body,
      requesterName: body.buyerName,
      phone: body.phoneNumber,
      whatsapp: body.whatsappNumber,
      deliveryLocation: [clean(body.district), clean(body.region)].filter(Boolean).join(", "),
      productInterest: body.productNeeded,
      quantityNeeded: body.quantityNeeded ?? body.quantity,
      message: [
        clean(body.preferredDelivery) ? `Preferred delivery: ${clean(body.preferredDelivery)}.` : "",
        cleanLong(body.additionalNotes ?? body.notes)
      ].filter(Boolean).join(" "),
      requiredBy: body.deadline,
      sourceType: "Buyer Request",
      sourceId: "generic-sourcing",
      sourceName: "Generic Sourcing Request",
      requestSource: "generic_sourcing"
    },
    clientKey
  );
}

export async function getRecentLeadRequests(limit = 250) {
  const safeLimit = Math.min(Math.max(limit, 1), 250);
  const selectFields = [
    "id",
    "created_at",
    "requester_name",
    "phone",
    "whatsapp",
    "location",
    "product_interest",
    "quantity_needed",
    "message",
    "source_type",
    "source_id",
    "source_name",
    "source_page",
    "status",
    "request_source",
    "marketplace_listing_id",
    "farmer_profile_id",
    "supplier_profile_id",
    "source_slug",
    "company_name",
    "whatsapp_same_as_phone",
    "delivery_location",
    "required_by",
    "listing_snapshot"
  ].join(",");

  return selectSupabaseRecords<LeadRequestRecord>(
    "lead_requests",
    `select=${selectFields}&order=created_at.desc&limit=${safeLimit}`
  );
}

export async function updateLeadRequestStatus({
  id,
  status,
  adminEmail
}: {
  id: string;
  status: LeadRequestStatus;
  adminEmail: string;
}) {
  if (!allowedStatuses.has(status)) {
    return { status: 400, error: "Choose a valid lead status." };
  }

  const update = await updateSupabaseRecord("lead_requests", `id=eq.${encodeURIComponent(id)}`, { status });

  if (!update.error) {
    const actionType = status === "Contacted" ? "Contact" : status === "Completed" ? "Complete" : status === "Lost" ? "Close" : "Edit";

    await logAdminActivity({
      adminEmail,
      actionType,
      entityType: "Lead Request",
      entityId: id,
      entityName: `lead marked ${status}`
    });
  }

  return update;
}
