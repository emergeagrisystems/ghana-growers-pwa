import { cleanProductList, productImageForName } from "./productDisplay";
import type { FarmerProfile } from "../types";

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

export function farmerCardImage(farmer: Pick<FarmerProfile, "farmType" | "hasRealPhoto" | "photos">, products: string[]) {
  if (farmer.hasRealPhoto && farmer.photos[0]) {
    return farmer.photos[0];
  }

  return productImageForName(products[0] ?? "Produce", farmer.farmType);
}

export function farmerImagePosition(farmer: Pick<FarmerProfile, "farmName">) {
  return farmer.farmName.toLowerCase().includes("nart") ? "object-[center_18%]" : "object-[center_30%]";
}

export function isVerifiedFarmer(farmer: Pick<FarmerProfile, "verificationStatus" | "trust">) {
  return farmer.verificationStatus === "Verified" || farmer.trust?.status === "Verified";
}

export function isPublicFarmerProfile(farmer: Pick<FarmerProfile, "verificationStatus" | "source" | "isFeatured" | "trust">) {
  if (isVerifiedFarmer(farmer)) {
    return true;
  }

  if (farmer.verificationStatus === "Premium Member" || farmer.trust?.status === "Premium Member") {
    return true;
  }

  return Boolean(farmer.isFeatured || farmer.source === "Founding Farmer");
}

export function publicFarmerProfiles(farmers: FarmerProfile[]) {
  return farmers.filter(isPublicFarmerProfile);
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
