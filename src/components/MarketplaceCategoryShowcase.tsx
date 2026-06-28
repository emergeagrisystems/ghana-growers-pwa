"use client";

import Link from "next/link";
import { Beef, Package, Sprout, Tractor, Truck, Wheat } from "lucide-react";

type HomepageMarketplaceCategory = {
  title: string;
  summary: string;
  href: string;
  icon: typeof Sprout;
  iconClassName: string;
};

const marketplaceCategories: HomepageMarketplaceCategory[] = [
  {
    title: "Fresh Produce",
    summary: "Fruits, vegetables, cereals and root crops.",
    href: "/marketplace?category=fresh-produce",
    icon: Wheat,
    iconClassName: "bg-leaf-50 text-leaf-700 ring-leaf-900/10"
  },
  {
    title: "Farm Inputs",
    summary: "Seeds, fertilizer and crop support.",
    href: "/marketplace?category=farm-inputs",
    icon: Sprout,
    iconClassName: "bg-mist text-leaf-700 ring-leaf-900/10"
  },
  {
    title: "Farm Services",
    summary: "Mechanization, advice and labour support.",
    href: "/marketplace?category=farm-services",
    icon: Tractor,
    iconClassName: "bg-earth-500/25 text-earth-700 ring-earth-700/10"
  },
  {
    title: "Livestock",
    summary: "Poultry, goats, cattle and fish.",
    href: "/marketplace?category=livestock",
    icon: Beef,
    iconClassName: "bg-earth-50 text-earth-700 ring-earth-700/10"
  },
  {
    title: "Logistics & Transport",
    summary: "Transport, aggregation and delivery.",
    href: "/marketplace?category=logistics",
    icon: Truck,
    iconClassName: "bg-leaf-600/10 text-leaf-700 ring-leaf-900/10"
  },
  {
    title: "Packaging & Storage",
    summary: "Packaging, storage and warehouse support.",
    href: "/marketplace?category=packaging-storage",
    icon: Package,
    iconClassName: "bg-earth-500/20 text-earth-700 ring-earth-700/10"
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

        <div className="mt-10 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketplaceCategories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.title}
                href={category.href}
                className="group min-w-0 rounded-md border border-leaf-900/10 bg-white p-5 shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-leaf-600/25 hover:shadow-soft"
              >
                <span className={`gg-icon h-11 w-11 ${category.iconClassName}`}>
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-black leading-tight text-ink transition group-hover:text-leaf-700">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
                  {category.summary}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
