"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { Product } from "@/types";

type MarketplaceCategoryShowcaseProps = {
  listings?: Product[];
};

type HomepageMarketplaceCategory = {
  title: string;
  description: string;
  image: string;
  href: string;
  matches: string[];
};

const marketplaceCategories: HomepageMarketplaceCategory[] = [
  {
    title: "Fresh Produce",
    description: "Fresh fruits, vegetables, cereals, root crops, and more.",
    image: "/images/marketplace/ghana-market-1.jpg",
    href: "/marketplace?category=fresh-produce",
    matches: ["vegetable", "fruit", "tuber", "cereal", "crop", "produce", "dairy"]
  },
  {
    title: "Farm Inputs",
    description: "Seeds, fertilizer, irrigation, agrochemicals, and more.",
    image: "/images/marketplace/farm-inputs.jpg",
    href: "/marketplace?category=farm-inputs",
    matches: ["input", "seed", "fertilizer", "agro", "chemical", "tool", "equipment", "irrigation"]
  },
  {
    title: "Farm Services",
    description: "Mechanization, advisory, labour support, and more.",
    image: "/images/marketplace/farm-activity-2.jpg",
    href: "/marketplace?category=farm-services",
    matches: ["service", "advisory", "consulting", "mechanization", "land", "support"]
  },
  {
    title: "Livestock",
    description: "Poultry, goats, cattle, fish, and more.",
    image: "/images/crops/poultry.jpg",
    href: "/marketplace?category=livestock",
    matches: ["livestock", "poultry", "egg", "goat", "sheep", "cattle", "fish", "animal"]
  },
  {
    title: "Logistics & Transport",
    description: "Transport, aggregation, cold chain, delivery, and more.",
    image: "/images/marketplace/logistics-truck.jpg",
    href: "/marketplace?category=logistics",
    matches: ["logistics", "transport", "delivery", "haulage", "aggregation", "cold", "storage"]
  },
  {
    title: "Packaging & Storage",
    description: "Packaging, storage solutions, warehouse services, and more.",
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
    <section className="bg-white py-20 sm:py-24" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
            <p className="gg-eyebrow">Marketplace</p>
            <h2 id="marketplace-category-showcase-title" className="mt-3 break-words text-2xl font-black text-ink sm:text-4xl">
              Explore the Marketplace
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/68 sm:text-lg">
              Browse produce, inputs, livestock, logistics, packaging, storage, and agricultural services from Ghana Growers members.
            </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {marketplaceCategories.map((category) => {
            const listingCount = categoryListingCount(category, listings);

            return (
              <Link
                key={category.title}
                href={category.href}
                className="group overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="relative">
                  <SafeImage
                    src={category.image}
                    alt={`${category.title} marketplace category`}
                    width={760}
                    height={460}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 shadow-sm">
                    <PackageCheck size={15} aria-hidden="true" />
                    {listingCount} {listingCount === 1 ? "listing" : "listings"}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-2xl font-black text-ink group-hover:text-leaf-700">{category.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/66">{category.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/marketplace" className="gg-button-primary">
            Browse Marketplace <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
