import type { Metadata } from "next";
import {
  FoundingFarmerCard,
  MarketplaceLaunchListingCard,
  SuccessStoryLaunchCard,
  SupplierLaunchCard
} from "@/components/launch-collection/LaunchCollectionCards";
import { farmerDirectory } from "@/data/farmers";
import { products } from "@/data/products";
import { supplierDirectory } from "@/data/suppliers";
import type { SuccessStory } from "@/types";

export const metadata: Metadata = {
  title: "Launch Collection Preview",
  robots: {
    index: false,
    follow: false
  }
};

const previewStory: SuccessStory = {
  id: "launch-preview-story",
  slug: "launch-preview-story",
  title: "A grower group prepares for larger buyers",
  category: "Farmers",
  personBusinessName: "Component preview",
  region: "Ashanti Region",
  summary:
    "A vegetable grower group organizes harvest information, product photos and supply details before meeting larger buyers. The story focuses on preparation, trust and clearer communication across the agricultural network.",
  outcome: "Component preview only",
  date: "2026-01-01",
  image: "/images/marketplace/ghana-market-2.jpg",
  status: "Published"
};

type ComponentKey = "farmer" | "supplier" | "listing" | "story";

export default function LaunchCollectionPreviewPage({
  searchParams
}: {
  searchParams?: {
    component?: string;
  };
}) {
  const farmer = farmerDirectory[0];
  const supplier = supplierDirectory[0];
  const listing = products[0];
  const selected = ["farmer", "supplier", "listing", "story"].includes(searchParams?.component ?? "")
    ? (searchParams?.component as ComponentKey)
    : undefined;

  const cards = [
    {
      id: "farmer" as const,
      label: "Founding Farmer",
      node: <FoundingFarmerCard farmer={farmer} />
    },
    {
      id: "supplier" as const,
      label: "Supplier",
      node: <SupplierLaunchCard supplier={supplier} />
    },
    {
      id: "listing" as const,
      label: "Marketplace Listing",
      node: <MarketplaceLaunchListingCard listing={listing} farmer={farmer} />
    },
    {
      id: "story" as const,
      label: "Success Story",
      node: <SuccessStoryLaunchCard story={previewStory} />
    }
  ];
  const visibleCards = selected ? cards.filter((card) => card.id === selected) : cards;
  const pageTitle = selected ? `${visibleCards[0]?.label} Card` : "Launch Collection Cards";

  return (
    <main className="bg-ivory py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="gg-eyebrow">Dev Preview</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">{pageTitle}</h1>
          <p className="mt-4 text-sm leading-7 text-ink/65">
            Internal review surface for Ghana Growers launch collection cards.
          </p>
        </div>

        <div className={`mt-12 grid gap-8 ${selected ? "max-w-sm" : "md:grid-cols-2 xl:grid-cols-4"}`}>
          {visibleCards.map((card) => (
            <section key={card.id}>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-earth-700">{card.label}</p>
              {card.node}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
