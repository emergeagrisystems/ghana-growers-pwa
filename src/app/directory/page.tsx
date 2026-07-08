import { Sprout, Store } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Directory",
  description: "Find farmers and agricultural suppliers across Ghana through Ghana Growers.",
  path: "/directory"
});

const directoryCards = [
  {
    title: "Farmer Directory",
    description: "Find verified farmers across Ghana.",
    href: "/farmer-directory",
    cta: "Find Farmers",
    icon: Sprout
  },
  {
    title: "Supplier Directory",
    description: "Find trusted agricultural suppliers.",
    href: "/supplier-directory",
    cta: "Find Suppliers",
    icon: Store
  }
];

export default function DirectoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Directory"
        title="Find Ghana Growers Network Members"
        description="Search trusted farmer and supplier profiles from one simple starting point."
        variant="compact"
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {directoryCards.map((card) => {
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
