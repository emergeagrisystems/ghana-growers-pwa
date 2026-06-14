import Link from "next/link";
import { Building2, CalendarDays, MapPin, ShoppingBasket, Sprout } from "lucide-react";
import { FeaturedRibbon } from "@/components/FeaturedRibbon";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { normalizeTrust, VerificationBadge } from "@/components/TrustIndicators";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  featuredBuyerRequests,
  featuredFarmers,
  featuredListingLabels,
  featuredSuppliers
} from "@/data/featuredListings";

type FeaturedListingKind = "farmers" | "suppliers" | "buyerRequests" | "all";

type FeaturedListingsProps = {
  kinds?: FeaturedListingKind[];
  title?: string;
  description?: string;
  background?: "white" | "leaf" | "earth";
  limit?: number;
  compact?: boolean;
};

const backgrounds = {
  white: "bg-white",
  leaf: "bg-leaf-50",
  earth: "bg-earth-50"
};

export function FeaturedListings({
  kinds = ["all"],
  title = "Featured listings",
  description = "Highlighted farmers, suppliers, and buyer requests that Ghana Growers wants visitors to notice first.",
  background = "white",
  limit,
  compact = false
}: FeaturedListingsProps) {
  const showAll = kinds.includes("all");
  const showFarmers = showAll || kinds.includes("farmers");
  const showSuppliers = showAll || kinds.includes("suppliers");
  const showBuyerRequests = showAll || kinds.includes("buyerRequests");

  return (
    <section className={`${backgrounds[background]} py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Featured" title={title} description={description} />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showFarmers
            ? featuredFarmers.slice(0, limit).map((farmer) => {
                const trust = normalizeTrust(farmer.trust);

                return (
                <article
                  key={farmer.slug}
                  className={`relative overflow-hidden rounded-md bg-white shadow-soft ${compact ? "border border-leaf-900/10 p-3.5" : "border-2 border-earth-500 p-5"}`}
                >
                  {compact ? null : (
                    <div className="flex items-start justify-between gap-4">
                      <FeaturedRibbon label={featuredListingLabels.farmers} />
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                        <Sprout size={20} aria-hidden="true" />
                      </div>
                    </div>
                  )}
                  <SafeImage
                    src={farmer.photos[0] ?? "/images/farmers/farmer-1.jpg"}
                    alt={`${farmer.farmName} farm photo`}
                    width={420}
                    height={240}
                    className={`${compact ? "h-40" : "mt-4 h-36"} w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover`}
                    fallbackKind="farmer"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                  <h3 className={`${compact ? "text-lg" : "text-xl"} mt-4 font-black text-ink`}>{farmer.farmName}</h3>
                  <p className="mt-1 text-sm font-bold text-leaf-700">{farmer.region}</p>
                  {trust.status === "Verified" ? (
                    <div className="mt-3">
                      <VerificationBadge kind="farmer" status={trust.status} />
                    </div>
                  ) : null}
                  {compact ? null : <p className="mt-3 text-sm leading-6 text-ink/65">{farmer.availabilityStatus}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {farmer.products.slice(0, 3).map((product) => (
                      <span key={product} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {product}
                      </span>
                    ))}
                  </div>
                  {compact ? null : (
                    <Link
                      href={`/farmer-directory/${farmer.slug}`}
                      className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-700"
                    >
                      View Farmer
                    </Link>
                  )}
                </article>
                );
              })
            : null}

          {showSuppliers
            ? featuredSuppliers.slice(0, limit).map((supplier) => {
                const trust = normalizeTrust(supplier.trust);

                return (
                <article key={supplier.slug} className="relative overflow-hidden rounded-md border-2 border-earth-500 bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <FeaturedRibbon label={featuredListingLabels.suppliers} />
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                      <Building2 size={20} aria-hidden="true" />
                    </div>
                  </div>
                  <SafeImage
                    src={supplier.photos[0] ?? "/images/suppliers/supplier-1.jpg"}
                    alt={`${supplier.companyName} supplier photo`}
                    width={420}
                    height={240}
                    className="mt-4 h-36 w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover"
                    fallbackKind="supplier"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                  <h3 className="mt-4 text-xl font-black text-ink">{supplier.companyName}</h3>
                  <p className="mt-1 text-sm font-bold text-leaf-700">{supplier.supplierCategory}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-ink/55">
                    <MapPin size={14} aria-hidden="true" />
                    {supplier.region}
                  </p>
                  {trust.status === "Verified" ? (
                    <div className="mt-3">
                      <VerificationBadge kind="supplier" status={trust.status} />
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-ink/65">{supplier.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {supplier.productsServices.slice(0, 3).map((service) => (
                      <span key={service} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {service}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/supplier-directory/${supplier.slug}`}
                    className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-700"
                  >
                    View Supplier
                  </Link>
                </article>
                );
              })
            : null}

          {showBuyerRequests
            ? featuredBuyerRequests.slice(0, limit).map((request) => (
                <article key={request.id} className="relative overflow-hidden rounded-md border-2 border-earth-500 bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <FeaturedRibbon label={featuredListingLabels.buyerRequests} />
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                      <ShoppingBasket size={20} aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-xl font-black text-ink">{request.productName}</h3>
                  <p className="mt-1 text-sm font-bold text-leaf-700">{request.quantityNeeded}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-ink/55">
                    <MapPin size={14} aria-hidden="true" />
                    {request.district}, {request.region}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-ink/55">
                    <CalendarDays size={14} aria-hidden="true" />
                    Posted {request.datePosted}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    {request.buyerType} in {request.district}, {request.region}. Deadline: {request.deadline}.
                  </p>
                  <WhatsAppButton
                    message={`Hello Ghana Growers, I am interested in the featured buyer request for ${request.quantityNeeded} of ${request.productName}.`}
                    sourceType="Buyer Request"
                    sourceId={request.id}
                    sourceName={request.productName}
                    phoneNumber={request.whatsappNumber}
                    className="mt-5 w-full"
                  />
                </article>
              ))
            : null}
        </div>
        {compact && showFarmers && !showSuppliers && !showBuyerRequests ? (
          <div className="mt-8 flex justify-center">
            <Link
              href="/farmer-directory"
              className="focus-ring inline-flex items-center justify-center rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700"
            >
              View all Farmers
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
