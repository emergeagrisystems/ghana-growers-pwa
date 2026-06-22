import { Sprout, Store } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SectionHeader } from "@/components/SectionHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sell Through Ghana Growers",
  description: "Register as a farmer or supplier to sell products and agricultural services through Ghana Growers.",
  path: "/services"
});

const sellOptions = [
  {
    title: "Register as Farmer",
    description: "Create a farmer profile, list products, and connect with buyers.",
    href: "/join/farmer",
    cta: "Register as Farmer",
    icon: Sprout
  },
  {
    title: "Register as Supplier",
    description: "Promote farm inputs, equipment, logistics, packaging, and agricultural services.",
    href: "/supplier-registration",
    cta: "Register as Supplier",
    icon: Store
  }
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell"
        title="Sell Through Ghana Growers"
        description="For farmers, suppliers, and agricultural service providers who want to reach buyers and grow visibility through Ghana Growers."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/join/farmer">Register as Farmer</ButtonLink>
          <ButtonLink href="/supplier-registration" variant="secondary">Register as Supplier</ButtonLink>
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Choose how you want to sell" description="Register the right profile so Ghana Growers can review your details and connect you with the right opportunities." />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {sellOptions.map((option) => {
              const Icon = option.icon;
              return (
                <article key={option.href} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-xl font-black text-ink">{option.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{option.description}</p>
                  <div className="mt-5">
                    <ButtonLink href={option.href}>{option.cta}</ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-leaf-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <RegistrationForm title="Tell us how Ghana Growers can help" audience="partner" />
        </div>
      </section>
    </>
  );
}
