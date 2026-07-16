import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { MarketplaceListings } from "@/components/MarketplaceListings";
import { Beef, Boxes, Carrot, PackageCheck } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData, getMarketplaceListingsData, getSuppliersData } from "@/lib/supabase/publicData";
import { publicMarketplaceListings } from "@/lib/marketplace/publicListings";
import type { FarmerProfile, SupplierProfile } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Marketplace",
  description:
    "Browse reviewed farm produce, livestock, inputs, and tools from farmers and suppliers across Ghana.",
  path: "/marketplace"
});

const primaryCategories = [
  {
    title: "Fresh Produce",
    description: "Browse vegetables, fruits, grains, legumes, nuts, and tubers.",
    href: "/marketplace?category=fresh-produce",
    icon: Carrot
  },
  {
    title: "Farm Inputs",
    description: "Find seeds, fertilizer, feed, and practical farm supplies.",
    href: "/marketplace?category=farm-inputs",
    icon: PackageCheck
  },
  {
    title: "Livestock",
    description: "Source livestock and animal products from reviewed sellers.",
    href: "/marketplace?category=livestock",
    icon: Beef
  },
  {
    title: "Tools & Equipment",
    description: "Find tools, equipment, and field support items.",
    href: "/marketplace?category=tools-equipment",
    icon: Boxes
  }
];

function uniqueProfiles<T extends FarmerProfile | SupplierProfile>(profiles: T[]) {
  const seen = new Set<string>();

  return profiles.filter((profile) => {
    const key = profile.id ?? profile.slug;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default async function MarketplacePage() {
  const [products, farmers, suppliers] = await Promise.all([
    getMarketplaceListingsData(),
    getFarmersData(),
    getSuppliersData()
  ]);
  const publicListings = publicMarketplaceListings(products, farmers, suppliers);
  const publicProducts = publicListings.map((listing) => listing.product);
  const publicFarmers = uniqueProfiles(
    publicListings.flatMap((listing) => listing.seller.kind === "farmer" ? [listing.seller.profile as FarmerProfile] : [])
  );
  const publicSuppliers = uniqueProfiles(
    publicListings.flatMap((listing) => listing.seller.kind === "supplier" ? [listing.seller.profile as SupplierProfile] : [])
  );

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-11">
          <div className="max-w-4xl">
            <p className="gg-eyebrow">Marketplace</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
              Ghana Growers Marketplace
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Browse reviewed farm produce, livestock, inputs, and tools from farmers and suppliers across Ghana.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="#marketplace-listings">Browse Listings</ButtonLink>
              <ButtonLink href="/submit-buyer-request" variant="secondary">Request Sourcing Support</ButtonLink>
              <ButtonLink href="/submit-listing" variant="secondary">Submit a Listing</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-10" aria-labelledby="marketplace-primary-categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="gg-eyebrow text-earth-700/75">Marketplace categories</p>
              <h2 id="marketplace-primary-categories" className="mt-2 text-2xl font-black text-ink sm:text-3xl">
                Start with what you need
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {primaryCategories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.href}
                  href={category.href}
                  className="focus-ring rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-leaf-700/25 hover:bg-white hover:shadow-card"
                >
                  <span className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-700/10">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-black text-ink">{category.title}</span>
                      <span className="mt-1 block text-sm font-semibold leading-5 text-ink/58">{category.description}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <MarketplaceListings products={publicProducts} farmers={publicFarmers} suppliers={publicSuppliers} />

      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-md border border-earth-500/25 bg-earth-50 p-5 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div>
              <p className="gg-eyebrow">Can&apos;t find what you need?</p>
              <h2 className="mt-1 text-xl font-black text-ink">Ask Ghana Growers to help source it.</h2>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                Tell us the product, quantity, location, and required date. Ghana Growers will review your request and look for suitable farmers, suppliers, or listings.
              </p>
            </div>
            <Link href="/submit-buyer-request" className="gg-button-primary w-full justify-center text-center sm:w-auto sm:shrink-0">
              Request Sourcing Support
            </Link>
            <Link href="/submit-listing" className="gg-button-secondary w-full justify-center text-center sm:w-auto sm:shrink-0">
              Submit a Listing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
