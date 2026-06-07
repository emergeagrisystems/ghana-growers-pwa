import farmersData from "@/data/farmers.json";
import type { FarmerProfile } from "@/types";

export const farmerDirectory = farmersData as FarmerProfile[];

export function getFarmerBySlug(slug: string) {
  return farmerDirectory.find((farmer) => farmer.slug === slug);
}
