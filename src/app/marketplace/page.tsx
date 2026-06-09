import { ButtonLink } from "@/components/ButtonLink";
import { MarketplaceListings } from "@/components/MarketplaceListings";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { productCategories } from "@/data/products";
import { getFarmersData, getMarketplaceListingsData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace | Ghana Growers",
  description:
    "Browse Ghana Growers marketplace listings for tomatoes, onions, maize, cassava, yam, plantain, pepper, rice, eggs, poultry, farm supply, and verified seller leads across Ghana."
};

export default async function MarketplacePage() {
  const [products, farmers] = await Promise.all([getMarketplaceListingsData(), getFarmersData()]);

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-gradient-to-br from-white via-leaf-50/40 to-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink sm:text-5xl">
              Farm Produce Marketplace
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
              Browse produce from Farmers & Suppliers across Ghana.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="#marketplace-listings">Browse Listings</ButtonLink>
              <ButtonLink href="/submit-produce-listing" variant="secondary">Submit Produce Listing</ButtonLink>
              <ButtonLink href="/submit-buyer-request" variant="light">Post Buyer Request</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceListings products={products} farmers={farmers} />

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
              <ButtonLink href="/submit-produce-listing" variant="light">Submit Listing</ButtonLink>
              <ButtonLink href="/submit-buyer-request" variant="light">Submit Request</ButtonLink>
              <ButtonLink href="/market-intelligence" variant="light">Market Intelligence</ButtonLink>
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
