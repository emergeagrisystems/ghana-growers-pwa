import { ButtonLink } from "@/components/ButtonLink";
import { MarketplaceListings } from "@/components/MarketplaceListings";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { productCategories, products } from "@/data/products";

export const metadata = {
  title: "Marketplace | Ghana Growers",
  description:
    "Browse Ghana Growers marketplace listings for tomatoes, onions, maize, cassava, yam, plantain, pepper, rice, eggs, poultry, farm supply, and verified seller leads across Ghana."
};

export default function MarketplacePage() {
  return (
    <>
      <section className="overflow-hidden border-b border-leaf-900/10 bg-gradient-to-br from-white via-leaf-50/70 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
              Source farm produce and trusted agricultural supply across Ghana
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              Browse available produce, livestock, buyer-ready quantities, seller locations, and WhatsApp inquiry paths for faster agricultural trade.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="#marketplace-listings">Browse Listings</ButtonLink>
              <ButtonLink href="/join/buyer" variant="secondary">Post Buyer Request</ButtonLink>
            </div>
          </div>
          <div className="relative">
            <SafeImage
              src="/images/marketplace/ghana-market-1.jpg"
              alt="Fresh produce at a Ghana agricultural market"
              width={720}
              height={480}
              priority
              fallbackSrc="/images/marketplace/fresh-tomatoes.jpg"
              className="h-72 w-full rounded-md border border-white/80 object-cover shadow-soft sm:h-96"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-md border border-white/70 bg-white/92 p-4 shadow-soft backdrop-blur">
              <p className="text-sm font-black text-ink">Direct agricultural sourcing</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                Compare listings, filter by region, and contact sellers through WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceListings products={products} />

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <SectionHeader
              eyebrow="Marketplace Resources"
              title="Helpful ways to source, compare, and connect"
              description="Use these supporting tools when you need directories, buyer demand, market intelligence, or WhatsApp communities."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <ButtonLink href="/farmer-directory" variant="light">Farmer Directory</ButtonLink>
              <ButtonLink href="/supplier-directory" variant="light">Supplier Directory</ButtonLink>
              <ButtonLink href="/buyer-requests" variant="light">Buyer Requests</ButtonLink>
              <ButtonLink href="/market-intelligence" variant="light">Market Intelligence</ButtonLink>
              <ButtonLink href="/whatsapp-communities" variant="light">WhatsApp Communities</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Marketplace categories" description="Browse the main product and service groups Ghana Growers is organizing for buyers, sellers, processors, exporters, restaurants, and farm suppliers." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productCategories.map((category) => (
              <div key={category.slug} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                <SafeImage src={category.image} alt={`${category.name} marketplace category`} width={240} height={150} className="h-28 w-full rounded-md object-cover" />
                <h2 className="mt-4 font-black text-ink">{category.name}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
