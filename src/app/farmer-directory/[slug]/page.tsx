import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Clock3,
  MapPin,
  PackageCheck,
  Ruler,
  Sprout,
  Truck,
  type LucideIcon
} from "lucide-react";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { PublicDataUnavailable } from "@/components/PublicDataUnavailable";
import { SafeImage } from "@/components/SafeImage";
import { cleanFarmerLocation, dedupePublicLocationParts, publicFarmSize } from "@/lib/farmerDirectory";
import { marketplacePriceLine } from "@/lib/marketplace/trade";
import { findBuyerRequestsForFarmer } from "@/lib/matching";
import { cleanProductList, productDisplayName, productImageForListing, productImageForName } from "@/lib/productDisplay";
import { createPageMetadata } from "@/lib/seo";
import { getBuyerRequestsData, getFarmersData, getMarketplaceListingsData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

type FarmerProfilePageProps = {
  params: {
    slug: string;
  };
};

type LocationSummary = {
  hero: string;
  community?: string;
  district?: string;
  region?: string;
  serviceArea: string;
};

type DisplayRow = {
  icon?: LucideIcon;
  label: string;
  value: string;
};

export async function generateMetadata({ params }: FarmerProfilePageProps) {
  const result = await getFarmersData();
  const farmer = result.status === "ready" ? result.data.find((record) => record.slug === params.slug) : undefined;

  if (!farmer) {
    return createPageMetadata({
      title: "Farmer Profile",
      description: "Ghana Growers farmer profile.",
      path: `/farmer-directory/${params.slug}`,
      noIndex: true
    });
  }

  const products = cleanProductList(farmer.products);
  const location = buildLocationSummary(farmer);

  return createPageMetadata({
    title: farmer.farmName,
    description: `${farmer.farmName} in ${location.hero} supplies ${formatList(products)} through Ghana Growers.`,
    path: `/farmer-directory/${params.slug}`,
    image: farmer.mainImage
  });
}

function FarmerVerificationBadge({ status }: { status: string }) {
  if (status !== "Verified") {
    return null;
  }

  return (
    <span className="gg-badge gg-badge-verified">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified Farmer
    </span>
  );
}

function normalizeText(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function isMeaningful(value?: string | null) {
  const cleaned = normalizeText(value);
  const key = cleaned.toLowerCase();

  return Boolean(cleaned && !["available on request", "not provided", "n/a", "na", "none", "ghana"].includes(key));
}

function uniqueLocationParts(...values: Array<string | undefined | null>) {
  return dedupePublicLocationParts(...values.map(normalizeText).filter(isMeaningful));
}

function buildLocationSummary(farmer: { publicLocation?: string | null; district?: string | null; region?: string | null }): LocationSummary {
  const parts = cleanFarmerLocation(farmer).split(",").map(normalizeText).filter(Boolean);
  const community = parts[0];
  const region = parts.at(-1);
  const serviceBase = community ?? region ?? "this farmer's area";

  return {
    hero: parts.join(", ") || "Ghana",
    community,
    region,
    serviceArea: `${serviceBase} and nearby buyer routes`
  };
}

function formatList(items: string[]) {
  const cleanItems = items.map(normalizeText).filter(Boolean);

  if (cleanItems.length <= 1) {
    return cleanItems[0] ?? "produce";
  }

  if (cleanItems.length === 2) {
    return `${cleanItems[0]} and ${cleanItems[1]}`;
  }

  return `${cleanItems.slice(0, -1).join(", ")}, and ${cleanItems[cleanItems.length - 1]}`;
}

function shortStory(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 90) {
    return text;
  }

  return `${words.slice(0, 86).join(" ")}...`;
}

function farmStory(text: string) {
  return normalizeText(text)
    .replace(/\s*Buyers can request[^.]*\./i, "")
    .replace(/\s*Contact Ghana Growers[^.]*\./i, "")
    .trim();
}

function listingImages(listing: { image: string; images?: string[] }) {
  return Array.from(new Set([...(listing.images ?? []), listing.image].filter(Boolean)));
}

function displayValue(value?: string | null, fallback = "Not provided") {
  return isMeaningful(value) ? normalizeText(value) : fallback;
}

function deliveryDisplay(options?: string[]) {
  const option = options?.map(normalizeText).find(isMeaningful);

  if (!option || /upon arrangement|available on request|not provided|cash|mobile money|bank transfer|payment/i.test(option)) {
    return "Confirmed during request";
  }

  return option;
}

function paymentDisplay(value?: string | null) {
  const payment = displayValue(value, "Payment to be confirmed");

  return payment === "Not provided" ? "Payment to be confirmed" : payment;
}

function formatQuantity(quantity?: string | null, unit?: string | null) {
  const quantityText = normalizeText(quantity);
  const unitText = normalizeText(unit);

  if (!quantityText) {
    return "Confirmed during request";
  }

  return unitText ? `${quantityText} ${unitText}` : quantityText;
}

function compactRows(rows: DisplayRow[]) {
  return rows.filter((row) => isMeaningful(row.value) || row.label === "Active Listings");
}

function activeListingMatchesProduct(listingName: string, product: string) {
  const cleanedListing = listingName
    .toLowerCase()
    .replace(/\b(fresh|red|yellow|mature|local|pona)\b/g, "")
    .trim();
  const cleanedProduct = product.toLowerCase();

  return cleanedListing.includes(cleanedProduct) || cleanedProduct.includes(cleanedListing);
}

export default async function FarmerProfilePage({ params }: FarmerProfilePageProps) {
  const [farmerResult, marketplaceProducts, buyerRequests] = await Promise.all([
    getFarmersData(),
    getMarketplaceListingsData(),
    getBuyerRequestsData()
  ]);
  if (farmerResult.status === "unavailable") {
    return <PublicDataUnavailable kind="farmer" />;
  }
  const farmer = farmerResult.data.find((record) => record.slug === params.slug);

  if (!farmer) {
    notFound();
  }

  const products = cleanProductList(farmer.products);
  const productText = formatList(products);
  const location = buildLocationSummary(farmer);
  const profilePhoto = farmer.mainImage ?? "/images/farmers/farmer-1.jpg";
  const activeMarketplaceListings = marketplaceProducts.filter((listing) => {
    if (listing.available === "Sold Out") {
      return false;
    }

    if (listing.ownerType && listing.ownerType !== "Farmer") {
      return false;
    }

    return (
      (farmer.id && listing.ownerId === farmer.id) ||
      listing.farmerSlug === farmer.slug ||
      listing.seller === farmer.farmName ||
      listing.ownerName === farmer.farmName
    );
  });
  const relevantBuyerRequests = findBuyerRequestsForFarmer(farmer, buyerRequests, 4);
  const deliveryOption = deliveryDisplay(farmer.deliveryOptions);
  const paymentPreference = paymentDisplay(farmer.paymentPreference);
  const farmGalleryImages = (farmer.farmPhotos ?? []).slice(0, 6);
  const produceGalleryImages = (farmer.producePhotos ?? []).slice(0, 6);
  const productListings = products.map((product) => {
    const marketplaceMatch = activeMarketplaceListings.find((listing) => activeListingMatchesProduct(listing.name, product));

    return {
      product,
      image: productImageForName(product),
      status: "Request availability",
      marketplaceStatus: marketplaceMatch?.available
    };
  });

  const aboutCopy = isMeaningful(farmStory(farmer.description))
    ? farmStory(farmer.description)
    : `${farmer.farmName} is a Ghana Growers farmer profile based in ${location.hero}. The farm currently lists ${productText}.`;
  const snapshotItems: DisplayRow[] = compactRows([
    { icon: Sprout, label: "Farm Type", value: displayValue(farmer.farmType) },
    { icon: Ruler, label: "Farm Size", value: publicFarmSize(farmer.farmSize) },
    { icon: Clock3, label: "Supply Frequency", value: "Confirmed during request" },
    { icon: PackageCheck, label: "Active Listings", value: String(activeMarketplaceListings.length) }
  ]);
  const locationRows: DisplayRow[] = compactRows([
    { label: "Community/Town", value: location.community ?? "Available on request" },
    { label: "Service Area", value: location.serviceArea }
  ]);
  const tradeRows: DisplayRow[] = compactRows([
    { label: "Delivery / Pickup", value: deliveryOption },
    { label: "Payment Terms", value: paymentPreference },
    { label: "Buyer Routing", value: "Through Ghana Growers" }
  ]);
  return (
    <>
      <section className="border-b border-leaf-900/10 bg-earth-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:items-center lg:px-8 lg:py-9">
          <div>
            <div className="relative overflow-hidden rounded-md border border-white bg-white p-2 shadow-soft">
              <FarmerProfileImage
                src={profilePhoto}
                alt={`${farmer.farmName} profile image`}
                variant="profile"
                priority
                fallbackKind="farmer"
                sizes="(min-width: 1024px) 34vw, 100vw"
                landscapePositionClass="object-[center_30%]"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Profile</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">{farmer.farmName}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-ink/68">
              <span className="inline-flex items-center gap-2 rounded-md bg-white/75 px-3 py-2 ring-1 ring-leaf-900/10">
                <MapPin className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                {location.hero}
                <FarmerVerificationBadge status={farmer.verificationStatus} />
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {products.slice(0, 6).map((product) => (
                <span key={product} className="rounded-md bg-white px-3 py-1.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  {product}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="bg-white pb-24 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <aside className="order-1 space-y-4 lg:sticky lg:top-24 lg:order-2">
              <RequestProduceCard farmerSlug={farmer.slug} farmName={farmer.farmName} products={products} />
              <InfoPanel title="Farm Snapshot" eyebrow="Profile Details" icon={Sprout} rows={snapshotItems} />
              <InfoPanel title="Location" eyebrow="Operating Area" icon={MapPin} rows={locationRows} />
              <InfoPanel title="Trade Details" eyebrow="Buyer Routing" icon={Truck} rows={tradeRows} />
            </aside>

            <div className="order-2 lg:order-1">
              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">About the Farm</p>
                <h2 className="mt-2 text-2xl font-black text-ink">{farmer.farmName}</h2>
                <p className="mt-4 max-w-4xl text-sm leading-7 text-ink/68">{shortStory(aboutCopy)}</p>
              </section>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Current Produce</p>
                <h2 className="mt-2 text-2xl font-black text-ink">What this farmer produces</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/62">
                Ghana Growers confirms available quantities during the request process.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productListings.map((listing) => (
                <article key={listing.product} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                  <SafeImage
                    src={listing.image}
                    alt={`${listing.product} produce from ${farmer.farmName}`}
                    width={420}
                    height={260}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 50vw, 100vw"
                    className="h-36 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-black text-ink">{listing.product}</h3>
                    <p className="mt-2 inline-flex rounded-md bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                      {listing.status}
                    </p>
                    {listing.marketplaceStatus ? (
                      <p className="mt-2 text-xs font-semibold text-ink/50">Marketplace status: {listing.marketplaceStatus}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Active Marketplace Listings</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Available from this farmer</h2>
              </div>
              <Link href="/marketplace" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                Browse Marketplace
              </Link>
            </div>
            {activeMarketplaceListings.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeMarketplaceListings.slice(0, 6).map((listing) => {
                  const listingImage = listingImages(listing)[0] ?? productImageForListing(listing.name, listing.category, listing.image);

                  return (
                    <article key={listing.id} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                      <SafeImage
                        src={listingImage}
                        alt={`${listing.name} available from ${farmer.farmName}`}
                        width={420}
                        height={260}
                        fallbackKind="marketplace"
                        sizes="(min-width: 1280px) 28vw, (min-width: 768px) 50vw, 100vw"
                        className="h-36 w-full object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black text-ink">{listing.name}</h3>
                          <span className="shrink-0 rounded-md bg-leaf-50 px-2.5 py-1 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10">
                            {listing.available}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-ink/66">
                          <DetailLine label="Quantity" value={formatQuantity(listing.quantity, listing.unit)} />
                          <DetailLine label="Guide Price" value={marketplacePriceLine(listing)} />
                          <DetailLine label="Payment Terms" value={paymentPreference} />
                          <DetailLine label="Delivery / Pickup" value="Confirmed during request" />
                        </div>
                        <RequestConnectionButton
                          label="Request this listing"
                          sourceType="Marketplace Listing"
                          sourceId={listing.id}
                          sourceName={listing.name}
                          requestSource="marketplace_listing"
                          productInterest={listing.name}
                          listingSummary={{
                            product: listing.name,
                            seller: farmer.farmName,
                            location: location.hero,
                            pricePackage: marketplacePriceLine(listing),
                            listedQuantity: formatQuantity(listing.quantity, listing.unit),
                            availability: listing.available
                          }}
                          className="mt-4 w-full"
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-md bg-leaf-50 p-4">
                <p className="text-sm font-semibold leading-6 text-ink/62">No active listings at the moment.</p>
                <RequestConnectionButton
                  label="Request Produce"
                  sourceType="Farmer"
                  sourceId={farmer.slug}
                  sourceName={farmer.farmName}
                  requestSource="farmer_profile"
                  productInterest={products.slice(0, 3).join(", ")}
                  productOptions={products}
                  className="mt-4"
                  helperText="Ghana Growers can confirm whether this farmer has produce available now."
                />
              </div>
            )}
          </section>

          {farmGalleryImages.length > 0 ? (
            <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Gallery</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Farm Gallery</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {farmGalleryImages.map((photo, index) => (
                  <SafeImage
                    key={photo}
                    src={photo}
                    alt={`${farmer.farmName} farm photo ${index + 1}`}
                    width={420}
                    height={280}
                    fallbackKind="farmer"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="h-44 w-full rounded-md object-cover object-center ring-1 ring-leaf-900/10"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {produceGalleryImages.length > 0 ? (
            <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Produce</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Produce Gallery</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {produceGalleryImages.map((photo, index) => (
                  <SafeImage
                    key={photo}
                    src={photo}
                    alt={`${farmer.farmName} produce photo ${index + 1}`}
                    width={420}
                    height={280}
                    fallbackKind="crop"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="h-44 w-full rounded-md object-cover object-center ring-1 ring-leaf-900/10"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {relevantBuyerRequests.length > 0 ? (
            <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer Demand</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Related buyer demand</h2>
                </div>
                <Link href="/buyer-requests" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                  View Produce Demand
                </Link>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {relevantBuyerRequests.map((request) => (
                  <article key={request.reference} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                    <h3 className="font-black text-ink">{productDisplayName(request.productName)}</h3>
                    <p className="mt-2 text-sm font-black text-leaf-700">{request.quantityNeeded}</p>
                    <p className="mt-2 text-sm text-ink/58">{uniqueLocationParts(request.district, request.region).join(", ") || "Location to be confirmed"}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-leaf-900/10 bg-white/95 p-3 shadow-[0_-12px_28px_rgba(20,58,31,0.12)] backdrop-blur md:hidden">
        <RequestConnectionButton
          label="Request Produce"
          sourceType="Farmer"
          sourceId={farmer.slug}
          sourceName={farmer.farmName}
          requestSource="farmer_profile"
          productInterest={products.slice(0, 3).join(", ")}
          productOptions={products}
          className="w-full"
        />
      </div>
    </>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-start justify-between gap-3">
      <span className="font-black text-ink/45">{label}</span>
      <span className="text-right font-semibold text-ink/72">{value}</span>
    </p>
  );
}

function RequestProduceCard({ farmerSlug, farmName, products }: { farmerSlug: string; farmName: string; products: string[] }) {
  return (
    <section className="rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-wide text-earth-700">Request Produce</p>
      <h2 className="mt-2 text-xl font-black leading-tight text-ink">Request produce from this farmer</h2>
      <p className="mt-3 text-sm leading-6 text-ink/64">
        Tell Ghana Growers what you need. We will confirm availability, quantity, price, and pickup or delivery details before connecting you.
      </p>
      <RequestConnectionButton
        label="Request Produce"
        sourceType="Farmer"
        sourceId={farmerSlug}
        sourceName={farmName}
        requestSource="farmer_profile"
        productInterest={products.slice(0, 3).join(", ")}
        productOptions={products}
        className="mt-5 w-full"
      />
      <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
        No payment is required at this stage.
      </p>
    </section>
  );
}

function InfoPanel({ title, eyebrow, icon: Icon, rows }: { title: string; eyebrow: string; icon: LucideIcon; rows: DisplayRow[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-earth-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-black text-ink">{title}</h2>
      <div className="mt-4 divide-y divide-leaf-900/10 text-sm">
        {rows.map((row) => (
          <InfoRow key={row.label} {...row} />
        ))}
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value }: DisplayRow) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/45">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-leaf-700" aria-hidden="true" /> : null}
        <span>{label}</span>
      </p>
      <p className="max-w-[58%] text-right font-semibold leading-6 text-ink/72">{value}</p>
    </div>
  );
}
