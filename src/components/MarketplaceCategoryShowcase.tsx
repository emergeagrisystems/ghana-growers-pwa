"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { Product } from "@/types";

type MarketplaceCategoryShowcaseProps = {
  listings?: Product[];
};

type HomepageMarketplaceCategory = {
  title: string;
  summary: string;
  image: string;
  href: string;
  matches: string[];
};

const marketplaceCategories: HomepageMarketplaceCategory[] = [
  {
    title: "Fresh Produce",
    summary: "Vegetables / Fruits / Cereals",
    image: "/images/marketplace/ghana-market-1.jpg",
    href: "/marketplace?category=fresh-produce",
    matches: ["vegetable", "fruit", "tuber", "cereal", "crop", "produce", "dairy"]
  },
  {
    title: "Farm Inputs",
    summary: "Seeds / Fertilizer / Irrigation",
    image: "/images/marketplace/farm-inputs.jpg",
    href: "/marketplace?category=farm-inputs",
    matches: ["input", "seed", "fertilizer", "agro", "chemical", "tool", "equipment", "irrigation"]
  },
  {
    title: "Farm Services",
    summary: "Mechanization / Advisory / Labour",
    image: "/images/marketplace/farm-activity-2.jpg",
    href: "/marketplace?category=farm-services",
    matches: ["service", "advisory", "consulting", "mechanization", "land", "support"]
  },
  {
    title: "Livestock",
    summary: "Poultry / Goats / Cattle",
    image: "/images/crops/poultry.jpg",
    href: "/marketplace?category=livestock",
    matches: ["livestock", "poultry", "egg", "goat", "sheep", "cattle", "fish", "animal"]
  },
  {
    title: "Logistics & Transport",
    summary: "Transport / Aggregation / Cold Chain",
    image: "/images/marketplace/logistics-truck.jpg",
    href: "/marketplace?category=logistics",
    matches: ["logistics", "transport", "delivery", "haulage", "aggregation", "cold", "storage"]
  },
  {
    title: "Packaging & Storage",
    summary: "Packaging / Storage / Warehouse",
    image: "/images/marketplace/produce-packaging.jpg",
    href: "/marketplace?category=packaging-storage",
    matches: ["packaging", "storage", "crate", "sack", "carton", "label", "warehouse"]
  }
];

function normalized(value: string) {
  return value.toLowerCase();
}

function categoryListingCount(category: HomepageMarketplaceCategory, listings: Product[]) {
  return listings.filter((listing) => {
    const searchable = normalized(`${listing.category} ${listing.name} ${listing.description}`);
    return category.matches.some((match) => searchable.includes(match));
  }).length;
}

export function MarketplaceCategoryShowcase({ listings = [] }: MarketplaceCategoryShowcaseProps) {
  return (
    <section className="overflow-hidden bg-white py-24 sm:py-28" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="gg-eyebrow text-earth-700/70">Marketplace</p>
          <h2 id="marketplace-category-showcase-title" className="mt-3 break-words text-2xl font-black text-ink sm:text-3xl">
            Explore the Marketplace
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink/68 sm:text-lg">
            Browse farm products and services across Ghana.
          </p>
        </div>

        <div className="mt-12 grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {marketplaceCategories.slice(0, 4).map((category) => {
            const listingCount = categoryListingCount(category, listings);

            return (
              <Link
                key={category.title}
                href={category.href}
                className="group min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
              >
                <SafeImage
                  src={category.image}
                  alt={`${category.title} marketplace category`}
                  width={760}
                  height={460}
                  fallbackKind="marketplace"
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="h-[6.75rem] w-full object-cover transition duration-300 group-hover:scale-105 sm:h-28"
                />
                <div className="min-w-0 p-3.5">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h3 className="min-w-0 text-lg font-black leading-tight text-ink group-hover:text-leaf-700">{category.title}</h3>
                    <span className="w-fit rounded-md bg-leaf-50 px-2.5 py-1 text-xs font-black text-leaf-700 sm:shrink-0">
                      {listingCount} {listingCount === 1 ? "Listing" : "Listings"}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-ink/58">{category.summary}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/marketplace" className="gg-button-primary">
            Explore All Marketplace Categories <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
