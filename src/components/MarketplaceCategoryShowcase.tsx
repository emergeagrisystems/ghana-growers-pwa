"use client";

import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";

type ShowcaseItem = {
  name: string;
  image: string;
  label?: string;
};

type ShowcaseCategory = {
  slug: string;
  name: string;
  items: ShowcaseItem[];
};

const showcaseCategories: ShowcaseCategory[] = [
  {
    slug: "vegetables",
    name: "Vegetables",
    items: [
      { name: "Tomato", image: "/images/marketplace/fresh-tomatoes.jpg" },
      { name: "Onion", image: "/images/marketplace/ghana-market-2.jpg" },
      { name: "Pepper", image: "/images/crops/tomatoes.jpg" },
      { name: "Okra", image: "/images/marketplace/ghana-market-1.jpg" }
    ]
  },
  {
    slug: "fruits",
    name: "Fruits",
    items: [
      { name: "Pineapple", image: "/images/crops/pineapple.jpg" },
      { name: "Mango", image: "/images/marketplace/pineapple-field.jpg" },
      { name: "Orange", image: "/images/marketplace/ghana-market-1.jpg" },
      { name: "Watermelon", image: "/images/marketplace/ghana-market-2.jpg" }
    ]
  },
  {
    slug: "tubers",
    name: "Tubers",
    items: [
      { name: "Cassava", image: "/images/marketplace/yam-cassava.jpg" },
      { name: "Yam", image: "/images/crops/yam.jpg" },
      { name: "Cocoyam", image: "/images/marketplace/yam-cassava.jpg" },
      { name: "Sweet Potato", image: "/images/crops/yam.jpg" }
    ]
  },
  {
    slug: "cereals",
    name: "Cereals",
    items: [
      { name: "Maize", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Rice", image: "/images/marketplace/river-supply-chain.jpg" },
      { name: "Sorghum", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Millet", image: "/images/marketplace/farm-activity-2.jpg" }
    ]
  },
  {
    slug: "livestock",
    name: "Livestock",
    items: [
      { name: "Poultry", image: "/images/crops/poultry.jpg" },
      { name: "Goats", image: "/images/marketplace/farm-activity-2.jpg" },
      { name: "Sheep", image: "/images/marketplace/farm-activity-1.jpg" },
      { name: "Cattle", image: "/images/marketplace/aggregation-cocoa.jpg" }
    ]
  },
  {
    slug: "farm-inputs",
    name: "Farm Inputs",
    items: [
      { name: "Seeds", image: "/images/crops/inputs.jpg" },
      { name: "Fertilizers", image: "/images/marketplace/farm-inputs.jpg" },
      { name: "Agro Chemicals", image: "/images/crops/inputs.jpg" },
      { name: "Farm Tools", image: "/images/marketplace/farm-activity-2.jpg" }
    ]
  },
  {
    slug: "packaging",
    name: "Packaging",
    items: [
      { name: "Crates", image: "/images/marketplace/produce-packaging.jpg" },
      { name: "Sacks", image: "/images/crops/packaging.jpg" },
      { name: "Labels", image: "/images/marketplace/produce-packaging.jpg" },
      { name: "Storage Bags", image: "/images/crops/packaging.jpg" }
    ]
  },
  {
    slug: "logistics",
    name: "Logistics",
    items: [
      { name: "Transport", image: "/images/marketplace/logistics-truck.jpg" },
      { name: "Aggregation", image: "/images/marketplace/aggregation-cocoa.jpg" },
      { name: "Cold Storage", image: "/images/crops/logistics.jpg" },
      { name: "Delivery Services", image: "/images/marketplace/river-supply-chain.jpg" }
    ]
  }
];

export function MarketplaceCategoryShowcase() {
  const [activeSlug, setActiveSlug] = useState(showcaseCategories[0].slug);
  const activeCategory = showcaseCategories.find((category) => category.slug === activeSlug) ?? showcaseCategories[0];

  return (
    <section className="bg-white py-16" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace</p>
          <h2 id="marketplace-category-showcase-title" className="mt-3 text-3xl font-black text-ink sm:text-4xl">
            Explore Marketplace Categories
          </h2>
          <p className="mt-4 text-base leading-7 text-ink/68 sm:text-lg">
            Browse products, inputs, livestock, logistics, and agricultural services across Ghana.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto pb-2" role="tablist" aria-label="Marketplace categories">
          <div className="flex min-w-max gap-2">
            {showcaseCategories.map((category) => {
              const isActive = category.slug === activeSlug;

              return (
                <button
                  key={category.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`category-panel-${category.slug}`}
                  className={`focus-ring rounded-md px-4 py-3 text-sm font-black transition ${
                    isActive
                      ? "bg-leaf-600 text-white shadow-soft"
                      : "bg-leaf-50 text-ink/75 ring-1 ring-leaf-900/10 hover:bg-leaf-100"
                  }`}
                  onClick={() => setActiveSlug(category.slug)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`category-panel-${activeCategory.slug}`}
          role="tabpanel"
          className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {activeCategory.items.map((item) => (
            <article
              key={`${activeCategory.slug}-${item.name}`}
              className="group overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
            >
              <SafeImage
                src={item.image}
                alt={`${item.name} available through Ghana Growers`}
                width={420}
                height={280}
                fallbackKind="marketplace"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <h3 className="text-base font-black text-ink">{item.name}</h3>
                <span className="rounded-md bg-leaf-50 px-2.5 py-1 text-xs font-black text-leaf-700">
                  {item.label ?? activeCategory.name}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
