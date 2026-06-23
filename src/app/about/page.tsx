import { Building2, Handshake, MapPin, Sprout, Store, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About Ghana Growers",
  description: "Learn what Ghana Growers is, why it exists, and how it helps farmers, buyers, suppliers, cooperatives, NGOs, and agribusinesses in Ghana.",
  path: "/about"
});

const helpCards = [
  {
    title: "For Farmers",
    description: "Farmers can show their farm name, location, products, harvest information, and contact route through Ghana Growers. This helps buyers understand who produces what and where supply may be available.",
    icon: Sprout
  },
  {
    title: "For Buyers",
    description: "Buyers can browse farmers, view marketplace listings, submit demand, and ask Ghana Growers to help connect them with suitable farmers or suppliers.",
    icon: UsersRound
  },
  {
    title: "For Suppliers",
    description: "Suppliers can register inputs, equipment, packaging, logistics, storage, finance, and advisory services so farmers and buyers know where to find them.",
    icon: Store
  },
  {
    title: "For Partners",
    description: "Farmer groups, cooperatives, NGOs, aggregators, agribusinesses, and development organizations can work with Ghana Growers to organize better agricultural connections.",
    icon: Handshake
  }
];

const reasons = [
  "Many farmers can produce good crops but struggle to show buyers what is available.",
  "Buyers often need produce from specific regions, quantities, or harvest periods.",
  "Suppliers need a clearer way to reach farmers with inputs, tools, packaging, logistics, and farm services.",
  "Ghana Growers brings this information into one reviewed platform so people can start conversations with better context."
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Ghana Growers"
        title="A practical agricultural network for Ghana"
        description="Ghana Growers helps farmers show what they produce, buyers find supply, and suppliers present useful agricultural products and services across Ghana."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/join">Join Ghana Growers</ButtonLink>
          <ButtonLink href="/partner-with-us" variant="secondary">Partner With Us</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:px-8">
          <div>
            <p className="gg-eyebrow">Who We Are</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Ghana Growers organizes farmer, buyer, and supplier information in one place.</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink/70">
              Ghana Growers is being built as a trusted agricultural platform for Ghana. It brings together farmer profiles, marketplace listings, buyer demand, supplier services, verification information, and Digital Farm tools.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink/70">
              The platform is not a shortcut around good judgement. It gives farmers, buyers, suppliers, and partners a clearer starting point before they discuss quantity, price, quality, delivery, and payment.
            </p>
          </div>
          <aside className="rounded-md border border-leaf-900/10 bg-[#ECE7D1] p-5 shadow-sm">
            <MapPin className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-ink">Built for Ghana</h2>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              Ghana Growers is focused on Ghanaian regions, districts, products, buyer demand, farm inputs, logistics, and practical farm support.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-leaf-50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.32fr_0.68fr] lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
            <Building2 className="text-leaf-700" size={30} aria-hidden="true" />
            <p className="gg-eyebrow mt-4">Parent Organization</p>
            <h2 className="mt-2 text-2xl font-black text-ink">About Emerge Agri Systems</h2>
          </div>
          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-base leading-8 text-ink/70">
              Emerge Agri Systems (E.A.Sy) is the parent organization behind Ghana Growers. E.A.Sy builds practical agricultural systems that help organize farmer records, supplier visibility, buyer demand, market information, and digital support tools.
            </p>
            <p className="mt-4 text-base leading-8 text-ink/70">
              Ghana Growers remains the public-facing platform. It is where farmers, buyers, suppliers, and partners can register, review opportunities, and request connections through a Ghana-focused agricultural network.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#ECE7D1] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="gg-eyebrow">Why Ghana Growers Was Created</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Agricultural connections need better information.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <p className="text-sm leading-7 text-ink/70">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="gg-eyebrow">Who Ghana Growers Helps</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Farmers, buyers, suppliers, and agricultural partners</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {helpCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-ink">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-ink/66">{card.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-ink py-12 text-white sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_0.25fr] lg:px-8">
          <div>
            <p className="gg-eyebrow text-earth-500">Our Vision</p>
            <h2 className="mt-3 text-2xl font-black sm:text-4xl">A Ghanaian agricultural network people can use with confidence.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
              Ghana Growers aims to make it easier to find farmers, source produce, discover suppliers, review buyer demand, and use simple digital farm tools. The work is practical: better profiles, better requests, better follow-up, and clearer trust signals.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/10 p-5">
            <Building2 className="text-earth-500" size={28} aria-hidden="true" />
            <p className="mt-4 text-sm leading-7 text-white/72">
              New farmer, buyer, and supplier records are reviewed before they are published or matched through Ghana Growers.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-ink sm:text-3xl">Join Ghana Growers</h2>
          <p className="mt-3 text-sm leading-7 text-ink/66">
            Register as a farmer, buyer, or supplier so Ghana Growers can review your details and prepare the right public profile, request, or connection workflow.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/join">Join Ghana Growers</ButtonLink>
            <ButtonLink href="/contact" variant="light">Contact Us</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
