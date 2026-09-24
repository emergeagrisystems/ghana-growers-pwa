import featuredListingData from "@/data/featuredListings.json";
import { buyerRequests } from "@/data/buyerRequests";
import { farmerDirectory } from "@/data/farmers";
import { supplierDirectory } from "@/data/suppliers";

export const featuredFarmerSlugs = featuredListingData.farmerSlugs;

const featuredFarmerSlugSet = new Set(featuredFarmerSlugs);
const featuredSupplierSlugs = new Set(featuredListingData.supplierSlugs);
const featuredBuyerRequestIds = new Set(featuredListingData.buyerRequestIds);

export const featuredListingLabels = featuredListingData.labels;

export const featuredFarmers = farmerDirectory.filter((farmer) => featuredFarmerSlugSet.has(farmer.slug));
export const featuredSuppliers = supplierDirectory.filter((supplier) => featuredSupplierSlugs.has(supplier.slug));
export const featuredBuyerRequests = buyerRequests
  .filter((request) => featuredBuyerRequestIds.has(request.id))
  .map((request, index) => ({
    reference: `GG-FEATURED-${index + 1}`,
    productName: request.productName,
    quantityNeeded: request.quantityNeeded,
    district: request.district,
    region: request.region,
    deadline: request.deadline,
    buyerType: request.buyerType,
    datePosted: request.datePosted
  }));

export function isFeaturedFarmer(slug: string) {
  return featuredFarmerSlugSet.has(slug);
}

export function isFeaturedSupplier(slug: string) {
  return featuredSupplierSlugs.has(slug);
}

export function isFeaturedBuyerRequest(id: string) {
  return featuredBuyerRequestIds.has(id);
}
