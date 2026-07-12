import { isPublicFarmerProfile } from "../farmerDirectory";
import { isFeaturedActive } from "../featured";
import { cleanSupplierLocation, isPublicSupplierProfile } from "../supplierDirectory";
import { marketplacePriceLine, marketplaceQuantityLine, usesCustomMarketplaceUnit } from "./trade";
import type { FarmerProfile, Product, SupplierProfile } from "../../types";

export const MARKETPLACE_LISTINGS_PER_PAGE = 12;

export type MarketplaceSeller =
  | { kind: "farmer"; profile: FarmerProfile }
  | { kind: "supplier"; profile: SupplierProfile };

export type MarketplaceDisplayListing = {
  product: Product;
  seller: MarketplaceSeller;
  href: string;
  title: string;
  sellerName: string;
  location: string;
  quantity: string;
  priceLine: string;
  availability: "Available now" | "Seasonal" | "Ask availability" | "Unavailable";
  supplyFrequency?: "One-time" | "Weekly" | "Monthly" | "On request";
  isSellerVerified: boolean;
};

const demoSourcePattern = /(demo|seed|mock|sample|placeholder)/i;
const knownDemoSellerPattern = /\bfarmer\s+j\b/i;
const inactiveStatusPattern = /(archive|inactive|draft|new|pending|review|reject|unpublish|disabled|deleted)/i;
const publicStatusPattern = /^(active|published|listed|approved|live)$/i;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCaseMarketplaceValue(value?: string) {
  const cleaned = value?.trim().replace(/\s+/g, " ") ?? "";

  if (!cleaned) {
    return "";
  }

  if (/[a-z]/.test(cleaned) && /[A-Z]/.test(cleaned) && !/^[A-Z\s&.'-]+$/.test(cleaned)) {
    return cleaned;
  }

  return cleaned
    .toLowerCase()
    .split(/(\s+|-|,|&|\/|\.)/)
    .map((part) => {
      if (/^(\s+|-|,|&|\/|\.)$/.test(part)) {
        return part;
      }

      return part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part;
    })
    .join("")
    .replace(/\bAnd\b/g, "and");
}

export function normalizeMarketplaceQuantity(product: Pick<Product, "quantity" | "unit">) {
  const raw = `${product.quantity ?? ""} ${product.unit ?? ""}`
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return "Ask quantity";
  }

  return raw
    .replace(/\b(kilo|kilogram|kilograms|kg)\b/gi, "kg")
    .replace(/\b(grams|gram)\b/gi, "g")
    .replace(/\b(tonnes|tons|ton)\b/gi, "tonnes")
    .replace(/\bcrates?\b/gi, (match) => match.toLowerCase())
    .replace(/\bbags?\b/gi, (match) => match.toLowerCase())
    .replace(/\bbunches?\b/gi, (match) => match.toLowerCase())
    .replace(/\bbirds?\b/gi, (match) => match.toLowerCase())
    .replace(/\btubers?\b/gi, (match) => match.toLowerCase())
    .replace(/\s+/g, " ")
    .replace(/(\d)\s?(kg|g)\b/gi, "$1 $2")
    .trim();
}

export function marketplaceAvailability(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return "Ask availability" as const;
  }

  if (/(sold|unavailable|out of stock|not available)/.test(normalized)) {
    return "Unavailable" as const;
  }

  if (/(season|harvest|soon|limited)/.test(normalized)) {
    return "Seasonal" as const;
  }

  if (/(available|ready|in stock|now)/.test(normalized)) {
    return "Available now" as const;
  }

  return "Ask availability" as const;
}

export function marketplaceSupplyFrequency(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.includes("weekly")) {
    return "Weekly" as const;
  }

  if (normalized.includes("one-time") || normalized.includes("one time") || normalized.includes("once")) {
    return "One-time" as const;
  }

  if (normalized.includes("monthly")) {
    return "Monthly" as const;
  }

  if (normalized.includes("request")) {
    return "On request" as const;
  }

  return undefined;
}

export function isMarketplaceListingPublicStatus(product: Product) {
  if (!product.status) {
    return true;
  }

  if (inactiveStatusPattern.test(product.status)) {
    return false;
  }

  return publicStatusPattern.test(product.status);
}

function isMarketplaceSupplierPublic(supplier: SupplierProfile) {
  if (!isPublicSupplierProfile(supplier)) {
    return false;
  }

  if (!supplier.status) {
    return true;
  }

  if (inactiveStatusPattern.test(supplier.status)) {
    return false;
  }

  return publicStatusPattern.test(supplier.status);
}

export function isDemoMarketplaceListing(product: Product, seller?: MarketplaceSeller) {
  const source = seller?.kind === "farmer" ? seller.profile.source : undefined;
  const searchable = [product.id, product.ownerName, product.seller, product.farmerSlug, product.recordSource, source].filter(Boolean).join(" ");

  return demoSourcePattern.test(searchable) || knownDemoSellerPattern.test(searchable);
}

export function findMarketplaceSeller(product: Product, farmers: FarmerProfile[], suppliers: SupplierProfile[]): MarketplaceSeller | undefined {
  const publicFarmers = farmers.filter(isPublicFarmerProfile);
  const publicSuppliers = suppliers.filter(isMarketplaceSupplierPublic);
  const farmerById = new Map(publicFarmers.filter((farmer) => farmer.id).map((farmer) => [farmer.id as string, farmer]));
  const farmerBySlug = new Map(publicFarmers.map((farmer) => [farmer.slug, farmer]));
  const supplierById = new Map(publicSuppliers.filter((supplier) => supplier.id).map((supplier) => [supplier.id as string, supplier]));
  const supplierBySlug = new Map(publicSuppliers.map((supplier) => [supplier.slug, supplier]));
  const ownerSlug = slugify(product.ownerName || product.seller);

  if (product.ownerType === "Supplier") {
    const supplier = (product.ownerId ? supplierById.get(product.ownerId) : undefined) ?? supplierBySlug.get(ownerSlug);
    return supplier ? { kind: "supplier", profile: supplier } : undefined;
  }

  const farmer =
    (product.ownerId ? farmerById.get(product.ownerId) : undefined) ??
    (product.farmerSlug ? farmerBySlug.get(product.farmerSlug) : undefined) ??
    farmerBySlug.get(ownerSlug);

  if (farmer) {
    return { kind: "farmer", profile: farmer };
  }

  if (!product.ownerType) {
    const supplier = supplierBySlug.get(ownerSlug);
    return supplier ? { kind: "supplier", profile: supplier } : undefined;
  }

  return undefined;
}

function listingDuplicateKey(listing: MarketplaceDisplayListing) {
  const product = listing.product;

  return [
    product.name,
    listing.sellerName,
    listing.location,
    listing.quantity,
    listing.availability,
    product.category
  ]
    .join("|")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function toMarketplaceDisplayListing(product: Product, seller: MarketplaceSeller): MarketplaceDisplayListing {
  const sellerName = seller.kind === "farmer" ? seller.profile.farmName : seller.profile.companyName;
  const location = seller.kind === "farmer"
    ? [titleCaseMarketplaceValue(seller.profile.district), titleCaseMarketplaceValue(seller.profile.region)].filter(Boolean).join(", ")
    : cleanSupplierLocation(seller.profile);
  const availability = marketplaceAvailability(product.available);
  const supplyFrequency = marketplaceSupplyFrequency(product.supplyFrequency) ?? marketplaceSupplyFrequency(product.available);

  return {
    product: {
      ...product,
      name: titleCaseMarketplaceValue(product.name),
      category: titleCaseMarketplaceValue(product.category),
      location: titleCaseMarketplaceValue(product.location),
      region: titleCaseMarketplaceValue(product.region),
      seller: titleCaseMarketplaceValue(product.seller),
      ownerName: product.ownerName ? titleCaseMarketplaceValue(product.ownerName) : product.ownerName
    },
    seller,
    href: `/marketplace/${encodeURIComponent(product.id)}`,
    title: titleCaseMarketplaceValue(product.name),
    sellerName: titleCaseMarketplaceValue(sellerName),
    location,
    quantity: marketplaceQuantityLine(product),
    priceLine: marketplacePriceLine(product),
    availability,
    supplyFrequency,
    isSellerVerified: seller.kind === "farmer"
      ? seller.profile.verificationStatus === "Verified" || seller.profile.trust?.status === "Verified"
      : seller.profile.verificationStatus === "Verified" || seller.profile.trust?.status === "Verified"
  };
}

export function publicMarketplaceListings(products: Product[], farmers: FarmerProfile[], suppliers: SupplierProfile[]) {
  const seen = new Set<string>();
  const listings: MarketplaceDisplayListing[] = [];

  for (const product of products) {
    if (!isMarketplaceListingPublicStatus(product)) {
      continue;
    }

    if (usesCustomMarketplaceUnit(product) && !product.customUnitReviewed) {
      continue;
    }

    const seller = findMarketplaceSeller(product, farmers, suppliers);

    if (!seller || isDemoMarketplaceListing(product, seller)) {
      continue;
    }

    const displayListing = toMarketplaceDisplayListing(product, seller);
    const duplicateKey = listingDuplicateKey(displayListing);

    if (seen.has(duplicateKey)) {
      continue;
    }

    seen.add(duplicateKey);
    listings.push(displayListing);
  }

  return listings;
}

export function featuredMarketplaceListings(listings: MarketplaceDisplayListing[]) {
  return listings.filter((listing) => isFeaturedActive(listing.product));
}

export function paginateMarketplaceListings<T>(items: T[], page: number, pageSize = MARKETPLACE_LISTINGS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex: Math.min(startIndex + pageSize, items.length),
    pageItems: items.slice(startIndex, startIndex + pageSize)
  };
}

export function marketplaceResultRange(page: number, total: number, pageSize = MARKETPLACE_LISTINGS_PER_PAGE) {
  if (total <= 0) {
    return "Showing 0 listings";
  }

  const paginated = paginateMarketplaceListings(Array.from({ length: total }), page, pageSize);
  return `Showing ${paginated.startIndex + 1}\u2013${paginated.endIndex} of ${total} listings`;
}
