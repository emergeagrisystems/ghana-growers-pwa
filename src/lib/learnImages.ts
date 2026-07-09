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
  Crops: learnImageMap.cropFarming,
  Livestock: learnImageMap.livestock,
  "Home Gardening": learnImageMap.homeGardening,
  Agribusiness: learnImageMap.agribusiness,
  "Seasonal Farming": learnImageMap.seasonalChecklist,
  "Video Library": learnImageMap.cropDoctor
};

const slugImageMap: Partial<Record<string, string>> = {
  "how-ghana-growers-works": learnImageMap.agribusiness,
  "verification-process": learnImageMap.verification,
  "how-to-sell-produce-through-ghana-growers": learnImageMap.buyerDemand,
  "how-buyers-use-ghana-growers": learnImageMap.buyerDemand,
  "tomato-production-in-southern-ghana": learnImageMap.cropFarming,
  "maize-yellow-leaves-field-guide": learnImageMap.cropDoctor,
  "backyard-vegetable-garden-ghana": learnImageMap.homeGardening,
  "seasonal-farm-checklist": learnImageMap.seasonalChecklist,
  "harvest-preparation-guide": learnImageMap.harvestPrep,
  "simple-farm-records-guide": learnImageMap.farmRecords,
  "seasonal-farming-rainy-season-checklist": learnImageMap.seasonalChecklist,
  "small-poultry-flock-records": learnImageMap.livestock,
  "video-how-to-use-crop-health-check": learnImageMap.cropDoctor
};

export function learnImageForPost(post: Pick<BlogPost, "slug" | "category">) {
  return slugImageMap[post.slug] ?? categoryImageMap[post.category];
}
