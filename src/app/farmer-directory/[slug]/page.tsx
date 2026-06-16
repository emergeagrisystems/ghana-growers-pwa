import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  Ruler,
  Sprout,
  Truck,
  type LucideIcon
} from "lucide-react";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
import { findBuyerRequestsForFarmer } from "@/lib/matching";
import { productImageForName } from "@/lib/productDisplay";
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
    return {
      title: "Farmer Profile"
    };
  }

  return {
    title: `${farmer.farmName} | Ghana Growers`,
    description: `${farmer.farmName} in ${farmer.district}, ${farmer.region} supplies ${farmer.products.join(", ")}.`
  };
}

function FarmerVerificationBadge({ status }: { status: string }) {
  if (status !== "Verified") {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-leaf-600 px-3 py-2 text-xs font-black text-white shadow-sm">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified by Ghana Growers
    </span>
  );
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
  const deliveryOption = farmer.deliveryOptions?.[0] ?? "Not provided";
  const paymentPreference = farmer.paymentPreference ?? "Not provided";
  const productListings = farmer.products.map((product) => {
    const marketplaceMatch = activeMarketplaceListings.find((listing) => {
      const listingName = listing.name.toLowerCase().replace("fresh ", "").replace("red ", "").replace("yellow ", "").replace("mature ", "");
      const productName = product.toLowerCase();
      return listingName.includes(productName) || productName.includes(listingName);
    });

    return {
      product,
      image: productImageForName(product),
      quantity: marketplaceMatch?.seller === farmer.farmName ? `${marketplaceMatch.quantity} ${marketplaceMatch.unit}` : farmer.availableQuantities ?? farmer.capacityVolume,
      status: marketplaceMatch?.seller === farmer.farmName ? marketplaceMatch.available : farmer.availabilityStatus
    };
  });

  const snapshotItems = [
    { icon: Sprout, label: "Farm Type", value: farmer.farmType },
    { icon: CalendarDays, label: "Years Farming", value: farmer.yearsFarming ?? "Available on request" },
    { icon: Ruler, label: "Farm Size", value: farmer.farmSize },
    { icon: Clock3, label: "Supply Frequency", value: farmer.availabilityStatus },
    { icon: Truck, label: "Delivery / Collection", value: deliveryOption },
    { icon: CreditCard, label: "Payment Preference", value: paymentPreference },
    { icon: PackageCheck, label: "Active Listings", value: String(activeMarketplaceListings.length) }
  ];

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-gradient-to-br from-white via-leaf-50/60 to-earth-50/35">
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
                className="aspect-[4/3] w-full rounded-md object-cover lg:aspect-square"
              />
              {farmer.verificationStatus === "Verified" ? (
                <div className="absolute bottom-5 left-5">
                  <FarmerVerificationBadge status={farmer.verificationStatus} />
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
              {farmer.products.slice(0, 5).map((product) => (
                <span key={product} className="rounded-md bg-white px-3 py-1.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  {product}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Contact farmer</p>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Confirm harvest timing, volume, pickup or delivery, grading, and payment terms before trade.
            </p>
            <RequestConnectionButton
              label="Request Connection"
              sourceType="Farmer"
              sourceId={farmer.slug}
              sourceName={farmer.farmName}
              productInterest={farmer.products.slice(0, 3).join(", ")}
              className="mt-5 w-full"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
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

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Products</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Products supplied</h2>
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
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace Listings</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Listings by this Farmer</h2>
                  </div>
                  <Link href="/marketplace" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                    Browse Marketplace
                  </Link>
                </div>
                {activeMarketplaceListings.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {activeMarketplaceListings.slice(0, 6).map((listing) => (
                      <article key={listing.id} className="overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50">
                        <SafeImage
                          src={listing.image}
                          alt={`${listing.name} marketplace listing`}
                          width={360}
                          height={220}
                          fallbackKind="marketplace"
                          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 50vw, 100vw"
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-black text-ink">{listing.name}</h3>
                          <p className="mt-2 text-sm font-black text-leaf-700">{listing.available}</p>
                          <p className="mt-1 text-sm text-ink/58">{listing.quantity} {listing.unit}</p>
                          <p className="mt-2 inline-flex rounded-md bg-white px-2.5 py-1 text-xs font-black text-ink/55 ring-1 ring-leaf-900/10">
                            {listing.available === "Sold Out" ? "Inactive" : "Active"}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-md bg-leaf-50 p-4 text-sm font-semibold leading-6 text-ink/62">
                    No active marketplace listings yet.
                  </p>
                )}
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">About the farmer</p>
                <h2 className="mt-2 text-2xl font-black text-ink">About {farmer.contactName}</h2>
                <p className="mt-4 text-sm leading-7 text-ink/68">{farmer.description}</p>
              </section>

              {farmer.verificationStatus === "Verified" ? (
                <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Trust</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Verified profile</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <TrustItem icon={BadgeCheck} label="Verified by Ghana Growers" value="Profile reviewed" />
                    <TrustItem icon={CalendarDays} label="Verification Date" value={farmer.verificationDate ?? "Available on request"} />
                    <TrustItem icon={CheckCircle2} label="Profile Reviewed" value="Contact and farm details checked" />
                  </div>
                </section>
              ) : null}

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer demand</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Related Buyer Requests</h2>
                  </div>
                  <Link href="/buyer-requests" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                    View Buyer Requests
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
                    No matching buyer requests are listed yet. Buyers can post demand for these products on the Buyer Demand Board.
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
