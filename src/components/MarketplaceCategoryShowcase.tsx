"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { productImageForListing } from "@/lib/productDisplay";
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
    description: "Vegetables, fruits, tubers, cereals, and fresh crops from Ghanaian farms.",
    image: "/images/marketplace/ghana-market-1.jpg",
    href: "/marketplace?category=fresh-produce",
    matches: ["vegetable", "fruit", "tuber", "cereal", "crop", "produce", "dairy"]
  },
  {
    title: "Farm Inputs",
    description: "Seeds, fertilizer, tools, agrochemicals, irrigation items, and farm supplies.",
    image: "/images/marketplace/farm-inputs.jpg",
    href: "/marketplace?category=farm-inputs",
    matches: ["input", "seed", "fertilizer", "agro", "chemical", "tool", "equipment", "irrigation"]
  },
  {
    title: "Farm Services",
    description: "Advisory, mechanization, land preparation, field support, and farm operations.",
    image: "/images/marketplace/farm-activity-2.jpg",
    href: "/marketplace?category=farm-services",
    matches: ["service", "advisory", "consulting", "mechanization", "land", "support"]
  },
  {
    title: "Livestock",
    description: "Poultry, eggs, goats, sheep, cattle, fish, and animal production opportunities.",
    image: "/images/crops/poultry.jpg",
    href: "/marketplace?category=livestock",
    matches: ["livestock", "poultry", "egg", "goat", "sheep", "cattle", "fish", "animal"]
  },
  {
    title: "Logistics & Transport",
    description: "Transport, aggregation, delivery support, cold chain, and produce movement.",
    image: "/images/marketplace/logistics-truck.jpg",
    href: "/marketplace?category=logistics",
    matches: ["logistics", "transport", "delivery", "haulage", "aggregation", "cold", "storage"]
  },
  {
    title: "Packaging & Storage",
    description: "Crates, sacks, cartons, labels, storage bags, warehousing, and handling support.",
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

function recentListings(listings: Product[]) {
  return [...listings]
    .sort((a, b) => new Date(b.datePosted || 0).getTime() - new Date(a.datePosted || 0).getTime())
    .slice(0, 4);
}

export function MarketplaceCategoryShowcase({ listings = [] }: MarketplaceCategoryShowcaseProps) {
  const latestListings = recentListings(listings);

  return (
    <section className="bg-[#ECE7D1] py-12 sm:py-16" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[19rem] sm:max-w-3xl">
            <p className="gg-eyebrow">Marketplace</p>
            <h2 id="marketplace-category-showcase-title" className="mt-3 break-words text-2xl font-black text-ink sm:text-4xl">
              Explore the Marketplace
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/68 sm:text-lg">
              Browse produce, inputs, livestock, logistics, packaging, storage, and agricultural services from Ghana Growers members.
            </p>
          </div>
          <Link href="/marketplace" className="gg-text-link w-full sm:w-auto">
            Browse Marketplace <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

        <div className="mt-10 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="gg-eyebrow">Recently Added</p>
              <h3 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Latest marketplace listings</h3>
            </div>
            <Link href="/marketplace" className="text-sm font-black text-leaf-700 hover:text-leaf-900">
              Browse Marketplace
            </Link>
          </div>

          {latestListings.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latestListings.map((listing) => (
                <Link
                  key={listing.id}
                  href="/marketplace"
                  className="group overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <SafeImage
                    src={productImageForListing(listing.name, listing.category, listing.image)}
                    alt={`${listing.name} marketplace listing`}
                    width={420}
                    height={300}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">{listing.category}</p>
                    <h4 className="mt-1 text-lg font-black text-ink">{listing.name}</h4>
                    <p className="mt-2 text-sm font-semibold text-ink/58">{listing.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="gg-empty-state mt-6">
              <h4 className="gg-card-title">No records available yet</h4>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                Ghana Growers is currently onboarding farmers, suppliers, and marketplace listings.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Link href="/marketplace" className="gg-button-primary">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
