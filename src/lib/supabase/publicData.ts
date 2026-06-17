import { buyerRequests as fallbackBuyerRequests, buyerRequestsMeta, type BuyerRequest } from "@/data/buyerRequests";
import { farmerDirectory as fallbackFarmers } from "@/data/farmers";
import { marketPriceMeta, marketPrices as fallbackMarketPrices, type MarketPrice } from "@/data/marketPrices";
import { products as fallbackProducts } from "@/data/products";
import { supplierDirectory as fallbackSuppliers } from "@/data/suppliers";
import { cleanProductList, productDisplayName, productImageForName, supplierServiceImageForName } from "@/lib/productDisplay";
import type { FarmerProfile, Product, SupplierProfile, TrustProfile, TrustStatus } from "@/types";

type SupabaseFarmer = {
  id: string;
  slug: string | null;
  farmer_name: string | null;
  farm_name: string;
  region: string;
  district: string;
  farm_type: "Crop" | "Livestock" | "Mixed" | string;
  products: string[] | null;
  farm_size: string | null;
  whatsapp_number: string | null;
  delivery_preference: string | null;
  payment_preference: string | null;
  tally_photo_url: string | null;
  imported_photo_url: string | null;
  original_tally_data: Record<string, string> | null;
  verification_status: string | null;
  verification_date: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  profile_image_url: string | null;
  description: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
};

type SupabaseSupplier = {
  id: string;
  slug: string | null;
  company_name: string;
  contact_person: string;
  region: string;
  district: string;
  category: SupplierProfile["supplierCategory"] | string;
  products_services: string[] | null;
  service_coverage_area: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  website: string | null;
  verification_status: string | null;
  verification_date: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  logo_url: string | null;
  profile_image_url?: string | null;
  application_image_url?: string | null;
  status: string | null;
  created_at: string;
};

type SupabaseListing = {
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
  quantity: string;
  unit: string;
  availability: string;
  price_range: string | null;
  image_url: string | null;
  whatsapp_number: string | null;
  verification_status: string | null;
  status: string | null;
  featured: boolean | null;
  created_at: string;
};

type SupabaseBuyerRequest = {
  id: string;
  product_needed: string;
  quantity: string;
  region: string;
  district: string;
  buyer_name: string | null;
  buyer_type: string;
  deadline: string | null;
  status: BuyerRequest["status"] | string;
  budget_range: string | null;
  delivery_preference: string | null;
  whatsapp_number: string | null;
  notes: string | null;
  verification_status: string | null;
  verification_date: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  created_at: string;
};

type SupabaseMarketPrice = {
  id: string;
  product: string;
  region: string;
  market: string;
  wholesale_price: string;
  retail_price: string;
  currency: string | null;
  date_updated: string;
  trend: MarketPrice["trend"] | string;
  source: string | null;
  status: string | null;
};

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

async function fetchRows<T>(table: string, select = "*", order = "created_at.desc") {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return [];
  }

  const endpoint = new URL(`${url.replace(/\/$/, "")}/rest/v1/${table}`);
  endpoint.searchParams.set("select", select);
  endpoint.searchParams.set("order", order);

  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    },
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const rows = (await response.json().catch(() => [])) as T[];
  return Array.isArray(rows) ? rows : [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function trustStatus(value?: string | null): TrustStatus {
  if (value === "Under Review" || value === "Rejected" || value === "Pending") {
    return value;
  }

  if (value === "Premium Member" || value === "Premium Farmer") {
    return "Verified";
  }

  if (value?.includes("Verified")) {
    return "Verified";
  }

  return "Pending";
}

function trustProfile(value?: string | null): TrustProfile {
  const status = trustStatus(value);
  const verified = status === "Verified";

  return {
    status,
    requirements: {
      phoneVerified: verified,
      whatsappVerified: verified,
      identitySubmitted: verified,
      businessRegistration: verified
    },
    score: {
      profileCompleteness: verified ? 85 : 55,
      verificationLevel: verified ? 80 : 35,
      activityLevel: 70
    }
  };
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function firstUsableTallyPhoto(originalData?: Record<string, string> | null) {
  if (!originalData) {
    return "";
  }

  const photoEntry = Object.entries(originalData).find(([label, value]) => {
    const normalizedLabel = label.toLowerCase();
    return Boolean(value?.trim()) && /(photo|image|picture|upload|file)/.test(normalizedLabel) && /^https?:\/\//i.test(value.trim());
  });

  return photoEntry?.[1]?.trim() ?? "";
}

function allowDemoPublicData() {
  return process.env.ENABLE_DEMO_PUBLIC_DATA === "true";
}

function isPublicDisplayableImageUrl(url?: string | null) {
  if (!url?.trim()) {
    return false;
  }

  if (url.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === "storage.tally.so" && path.includes("/private/")) {
      return false;
    }

    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function farmerPhotoUrls(row: SupabaseFarmer) {
  const urls = [
    row.profile_image_url,
    row.imported_photo_url,
    isPublicDisplayableImageUrl(row.tally_photo_url) ? row.tally_photo_url : "",
    firstUsableTallyPhoto(row.original_tally_data),
    "/images/farmers/farmer-1.jpg"
  ];

  return Array.from(new Set(urls.filter((url): url is string => isPublicDisplayableImageUrl(url))));
}

function locationLabel(district?: string | null, region?: string | null) {
  const parts = [district, region]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.toLowerCase() !== "not provided" && part.toLowerCase() !== "ghana"));

  return Array.from(new Set(parts)).join(", ");
}

function farmerDescription(row: SupabaseFarmer, products: string[]) {
  const existingDescription = row.description?.trim();

  if (
    existingDescription &&
    !/supplies\s+.+\s+from\s+.+\s+through the Ghana Growers network/i.test(existingDescription) &&
    !/,\s*([^,.]+),\s*\1/i.test(existingDescription)
  ) {
    return existingDescription;
  }

  const name = row.farm_name || row.farmer_name || "This farmer";
  const location = locationLabel(row.district, row.region);
  const productText = products.length > 0 ? products.join(", ") : "";

  if (productText && location) {
    return `${name} is a Ghana Growers farmer based in ${location}, supplying ${productText}. Buyers can request availability, quantity, and collection or delivery details through Ghana Growers.`;
  }

  if (productText) {
    return `${name} supplies ${productText} through the Ghana Growers network. Buyers can request availability and quantity details through Ghana Growers.`;
  }

  if (location) {
    return `${name} is listed in the Ghana Growers farmer network and operates from ${location}.`;
  }

  return `${name} is listed in the Ghana Growers farmer network. Buyers can request availability and quantity details through Ghana Growers.`;
}

function publicDeliveryPreference() {
  return "Upon arrangement";
}

function publicPaymentPreference(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized || ["not provided", "n/a", "na", "none"].includes(normalized)) {
    return "Payment to be confirmed";
  }

  if (normalized.includes("mobile money") || normalized.includes("momo")) {
    return "Mobile Money";
  }

  if (normalized.includes("bank")) {
    return "Bank Transfer";
  }

  if (normalized.includes("cash")) {
    return "Cash";
  }

  return "Payment to be confirmed";
}

function supplierImageUrls(row: SupabaseSupplier, services: string[]) {
  const urls = [
    row.logo_url,
    row.profile_image_url,
    row.application_image_url,
    supplierServiceImageForName(services[0] ?? row.category, row.category),
    "/images/suppliers/supplier-1.jpg"
  ];

  return Array.from(new Set(urls.filter((url): url is string => isPublicDisplayableImageUrl(url))));
}

function supplierDescription(row: SupabaseSupplier, services: string[]) {
  const name = row.company_name || "This supplier";
  const location = locationLabel(row.district, row.region);
  const serviceText = services.length > 0 ? services.slice(0, 4).join(", ") : row.category;
  const coverage = row.service_coverage_area?.trim();

  if (serviceText && location) {
    return `${name} is a Ghana Growers supplier based in ${location}, providing ${serviceText}. Farmers and buyers can request availability, delivery coverage, and service details through Ghana Growers.`;
  }

  if (serviceText) {
    return `${name} provides ${serviceText} through the Ghana Growers network. Farmers and buyers can request availability and service details through Ghana Growers.`;
  }

  if (coverage) {
    return `${name} supports farmers and buyers across ${coverage} through the Ghana Growers supplier network.`;
  }

  return `${name} is listed in the Ghana Growers supplier network. Farmers and buyers can request service details through Ghana Growers.`;
}

function mapFarmer(row: SupabaseFarmer): FarmerProfile {
  const slug = row.slug ?? slugify(row.farm_name);
  const products = cleanProductList(row.products?.length ? row.products : ["Produce"]);
  const verificationStatus = trustStatus(row.verification_status);

  return {
    id: row.id,
    slug,
    farmName: row.farm_name,
    contactName: row.farmer_name ?? row.farm_name,
    region: row.region,
    district: row.district,
    products,
    farmType: row.farm_type === "Livestock" || row.farm_type === "Mixed" ? row.farm_type : "Crop",
    farmSize: row.farm_size ?? "Available on request",
    yearsFarming: "Available on request",
    availabilityStatus: row.status === "Archived" ? "Currently unavailable" : "Available on request",
    description: farmerDescription(row, products),
    harvestSeason: "Confirm current harvest timing with Ghana Growers.",
    capacityVolume: "Capacity available on request",
    availableQuantities: "Available quantities confirmed during inquiry",
    deliveryOptions: [publicDeliveryPreference()],
    paymentPreference: publicPaymentPreference(row.payment_preference),
    photos: farmerPhotoUrls(row),
    verificationStatus,
    verificationDate: row.verification_date ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verificationNotes: row.verification_notes ?? undefined,
    source: row.source ?? undefined,
    trust: trustProfile(row.verification_status),
    whatsappMessage: `Hello Ghana Growers, I am interested in contacting ${row.farm_name} in ${row.district}, ${row.region}.`
  };
}

function mapSupplier(row: SupabaseSupplier): SupplierProfile {
  const slug = row.slug ?? slugify(row.company_name);
  const services = row.products_services?.length ? row.products_services : [row.category];
  const verificationStatus = trustStatus(row.verification_status);
  const overview = supplierDescription(row, services);

  return {
    id: row.id,
    slug,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    supplierCategory: row.category as SupplierProfile["supplierCategory"],
    region: row.region,
    district: row.district,
    productsServices: services,
    shortDescription: `${row.company_name} provides ${services.slice(0, 3).join(", ")} for farmers and buyers in ${row.region}.`,
    companyOverview: overview,
    serviceCoverageArea: row.service_coverage_area ?? `${row.district} and surrounding districts`,
    photos: supplierImageUrls(row, services),
    website: row.website ?? undefined,
    phone: row.phone ?? row.whatsapp_number ?? "",
    verificationStatus,
    verificationDate: row.verification_date ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verificationNotes: row.verification_notes ?? undefined,
    trust: trustProfile(row.verification_status),
    whatsappMessage: `Hello Ghana Growers, I want to contact ${row.company_name} about ${services.slice(0, 2).join(" and ")}.`
  };
}

function mapListing(row: SupabaseListing): Product {
  const productName = productDisplayName(row.product_name);
  const ownerType = row.owner_type === "Supplier" || row.owner_type === "Admin" ? row.owner_type : "Farmer";
  const ownerName = row.owner_name || row.seller_name;

  return {
    id: row.slug ?? row.id,
    name: productName,
    category: row.category,
    location: row.district,
    region: row.region,
    seller: ownerName,
    description: `${productName} listed by ${ownerName} in ${row.district}, ${row.region}. Confirm quality, timing, and trade terms before purchase.`,
    quantity: row.quantity,
    unit: row.unit,
    image: row.image_url || productImageForName(productName, row.category),
    available: row.availability,
    datePosted: dateOnly(row.created_at),
    verified: trustStatus(row.verification_status) === "Verified",
    featured: Boolean(row.featured),
    whatsappNumber: row.whatsapp_number ?? "233000000000",
    farmerSlug: ownerType === "Farmer" ? slugify(ownerName) : undefined,
    ownerType,
    ownerId: row.owner_id ?? undefined,
    ownerName
  };
}

function mapBuyerRequest(row: SupabaseBuyerRequest): BuyerRequest {
  const status = row.status === "Urgent" || row.status === "Fulfilled" ? row.status : "Open";

  return {
    id: row.id,
    productName: row.product_needed,
    quantityNeeded: row.quantity,
    region: row.region,
    district: row.district,
    deadline: row.deadline ?? "Confirm with buyer",
    buyerType: row.buyer_type,
    buyerName: row.buyer_name ?? "Ghana Growers Buyer",
    deliveryPreference: row.delivery_preference ?? "Confirm delivery or pickup preference",
    budgetRange: row.budget_range ?? undefined,
    notes: row.notes ?? "Contact buyer through Ghana Growers for full request details.",
    status,
    whatsappNumber: row.whatsapp_number ?? "233000000000",
    contactMethod: "WhatsApp",
    datePosted: dateOnly(row.created_at),
    verificationStatus: trustStatus(row.verification_status),
    verificationDate: row.verification_date ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verificationNotes: row.verification_notes ?? undefined,
    trust: trustProfile(row.verification_status)
  };
}

function mapMarketPrice(row: SupabaseMarketPrice): MarketPrice {
  const trend = row.trend === "Rising" || row.trend === "Falling" ? row.trend : "Stable";

  return {
    crop: row.product,
    market: row.market,
    region: row.region,
    wholesalePrice: row.wholesale_price,
    retailPrice: row.retail_price,
    dateUpdated: row.date_updated,
    trend
  };
}

export async function getFarmersData() {
  const rows = await fetchRows<SupabaseFarmer>("farmers");
  const publicRows = rows.filter((row) => row.status === "Active");

  if (rows.length > 0) {
    return publicRows.map(mapFarmer);
  }

  return allowDemoPublicData() ? fallbackFarmers : [];
}

export async function getSuppliersData() {
  const rows = await fetchRows<SupabaseSupplier>("suppliers");
  return rows.length > 0 ? rows.map(mapSupplier) : allowDemoPublicData() ? fallbackSuppliers : [];
}

export async function getMarketplaceListingsData() {
  const rows = await fetchRows<SupabaseListing>("marketplace_listings");
  return rows.length > 0 ? rows.map(mapListing) : allowDemoPublicData() ? fallbackProducts : [];
}

export async function getBuyerRequestsData() {
  const rows = await fetchRows<SupabaseBuyerRequest>("buyer_requests");
  return rows.length > 0 ? rows.map(mapBuyerRequest) : fallbackBuyerRequests;
}

export async function getMarketPricesData() {
  const rows = await fetchRows<SupabaseMarketPrice>("market_prices", "*", "date_updated.desc");
  return rows.length > 0 ? rows.map(mapMarketPrice) : fallbackMarketPrices;
}

export function getBuyerRequestsMeta() {
  return buyerRequestsMeta;
}

export function getMarketPriceMeta() {
  return marketPriceMeta;
}
