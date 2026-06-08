import { ButtonLink } from "@/components/ButtonLink";
import { MarketplaceListings } from "@/components/MarketplaceListings";
import { PageHero } from "@/components/PageHero";
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
      <PageHero
        eyebrow="Marketplace"
        title="Source farm produce and trusted agricultural supply across Ghana"
        description="Find available produce, livestock, buyer-ready quantities, seller locations, verification signals, and WhatsApp inquiry paths for faster agricultural trade."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/farmer-directory">Browse Farmer Directory</ButtonLink>
          <ButtonLink href="/supplier-directory" variant="secondary">Browse Supplier Directory</ButtonLink>
          <ButtonLink href="/buyer-requests">View Buyer Requests</ButtonLink>
          <ButtonLink href="/market-intelligence" variant="light">Market Intelligence</ButtonLink>
          <ButtonLink href="/join/buyer" variant="secondary">Post Buyer Demand</ButtonLink>
          <ButtonLink href="/whatsapp-communities" variant="light">Join WhatsApp Communities</ButtonLink>
        </div>
      </PageHero>

      <MarketplaceListings products={products} />

      <section className="bg-white py-16">
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
