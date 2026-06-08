import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
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
import { farmerDirectory, getFarmerBySlug } from "@/data/farmers";
import { products as marketplaceProducts } from "@/data/products";

type FarmerProfilePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return farmerDirectory.map((farmer) => ({ slug: farmer.slug }));
}

export function generateMetadata({ params }: FarmerProfilePageProps) {
  const farmer = getFarmerBySlug(params.slug);

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

  if (status === "Premium Member") {
    badges.push(
      <span key="premium" className="inline-flex items-center gap-1.5 rounded-full bg-earth-500 px-3 py-1.5 text-xs font-black text-ink">
        <Crown className="h-3.5 w-3.5" />
        Premium Farmer
      </span>
    );
  } else if (status === "Verified") {
    badges.push(
      <span key="verified" className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-xs font-black text-leaf-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified Farmer
      </span>
    );
  }

  if (status !== "Pending Verification") {
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

export default function FarmerProfilePage({ params }: FarmerProfilePageProps) {
  const farmer = getFarmerBySlug(params.slug);

  if (!farmer) {
    notFound();
  }

  const profilePhoto = farmer.photos[0] ?? "/images/farmers/farmer-1.jpg";
  const productListings = farmer.products.map((product) => {
    const marketplaceMatch = marketplaceProducts.find(
      (listing) =>
        listing.name.toLowerCase().includes(product.toLowerCase()) ||
        product.toLowerCase().includes(listing.name.toLowerCase().replace("fresh ", "").replace("red ", "").replace("yellow ", ""))
    );

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
              <WhatsAppButton message={farmer.whatsappMessage} label="WhatsApp Farmer" />
              <WhatsAppButton message={`Hello Ghana Growers, I want to send an inquiry to ${farmer.farmName}.`} label="Send Inquiry" className="bg-earth-500 text-ink hover:bg-earth-700 hover:text-white" />
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
            <ProfileFact icon={ShieldCheck} label="Verification" value={farmer.verificationStatus} detail="Ghana Growers profile status" />
            <ProfileFact icon={CalendarDays} label="Years farming" value={farmer.yearsFarming ?? "Available on request"} detail="Reported experience" />
            <ProfileFact icon={Truck} label="Delivery" value={farmer.deliveryOptions?.[0] ?? "Buyer pickup"} detail="Confirm before purchase" />
          </div>

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
                  <Link href="/marketplace" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                    Browse Marketplace
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
                            Marketplace
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
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
                  <WhatsAppButton message={farmer.whatsappMessage} label="WhatsApp Farmer" className="bg-white text-leaf-700 hover:bg-leaf-50" />
                  <WhatsAppButton message={`Hello Ghana Growers, I want to send an inquiry to ${farmer.farmName}.`} label="Send Inquiry" className="bg-earth-500 text-ink hover:bg-earth-700 hover:text-white" />
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Trust indicators</p>
                <div className="mt-4">
                  <FarmerTrustBadges status={farmer.verificationStatus} />
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/62">
                  Verification placeholders can later connect to field checks, documents, buyer feedback, and Ghana Growers approval status.
                </p>
              </section>

              <section className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                <div className="relative flex h-56 items-center justify-center bg-leaf-50">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,65,0.08)_1px,transparent_1px),linear-gradient(rgba(37,99,65,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  <div className="relative mx-6 rounded-md border border-leaf-900/10 bg-white/90 p-5 text-center shadow-soft backdrop-blur">
                    <MapPin className="mx-auto h-7 w-7 text-leaf-600" aria-hidden="true" />
                    <p className="mt-3 text-lg font-black text-ink">{farmer.region}</p>
                    <p className="mt-1 text-sm font-bold text-leaf-700">{farmer.district}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Region map placeholder</p>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    A verified map or farm cluster location can be connected here when location review is enabled.
                  </p>
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
