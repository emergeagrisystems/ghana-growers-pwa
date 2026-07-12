import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
import { publicMarketplaceListings } from "@/lib/marketplace/publicListings";
import { marketplaceTradeLines } from "@/lib/marketplace/trade";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData, getMarketplaceListingsData, getSuppliersData } from "@/lib/supabase/publicData";

type MarketplaceListingPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MarketplaceListingPageProps) {
  const [products, farmers, suppliers] = await Promise.all([
    getMarketplaceListingsData(),
    getFarmersData(),
    getSuppliersData()
  ]);
  const listing = publicMarketplaceListings(products, farmers, suppliers).find((item) => item.product.id === decodeURIComponent(params.id));

  return createPageMetadata({
    title: listing ? `${listing.title} | Marketplace` : "Marketplace Listing",
    description: listing
      ? `${listing.title} from ${listing.sellerName}. Request sourcing support through Ghana Growers.`
      : "View a reviewed Ghana Growers marketplace listing.",
    path: `/marketplace/${params.id}`
  });
}

export default async function MarketplaceListingPage({ params }: MarketplaceListingPageProps) {
  const [products, farmers, suppliers] = await Promise.all([
    getMarketplaceListingsData(),
    getFarmersData(),
    getSuppliersData()
  ]);
  const listing = publicMarketplaceListings(products, farmers, suppliers).find((item) => item.product.id === decodeURIComponent(params.id));

  if (!listing) {
    notFound();
  }

  const image = listing.product.images?.[0] ?? listing.product.image;
  const profileHref = listing.seller.kind === "farmer"
    ? `/farmer-directory/${listing.seller.profile.slug}`
    : `/supplier-directory/${listing.seller.profile.slug}`;
  const statusLine = listing.supplyFrequency
    ? `${listing.availability} · ${listing.supplyFrequency}`
    : listing.availability;
  const tradeLines = marketplaceTradeLines(listing.product);

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-black text-leaf-700 transition hover:text-leaf-900">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to marketplace
          </Link>
        </div>
      </section>

      <section className="py-10 sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50 shadow-card">
            <SafeImage
              src={image}
              alt={`${listing.title} available from ${listing.sellerName}`}
              width={760}
              height={570}
              fallbackKind="marketplace"
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div>
            <p className="gg-eyebrow text-earth-700/75">Marketplace listing</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">{listing.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.isSellerVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-xs font-black text-leaf-800 ring-1 ring-leaf-700/15">
                  <BadgeCheck size={15} aria-hidden="true" />
                  Verified seller
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-earth-50 px-3 py-1.5 text-xs font-black text-earth-700 ring-1 ring-earth-500/20">
                {statusLine}
              </span>
            </div>

            <div className="mt-6 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Seller</p>
              <Link href={profileHref} className="focus-ring mt-2 inline-block rounded-md text-xl font-black text-leaf-700 transition hover:text-leaf-900">
                {listing.sellerName}
              </Link>
              <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-6 text-ink/62">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                {listing.location || "Ghana"}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Detail label="Price" value={listing.priceLine} />
              <Detail label="Available" value={listing.quantity} />
              <Detail label="Category" value={listing.product.category} />
              <Detail label="Availability" value={statusLine} />
            </div>

            <div className="mt-5 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <h2 className="font-black text-ink">Trade information</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tradeLines.map((line) => (
                  <Detail key={line.label} label={line.label} value={line.value} />
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <h2 className="font-black text-ink">Listing notes</h2>
              <p className="mt-2 text-sm leading-6 text-ink/68">{listing.product.description}</p>
            </div>

            <div className="mt-5">
              <RequestConnectionButton
                label="Request this listing"
                sourceType={listing.seller.kind === "supplier" ? "Supplier Listing" : "Marketplace Listing"}
                sourceId={listing.product.id}
                sourceName={listing.title}
                productInterest={listing.title}
                className="w-full"
                helperText="Ghana Growers reviews your request before helping route the connection."
              />
              <p className="mt-3 rounded-md bg-earth-50 px-3 py-2 text-sm font-semibold leading-6 text-ink/65 ring-1 ring-earth-500/20">
                No payment is required at this stage. Ghana Growers will first confirm availability, quantity, and pickup or delivery details.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
      <p className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-semibold text-ink/78">{value}</p>
    </div>
  );
}
