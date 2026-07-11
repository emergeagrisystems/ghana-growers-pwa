import Link from "next/link";
import { BadgeCheck, Building2, CalendarDays, MapPin, ShoppingBasket, Sprout, Star } from "lucide-react";
import { FeaturedRibbon } from "@/components/FeaturedRibbon";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { normalizeTrust, VerificationBadge } from "@/components/TrustIndicators";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { isFeaturedActive } from "@/lib/featured";
import {
  cleanFarmerLocation,
  farmerCardImage,
  farmerCardProducts,
  farmerImagePosition,
  isVerifiedFarmer
} from "@/lib/farmerDirectory";
import { cleanProductList, productImageForName } from "@/lib/productDisplay";
import {
  featuredBuyerRequests,
  featuredFarmers,
  featuredListingLabels,
  featuredSuppliers
} from "@/data/featuredListings";
import type { FarmerProfile, SupplierProfile } from "@/types";

type FeaturedListingKind = "farmers" | "suppliers" | "buyerRequests" | "all";

type FeaturedListingsProps = {
  kinds?: FeaturedListingKind[];
  title?: string;
  description?: string;
  background?: "white" | "leaf" | "earth";
  limit?: number;
  compact?: boolean;
  farmers?: FarmerProfile[];
  suppliers?: SupplierProfile[];
};

const backgrounds = {
  white: "bg-white",
  leaf: "bg-leaf-50",
  earth: "bg-earth-50"
};

function compactFarmerGridClass(count: number) {
  if (count >= 4) {
    return "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }

  if (count === 3) {
    return "justify-center sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,20rem))]";
  }

  if (count === 2) {
    return "justify-center sm:grid-cols-[repeat(2,minmax(0,20rem))]";
  }

  return "justify-center sm:grid-cols-[minmax(0,20rem)]";
}

function titleCaseLocation(value?: string) {
  return (value ?? "")
    .split(/(\s+|-|\/|,)/)
    .map((part) => {
      if (/^(\s+|-|\/|,)$/.test(part)) {
        return part;
      }

      return part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : part;
    })
    .join("")
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\bRegion\b/gi, "Region");
}

function formatFarmerLocation(farmer: FarmerProfile) {
  const district = titleCaseLocation(farmer.district);
  const region = titleCaseLocation(farmer.region);

  if (!district || district.toLowerCase() === region.toLowerCase()) {
    return region || district || "Ghana";
  }

  return `${district}, ${region}`;
}

function formatFarmerProducts(products: string[]) {
  return cleanProductList(products).map((product) => product.replace("Aquaculture And Poultry", "Aquaculture & Poultry"));
}

function farmerImage(farmer: FarmerProfile) {
  if (farmer.hasRealPhoto && farmer.photos[0]) {
    return farmer.photos[0];
  }

  return productImageForName(formatFarmerProducts(farmer.products)[0] ?? "Produce");
}

function FarmerPhotoPlaceholder({ rounded = "rounded-t-md" }: { rounded?: string }) {
  return (
    <div className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-leaf-50 to-earth-50 text-center text-leaf-700 ${rounded}`}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white/80 shadow-sm ring-1 ring-leaf-900/10">
        <Sprout className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="text-xs font-bold text-ink/55">Photo coming soon</span>
    </div>
  );
}

export function FeaturedListings({
  kinds = ["all"],
  title = "Featured listings",
  description = "Highlighted farmers, suppliers, and produce demand that Ghana Growers wants visitors to notice first.",
  background = "white",
  limit,
  compact = false,
  farmers,
  suppliers
}: FeaturedListingsProps) {
  const showAll = kinds.includes("all");
  const showFarmers = showAll || kinds.includes("farmers");
  const showSuppliers = showAll || kinds.includes("suppliers");
  const showBuyerRequests = showAll || kinds.includes("buyerRequests");
  const selectedFarmers = farmers ?? featuredFarmers;
  const selectedSuppliers = suppliers ?? featuredSuppliers;
  const farmerLimit = limit ?? selectedFarmers.length;
  const visibleFarmers = selectedFarmers.slice(0, farmerLimit);
  const isCompactFarmersOnly = compact && showFarmers && !showSuppliers && !showBuyerRequests;
  const gridClass = isCompactFarmersOnly
    ? compactFarmerGridClass(visibleFarmers.length)
    : compact
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className={`${backgrounds[background]} ${compact ? "py-12 sm:py-14 lg:py-16" : "py-20 sm:py-24 lg:py-[120px]"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Featured" title={title} description={description} />
        <div className={`mt-8 grid gap-5 ${gridClass}`}>
          {showFarmers
            ? visibleFarmers.map((farmer) => {
                const trust = normalizeTrust(farmer.trust);
                const products = formatFarmerProducts(farmer.products);
                const location = formatFarmerLocation(farmer);

                if (compact) {
                  const cardProducts = farmerCardProducts(farmer);
                  const mainProducts = cardProducts.slice(0, 2);
                  const extraProductCount = Math.max(0, cardProducts.length - mainProducts.length);
                  const hasRealPhoto = Boolean(farmer.hasRealPhoto && farmer.photos[0]);

                  return (
                    <article
                      key={farmer.slug}
                      className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <div className="relative">
                        {hasRealPhoto ? (
                          <SafeImage
                            src={farmerCardImage(farmer, cardProducts)}
                            alt={`${farmer.farmName} farm photo`}
                            width={360}
                            height={270}
                            className={`aspect-[4/3] w-full rounded-t-md bg-leaf-50 object-cover ${farmerImagePosition(farmer)}`}
                            fallbackKind="farmer"
                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          />
                        ) : (
                          <FarmerPhotoPlaceholder />
                        )}
                        {isVerifiedFarmer(farmer) ? (
                          <span aria-label="Verified by Ghana Growers" className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[0.68rem] font-bold text-leaf-700 shadow-sm">
                            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                            Verified
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="line-clamp-2 min-h-[2.9rem] text-lg font-extrabold leading-tight text-ink [text-wrap:balance]">
                          <Link
                            href={`/farmer-directory/${farmer.slug}`}
                            className="focus-ring rounded-sm hover:text-leaf-700"
                            aria-label={`View profile for ${farmer.farmName}`}
                          >
                            {farmer.farmName}
                          </Link>
                        </h3>
                        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-ink/58">
                          {cleanFarmerLocation(farmer)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {mainProducts.map((product) => (
                            <span key={product} className="rounded-md bg-leaf-50 px-2.5 py-1 text-[0.72rem] font-semibold text-leaf-700">
                              {product}
                            </span>
                          ))}
                          {extraProductCount > 0 ? (
                            <span className="rounded-md bg-earth-50 px-2.5 py-1 text-[0.72rem] font-semibold text-earth-700">
                              +{extraProductCount} more
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-auto pt-4">
                          <Link
                            href={`/farmer-directory/${farmer.slug}`}
                            className="focus-ring group inline-flex min-h-10 items-center gap-1 rounded-md px-1 text-sm font-bold text-leaf-700 transition hover:text-leaf-900"
                            aria-label={`View profile for ${farmer.farmName}`}
                          >
                            View profile <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                <article
                  key={farmer.slug}
                  className={`relative overflow-hidden rounded-md bg-white shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:shadow-soft ${compact ? "border border-leaf-900/10 p-3.5" : "border border-earth-500/40 p-5"}`}
                >
                  {compact ? null : (
                    <div className="flex items-start justify-between gap-4">
                      <FeaturedRibbon label={featuredListingLabels.farmers} />
                      <div className="gg-icon gg-icon-marketplace h-10 w-10 shrink-0">
                        <Sprout size={20} aria-hidden="true" />
                      </div>
                    </div>
                  )}
                  <SafeImage
                    src={farmerImage(farmer)}
                    alt={`${farmer.farmName} farm or produce photo`}
                    width={420}
                    height={240}
                    className={`${compact ? "aspect-[4/3]" : "mt-4 aspect-[4/3]"} w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover object-[center_30%]`}
                    fallbackKind="farmer"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                  <h3 className={`${compact ? "text-lg" : "text-xl"} mt-4 font-black text-ink`}>{farmer.farmName}</h3>
                  <p className="mt-1 text-sm font-bold text-leaf-700">{location}</p>
                  {trust.status === "Verified" ? (
                    <div className="mt-3">
                      <VerificationBadge kind="farmer" status={trust.status} />
                    </div>
                  ) : null}
                  {isFeaturedActive(farmer) ? (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-earth-50 px-3 py-1 text-xs font-bold text-earth-700/85">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Featured
                    </span>
                  ) : null}
                  {compact ? null : <p className="mt-3 text-sm leading-6 text-ink/65">{farmer.availabilityStatus}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {products.slice(0, 3).map((product) => (
                      <span key={product} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {product}
                      </span>
                    ))}
                  </div>
                  <Link href={`/farmer-directory/${farmer.slug}`} className={compact ? "gg-button-secondary mt-5 w-full" : "gg-button-primary mt-5 w-full"}>
                    View Profile
                  </Link>
                </article>
                );
              })
            : null}

          {showSuppliers
            ? selectedSuppliers.slice(0, limit).map((supplier) => {
                const trust = normalizeTrust(supplier.trust);

                return (
                <article key={supplier.slug} className="relative overflow-hidden rounded-md border border-earth-500/40 bg-white p-5 shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <FeaturedRibbon label={featuredListingLabels.suppliers} />
                    <div className="gg-icon gg-icon-logistics h-10 w-10 shrink-0">
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
                  {isFeaturedActive(supplier) ? (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-earth-50 px-3 py-1 text-xs font-bold text-earth-700/85">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Featured
                    </span>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-ink/65">{supplier.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {supplier.productsServices.slice(0, 3).map((service) => (
                      <span key={service} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {service}
                      </span>
                    ))}
                  </div>
                  <Link href={`/supplier-directory/${supplier.slug}`} className="gg-button-primary mt-5 w-full">
                    View Supplier
                  </Link>
                </article>
                );
              })
            : null}

          {showBuyerRequests
            ? featuredBuyerRequests.slice(0, limit).map((request) => (
                <article key={request.id} className="relative overflow-hidden rounded-md border border-earth-500/40 bg-white p-5 shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <FeaturedRibbon label={featuredListingLabels.buyerRequests} />
                    <div className="gg-icon gg-icon-marketplace h-10 w-10 shrink-0">
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
                    message={`Hello Ghana Growers, I am interested in the featured sourcing request for ${request.quantityNeeded} of ${request.productName}.`}
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
          <div className="mt-5 flex justify-center">
            <Link href="/farmer-directory" className="focus-ring group inline-flex min-h-10 items-center gap-1 rounded-md px-1 text-sm font-black text-leaf-700 transition hover:text-leaf-900">
              View all farmers <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
