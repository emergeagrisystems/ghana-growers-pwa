import { BriefcaseBusiness, ShoppingBasket, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Ghana Growers Services",
  description: "Use Ghana Growers to sell farm products and services, buy produce, or partner with Ghanaian agricultural businesses.",
  path: "/services"
});

const serviceCards = [
  {
    title: "Sell Through Ghana Growers",
    description: "Create a farmer or supplier profile so buyers can find what you produce or provide.",
    href: "/services/farmers",
    cta: "Start Selling",
    icon: Sprout
  },
  {
    title: "Buy Through Ghana Growers",
    description: "Browse marketplace categories, find farmers, and submit produce demand for Ghana Growers to review.",
    href: "/services/buy",
    cta: "Start Buying",
    icon: ShoppingBasket
  },
  {
    title: "Business Services",
    description: "Work with Ghana Growers on farmer groups, supplier visibility, buyer sourcing, and agricultural partnerships.",
    href: "/partner-with-us",
    cta: "Partner With Us",
    icon: BriefcaseBusiness
  }
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="How Ghana Growers can help"
        description="Choose the path that matches what you want to do: sell, buy, or build agricultural partnerships across Ghana."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/services/farmers">Sell</ButtonLink>
          <ButtonLink href="/services/buy" variant="secondary">
            Buy
          </ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {serviceCards.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.title} className="rounded-md border border-leaf-900/10 bg-earth-50 p-6 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-700 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-2xl font-black text-ink">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/66">{card.description}</p>
                  <div className="mt-6">
                    <ButtonLink href={card.href}>{card.cta}</ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
