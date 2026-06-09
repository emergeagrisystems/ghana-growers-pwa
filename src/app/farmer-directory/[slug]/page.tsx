import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Truck
} from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { WhatsAppButton } from "@/components/WhatsAppButton";
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

function FarmerTrustBadges({ status }: { status: string }) {
  const badges = [];

  if (status === "Verified") {
    badges.push(
      <span key="verified" className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-xs font-black text-leaf-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified by Ghana Growers
      </span>
    );
    badges.push(
      <span key="active" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active Seller
      </span>
    );
  }

  return <div className="flex flex-wrap gap-2">{badges}</div>;
}

function imageForProduct(product: string) {
  const lower = product.toLowerCase();

  if (lower.includes("tomato") || lower.includes("pepper") || lower.includes("okra") || lower.includes("onion")) {
    return "/images/crops/tomatoes.jpg";
  }

  if (lower.includes("pineapple") || lower.includes("mango") || lower.includes("pawpaw") || lower.includes("plantain")) {
    return "/images/crops/pineapple.jpg";
  }

  if (lower.includes("yam") || lower.includes("cassava") || lower.includes("cocoyam") || lower.includes("potato")) {
    return "/images/crops/yam.jpg";
  }

  if (lower.includes("egg") || lower.includes("broiler") || lower.includes("poultry") || lower.includes("layer")) {
    return "/images/crops/poultry.jpg";
  }

  return "/images/marketplace/farm-activity-1.jpg";
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
  const farmerProducts = farmer.products.map((product) => product.toLowerCase());
  const activeMarketplaceListings = marketplaceProducts.filter((listing) => listing.farmerSlug === farmer.slug);
  const relevantBuyerRequests = buyerRequests.filter((request) =>
    farmerProducts.some((product) => {
      const requestProduct = request.productName.toLowerCase();
      return requestProduct.includes(product) || product.includes(requestProduct);
    })
  ).slice(0, 4);
  const productListings = farmer.products.map((product) => {
    const marketplaceMatch = activeMarketplaceListings.find((listing) => {
      const listingName = listing.name.toLowerCase().replace("fresh ", "").replace("red ", "").replace("yellow ", "").replace("mature ", "");
      const productName = product.toLowerCase();
      return listingName.includes(productName) || productName.includes(listingName);
    });

    return {
      product,
      image: marketplaceMatch?.image ?? imageForProduct(product),
      quantity: marketplaceMatch?.seller === farmer.farmName ? `${marketplaceMatch.quantity} ${marketplaceMatch.unit}` : farmer.availableQuantities ?? farmer.capacityVolume,
      status: marketplaceMatch?.seller === farmer.farmName ? marketplaceMatch.available : farmer.availabilityStatus,
      href: marketplaceMatch ? "/marketplace#marketplace-listings" : undefined
    };
  });

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-gradient-to-br from-white via-leaf-50/40 to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-12">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Profile</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink sm:text-5xl">{farmer.farmName}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
              {farmer.contactName} is a {farmer.products.slice(0, 2).join(" and ")} farmer in {farmer.district} supplying traders, processors, wholesalers, and buyers across Ghana.
            </p>
            <div className="mt-5">
              <FarmerTrustBadges status={farmer.verificationStatus} />
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <WhatsAppButton
                message={farmer.whatsappMessage}
                label="WhatsApp Farmer"
                sourceType="Farmer"
                sourceId={farmer.slug}
                sourceName={farmer.farmName}
              />
              <ButtonLink href="/farmer-directory" variant="light">Back to Directory</ButtonLink>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SafeImage
              src={profilePhoto}
              alt={`${farmer.farmName} profile photo`}
              width={720}
              height={520}
              priority
              fallbackSrc="/images/farmers/farmer-1.jpg"
              className="h-72 w-full rounded-md border border-white/80 object-cover shadow-soft sm:h-96"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ProfileFact icon={MapPin} label="Region" value={farmer.region} detail={farmer.district} />
            <ProfileFact icon={Sprout} label="Farm type" value={farmer.farmType} detail={farmer.farmSize} />
            <ProfileFact
              icon={ShieldCheck}
              label="Verification"
              value={farmer.verificationStatus}
              detail={farmer.verificationStatus === "Verified" && farmer.verificationDate ? `Verified on ${farmer.verificationDate}` : "Ghana Growers profile status"}
            />
            <ProfileFact icon={CalendarDays} label="Years farming" value={farmer.yearsFarming ?? "Available on request"} detail="Reported experience" />
            <ProfileFact icon={Truck} label="Delivery" value={farmer.deliveryOptions?.[0] ?? "Buyer pickup"} detail="Confirm before purchase" />
          </div>

          <section className="mt-6 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Products supplied</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {farmer.products.map((product) => (
                    <span key={product} className="rounded-md bg-white px-3 py-1.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/65">{farmer.availableQuantities ?? farmer.capacityVolume}</p>
            </div>
          </section>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.75fr]">
            <div className="grid gap-8">
              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Farm information</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Supply overview</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoBlock label="Main crops/products" value={farmer.products.join(", ")} />
                  <InfoBlock label="Production capacity" value={farmer.capacityVolume} />
                  <InfoBlock label="Harvest periods" value={farmer.harvestSeason} />
                  <InfoBlock label="Available quantities" value={farmer.availableQuantities ?? farmer.capacityVolume} />
                  <InfoBlock label="Delivery options" value={(farmer.deliveryOptions ?? ["Buyer pickup from farm or aggregation point"]).join("; ")} />
                  <InfoBlock label="Current availability" value={farmer.availabilityStatus} />
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">About the farmer</p>
                <h2 className="mt-2 text-2xl font-black text-ink">About {farmer.contactName}</h2>
                <p className="mt-4 text-sm leading-7 text-ink/68">{farmer.description}</p>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Product listings</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Currently offered by this farmer</h2>
                  </div>
                  <Link href="/marketplace#marketplace-listings" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                    View Products
                  </Link>
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  {productListings.map((listing) => (
                    <article key={listing.product} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                      <SafeImage
                        src={listing.image}
                        alt={`${listing.product} from ${farmer.farmName}`}
                        width={360}
                        height={220}
                        fallbackSrc="/images/marketplace/farm-activity-1.jpg"
                        className="h-36 w-full object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-black text-ink">{listing.product}</h3>
                        <p className="mt-2 text-sm text-ink/58">{listing.quantity}</p>
                        <p className="mt-2 inline-flex rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">{listing.status}</p>
                        {listing.href ? (
                          <Link href={listing.href} className="mt-4 inline-flex w-full justify-center rounded-md border border-leaf-900/10 bg-white px-4 py-2.5 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50">
                            View Product
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer demand</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Relevant buyer requests</h2>
                  </div>
                  <Link href="/buyer-requests" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                    View Buyer Requests
                  </Link>
                </div>
                {relevantBuyerRequests.length > 0 ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {relevantBuyerRequests.map((request) => (
                      <article key={request.id} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-ink">{request.productName}</h3>
                            <p className="mt-1 text-sm font-black text-leaf-700">{request.quantityNeeded}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/65">{request.status}</span>
                        </div>
                        <p className="mt-3 text-sm text-ink/58">{request.district}, {request.region}</p>
                        <Link href="/buyer-requests" className="mt-4 inline-flex w-full justify-center rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50">
                          View Buyer Request
                        </Link>
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
              <section className="rounded-md border border-leaf-900/10 bg-leaf-700 p-6 text-white">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-500">
                  <MessageCircle className="h-4 w-4" />
                  Contact area
                </p>
                <h2 className="mt-3 text-2xl font-black">Start a farm conversation</h2>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Confirm quantity, grading, harvest timing, pickup, delivery, and payment terms before committing to trade.
                </p>
                <div className="mt-5 grid gap-3">
                  <WhatsAppButton
                    message={`Hello Ghana Growers, I want to send an inquiry to ${farmer.farmName}.`}
                    label="Send Inquiry"
                    sourceType="Farmer"
                    sourceId={farmer.slug}
                    sourceName={farmer.farmName}
                    className="bg-white text-leaf-700 hover:bg-leaf-50"
                  />
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Trust indicators</p>
                <div className="mt-4">
                  <FarmerTrustBadges status={farmer.verificationStatus} />
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/62">
                  {farmer.verificationStatus === "Pending Verification"
                    ? "Verification review is in progress. Buyers should confirm current supply and trade terms before committing."
                    : farmer.verificationStatus === "Verified"
                      ? `Verified by Ghana Growers${farmer.verificationDate ? ` on ${farmer.verificationDate}` : ""}.`
                      : "Verification status is not currently verified. Buyers should confirm details before committing."}
                </p>
              </section>

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
                    <LocationRow label="Delivery / pickup" value={farmer.deliveryOptions?.[0] ?? "Buyer pickup from farm or aggregation point"} />
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

function ProfileFact({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-earth-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-3 text-lg font-black text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink/58">{detail}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-leaf-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-earth-700">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink/68">{value}</p>
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
