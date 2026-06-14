"use client";

import Link from "next/link";
import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";

type ShowcaseItem = {
  name: string;
  image: string;
};

type ShowcaseCategory = {
  slug: string;
  name: string;
  items: ShowcaseItem[];
};

const marketplaceShowcaseData: ShowcaseCategory[] = [
  {
    slug: "vegetables",
    name: "Vegetables",
    items: [
      { name: "Tomato", image: "/images/marketplace/fresh-tomatoes.jpg" },
      { name: "Onion", image: "/images/marketplace/ghana-market-2.jpg" },
      { name: "Pepper", image: "/images/crops/tomatoes.jpg" },
      { name: "Okra", image: "/images/marketplace/ghana-market-1.jpg" },
      { name: "Garden Eggs", image: "/images/marketplace/fresh-tomatoes.jpg" },
      { name: "Cabbage", image: "/images/marketplace/ghana-market-2.jpg" },
      { name: "Carrot", image: "/images/crops/tomatoes.jpg" },
      { name: "Leafy Greens", image: "/images/marketplace/ghana-market-1.jpg" }
    ]
  },
  {
    slug: "fruits",
    name: "Fruits",
    items: [
      { name: "Pineapple", image: "/images/crops/pineapple.jpg" },
      { name: "Mango", image: "/images/marketplace/pineapple-field.jpg" },
      { name: "Orange", image: "/images/marketplace/ghana-market-1.jpg" },
      { name: "Watermelon", image: "/images/marketplace/ghana-market-2.jpg" },
      { name: "Banana", image: "/images/crops/pineapple.jpg" },
      { name: "Pawpaw", image: "/images/marketplace/pineapple-field.jpg" },
      { name: "Coconut", image: "/images/marketplace/ghana-market-1.jpg" },
      { name: "Avocado", image: "/images/marketplace/ghana-market-2.jpg" }
    ]
  },
  {
    slug: "tubers",
    name: "Tubers",
    items: [
      { name: "Cassava", image: "/images/marketplace/yam-cassava.jpg" },
      { name: "Yam", image: "/images/crops/yam.jpg" },
      { name: "Cocoyam", image: "/images/marketplace/yam-cassava.jpg" },
      { name: "Sweet Potato", image: "/images/crops/yam.jpg" },
      { name: "Irish Potato", image: "/images/marketplace/yam-cassava.jpg" },
      { name: "Plantain", image: "/images/crops/yam.jpg" },
      { name: "Taro", image: "/images/marketplace/yam-cassava.jpg" },
      { name: "Processed Cassava", image: "/images/crops/yam.jpg" }
    ]
  },
  {
    slug: "cereals",
    name: "Cereals",
    items: [
      { name: "Maize", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Rice", image: "/images/marketplace/river-supply-chain.jpg" },
      { name: "Sorghum", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Millet", image: "/images/marketplace/farm-activity-2.jpg" },
      { name: "Soybean", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Groundnut", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Cowpea", image: "/images/marketplace/river-supply-chain.jpg" },
      { name: "Wheat", image: "/images/marketplace/farm-activity-2.jpg" }
    ]
  },
  {
    slug: "livestock",
    name: "Livestock",
    items: [
      { name: "Poultry", image: "/images/crops/poultry.jpg" },
      { name: "Goats", image: "/images/marketplace/farm-activity-2.jpg" },
      { name: "Sheep", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Cattle", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Eggs", image: "/images/crops/eggs.jpg" },
      { name: "Guinea Fowl", image: "/images/crops/poultry.jpg" },
      { name: "Fish", image: "/images/marketplace/river-supply-chain.jpg" },
      { name: "Animal Feed", image: "/images/crops/inputs.jpg" }
    ]
  },
  {
    slug: "farm-inputs",
    name: "Farm Inputs",
    items: [
      { name: "Seeds", image: "/images/crops/inputs.jpg" },
      { name: "Fertilizer", image: "/images/marketplace/farm-inputs.jpg" },
      { name: "Agro Chemicals", image: "/images/crops/inputs.jpg" },
      { name: "Farm Tools", image: "/images/marketplace/farm-activity-2.jpg" },
      { name: "Organic Compost", image: "/images/crops/inputs.jpg" },
      { name: "Irrigation Supplies", image: "/images/marketplace/farm-inputs.jpg" },
      { name: "Protective Gear", image: "/images/marketplace/farm-activity-2.jpg" },
      { name: "Animal Feed", image: "/images/crops/inputs.jpg" }
    ]
  },
  {
    slug: "packaging",
    name: "Packaging",
    items: [
      { name: "Crates", image: "/images/marketplace/produce-packaging.jpg" },
      { name: "Sacks", image: "/images/crops/packaging.jpg" },
      { name: "Labels", image: "/images/marketplace/produce-packaging.jpg" },
      { name: "Storage Bags", image: "/images/crops/packaging.jpg" },
      { name: "Cartons", image: "/images/marketplace/produce-packaging.jpg" },
      { name: "Net Bags", image: "/images/crops/packaging.jpg" },
      { name: "Cold Boxes", image: "/images/crops/logistics.jpg" },
      { name: "Pallets", image: "/images/marketplace/produce-packaging.jpg" }
    ]
  },
  {
    slug: "logistics",
    name: "Logistics",
    items: [
      { name: "Transport", image: "/images/marketplace/logistics-truck.jpg" },
      { name: "Aggregation", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Cold Storage", image: "/images/crops/logistics.jpg" },
      { name: "Delivery Services", image: "/images/marketplace/river-supply-chain.jpg" },
      { name: "Farm Pickup", image: "/images/marketplace/logistics-truck.jpg" },
      { name: "Bulk Haulage", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Warehousing", image: "/images/crops/logistics.jpg" },
      { name: "Route Support", image: "/images/marketplace/river-supply-chain.jpg" }
    ]
  },
  {
    slug: "farm-services",
    name: "Farm Services",
    items: [
      { name: "Advisory", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Land Preparation", image: "/images/marketplace/farm-activity-2.jpg" },
      { name: "Mechanization", image: "/images/marketplace/farm-inputs.jpg" },
      { name: "Farm Support", image: "/images/farmers/farmer-5.jpg" },
      { name: "Harvest Labour", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Soil Testing", image: "/images/crops/inputs.jpg" },
      { name: "Extension Support", image: "/images/farmers/farmer-5.jpg" },
      { name: "Irrigation Setup", image: "/images/marketplace/farm-inputs.jpg" }
    ]
  }
];

export function MarketplaceCategoryShowcase() {
  const [activeSlug, setActiveSlug] = useState(marketplaceShowcaseData[0].slug);
  const activeCategory = marketplaceShowcaseData.find((category) => category.slug === activeSlug) ?? marketplaceShowcaseData[0];

  return (
    <section className="bg-gradient-to-b from-white via-leaf-50/55 to-white py-12 sm:py-14" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-[18rem] sm:max-w-4xl">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace</p>
          <h2 id="marketplace-category-showcase-title" className="mt-3 break-words text-2xl font-black text-ink sm:text-4xl">
            Shop @ Farmer&apos;s Market
          </h2>
          <p className="mt-4 text-base leading-7 text-ink/68 sm:text-lg">
            Browse fresh produce, farm inputs, livestock, packaging, logistics, and agricultural services from Ghana Growers members.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.72fr_2.28fr] lg:items-start">
          <aside className="rounded-lg border border-leaf-900/10 bg-white/95 p-3 shadow-sm">
            <h3 className="px-2 py-2 text-sm font-black uppercase tracking-wide text-ink/55">Marketplace Categories</h3>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0" role="tablist" aria-label="Marketplace categories">
              {marketplaceShowcaseData.map((category) => {
                const isActive = category.slug === activeSlug;

                return (
                  <button
                    key={category.slug}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`category-panel-${category.slug}`}
                    className={`focus-ring flex shrink-0 items-center justify-between gap-4 rounded-md px-3 py-3 text-left text-sm font-black transition lg:w-full ${
                      isActive
                        ? "bg-leaf-600 text-white shadow-soft"
                        : "bg-white text-ink/72 ring-1 ring-leaf-900/10 hover:bg-white hover:text-leaf-700 hover:shadow-sm"
                    }`}
                    onClick={() => setActiveSlug(category.slug)}
                  >
                    <span>{category.name}</span>
                    <span className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : "bg-leaf-600/35"}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </aside>

          <div
            id={`category-panel-${activeCategory.slug}`}
            role="tabpanel"
            className="rounded-lg border border-leaf-900/10 bg-white p-4 shadow-soft"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Featured Products</p>
              <h3 className="mt-1 text-2xl font-black text-ink">{activeCategory.name}</h3>
            </div>

            <div className="mt-5 grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeCategory.items.slice(0, 8).map((item) => (
                <article
                  key={`${activeCategory.slug}-${item.name}`}
                  className="group overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <SafeImage
                    src={item.image}
                    alt={`${item.name} available through Ghana Growers`}
                    width={420}
                    height={300}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 25vw, (min-width: 480px) 50vw, 100vw"
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <h4 className="px-4 py-3 text-base font-black text-ink">{item.name}</h4>
                </article>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Link href="/marketplace" className="focus-ring inline-flex items-center justify-center rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700">
                Browse Full Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
