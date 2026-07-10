"use client";

import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";

type HomepageMarketplaceCategory = {
  title: string;
  summary: string;
  href: string;
  image: string;
  action: string;
};

const marketplaceCategories: HomepageMarketplaceCategory[] = [
  {
    title: "Fresh Produce",
    summary: "Fruits, vegetables, cereals, and root crops.",
    href: "/marketplace?category=fresh-produce",
    image: "/images/marketplace/ghana-market-1.jpg",
    action: "Browse"
  },
  {
    title: "Farm Inputs",
    summary: "Seeds, fertilizer, tools, and crop support.",
    href: "/marketplace?category=farm-inputs",
    image: "/images/marketplace/farm-inputs.jpg",
    action: "Browse"
  },
  {
    title: "Farm Services",
    summary: "Mechanization, advisory, and labour support.",
    href: "/marketplace?category=farm-services",
    image: "/images/marketplace/farm-activity-2.jpg",
    action: "Explore"
  },
  {
    title: "Livestock",
    summary: "Poultry, goats, cattle, and fish.",
    href: "/marketplace?category=livestock",
    image: "/images/crops/poultry.jpg",
    action: "Explore"
  },
  {
    title: "Logistics & Transport",
    summary: "Aggregation, transport, and delivery support.",
    href: "/marketplace?category=logistics",
    image: "/images/marketplace/logistics-truck.jpg",
    action: "Find support"
  },
  {
    title: "Packaging & Storage",
    summary: "Packaging, storage, and warehouse support.",
    href: "/marketplace?category=packaging-storage",
    image: "/images/marketplace/produce-packaging.jpg",
    action: "Find support"
  }
];

export function MarketplaceCategoryShowcase() {
  return (
    <section className="overflow-hidden bg-white py-12 sm:py-14 lg:py-16" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.25fr] lg:items-start lg:px-8">
        <div className="lg:sticky lg:top-28">
          <p className="gg-eyebrow text-earth-700/70">Marketplace</p>
          <h2 id="marketplace-category-showcase-title" className="mt-3 gg-section-title">
            Explore the Marketplace
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-ink/68 sm:text-lg">
            Browse produce, inputs, livestock, transport, packaging, and farm services across Ghana.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/marketplace" className="gg-button-primary">
              Explore Marketplace
            </Link>
            <Link href="/submit-buyer-request" className="gg-text-link">
              Request Sourcing Support
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 items-stretch gap-4 sm:grid-cols-2">
          {marketplaceCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              aria-label={`${category.action}: ${category.title}`}
              className="focus-ring group flex h-full min-w-0 gap-4 rounded-md border border-leaf-900/10 bg-earth-50 p-3 shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-leaf-600/25 hover:bg-white hover:shadow-soft"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white bg-white sm:h-24 sm:w-24">
                <SafeImage
                  src={category.image}
                  alt={`${category.title} marketplace category`}
                  width={240}
                  height={240}
                  fallbackKind="marketplace"
                  sizes="96px"
                  className="h-full w-full object-cover transition duration-200 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="min-w-0 py-1">
                <h3 className="text-base font-black leading-tight text-ink transition group-hover:text-leaf-700">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-5 text-ink/58">
                  {category.summary}
                </p>
                <span className="mt-3 inline-flex text-sm font-black text-leaf-700 transition group-hover:text-leaf-900">
                  {category.action} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
