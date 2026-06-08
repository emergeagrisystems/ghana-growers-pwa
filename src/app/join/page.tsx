import { ArrowRight, Store, Tractor, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "Join Ghana Growers",
  description: "Join Ghana Growers as a farmer, buyer, or agricultural supplier in Ghana."
};

const joinOptions = [
  {
    title: "Join as Farmer",
    description: "Register your farm, products, region, and harvest availability so buyers can discover you.",
    href: "/join/farmer",
    icon: Tractor
  },
  {
    title: "Join as Buyer",
    description: "Share sourcing needs, preferred products, locations, and buying volumes for Ghanaian produce.",
    href: "/join/buyer",
    icon: Store
  },
  {
    title: "Join as Supplier",
    description: "List your agricultural inputs, services, coverage area, and contact details for farmers and buyers.",
    href: "/join/supplier",
    icon: Truck
  }
];

export default function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="Join Ghana Growers"
        title="Choose how you want to join the agricultural network"
        description="Ghana Growers connects farmers, buyers, and suppliers through practical directories, buyer requests, WhatsApp follow-up, and farmer tools."
      />

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {joinOptions.map((option) => {
            const Icon = option.icon;

            return (
              <article key={option.href} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6 shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                  <Icon size={23} aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-ink">{option.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink/65">{option.description}</p>
                <div className="mt-6">
                  <ButtonLink href={option.href}>
                    {option.title} <ArrowRight size={17} aria-hidden="true" />
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
