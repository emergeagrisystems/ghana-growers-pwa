import { Building2, Handshake, Sprout, Store, Truck, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Partner With Us",
  description: "Partnership opportunities with Ghana Growers for NGOs, agribusinesses, logistics firms, agencies, investors, and suppliers.",
  path: "/partner-with-us"
});

const partners = [
  {
    title: "Farmer groups",
    description: "Bring organized farmers into a reviewed network with clearer products, location, and supply information.",
    icon: Sprout
  },
  {
    title: "NGOs",
    description: "Support farmer onboarding, training, market access, data quality, and responsible agricultural programs.",
    icon: Handshake
  },
  {
    title: "Agribusinesses",
    description: "Connect with farmers, suppliers, buyers, logistics partners, and regional market opportunities.",
    icon: Building2
  },
  {
    title: "Suppliers",
    description: "Reach farmers and buyers with inputs, equipment, packaging, transport, storage, finance, and advisory services.",
    icon: Store
  },
  {
    title: "Buyers",
    description: "Share demand, source produce, and help Ghana Growers understand real market needs.",
    icon: UsersRound
  },
  {
    title: "Logistics partners",
    description: "Support movement of produce, aggregation, cold chain, packaging, and delivery coordination.",
    icon: Truck
  }
];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner with us"
        title="Partner with Ghana Growers to strengthen agricultural trade"
        description="We welcome partners who can support farmers, buyers, suppliers, logistics, training, investment, market access, and agricultural innovation."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact">Contact Ghana Growers</ButtonLink>
          <ButtonLink href="/supplier-registration" variant="secondary">Register as Supplier</ButtonLink>
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Partnership focus</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Work with Ghana Growers where trust and market access meet</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              Ghana Growers is suited for organizations that want to improve farmer visibility, buyer demand, supplier access, market information, and agricultural coordination across Ghana.
            </p>
            <div className="mt-6 grid gap-4">
              {partners.map((partner) => {
                const Icon = partner.icon;
                return (
                  <article key={partner.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                    <div className="flex gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-black text-ink">{partner.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/64">{partner.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <RegistrationForm title="Start a partnership conversation" audience="partner" />
        </div>
      </section>
    </>
  );
}
