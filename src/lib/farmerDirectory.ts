import { cleanProductList, productImageForName } from "./productDisplay";
import { isFeaturedActive } from "./featured";
import { isEligiblePublicFarmer } from "./publicProfileEligibility";
import type { FarmerProfile, PublicFarmerProfile } from "../types";

export const FARMERS_PER_PAGE = 12;

export function titleCaseFarmerValue(value: string) {
  return value
    .trim()
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\s+/g, " ")
    .split(/(\s+|-|,)/)
    .map((part) => {
      if (/^(\s+|-|,)$/.test(part)) {
        return part;
      }

      const lower = part.toLowerCase();
      return lower ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower;
    })
    .join("")
    .replace(/\bRegion\b/gi, "Region");
}

export function cleanFarmerProfileLabel(value: string) {
  return titleCaseFarmerValue(value)
    .replace(/\bMaise\b/gi, "Maize")
    .replace(/\bAquaculture And Poultry\b/gi, "Aquaculture & Poultry")
    .replace(/\bCabbages And Chili Pepper\b/gi, "Cabbage & Chili Pepper");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanFarmerLocation(farmer: Pick<FarmerProfile, "district" | "region">) {
  const region = cleanFarmerProfileLabel(farmer.region);
  let district = cleanFarmerProfileLabel(farmer.district);

  if (region) {
    district = district
      .replace(new RegExp(`^${escapeRegExp(region)}\\s*`, "i"), "")
      .replace(new RegExp(`,?\\s*${escapeRegExp(region)}$`, "i"), "")
      .trim()
      .replace(/^,|,$/g, "")
      .trim();
  }

  if (!district) {
    return region || "Ghana";
  }

  return region ? `${district}, ${region}` : district;
}

export function farmerProducts(farmer: Pick<FarmerProfile, "products">) {
  return cleanProductList(farmer.products).map(cleanFarmerProfileLabel);
}

function isBroadFarmerProductLabel(product: string, farmType?: string) {
  const normalizedProduct = product.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  const normalizedFarmType = farmType?.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

  return (
    normalizedProduct === normalizedFarmType ||
    normalizedProduct === "aquaculture and poultry" ||
    normalizedProduct === "mixed farming" ||
    normalizedProduct === "crop" ||
    normalizedProduct === "livestock"
  );
}

export function farmerCardProducts(farmer: Pick<FarmerProfile, "farmType" | "products">) {
  return farmerProducts(farmer).filter((product) => !isBroadFarmerProductLabel(product, farmer.farmType));
}

export function farmerCardImage(farmer: Pick<FarmerProfile, "farmType" | "hasRealPhoto" | "photos">, products: string[]) {
  if (farmer.hasRealPhoto && farmer.photos[0]) {
    return farmer.photos[0];
  }

  return productImageForName(products[0] ?? "Produce", farmer.farmType);
}

export function farmerImagePosition(farmer: Pick<FarmerProfile, "farmName">) {
  return farmer.farmName.toLowerCase().includes("nart") ? "object-[center_18%]" : "object-[center_30%]";
}

export function isVerifiedFarmer(farmer: Pick<FarmerProfile, "verificationStatus">) {
  return farmer.verificationStatus === "Verified";
}

export function isDemoSeedFarmerProfile(farmer: Pick<FarmerProfile, "source">) {
  const source = farmer.source?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
  const demoSourceMarkers = ["demo", "demo seed", "seed data", "seed record", "seed profile", "sample", "mock", "placeholder"];

  return demoSourceMarkers.some((marker) => source === marker || source.includes(marker));
}

export function isPublicFarmerProfile(farmer: Pick<FarmerProfile, "slug" | "verificationStatus" | "status" | "launchReady" | "source">) {
  return isEligiblePublicFarmer(farmer);
}

export function publicFarmerProfiles(farmers: FarmerProfile[]) {
  return farmers.filter(isPublicFarmerProfile);
}

function uniqueFarmersBySlug<T extends Pick<PublicFarmerProfile, "slug">>(farmers: T[]) {
  return farmers.filter((farmer, index, allFarmers) => allFarmers.findIndex((item) => item.slug === farmer.slug) === index);
}

export function homepageFeaturedFarmerProfiles(
  farmers: Array<PublicFarmerProfile & { source?: string }>,
  limit = 4
) {
  return uniqueFarmersBySlug(farmers)
    .filter((farmer) => isEligiblePublicFarmer(farmer) && isFeaturedActive(farmer))
    .slice(0, limit);
}

export function orderFarmerDirectoryProfiles(farmers: FarmerProfile[]) {
  const publicProfiles = publicFarmerProfiles(farmers);
  const featured = publicProfiles.filter((farmer) => isVerifiedFarmer(farmer) && isFeaturedActive(farmer)).slice(0, 4);
  const featuredSlugs = new Set(featured.map((farmer) => farmer.slug));
  const remaining = publicProfiles.filter((farmer) => !featuredSlugs.has(farmer.slug));

  return [...featured, ...remaining];
}

export function paginateFarmers<T>(items: T[], page: number, pageSize = FARMERS_PER_PAGE) {
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

export function paginationPages(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
    .reduce<Array<number | "ellipsis">>((items, page) => {
      const previous = items[items.length - 1];
      if (typeof previous === "number" && page - previous > 1) {
        items.push("ellipsis");
      }
      items.push(page);
      return items;
    }, []);
}
