import { Building2, Handshake, Sprout, Store, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "About",
  description: "Learn about the Ghana Growers mission, vision, and purpose."
};

const values = [
  ["Mission", "To connect Ghana's farmers, buyers, and agricultural suppliers through a trusted digital platform that makes agricultural opportunities easier to discover and follow up."],
  ["Vision", "A more connected Ghanaian agricultural economy where produce, inputs, services, logistics, and market information move with greater trust and less friction."],
  ["Why Ghana Growers exists", "Farmers often struggle to reach reliable buyers, while buyers and suppliers spend time searching for credible agricultural contacts. Ghana Growers exists to organize that connection layer."],
  ["Who we serve", "The platform serves farmers, farmer groups, market traders, processors, restaurants, exporters, suppliers, logistics providers, NGOs, and agribusiness partners."]
];

const audiences = [
  { title: "Farmers", description: "Profiles, marketplace visibility, buyer demand, and practical digital farm tools.", icon: Sprout },
  { title: "Buyers", description: "Farmer discovery, buyer request submissions, market intelligence, and lead support.", icon: UsersRound },
  { title: "Suppliers", description: "Visibility for inputs, equipment, packaging, logistics, storage, finance, and consulting.", icon: Store },
  { title: "Partners", description: "A trusted channel for farmer groups, NGOs, agribusinesses, and support organizations.", icon: Handshake }
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Ghana Growers"
        title="Building trusted digital connections for Ghana agriculture"
        description="Ghana Growers exists to make agricultural trade easier, more transparent, and more useful for the people who grow, buy, supply, package, transport, and support food systems."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/join">Join Ghana Growers</ButtonLink>
          <ButtonLink href="/partner-with-us" variant="secondary">
            Partner With Us
          </ButtonLink>
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Our purpose</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">A practical network for agricultural trust and market access</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              Ghana Growers brings farmer profiles, buyer demand, supplier visibility, marketplace listings, and digital farm tools into one organized platform for Ghana&apos;s agricultural community.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {values.map(([title, body]) => (
              <div key={title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6">
                <h2 className="text-xl font-black text-ink">{title}</h2>
                <p className="mt-3 leading-7 text-ink/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-earth-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Who Ghana Growers serves</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Built around real agricultural roles</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <article key={audience.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-ink">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/64">{audience.description}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 rounded-md bg-ink p-6 text-white sm:p-8">
            <Building2 className="text-earth-400" size={30} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black">Trust grows through reviewed information.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
              Ghana Growers focuses on clearer profiles, reviewed records, better request information, and practical follow-up. The platform does not replace due diligence, but it gives people a better starting point for agricultural connections.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
