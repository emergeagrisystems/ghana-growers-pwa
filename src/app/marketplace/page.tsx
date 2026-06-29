import { ButtonLink } from "@/components/ButtonLink";
import { MarketplaceListings } from "@/components/MarketplaceListings";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { productCategories } from "@/data/products";
import { createPageMetadata } from "@/lib/seo";
import { getBuyerRequestsData, getFarmersData, getMarketplaceListingsData, getSuppliersData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Marketplace",
  description:
    "Browse Ghana Growers marketplace listings for tomatoes, onions, maize, cassava, yam, plantain, pepper, rice, eggs, poultry, farm supply, and verified seller leads across Ghana.",
  path: "/marketplace"
});

export default async function MarketplacePage() {
  const [products, farmers, suppliers, buyerRequests] = await Promise.all([
    getMarketplaceListingsData(),
    getFarmersData(),
    getSuppliersData(),
    getBuyerRequestsData()
  ]);

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-4xl">
            <p className="gg-eyebrow">Marketplace</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
              Farm Produce Marketplace
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Browse produce from Farmers & Suppliers across Ghana.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="#marketplace-listings">Browse Listings</ButtonLink>
              <ButtonLink href="/submit-buyer-request" variant="secondary">Request Supply</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceListings products={products} farmers={farmers} suppliers={suppliers} buyerRequests={buyerRequests} />

      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-md border border-earth-500/25 bg-earth-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="gg-eyebrow">Can&apos;t find what you need?</p>
              <h2 className="mt-1 text-xl font-black text-ink">Ask Ghana Growers to help source it.</h2>
              <p className="mt-2 text-sm leading-6 text-ink/62">Share the product, quantity, location, and deadline. Our team reviews your request and looks for suitable farmers, suppliers, or listings.</p>
            </div>
            <ButtonLink href="/submit-buyer-request">Request Supply</ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <SectionHeader
              eyebrow="Marketplace Resources"
              title="Helpful ways to source, compare, and connect"
              description="Use these supporting tools when you need directories, produce sourcing, market information, or a reviewed connection request."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <ButtonLink href="/farmer-directory" variant="light">Farmer Directory</ButtonLink>
              <ButtonLink href="/supplier-directory" variant="light">Supplier Directory</ButtonLink>
              <ButtonLink href="/buyer-requests" variant="light">Produce Sourcing</ButtonLink>
              <ButtonLink href="/submit-produce-listing" variant="light">Submit Listing</ButtonLink>
              <ButtonLink href="/submit-buyer-request" variant="light">Request Supply</ButtonLink>
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
                <SafeImage src={category.image} alt={`${category.name} marketplace category`} width={240} height={150} fallbackKind="crop" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="h-28 w-full rounded-md object-cover" />
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
