import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  type LucideIcon
} from "lucide-react";
import { GGStandardBadge, GGStandardCommitment } from "@/components/GGStandard";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
import { supplierServiceImageForName } from "@/lib/productDisplay";
import { createPageMetadata } from "@/lib/seo";
import { getMarketplaceListingsData, getSuppliersData } from "@/lib/supabase/publicData";
import type { Product, SupplierProfile } from "@/types";

export const dynamic = "force-dynamic";

type SupplierProfilePageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: SupplierProfilePageProps) {
  const suppliers = await getSuppliersData();
  const supplier = suppliers.find((record) => record.slug === params.slug);

  if (!supplier) {
    return createPageMetadata({
      title: "Supplier Profile",
      description: "Ghana Growers supplier profile.",
      path: `/supplier-directory/${params.slug}`,
      noIndex: true
    });
  }

  return createPageMetadata({
    title: supplier.companyName,
    description: `${supplier.companyName} provides ${supplier.productsServices.join(", ")} in ${supplier.district}, ${supplier.region} through Ghana Growers.`,
    path: `/supplier-directory/${params.slug}`,
    image: supplier.photos[0]
  });
}

function SupplierVerificationBadge({ status }: { status: string }) {
  if (status !== "Verified") {
    return null;
  }

  return (
    <span className="gg-badge gg-badge-verified">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified by Ghana Growers
    </span>
  );
}

function websiteLabel(url?: string) {
  if (!url) {
    return "Available on request";
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function deliverySupportFor(supplier: SupplierProfile) {
  const category = supplier.supplierCategory.toLowerCase();

  if (category.includes("logistics")) {
    return "Transport and delivery support available";
  }

  if (category.includes("storage")) {
    return "Storage and handling support available";
  }

  if (category.includes("consulting") || category.includes("financial")) {
    return "Advisory support available by arrangement";
  }

  return "Delivery or pickup confirmed during inquiry";
}

function listingMatchesSupplier(listing: Product, supplier: SupplierProfile) {
  if (listing.ownerType === "Supplier") {
    return Boolean(
      (supplier.id && listing.ownerId === supplier.id) ||
      listing.ownerName?.toLowerCase() === supplier.companyName.toLowerCase() ||
      listing.seller.toLowerCase() === supplier.companyName.toLowerCase()
    );
  }

  if (listing.ownerType) {
    return false;
  }

  const listingSeller = listing.seller.toLowerCase();
  const listingCategory = listing.category.toLowerCase();
  const supplierCategory = supplier.supplierCategory.toLowerCase();
  const companyWords = supplier.companyName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4);
  const farmInputCategories = ["seeds", "fertilizers", "agrochemicals", "farm equipment", "irrigation systems"];
  const logisticsCategories = ["logistics", "storage"];

  return (
    companyWords.some((word) => listingSeller.includes(word)) ||
    listingCategory === supplierCategory ||
    (listingCategory === "farm inputs" && farmInputCategories.includes(supplierCategory)) ||
    (listingCategory === "logistics services" && logisticsCategories.includes(supplierCategory)) ||
    (listingCategory === "packaging" && supplierCategory === "packaging")
  );
}

export default async function SupplierProfilePage({ params }: SupplierProfilePageProps) {
  const [suppliers, marketplaceProducts] = await Promise.all([
    getSuppliersData(),
    getMarketplaceListingsData()
  ]);
  const supplier = suppliers.find((record) => record.slug === params.slug);

  if (!supplier) {
    notFound();
  }

  const profileImage = supplier.photos[0] ?? "/images/suppliers/supplier-1.jpg";
  const deliverySupport = deliverySupportFor(supplier);
  const supplierListings = marketplaceProducts
    .filter((listing) => listing.available !== "Sold Out" && listingMatchesSupplier(listing, supplier))
    .slice(0, 6);
  const serviceCards = supplier.productsServices.slice(0, 8).map((service) => ({
    name: service,
    image: supplierServiceImageForName(service, supplier.supplierCategory, profileImage)
  }));

  const snapshotItems = [
    { icon: Building2, label: "Supplier Category", value: supplier.supplierCategory },
    { icon: PackageCheck, label: "Main Products / Services", value: supplier.productsServices.slice(0, 3).join(", ") },
    { icon: PackageCheck, label: "Active Listings", value: `${supplierListings.length}` },
    { icon: MapPin, label: "Service Area", value: supplier.serviceCoverageArea },
    { icon: Truck, label: "Delivery / Support", value: deliverySupport },
    { icon: ShieldCheck, label: "Verification Status", value: supplier.verificationStatus },
    { icon: Globe2, label: "Website", value: websiteLabel(supplier.website) }
  ];
  const trustItems = [
    { icon: BadgeCheck, label: "Verified by Ghana Growers" },
    { icon: CheckCircle2, label: "Business Details Reviewed" },
    { icon: ShieldCheck, label: "Profile Approved" }
  ];

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-earth-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.56fr_1.38fr_0.66fr] lg:items-center lg:px-8 lg:py-12">
          <div>
            <div className="relative overflow-hidden rounded-md border border-white bg-white p-2 shadow-soft">
              <SafeImage
                src={profileImage}
                alt={`${supplier.companyName} supplier profile image`}
                width={440}
                height={440}
                priority
                fallbackKind="supplier"
                sizes="(min-width: 1024px) 20vw, 100vw"
                className="aspect-[4/3] w-full rounded-md object-cover lg:aspect-[4/5]"
              />
              {supplier.verificationStatus === "Verified" || supplier.ggStandardStatus === "Member" ? (
                <div className="absolute bottom-5 left-5 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-2">
                  <SupplierVerificationBadge status={supplier.verificationStatus} />
                  <GGStandardBadge status={supplier.ggStandardStatus} />
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <p className="gg-eyebrow">Supplier Profile</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">{supplier.companyName}</h1>
            <p className="mt-2 text-xl font-black text-leaf-700">{supplier.supplierCategory}</p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-ink/68 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                {supplier.district}, {supplier.region}
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-leaf-700" aria-hidden="true" />
                {supplier.serviceCoverageArea}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {supplier.productsServices.slice(0, 5).map((service) => (
                <span key={service} className="rounded-md bg-white px-3 py-1.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Contact supplier</p>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Confirm product availability, delivery coverage, pricing, and support terms before purchase.
            </p>
            <RequestConnectionButton
              label="Request Connection"
              sourceType="Supplier"
              sourceId={supplier.slug}
              sourceName={supplier.companyName}
              requestSource="supplier_profile"
              productInterest={supplier.productsServices.slice(0, 3).join(", ")}
              productOptions={supplier.productsServices}
              className="mt-5 w-full"
              helperText="Ghana Growers reviews your request before helping route the connection."
            />
            {supplier.website ? (
              <a
                href={supplier.website}
                target="_blank"
                rel="noreferrer"
                className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50"
              >
                Visit Website
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Supplier Snapshot</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Service readiness at a glance</h2>
              </div>
              <Link href="/supplier-directory" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                Back to Directory
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snapshotItems.map((item) => (
                <SnapshotCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          </section>

          <div className="mt-6">
            <GGStandardCommitment status={supplier.ggStandardStatus} />
          </div>

          <section className="mt-6 rounded-md border border-leaf-900/10 bg-leaf-50 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Products and Services</p>
                <h2 className="mt-2 text-2xl font-black text-ink">What this supplier provides</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/62">{supplier.serviceCoverageArea}</p>
            </div>
            <div className="mt-5 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceCards.map((service) => (
                <article key={service.name} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                  <SafeImage
                    src={service.image}
                    alt={`${service.name} supplied by ${supplier.companyName}`}
                    width={420}
                    height={260}
                    fallbackKind="supplier"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="h-32 w-full object-cover sm:h-36"
                  />
                  <div className="p-3.5">
                    <h3 className="font-black text-ink">{service.name}</h3>
                    <p className="mt-1.5 text-sm font-bold text-ink/52">{supplier.supplierCategory}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.75fr]">
            <div className="grid gap-8">
              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Company Overview</p>
                <h2 className="mt-2 text-2xl font-black text-ink">About {supplier.companyName}</h2>
                <p className="mt-4 text-sm leading-7 text-ink/68">{supplier.companyOverview}</p>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace</p>
                      <h2 className="mt-2 text-2xl font-black text-ink">Products & Services Listed</h2>
                    </div>
                    <Link href="/marketplace" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                      View Marketplace
                    </Link>
                  </div>
                  {supplierListings.length > 0 ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {supplierListings.map((listing) => (
                        <article
                          key={listing.id}
                          className="overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50 transition hover:border-leaf-700 hover:bg-white"
                        >
                          <SafeImage
                            src={listing.image}
                            alt={`${listing.name} marketplace listing from ${supplier.companyName}`}
                            width={420}
                            height={240}
                            fallbackKind="marketplace"
                            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                            className="h-32 w-full object-cover"
                          />
                          <div className="p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-earth-700">{listing.category}</p>
                            <h3 className="mt-1 font-black text-ink">{listing.name}</h3>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs font-black uppercase tracking-wide text-ink/40">Availability</p>
                                <p className="mt-1 font-black text-leaf-700">{listing.available}</p>
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase tracking-wide text-ink/40">Quantity</p>
                                <p className="mt-1 font-black text-ink">{listing.quantity} {listing.unit}</p>
                              </div>
                            </div>
                            <RequestConnectionButton
                              label="Request Connection"
                              sourceType="Supplier Listing"
                              sourceId={listing.id}
                              sourceName={`${supplier.companyName} - ${listing.name}`}
                              requestSource="marketplace_listing"
                              productInterest={listing.name}
                              listingSummary={{
                                product: listing.name,
                                seller: supplier.companyName,
                                location: `${supplier.district}, ${supplier.region}`,
                                pricePackage: listing.priceRange || "Ask for price",
                                listedQuantity: `${listing.quantity} ${listing.unit}`.trim(),
                                availability: listing.available
                              }}
                              className="mt-4 w-full"
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-md border border-dashed border-leaf-900/20 bg-leaf-50 p-5 text-sm font-bold text-ink/62">
                      No active marketplace listings yet.
                    </div>
                  )}
                </section>
            </div>

            <aside className="grid content-start gap-5">
              <section className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Service Location
                  </p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <LocationRow label="Region" value={supplier.region} />
                    <LocationRow label="District" value={supplier.district} />
                    <LocationRow label="Service area" value={supplier.serviceCoverageArea} />
                    <LocationRow label="Delivery / support" value={deliverySupport} />
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-leaf-900/10 bg-leaf-600 p-5 text-white shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-earth-300">Contact Details</p>
                <h2 className="mt-2 text-xl font-black">{supplier.contactPerson}</h2>
                <p className="mt-3 text-sm leading-6 text-white/78">{supplier.phone}</p>
                {supplier.website ? (
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white hover:text-earth-300"
                  >
                    {websiteLabel(supplier.website)}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </section>

              {supplier.verificationStatus === "Verified" ? (
                <section className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Trust Information</p>
                  <div className="mt-3 grid gap-2">
                    {trustItems.map((item) => (
                      <TrustBarItem key={item.label} icon={item.icon} label={item.label} />
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-ink/50">
                    {supplier.verificationDate ? `Verified on ${supplier.verificationDate}.` : "Verification date available on request."}
                  </p>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function SnapshotCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-3.5 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-earth-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-5 text-ink">{value}</p>
    </div>
  );
}

function TrustBarItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-ink">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-leaf-700 ring-1 ring-leaf-900/10">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span>
        {label}
      </span>
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
