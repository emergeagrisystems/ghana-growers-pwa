import suppliersData from "@/data/suppliers.json";
import type { SupplierProfile } from "@/types";

export const supplierDirectory = suppliersData as SupplierProfile[];

export function getSupplierBySlug(slug: string) {
  return supplierDirectory.find((supplier) => supplier.slug === slug);
}
