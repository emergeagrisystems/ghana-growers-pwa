import { PackageCheck, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sell",
  description: "Sell harvests, agricultural products, and farm services through Ghana Growers.",
  path: "/sell"
});

const sellCards = [
  {
    title: "Sell Your Harvest",
    description: "Sell fruits, vegetables, grains and other farm produce.",
    href: "/join/farmer",
    cta: "Join as Farmer",
    icon: Sprout
  },
  {
    title: "Sell Products & Services",
    description: "Sell seeds, fertilizer, equipment or agricultural services.",
    href: "/join/supplier",
    cta: "Join as Supplier",
    icon: PackageCheck
  }
];

export default function SellPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell"
        title="Sell Through Ghana Growers"
        description="Choose how you want buyers and agricultural partners to find what you offer."
        variant="compact"
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {sellCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="rounded-md border border-leaf-900/10 bg-earth-50 p-6 shadow-soft sm:p-8">
                <span className="gg-icon bg-leaf-600 text-white ring-leaf-700/10">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-2xl font-black text-ink">{card.title}</h2>
                <p className="mt-3 text-base leading-7 text-ink/68">{card.description}</p>
                <div className="mt-6">
                  <ButtonLink href={card.href}>{card.cta}</ButtonLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
