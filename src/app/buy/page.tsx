import { PackageSearch, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Buy",
  description: "Buy fresh produce and farm inputs through Ghana Growers.",
  path: "/buy"
});

const buyCards = [
  {
    title: "Buy Fresh Produce",
    description: "Buy directly from trusted farmers.",
    href: "/marketplace",
    cta: "Browse Produce",
    icon: Sprout
  },
  {
    title: "Buy Farm Inputs",
    description: "Find seeds, fertilizer, tools and agricultural supplies.",
    href: "/supplier-directory",
    cta: "Find Suppliers",
    icon: PackageSearch
  }
];

export default function BuyPage() {
  return (
    <>
      <PageHero
        eyebrow="Buy"
        title="Buy Through Ghana Growers"
        description="Choose what you want to source from Ghana's trusted agricultural network."
        variant="compact"
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {buyCards.map((card) => {
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
