import Image from "next/image";
import { PackageCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { productCategories, products } from "@/data/products";

export const metadata = {
  title: "Marketplace / Shop",
  description: "Browse Ghana Growers produce, farm input, packaging, and logistics listings."
};

export default function MarketplacePage() {
  return (
    <>
      <PageHero
        eyebrow="Marketplace / Shop"
        title="Browse produce, inputs, packaging, and logistics support"
        description="No checkout yet. Every listing uses direct WhatsApp contact so buyers, farmers, and suppliers can confirm price, availability, volume, and location."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/buyer-requests">View Buyer Requests</ButtonLink>
          <ButtonLink href="/join/buyer" variant="secondary">Post Buyer Demand</ButtonLink>
          <ButtonLink href="/whatsapp-communities" variant="light">Join WhatsApp Communities</ButtonLink>
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Categories" description="Use this structure to organize products and services before a full marketplace backend is added." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productCategories.map((category) => (
              <div key={category.slug} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                <Image src={category.image} alt="" width={240} height={150} className="h-28 w-full rounded-md object-cover" />
                <h2 className="mt-4 font-black text-ink">{category.name}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-earth-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Placeholder products and services" description="These sample listings show how the shop can look before payments, user accounts, and verified listings are introduced." />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft">
                <Image src={product.image} alt="" width={320} height={210} className="h-40 w-full rounded-md object-cover" />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-earth-700">{product.category}</p>
                    <h2 className="mt-1 text-xl font-black text-ink">{product.name}</h2>
                  </div>
                  <PackageCheck className="shrink-0 text-leaf-600" size={23} aria-hidden="true" />
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-ink/70">
                  <div><dt className="font-black text-ink">Seller</dt><dd>{product.seller}</dd></div>
                  <div><dt className="font-black text-ink">Location</dt><dd>{product.location}</dd></div>
                  <div><dt className="font-black text-ink">Unit</dt><dd>{product.unit}</dd></div>
                  <div><dt className="font-black text-ink">Availability</dt><dd>{product.available}</dd></div>
                </dl>
                <WhatsAppButton message={`Hello Ghana Growers, I am interested in ${product.name} from the marketplace.`} className="mt-5 w-full" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
