import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Ruler,
  Sprout,
  Truck,
  type LucideIcon
} from "lucide-react";
import { GGStandardBadge, GGStandardCommitment } from "@/components/GGStandard";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
import { findBuyerRequestsForFarmer } from "@/lib/matching";
import { productDisplayName, productImageForListing, productImageForName } from "@/lib/productDisplay";
import { createPageMetadata } from "@/lib/seo";
import { getBuyerRequestsData, getFarmersData, getMarketplaceListingsData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

type FarmerProfilePageProps = {
  params: {
    slug: string;
  };
};

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

  return createPageMetadata({
    title: farmer.farmName,
    description: `${farmer.farmName} in ${farmer.district}, ${farmer.region} supplies ${farmer.products.join(", ")} through Ghana Growers.`,
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

function shortStory(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 100) {
    return text;
  }

  return `${words.slice(0, 96).join(" ")}...`;
}

function listingImages(listing: { image: string; images?: string[] }) {
  return Array.from(new Set([...(listing.images ?? []), listing.image].filter(Boolean)));
}

function latestListingDate(listings: { datePosted: string }[]) {
  const sorted = listings
    .map((listing) => listing.datePosted)
    .filter(Boolean)
    .sort()
    .reverse();

  return sorted[0] ?? "";
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
  const deliveryOption = "Upon arrangement";
  const paymentPreference = farmer.paymentPreference && farmer.paymentPreference !== "Not provided" ? farmer.paymentPreference : "Payment to be confirmed";
  const listingPhotoGallery = Array.from(new Set(activeMarketplaceListings.flatMap((listing) => listingImages(listing))));
  const profileGallery = Array.from(new Set(farmer.photos.filter((photo) => photo !== profilePhoto)));
  const currentProduceGallery = listingPhotoGallery.filter((image) => !farmer.photos.includes(image));
  const memberSince = farmer.verificationDate?.slice(0, 4) ?? activeMarketplaceListings[0]?.datePosted?.slice(0, 4) ?? "";
  const lastUpdated = latestListingDate(activeMarketplaceListings) || farmer.verificationDate || "";
  const productListings = farmer.products.map((product) => {
    const marketplaceMatch = activeMarketplaceListings.find((listing) => {
      const listingName = listing.name.toLowerCase().replace("fresh ", "").replace("red ", "").replace("yellow ", "").replace("mature ", "");
      const productName = product.toLowerCase();
      return listingName.includes(productName) || productName.includes(listingName);
    });
    const displayName = productDisplayName(product);

    return {
      product: displayName,
      image: productImageForName(displayName),
      quantity: marketplaceMatch?.seller === farmer.farmName ? `${marketplaceMatch.quantity} ${marketplaceMatch.unit}` : farmer.availableQuantities ?? farmer.capacityVolume,
      status: marketplaceMatch?.seller === farmer.farmName ? marketplaceMatch.available : farmer.availabilityStatus
    };
  });

  const snapshotItems = [
    { icon: Sprout, label: "Farm Type", value: farmer.farmType },
    { icon: CalendarDays, label: "Years Farming", value: farmer.yearsFarming ?? "Available on request" },
    { icon: Ruler, label: "Farm Size", value: farmer.farmSize },
    { icon: Clock3, label: "Supply Frequency", value: farmer.availabilityStatus },
    { icon: PackageCheck, label: "Active Listings", value: String(activeMarketplaceListings.length) }
  ];
  const trustPoints = ["Verified farmer profile", "Direct farm sourcing", "Marketplace support", "Reliable communication"];

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr_0.62fr] lg:items-center lg:px-8 lg:py-12">
          <div>
            <div className="relative overflow-hidden rounded-md border border-white bg-white p-2 shadow-soft">
              <SafeImage
                src={profilePhoto}
                alt={`${farmer.farmName} profile photo`}
                width={560}
                height={560}
                priority
                fallbackKind="farmer"
                sizes="(min-width: 1024px) 25vw, 100vw"
                className="aspect-[4/5] w-full rounded-md object-cover object-[center_35%] lg:aspect-[4/5]"
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
            <div className="mt-5 grid gap-3 text-sm font-bold text-ink/68 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                {farmer.district}, {farmer.region}
              </span>
              <span className="inline-flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                {farmer.capacityVolume}
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
              {farmer.products.slice(0, 5).map((product) => (
                <span key={product} className="rounded-md bg-white px-3 py-1.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  {product}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buy from this farmer</p>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Tell Ghana Growers what you need. We will first confirm availability and contact you with the next steps.
            </p>
            <RequestConnectionButton
              label="Request Produce"
              sourceType="Farmer"
              sourceId={farmer.slug}
              sourceName={farmer.farmName}
              productInterest={farmer.products.slice(0, 3).join(", ")}
              className="mt-5 w-full"
              helperText="Ghana Growers reviews your request before helping route the connection."
            />
            <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
              No payment is required at this stage. Ghana Growers will first confirm availability and contact you.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">About the Farm</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{farmer.farmName}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/68">{shortStory(farmer.description)}</p>
          </section>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Snapshot</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Supply readiness at a glance</h2>
              </div>
              <Link href="/farmer-directory" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                Back to Directory
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshotItems.map((item) => (
                <SnapshotCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          </section>

          <div className="mt-8">
            <GGStandardCommitment status={farmer.ggStandardStatus} />
          </div>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Current Produce</p>
                <h2 className="mt-2 text-2xl font-black text-ink">What this farmer produces</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/62">{farmer.availableQuantities ?? farmer.capacityVolume}</p>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {productListings.map((listing) => (
                <article key={listing.product} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                  <SafeImage
                    src={listing.image}
                    alt={`${listing.product} from ${farmer.farmName}`}
                    width={420}
                    height={260}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-black text-ink">{listing.product}</h3>
                    <p className="mt-2 inline-flex rounded-md bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                      {listing.status}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.75fr]">
            <div className="grid gap-8">
              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
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
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {activeMarketplaceListings.slice(0, 6).map((listing) => (
                      <article key={listing.id} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                        <SafeImage
                          src={listingImages(listing)[0] ?? productImageForListing(listing.name, listing.category, listing.image)}
                          alt={`${listing.name} marketplace listing`}
                          width={360}
                          height={220}
                          fallbackKind="marketplace"
                          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 50vw, 100vw"
                          className="h-36 w-full object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-black text-ink">{listing.name}</h3>
                          <div className="mt-3 grid gap-2 text-sm text-ink/62">
                            <p>
                              <span className="font-black text-leaf-700">{listing.available}</span>
                            </p>
                            <p>{listing.quantity} {listing.unit}</p>
                            {listing.priceRange ? <p>Guide Price: {listing.priceRange}</p> : null}
                          </div>
                          <Link
                            href={`/marketplace?search=${encodeURIComponent(listing.name)}`}
                            className="mt-4 inline-flex rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                          >
                            View Listing
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-md bg-leaf-50 p-4">
                    <p className="text-sm font-semibold leading-6 text-ink/62">No active listings at the moment.</p>
                    <RequestConnectionButton
                      label="Request Produce"
                      sourceType="Farmer"
                      sourceId={farmer.slug}
                      sourceName={farmer.farmName}
                      productInterest={farmer.products.slice(0, 3).join(", ")}
                      className="mt-4"
                      helperText="Ghana Growers can confirm whether this farmer has produce available now."
                    />
                  </div>
                )}
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Why Buy Through Ghana Growers</p>
                <h2 className="mt-2 text-2xl font-black text-ink">A supported way to source farm produce</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex items-center gap-2 rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10">
                      <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {point}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace Activity</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Activity at a glance</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <TrustItem icon={PackageCheck} label="Active Listings" value={String(activeMarketplaceListings.length)} />
                  {memberSince ? <TrustItem icon={CalendarDays} label="Member Since" value={memberSince} /> : null}
                  {lastUpdated ? <TrustItem icon={Clock3} label="Last Updated" value={lastUpdated} /> : null}
                  <TrustItem icon={CheckCircle2} label="Verified" value={farmer.verificationStatus === "Verified" ? "Yes" : farmer.verificationStatus} />
                </div>
              </section>

              <section className="rounded-md border border-earth-500/25 bg-earth-50 p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Request Produce</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Interested in buying from {farmer.farmName}?</h2>
                <p className="mt-3 text-sm leading-6 text-ink/65">
                  Tell Ghana Growers what you need and we will confirm availability before connecting you with the farmer.
                </p>
                <RequestConnectionButton
                  label="Request Produce"
                  sourceType="Farmer"
                  sourceId={farmer.slug}
                  sourceName={farmer.farmName}
                  productInterest={farmer.products.slice(0, 3).join(", ")}
                  className="mt-5 w-full sm:w-auto"
                  helperText="Ghana Growers reviews your request before helping route the connection."
                />
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">
                  No payment is required at this stage. Ghana Growers will first confirm availability and contact you.
                </p>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Gallery</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Farm and produce photos</h2>
                <div className="mt-5 grid gap-5">
                  <div>
                    <p className="text-sm font-black text-ink">Profile photo</p>
                    <div className="mt-3 max-w-sm overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50">
                      <SafeImage
                        src={profilePhoto}
                        alt={`${farmer.farmName} profile`}
                        width={420}
                        height={280}
                        fallbackKind="farmer"
                        sizes="(min-width: 640px) 360px, 100vw"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-black text-ink">Farm gallery</p>
                    {profileGallery.length > 0 ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {profileGallery.slice(0, 6).map((photo) => (
                          <SafeImage
                            key={photo}
                            src={photo}
                            alt={`${farmer.farmName} farm photo`}
                            width={320}
                            height={220}
                            fallbackKind="farmer"
                            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                            className="h-36 w-full rounded-md object-cover ring-1 ring-leaf-900/10"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/62">
                        This farmer has not uploaded farm photos yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-black text-ink">Current Produce Gallery</p>
                    {currentProduceGallery.length > 0 ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {currentProduceGallery.slice(0, 6).map((photo) => (
                          <SafeImage
                            key={photo}
                            src={photo}
                            alt={`${farmer.farmName} produce photo`}
                            width={320}
                            height={220}
                            fallbackKind="marketplace"
                            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                            className="h-36 w-full rounded-md object-cover ring-1 ring-leaf-900/10"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/62">
                        {activeMarketplaceListings.length > 0
                          ? "No separate produce gallery is available yet. Use the active listings above to review current produce."
                          : "No produce is currently listed. Contact Ghana Growers if you are looking for this product."}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer demand</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Related Produce Demand</h2>
                  </div>
                  <Link href="/buyer-requests" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                    View Produce Demand
                  </Link>
                </div>
                {relevantBuyerRequests.length > 0 ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {relevantBuyerRequests.map((request) => (
                      <article key={request.id} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                        <h3 className="font-black text-ink">{request.productName}</h3>
                        <p className="mt-2 text-sm font-black text-leaf-700">{request.quantityNeeded}</p>
                        <p className="mt-2 text-sm text-ink/58">{request.district}, {request.region}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/62">
                    No matching produce demand is listed yet. Buyers can request sourcing support for these products through Ghana Growers.
                  </p>
                )}
              </section>
            </div>

            <aside className="grid content-start gap-5">
              <section className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Location
                  </p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <LocationRow label="Region" value={farmer.region} />
                    <LocationRow label="District" value={farmer.district} />
                    <LocationRow label="Service area" value={`${farmer.district} and nearby buyer routes`} />
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
                    <Truck className="h-4 w-4" aria-hidden="true" />
                    Trade Details
                  </p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <LocationRow label="Delivery / pickup" value={deliveryOption} />
                    <LocationRow label="Payment preference" value={paymentPreference} />
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function SnapshotCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-earth-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-3 text-sm font-black leading-6 text-ink">{value}</p>
    </div>
  );
}

function TrustItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md bg-leaf-50 p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-earth-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-ink/70">{value}</p>
    </div>
  );
}

function LocationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-leaf-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-semibold leading-6 text-ink/72">{value}</p>
    </div>
  );
}
