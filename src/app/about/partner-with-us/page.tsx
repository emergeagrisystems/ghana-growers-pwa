import { Building2, Handshake, PackageCheck, Sprout, Store, Truck, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Partner With Us",
  description: "Partner with Ghana Growers on farmer onboarding, buyer demand, supplier visibility, logistics, market access, and agricultural support in Ghana.",
  path: "/partner-with-us"
});

const partners = [
  {
    title: "Farmer groups and cooperatives",
    description: "Work with Ghana Growers to organize farmer records, products, locations, photos, and public profiles for groups that are ready for market visibility.",
    icon: Sprout
  },
  {
    title: "NGOs and development organizations",
    description: "Support farmer onboarding, training follow-up, verification, data quality, and practical market access work without building a separate directory from scratch.",
    icon: Handshake
  },
  {
    title: "Agribusinesses and aggregators",
    description: "Share real demand, identify farmer supply, coordinate produce sourcing, and help Ghana Growers understand volumes, regions, and quality requirements.",
    icon: Building2
  },
  {
    title: "Input suppliers",
    description: "List seeds, fertilizer, agrochemicals, irrigation, farm tools, packaging, storage, finance, and advisory services where farmers and buyers can find them.",
    icon: Store
  },
  {
    title: "Buyers and processors",
    description: "Submit buyer requests, explain product specifications, and help connect demand to farmers, farmer groups, and available marketplace listings.",
    icon: UsersRound
  },
  {
    title: "Logistics and storage partners",
    description: "Support aggregation, transport, cold storage, warehousing, packaging, route planning, and delivery conversations linked to real produce demand.",
    icon: Truck
  }
];

const ways = [
  "Onboard farmers, suppliers, or buyer groups into Ghana Growers.",
  "Share buyer demand so Ghana Growers can match it with farmers or listings.",
  "Support verification, farmer photos, profile completeness, or field follow-up.",
  "Provide services such as transport, packaging, storage, inputs, or advisory support.",
  "Sponsor practical content, training, or Farmer Hub resources for farmers."
];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner With Us"
        title="Work with Ghana Growers where farmers, buyers, and suppliers meet"
        description="Partnership opportunities with Ghana Growers are handled through Emerge Agri Systems (E.A.Sy), the parent organization behind the platform. We welcome partners who can help organize farmer information, source produce, support suppliers, improve logistics, or strengthen practical market access in Ghana."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact">Contact Ghana Growers</ButtonLink>
          <ButtonLink href="/become-a-supplier" variant="secondary">Become a Supplier</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div>
            <p className="gg-eyebrow">Who We Partner With</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Partners that work close to Ghanaian agriculture</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              The best Ghana Growers partnerships are practical. They help farmers become easier to find, help buyers explain what they need, or help suppliers and service providers support agricultural trade.
            </p>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              Emerge Agri Systems coordinates partnership conversations so Ghana Growers can stay focused on being the public platform farmers, buyers, and suppliers use.
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

          <div className="grid gap-6">
            <section className="rounded-md border border-leaf-900/10 bg-[#ECE7D1] p-5 shadow-sm">
              <PackageCheck className="text-leaf-700" size={26} aria-hidden="true" />
              <p className="gg-eyebrow mt-4">Ways To Partner</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Make the platform more useful with real records and real demand.</h2>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-ink/70">
                {ways.map((way) => (
                  <li key={way} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-earth-500" aria-hidden="true" />
                    <span>{way}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <p className="gg-eyebrow">Benefits Of Partnership</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Better agricultural follow-up starts with better information.</h2>
              <p className="mt-3 text-sm leading-7 text-ink/66">
                Partners can help Ghana Growers keep records accurate, improve farmer visibility, organize buyer demand, and connect services such as inputs, transport, packaging, and storage to the people who need them.
              </p>
            </section>

            <RegistrationForm title="Start a partnership conversation" audience="partner" />
          </div>
        </div>
      </section>
    </>
  );
}
