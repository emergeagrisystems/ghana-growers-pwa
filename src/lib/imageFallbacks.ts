export const imageFallbacks = {
  default: "/images/marketplace/ghana-market-1.jpg",
  farmer: "/images/farmers/farmer-1.jpg",
  supplier: "/images/suppliers/supplier-1.jpg",
  marketplace: "/images/marketplace/fresh-tomatoes.jpg",
  crop: "/images/crops/tomatoes.jpg",
  logistics: "/images/marketplace/logistics-truck.jpg",
  hero: "/images/hero/ghana-growers-hero.jpg",
  og: "/images/marketplace/ghana-market-1.jpg"
} as const;

export type ImageFallbackKind = keyof typeof imageFallbacks;

export function fallbackForImage(kind: ImageFallbackKind = "default") {
  return imageFallbacks[kind];
}
