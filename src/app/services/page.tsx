import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SectionHeader } from "@/components/SectionHeader";
import { serviceAudiences } from "@/data/services";

export const metadata = {
  title: "Services",
  description: "Services for farmers, buyers, and agricultural suppliers on Ghana Growers."
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Digital tools and trusted connections for Ghana agriculture"
        description="Ghana Growers brings farmers, buyers, and suppliers into one practical platform for produce discovery, buyer access, supply listings, learning, and direct WhatsApp inquiry."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/join/farmer">Join as Farmer</ButtonLink>
          <ButtonLink href="/join/buyer" variant="secondary">
            Join as Buyer
          </ButtonLink>
          <ButtonLink href="/supplier-registration" variant="light">
            Join as Supplier
          </ButtonLink>
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Choose the service path that fits you" description="Each audience gets a dedicated experience while staying connected to the wider agricultural network." />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {serviceAudiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <Link key={audience.href} href={audience.href} className="focus-ring rounded-md border border-leaf-900/10 bg-leaf-50 p-6 transition hover:-translate-y-1 hover:shadow-soft">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-xl font-black text-ink">{audience.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{audience.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-leaf-700">
                    View service <ArrowRight size={17} aria-hidden="true" />
                  </span>
                </Link>
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
