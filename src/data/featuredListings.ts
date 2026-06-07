import featuredListingData from "@/data/featuredListings.json";
import { buyerRequests } from "@/data/buyerRequests";
import { farmerDirectory } from "@/data/farmers";
import { supplierDirectory } from "@/data/suppliers";

const featuredFarmerSlugs = new Set(featuredListingData.farmerSlugs);
const featuredSupplierSlugs = new Set(featuredListingData.supplierSlugs);
const featuredBuyerRequestIds = new Set(featuredListingData.buyerRequestIds);

export const featuredListingLabels = featuredListingData.labels;

export const featuredFarmers = farmerDirectory.filter((farmer) => featuredFarmerSlugs.has(farmer.slug));
export const featuredSuppliers = supplierDirectory.filter((supplier) => featuredSupplierSlugs.has(supplier.slug));
export const featuredBuyerRequests = buyerRequests.filter((request) => featuredBuyerRequestIds.has(request.id));

export function isFeaturedFarmer(slug: string) {
  return featuredFarmerSlugs.has(slug);
}

export function isFeaturedSupplier(slug: string) {
  return featuredSupplierSlugs.has(slug);
}

export function isFeaturedBuyerRequest(id: string) {
  return featuredBuyerRequestIds.has(id);
}
