import type { BlogPost } from "@/types";

export const learnImageMap = {
  cropFarming: "/images/marketplace/farm-activity-1.jpg",
  livestock: "/images/products/livestock.jpg",
  agribusiness: "/images/marketplace/ghana-market-2.jpg",
  homeGardening: "/images/products/vegetables.jpg",
  cropDoctor: "/images/marketplace/farm-activity-2.jpg",
  marketPrices: "/images/marketplace/ghana-market-1.jpg",
  buyerDemand: "/images/marketplace/produce-packaging.jpg",
  verification: "/images/marketplace/aggregation-cocoa.jpg",
  seasonalChecklist: "/images/marketplace/pineapple-field.jpg",
  harvestPrep: "/images/marketplace/yam-cassava.jpg",
  farmRecords: "/images/products/cereals.jpg"
} as const;

const categoryImageMap: Record<BlogPost["category"], string> = {
  "Soil & Compost": learnImageMap.farmRecords,
  "Crop Care": learnImageMap.cropFarming,
  "Water & Weather": learnImageMap.seasonalChecklist,
  "Pests & Diseases": learnImageMap.cropDoctor,
  "Harvest & Selling": learnImageMap.harvestPrep,
  "FarmMate Guides": learnImageMap.cropDoctor,
  "Video Lessons": learnImageMap.cropDoctor
};

const slugImageMap: Partial<Record<string, string>> = {
  "make-your-own-compost-for-healthy-soil": learnImageMap.farmRecords,
  "how-to-mulch-your-farm-and-save-water": learnImageMap.seasonalChecklist,
  "how-to-use-poultry-manure-safely": learnImageMap.farmRecords,
  "crop-rotation-why-maize-should-not-stand-alone": learnImageMap.cropFarming,
  "before-you-spray-three-things-to-check-first": learnImageMap.cropDoctor,
  "weekly-crop-field-check": learnImageMap.cropFarming,
  "rainy-season-farm-checklist": learnImageMap.seasonalChecklist,
  "simple-raised-beds-for-vegetables": learnImageMap.homeGardening,
  "how-to-prepare-produce-before-selling": learnImageMap.harvestPrep,
  "how-to-sort-and-pack-vegetables-for-buyers": learnImageMap.buyerDemand,
  "how-to-use-gg-farmmate": learnImageMap.cropDoctor,
  "how-to-use-crop-doctor": learnImageMap.cropDoctor,
  "video-how-to-use-crop-doctor": learnImageMap.cropDoctor
};

export function learnImageForPost(post: Pick<BlogPost, "slug" | "category">) {
  return slugImageMap[post.slug] ?? categoryImageMap[post.category];
}
