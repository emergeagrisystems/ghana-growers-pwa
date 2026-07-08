import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  PackageCheck,
  Ruler,
  Sprout,
  Truck,
  type LucideIcon
} from "lucide-react";
import { GGStandardBadge } from "@/components/GGStandard";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
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

const REQUEST_EXPLANATION =
  "Ghana Growers confirms availability, quantity, price guidance, and collection or delivery details before connecting buyers.";

export async function generateMetadata({ params }: FarmerProfilePageProps) {
  const farmers = await getFarmersData();
  const farmer = farmers.find((record) => record.slug === params.slug);

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
    image: farmer.photos[0]
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

function normalizedKey(value?: string | null) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\b(region|district|municipal|metropolitan|assembly)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isMeaningful(value?: string | null) {
  const cleaned = normalizeText(value);
  const key = cleaned.toLowerCase();

  return Boolean(cleaned && !["available on request", "not provided", "n/a", "na", "none", "ghana"].includes(key));
}

function uniqueLocationParts(...values: Array<string | undefined | null>) {
  const seen = new Set<string>();

  return values
    .map(normalizeText)
    .filter(isMeaningful)
    .filter((value) => {
      const key = normalizedKey(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function buildLocationSummary(farmer: { district?: string | null; region?: string | null }): LocationSummary {
  const parts = uniqueLocationParts(farmer.district, farmer.region);
  const community = parts[0];
  const region = parts[1];
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

function listingImages(listing: { image: string; images?: string[] }) {
  return Array.from(new Set([...(listing.images ?? []), listing.image].filter(Boolean)));
}

function displayValue(value?: string | null, fallback = "Not provided") {
  return isMeaningful(value) ? normalizeText(value) : fallback;
}

function deliveryDisplay(options?: string[]) {
  const option = options?.map(normalizeText).find(isMeaningful);

  if (!option || /upon arrangement|available on request|not provided/i.test(option)) {
    return "Confirmed during request";
  }

  return option;
}

function paymentDisplay(value?: string | null) {
  const payment = displayValue(value, "Payment to be confirmed");

  return payment === "Not provided" ? "Payment to be confirmed" : payment;
}

function formatPrice(value?: string | null) {
  const cleaned = normalizeText(value);

  if (!cleaned) {
    return "Confirmed during request";
  }

  if (/^(ghs|₵|usd|\$)/i.test(cleaned)) {
    return cleaned;
  }

  if (/^\d[\d,.\s]*$/.test(cleaned)) {
    return `GHS ${cleaned}`;
  }

  return cleaned;
}

function formatQuantity(quantity?: string | null, unit?: string | null) {
  const quantityText = normalizeText(quantity);
  const unitText = normalizeText(unit);

  if (!quantityText) {
    return "Confirmed during request";
  }

  return unitText ? `${quantityText} ${unitText}` : quantityText;
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
  const [farmers, marketplaceProducts, buyerRequests] = await Promise.all([
    getFarmersData(),
    getMarketplaceListingsData(),
    getBuyerRequestsData()
  ]);
  const farmer = farmers.find((record) => record.slug === params.slug);

  if (!farmer) {
    notFound();
  }

  const products = cleanProductList(farmer.products);
  const productText = formatList(products);
  const location = buildLocationSummary(farmer);
  const profilePhoto = farmer.photos[0] ?? "/images/farmers/farmer-1.jpg";
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
  const listingPhotoGallery = Array.from(new Set(activeMarketplaceListings.flatMap((listing) => listingImages(listing))));
  const profileGallery = Array.from(new Set(farmer.photos.filter((photo) => photo !== profilePhoto)));
  const currentProduceGallery = listingPhotoGallery.filter((image) => !farmer.photos.includes(image));
  const galleryImages = Array.from(new Set([...currentProduceGallery, ...profileGallery])).filter((photo) => photo !== profilePhoto);
  const productListings = products.map((product) => {
    const marketplaceMatch = activeMarketplaceListings.find((listing) => activeListingMatchesProduct(listing.name, product));

    return {
      product,
      image: productImageForName(product),
      status: "Request availability",
      marketplaceStatus: marketplaceMatch?.available
    };
  });

  const aboutCopy = `${farmer.farmName} is a Ghana Growers farmer profile based in ${location.hero}. The farm currently lists ${productText}. Buyers can request availability, quantity, pricing guidance, and collection or delivery details through Ghana Growers.`;
  const snapshotItems: DisplayRow[] = [
    { icon: Sprout, label: "Farm Type", value: displayValue(farmer.farmType) },
    { icon: Ruler, label: "Farm Size", value: displayValue(farmer.farmSize) },
    ...(isMeaningful(farmer.yearsFarming) ? [{ icon: CalendarDays, label: "Years Farming", value: normalizeText(farmer.yearsFarming) }] : []),
    { icon: Clock3, label: "Supply Frequency", value: "Confirmed during request" },
    { icon: PackageCheck, label: "Active Listings", value: String(activeMarketplaceListings.length) }
  ];
  const locationRows: DisplayRow[] = [
    ...(location.community ? [{ label: "Community/Town", value: location.community }] : []),
    ...(location.district ? [{ label: "District", value: location.district }] : []),
    ...(location.region ? [{ label: "Region", value: location.region }] : []),
    { label: "Service Area", value: location.serviceArea }
  ];
  const tradeRows: DisplayRow[] = [
    { label: "Delivery / Pickup", value: deliveryOption },
    { label: "Payment Terms", value: paymentPreference },
    { label: "Buyer Routing", value: "Through Ghana Growers" }
  ];
  const trustPoints = [
    "Verified farmer profile",
    "Produce information reviewed",
    "Buyer request support",
    "Communication routed through Ghana Growers"
  ];

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.78fr_1.25fr_0.82fr] lg:items-center lg:px-8 lg:py-10">
          <div>
            <div className="relative overflow-hidden rounded-md border border-white bg-white p-2 shadow-soft">
              <SafeImage
                src={profilePhoto}
                alt={`${farmer.contactName} of ${farmer.farmName}`}
                width={560}
                height={620}
                priority
                fallbackKind="farmer"
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="aspect-[4/5] w-full rounded-md object-cover object-[center_32%]"
              />
              {farmer.verificationStatus === "Verified" || farmer.ggStandardStatus === "Member" ? (
                <div className="absolute bottom-5 left-5 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-2">
                  <FarmerVerificationBadge status={farmer.verificationStatus} />
                  <GGStandardBadge status={farmer.ggStandardStatus} />
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Profile</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">{farmer.contactName}</h1>
            <p className="mt-2 text-xl font-black text-leaf-700">{farmer.farmName}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-ink/68">
              <span className="inline-flex items-center gap-2 rounded-md bg-white/75 px-3 py-2 ring-1 ring-leaf-900/10">
                <MapPin className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                {location.hero}
              </span>
              <span className="inline-flex items-center gap-2 rounded-md bg-white/75 px-3 py-2 ring-1 ring-leaf-900/10">
                <PackageCheck className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                Quantities confirmed by Ghana Growers
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <FarmerVerificationBadge status={farmer.verificationStatus} />
              <GGStandardBadge status={farmer.ggStandardStatus} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10">
                <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Marketplace Member
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {products.slice(0, 6).map((product) => (
                <span key={product} className="rounded-md bg-white px-3 py-1.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  {product}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Request produce from this farmer</p>
            <h2 className="mt-2 text-xl font-black leading-tight text-ink">Request produce from this farmer</h2>
            <p className="mt-3 text-sm leading-6 text-ink/64">
              Tell Ghana Growers what you need from this farmer. We will confirm availability, quantity, price guidance, and collection or delivery details before connecting you.
            </p>
            <RequestConnectionButton
              label="Request Produce"
              sourceType="Farmer"
              sourceId={farmer.slug}
              sourceName={farmer.farmName}
              productInterest={products.slice(0, 3).join(", ")}
              className="mt-5 w-full"
            />
            <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
              No payment is required at this stage.
            </p>
          </div>
        </div>
      </section>

      <main className="bg-white pb-24 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">About the Farm</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{farmer.farmName}</h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-ink/68">{shortStory(aboutCopy)}</p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-ink/60">{REQUEST_EXPLANATION}</p>
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
                          <DetailLine label="Guide Price" value={formatPrice(listing.priceRange)} />
                          <DetailLine label="Payment Terms" value={paymentPreference} />
                          <DetailLine label="Fulfillment" value="Confirmed during request" />
                        </div>
                        <RequestConnectionButton
                          label="Request this listing"
                          sourceType="Marketplace Listing"
                          sourceId={listing.id}
                          sourceName={listing.name}
                          productInterest={listing.name}
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
                  productInterest={products.slice(0, 3).join(", ")}
                  className="mt-4"
                  helperText="Ghana Growers can confirm whether this farmer has produce available now."
                />
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <InfoPanel title="Farm Snapshot" eyebrow="Profile Details" icon={Sprout} rows={snapshotItems} />
            <InfoPanel title="Location" eyebrow="Operating Area" icon={MapPin} rows={locationRows} />
            <InfoPanel title="Trade Details" eyebrow="Buyer Routing" icon={Truck} rows={tradeRows} />
          </section>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Why Source Through Ghana Growers</p>
            <h2 className="mt-2 text-2xl font-black text-ink">A supported way to source farm produce</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-ink/65">
              Ghana Growers supports buyer requests by helping confirm produce availability, quantity, price guidance, and collection or delivery details. This profile follows the Ghana Growers platform commitment framework and is separate from formal certification.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-2 rounded-md bg-leaf-50 px-3 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {point}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Gallery</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Farm and produce photos</h2>
            {galleryImages.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryImages.slice(0, 6).map((photo, index) => (
                  <SafeImage
                    key={photo}
                    src={photo}
                    alt={`${farmer.farmName} farm or produce photo ${index + 1}`}
                    width={420}
                    height={280}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="h-44 w-full rounded-md object-cover object-center ring-1 ring-leaf-900/10"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/62">
                Farm gallery photos are not available yet. Current produce images are shown in the produce and listing sections above.
              </p>
            )}
          </section>

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
            {relevantBuyerRequests.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {relevantBuyerRequests.map((request) => (
                  <article key={request.id} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                    <h3 className="font-black text-ink">{productDisplayName(request.productName)}</h3>
                    <p className="mt-2 text-sm font-black text-leaf-700">{request.quantityNeeded}</p>
                    <p className="mt-2 text-sm text-ink/58">{uniqueLocationParts(request.district, request.region).join(", ") || "Location to be confirmed"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/62">
                No matching produce demand is listed yet. Buyers can request sourcing support for these products through Ghana Growers.
              </p>
            )}
          </section>

          <section className="mt-8 rounded-md border border-earth-500/25 bg-earth-50 p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Request Produce</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Interested in buying from {farmer.farmName}?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
              Tell Ghana Growers what you need and we will confirm availability before connecting you with the farmer.
            </p>
            <RequestConnectionButton
              label="Request Produce"
              sourceType="Farmer"
              sourceId={farmer.slug}
              sourceName={farmer.farmName}
              productInterest={products.slice(0, 3).join(", ")}
              className="mt-5 w-full sm:w-auto"
            />
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">
              No payment is required at this stage. Ghana Growers will first confirm availability and contact you.
            </p>
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-leaf-900/10 bg-white/95 p-3 shadow-[0_-12px_28px_rgba(20,58,31,0.12)] backdrop-blur md:hidden">
        <RequestConnectionButton
          label="Request Produce"
          sourceType="Farmer"
          sourceId={farmer.slug}
          sourceName={farmer.farmName}
          productInterest={products.slice(0, 3).join(", ")}
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

function InfoPanel({ title, eyebrow, icon: Icon, rows }: { title: string; eyebrow: string; icon: LucideIcon; rows: DisplayRow[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-black text-ink">{title}</h2>
      <div className="mt-4 grid gap-3 text-sm">
        {rows.map((row) => (
          <InfoRow key={row.label} {...row} />
        ))}
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value }: DisplayRow) {
  return (
    <div className="rounded-md bg-leaf-50 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/40">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-1 font-semibold leading-6 text-ink/72">{value}</p>
    </div>
  );
}
