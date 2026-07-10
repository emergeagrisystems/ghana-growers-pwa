import { cleanProductList } from "./productDisplay";
import { isFeaturedActive } from "./featured";
import type { SupplierProfile } from "../types";

export const SUPPLIERS_PER_PAGE = 12;

export function cleanSupplierLabel(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(/(\s+|-|,|&)/)
    .map((part) => {
      if (/^(\s+|-|,|&)$/.test(part)) {
        return part;
      }

      const lower = part.toLowerCase();
      return lower ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower;
    })
    .join("")
    .replace(/\bAnd\b/g, "and");
}

export function cleanSupplierLocation(supplier: Pick<SupplierProfile, "district" | "region">) {
  const district = cleanSupplierLabel(supplier.district);
  const region = cleanSupplierLabel(supplier.region);

  if (!district) {
    return region || "Ghana";
  }

  return region ? `${district}, ${region}` : district;
}

export function supplierProducts(supplier: Pick<SupplierProfile, "productsServices" | "supplierCategory">) {
  const products = cleanProductList(supplier.productsServices).map(cleanSupplierLabel);
  return products.length > 0 ? products : [cleanSupplierLabel(supplier.supplierCategory)];
}

export function isVerifiedSupplier(supplier: Pick<SupplierProfile, "verificationStatus" | "trust">) {
  return supplier.verificationStatus === "Verified" || supplier.trust?.status === "Verified";
}

export function isPublicSupplierProfile(supplier: Pick<SupplierProfile, "verificationStatus" | "trust">) {
  return isVerifiedSupplier(supplier);
}

export function publicSupplierProfiles(suppliers: SupplierProfile[]) {
  return suppliers.filter(isPublicSupplierProfile);
}

export function orderSupplierDirectoryProfiles(suppliers: SupplierProfile[]) {
  const publicProfiles = publicSupplierProfiles(suppliers);
  const featured = publicProfiles.filter((supplier) => isFeaturedActive(supplier)).slice(0, 4);
  const featuredSlugs = new Set(featured.map((supplier) => supplier.slug));
  const remaining = publicProfiles.filter((supplier) => !featuredSlugs.has(supplier.slug));

  return [...featured, ...remaining];
}

export function paginateSuppliers<T>(items: T[], page: number, pageSize = SUPPLIERS_PER_PAGE) {
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

export function supplierPaginationPages(currentPage: number, totalPages: number) {
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
