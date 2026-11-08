import { normalizeSupplierCategories, unsupportedSupplierCategories } from "./profileApplicationContracts";

const services = new Set(["Logistics", "Storage", "Financial Services", "Agricultural Consulting"]);

export function publicSupplierBadge(category?: string | null) {
  const recorded = (category ?? "").split(",").map(item => item.trim()).filter(Boolean);
  const known = normalizeSupplierCategories(recorded);
  if (!known.length || unsupportedSupplierCategories(recorded).length) return "Supplier / service";
  if (known.every(item => services.has(item))) return "Service provider";
  return known.every(item => !services.has(item)) ? "Supplier" : "Supplier / service";
}
