"use client";

import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";

type HomepageMarketplaceCategory = {
  title: string;
  summary: string;
  href: string;
  image: string;
};

const marketplaceCategories: HomepageMarketplaceCategory[] = [
  {
    title: "Fresh Produce",
    summary: "Fresh fruits, vegetables, cereals and root crops.",
    href: "/marketplace?category=fresh-produce",
    image: "/images/marketplace/ghana-market-1.jpg"
  },
  {
    title: "Farm Inputs",
    summary: "Seeds, fertilizer and crop support.",
    href: "/marketplace?category=farm-inputs",
    image: "/images/marketplace/farm-inputs.jpg"
  },
  {
    title: "Farm Services",
    summary: "Mechanization, advice and labour support.",
    href: "/marketplace?category=farm-services",
    image: "/images/marketplace/farm-activity-2.jpg"
  },
  {
    title: "Livestock",
    summary: "Poultry, goats, cattle and fish.",
    href: "/marketplace?category=livestock",
    image: "/images/crops/poultry.jpg"
  },
  {
    title: "Logistics & Transport",
    summary: "Transport, aggregation and delivery.",
    href: "/marketplace?category=logistics",
    image: "/images/marketplace/logistics-truck.jpg"
  },
  {
    title: "Packaging & Storage",
    summary: "Packaging, storage and warehouse support.",
    href: "/marketplace?category=packaging-storage",
    image: "/images/marketplace/produce-packaging.jpg"
  }
];

export function MarketplaceCategoryShowcase() {
  return (
    <section className="overflow-hidden bg-white py-20 sm:py-24 lg:py-[104px]" aria-labelledby="marketplace-category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="gg-eyebrow text-earth-700/70">Marketplace</p>
          <h2 id="marketplace-category-showcase-title" className="mt-3 gg-section-title">
            Explore the Marketplace
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg">
            Browse fresh produce, farm inputs, livestock and trusted agricultural services across Ghana.
          </p>
        </div>

        <div className="mt-12 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {marketplaceCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-leaf-600/25 hover:shadow-soft"
            >
              <SafeImage
                src={category.image}
                alt={`${category.title} marketplace category`}
                width={720}
                height={420}
                fallbackKind="marketplace"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-32 w-full object-cover transition duration-200 ease-out group-hover:scale-[1.03] sm:h-36"
              />
              <div className="min-w-0 p-5">
                <h3 className="text-lg font-black leading-tight text-ink transition group-hover:text-leaf-700">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
                  {category.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
