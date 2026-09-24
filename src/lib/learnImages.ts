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
  "Pests & Diseases": learnImageMap.cropDoctor,
  "Harvest & Storage": learnImageMap.harvestPrep,
  "FarmMate Guides": learnImageMap.cropDoctor,
  "Video Lessons": learnImageMap.cropDoctor
};

const slugImageMap: Partial<Record<string, string>> = {
  "make-your-own-compost-for-healthy-soil": learnImageMap.farmRecords,
  "how-to-mulch-your-farm-and-save-water": learnImageMap.seasonalChecklist,
  "how-to-use-poultry-manure-safely": learnImageMap.farmRecords,
  "crop-rotation-why-maize-should-not-stand-alone": learnImageMap.cropFarming,
  "how-to-keep-soil-covered-during-dry-weather": learnImageMap.seasonalChecklist,
  "before-you-spray-three-things-to-check-first": learnImageMap.cropDoctor,
  "weekly-crop-field-check": learnImageMap.cropFarming,
  "maize-leaves-turning-yellow-what-to-check-first": learnImageMap.cropFarming,
  "tomato-field-checks-before-flowering": learnImageMap.homeGardening,
  "cassava-leaves-curling-what-to-check": learnImageMap.cropFarming,
  "plant-spacing-why-crowded-crops-struggle": learnImageMap.cropFarming,
  "rainy-season-farm-checklist": learnImageMap.seasonalChecklist,
  "simple-raised-beds-for-vegetables": learnImageMap.homeGardening,
  "how-to-save-water-with-mulch": learnImageMap.seasonalChecklist,
  "best-time-of-day-to-water-vegetables": learnImageMap.homeGardening,
  "when-not-to-spray-because-of-weather": learnImageMap.cropDoctor,
  "how-to-scout-your-farm-every-week": learnImageMap.cropFarming,
  "common-tomato-leaf-problems": learnImageMap.homeGardening,
  "natural-pest-prevention-practices": learnImageMap.cropFarming,
  "when-to-ask-crop-doctor": learnImageMap.cropDoctor,
  "how-to-prepare-produce-before-selling": learnImageMap.harvestPrep,
  "how-to-sort-and-pack-vegetables-for-buyers": learnImageMap.buyerDemand,
  "how-to-store-maize-after-harvest": learnImageMap.farmRecords,
  "how-to-store-yam-and-root-crops": learnImageMap.harvestPrep,
  "how-to-reduce-tomato-loss-after-harvest": learnImageMap.buyerDemand,
  "how-to-reduce-produce-loss-after-harvest": learnImageMap.harvestPrep,
  "how-to-estimate-quantity-before-talking-to-buyers": learnImageMap.buyerDemand,
  "simple-harvest-records-for-farmers": learnImageMap.farmRecords,
  "how-buyers-source-produce-through-ghana-growers": learnImageMap.agribusiness,
  "how-to-use-gg-farmmate": learnImageMap.cropDoctor,
  "how-to-ask-farmmate-a-good-question": learnImageMap.cropDoctor,
  "how-to-use-crop-doctor": learnImageMap.cropDoctor,
  "how-to-use-crop-calendar": learnImageMap.seasonalChecklist,
  "how-to-use-planting-advisor": learnImageMap.cropFarming,
  "video-how-to-make-compost-at-home": learnImageMap.farmRecords,
  "video-how-to-mulch-tomatoes": learnImageMap.homeGardening,
  "video-before-you-spray": learnImageMap.cropDoctor,
  "video-how-to-prepare-produce-before-selling": learnImageMap.harvestPrep,
  "video-how-to-store-maize-after-harvest": learnImageMap.farmRecords,
  "video-how-to-use-crop-doctor": learnImageMap.cropDoctor
};

export function learnImageForPost(post: Pick<BlogPost, "slug" | "category">) {
  return slugImageMap[post.slug] ?? categoryImageMap[post.category];
}
