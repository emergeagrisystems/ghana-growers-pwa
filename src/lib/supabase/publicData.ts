import { buyerRequests as fallbackBuyerRequests, buyerRequestsMeta, type BuyerRequest } from "@/data/buyerRequests";
import { farmerDirectory as fallbackFarmers } from "@/data/farmers";
import { marketPriceMeta, marketPrices as fallbackMarketPrices, type MarketPrice } from "@/data/marketPrices";
import { products as fallbackProducts } from "@/data/products";
import { supplierDirectory as fallbackSuppliers } from "@/data/suppliers";
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
  verification_status: string | null;
  profile_image_url: string | null;
  description: string | null;
  status: string | null;
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
  logo_url: string | null;
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
  if (value === "Premium Member" || value === "Premium Farmer") {
    return "Premium Member";
  }

  if (value?.includes("Verified")) {
    return "Verified";
  }

  return "Pending Verification";
}

function trustProfile(value?: string | null): TrustProfile {
  const status = trustStatus(value);
  const verified = status !== "Pending Verification";

  return {
    status,
    requirements: {
      phoneVerified: verified,
      whatsappVerified: verified,
      identitySubmitted: verified,
      businessRegistration: status === "Premium Member"
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

function mapFarmer(row: SupabaseFarmer): FarmerProfile {
  const slug = row.slug ?? slugify(row.farm_name);
  const products = row.products?.length ? row.products : ["Produce"];
  const verificationStatus = trustStatus(row.verification_status);

  return {
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
    description:
      row.description ??
      `${row.farm_name} supplies ${products.join(", ")} from ${row.district}, ${row.region} through the Ghana Growers network.`,
    harvestSeason: "Confirm current harvest timing with Ghana Growers.",
    capacityVolume: "Capacity available on request",
    availableQuantities: "Available quantities confirmed during inquiry",
    deliveryOptions: ["Buyer pickup or delivery arranged through Ghana Growers"],
    photos: [row.profile_image_url || "/images/farmers/farmer-1.jpg"],
    verificationStatus,
    trust: trustProfile(row.verification_status),
    whatsappMessage: `Hello Ghana Growers, I am interested in contacting ${row.farm_name} in ${row.district}, ${row.region}.`
  };
}

function mapSupplier(row: SupabaseSupplier): SupplierProfile {
  const slug = row.slug ?? slugify(row.company_name);
  const services = row.products_services?.length ? row.products_services : [row.category];
  const verificationStatus = trustStatus(row.verification_status);

  return {
    slug,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    supplierCategory: row.category as SupplierProfile["supplierCategory"],
    region: row.region,
    district: row.district,
    productsServices: services,
    shortDescription: `${row.company_name} provides ${services.slice(0, 3).join(", ")} in ${row.region}.`,
    companyOverview: `${row.company_name} supports Ghana Growers farmers and buyers with ${services.join(", ")} across ${row.service_coverage_area ?? row.region}.`,
    serviceCoverageArea: row.service_coverage_area ?? `${row.district} and surrounding districts`,
    photos: [row.logo_url || "/images/suppliers/supplier-1.jpg"],
    website: row.website ?? undefined,
    phone: row.phone ?? row.whatsapp_number ?? "",
    verificationStatus,
    trust: trustProfile(row.verification_status),
    whatsappMessage: `Hello Ghana Growers, I want to contact ${row.company_name} about ${services.slice(0, 2).join(" and ")}.`
  };
}

function mapListing(row: SupabaseListing): Product {
  return {
    id: row.slug ?? row.id,
    name: row.product_name,
    category: row.category,
    location: row.district,
    region: row.region,
    seller: row.seller_name,
    description: `${row.product_name} listed by ${row.seller_name} in ${row.district}, ${row.region}. Confirm quality, timing, and trade terms before purchase.`,
    quantity: row.quantity,
    unit: row.unit,
    image: row.image_url || "/images/marketplace/farm-activity-1.jpg",
    available: row.availability,
    datePosted: dateOnly(row.created_at),
    verified: trustStatus(row.verification_status) !== "Pending Verification",
    featured: Boolean(row.featured),
    whatsappNumber: row.whatsapp_number ?? "233000000000",
    farmerSlug: slugify(row.seller_name)
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
  return rows.length > 0 ? rows.map(mapFarmer) : fallbackFarmers;
}

export async function getSuppliersData() {
  const rows = await fetchRows<SupabaseSupplier>("suppliers");
  return rows.length > 0 ? rows.map(mapSupplier) : fallbackSuppliers;
}

export async function getMarketplaceListingsData() {
  const rows = await fetchRows<SupabaseListing>("marketplace_listings");
  return rows.length > 0 ? rows.map(mapListing) : fallbackProducts;
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
