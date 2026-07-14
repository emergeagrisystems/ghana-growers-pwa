import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import { MarketplaceImageGallery } from "@/components/MarketplaceImageGallery";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { publicMarketplaceListings } from "@/lib/marketplace/publicListings";
import { marketplaceTradeInformation } from "@/lib/marketplace/trade";
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

  const profileHref = listing.seller.kind === "farmer"
    ? `/farmer-directory/${listing.seller.profile.slug}`
    : listing.seller.kind === "supplier"
      ? `/supplier-directory/${listing.seller.profile.slug}`
      : "";
  const tradeInformation = marketplaceTradeInformation(listing.product);

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
        <div className="mx-auto grid max-w-7xl gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(360px,0.42fr)] lg:items-start lg:gap-10 lg:px-8 xl:gap-12">
          <div className="order-1 min-w-0">
            <MarketplaceImageGallery product={listing.product} title={listing.title} sellerName={listing.sellerName} />
            <div className="mt-5 hidden lg:block">
              <ListingNotes description={listing.product.description} />
            </div>
          </div>

          <div className="order-2 min-w-0 lg:sticky lg:top-24">
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
                {listing.availability}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-ink/70 ring-1 ring-leaf-900/10">
                Category: {listing.product.category}
              </span>
            </div>

            <div className="mt-6 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Seller</p>
              {profileHref ? (
                <Link href={profileHref} className="focus-ring mt-2 inline-block rounded-md text-lg font-black text-leaf-700 transition hover:text-leaf-900 sm:text-xl">
                  {listing.sellerName}
                </Link>
              ) : (
                <p className="mt-2 text-lg font-black text-ink sm:text-xl">{listing.sellerName}</p>
              )}
              <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-6 text-ink/62">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                {listing.location || "Ghana"}
              </p>
            </div>

            <div className="mt-5 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
              <SummaryLine label="Price" value={listing.priceLine} />
              <SummaryLine label={listing.quantityLabel} value={listing.quantity} />
              <SummaryLine label="Status" value={listing.availability} />
              <div className="mt-5">
                <RequestConnectionButton
                  label="Request this listing"
                  sourceType={listing.seller.kind === "supplier" || (listing.seller.kind === "submission" && listing.seller.sellerType === "Supplier") ? "Supplier Listing" : "Marketplace Listing"}
                  sourceId={listing.product.id}
                  sourceName={listing.title}
                  productInterest={listing.title}
                  className="w-full"
                  helperText="Ghana Growers reviews your request before helping route the connection."
                />
              </div>
            </div>

            <div className="mt-5 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-black text-ink">Trade information</h2>
              <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {tradeInformation.lines.map((line) => (
                  <Detail key={line.label} label={line.label} value={line.value} />
                ))}
              </div>
              {tradeInformation.missingNote ? (
                <p className="mt-4 rounded-md bg-leaf-50 px-3 py-2 text-sm font-semibold leading-6 text-ink/62">
                  {tradeInformation.missingNote}
                </p>
              ) : null}
            </div>

            <div className="mt-5 hidden lg:block">
              <ReviewNote />
            </div>

            <div className="mt-5 lg:hidden">
              <ListingNotes description={listing.product.description} />
              <div className="mt-5">
                <ReviewNote />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-leaf-900/10 py-3 first:pt-0 last:border-b-0">
      <p className="text-xs font-black uppercase tracking-wide text-ink/42">{label}</p>
      <p className="max-w-[60%] text-right text-base font-black text-ink">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-leaf-50/70 p-3 ring-1 ring-leaf-900/10">
      <p className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-semibold text-ink/78">{value}</p>
    </div>
  );
}

function ListingNotes({ description }: { description: string }) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 sm:p-5">
      <h2 className="font-black text-ink">Listing notes</h2>
      <p className="mt-2 text-sm leading-6 text-ink/68">{description}</p>
    </div>
  );
}

function ReviewNote() {
  return (
    <p className="rounded-md bg-earth-50 px-3 py-2 text-sm font-semibold leading-6 text-ink/65 ring-1 ring-earth-500/20">
      No payment is required at this stage. Ghana Growers will first confirm availability, quantity, and pickup or delivery details.
    </p>
  );
}
