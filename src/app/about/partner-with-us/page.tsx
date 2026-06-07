import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata = {
  title: "Partner With Us",
  description: "Partnership opportunities with Ghana Growers for NGOs, agribusinesses, logistics firms, agencies, investors, and suppliers."
};

const partners = ["NGOs", "Agribusinesses", "Logistics companies", "Government agencies", "Investors", "Suppliers"];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner with us"
        title="Partner with Ghana Growers to strengthen agricultural trade"
        description="We welcome partners who can support farmers, buyers, suppliers, logistics, training, investment, market access, and agricultural innovation."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <SectionHeader title="Partner types" description="The platform can support collaboration across public, private, nonprofit, and investment partners." />
            <div className="mt-6 flex flex-wrap gap-3">
              {partners.map((partner) => (
                <span key={partner} className="rounded-md bg-leaf-50 px-4 py-2 text-sm font-black text-leaf-700">
                  {partner}
                </span>
              ))}
            </div>
          </div>
          <RegistrationForm title="Start a partnership conversation" audience="partner" />
        </div>
      </section>
    </>
  );
}
