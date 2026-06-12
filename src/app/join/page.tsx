import { ArrowRight, Store, Tractor, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";

export const metadata = {
  title: "Join Ghana Growers",
  description: "Join Ghana Growers as a farmer, buyer, or agricultural supplier in Ghana."
};

const joinOptions = [
  {
    title: "Farmer",
    description: "Create a farmer profile, showcase your produce, and connect with buyers.",
    buttonLabel: "Join as Farmer",
    href: "/join/farmer",
    icon: Tractor
  },
  {
    title: "Buyer",
    description: "Find produce, post buyer requests, and connect with farmers and suppliers.",
    buttonLabel: "Join as Buyer",
    href: "/join/buyer",
    icon: Store
  },
  {
    title: "Supplier",
    description: "Promote farm inputs, equipment, logistics, and agricultural services.",
    buttonLabel: "Join as Supplier",
    href: "/supplier-registration",
    icon: Truck
  }
];

export default function JoinPage() {
  return (
    <>
      <PrelaunchHeader />
      <PageHero
        eyebrow="Join Ghana Growers"
        title="Join Ghana Growers"
        description="Choose how you want to be part of Ghana's agricultural network."
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
                    {option.buttonLabel} <ArrowRight size={17} aria-hidden="true" />
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <PrelaunchFooter />
    </>
  );
}
