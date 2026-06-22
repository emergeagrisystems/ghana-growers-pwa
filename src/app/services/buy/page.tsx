import { PackageSearch, Send, Store } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Buy Through Ghana Growers",
  description: "Browse produce, view marketplace listings, and submit buyer requests through Ghana Growers.",
  path: "/services/buy"
});

const buyActions = [
  {
    title: "Browse Produce",
    description: "Explore available produce, livestock, and agricultural supply listings.",
    href: "/marketplace",
    cta: "Browse Produce",
    icon: Store
  },
  {
    title: "View Marketplace Listings",
    description: "Find products by category, region, availability, and seller.",
    href: "/marketplace",
    cta: "View Marketplace Listings",
    icon: PackageSearch
  },
  {
    title: "Submit Buyer Request",
    description: "Tell Ghana Growers what you need so matching opportunities can be reviewed.",
    href: "/submit-buyer-request",
    cta: "Submit Buyer Request",
    icon: Send
  }
];

export default function BuyServicePage() {
  return (
    <>
      <PageHero
        eyebrow="Buy"
        title="Buy Through Ghana Growers"
        description="For buyers who want to source produce, livestock, farm inputs, and agricultural supply through Ghana Growers."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/marketplace">Open Marketplace</ButtonLink>
          <ButtonLink href="/submit-buyer-request" variant="secondary">Submit Buyer Request</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="What do you want to buy?" description="Most buyers start in the Marketplace, then submit a request if they cannot find the exact product or volume." />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {buyActions.map((action) => {
              const Icon = action.icon;

              return (
                <article key={`${action.title}-${action.href}`} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-xl font-black text-ink">{action.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{action.description}</p>
                  <div className="mt-5">
                    <ButtonLink href={action.href}>{action.cta}</ButtonLink>
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
