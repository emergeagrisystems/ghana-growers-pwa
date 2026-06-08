"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { FeaturedRibbon } from "@/components/FeaturedRibbon";
import { SafeImage } from "@/components/SafeImage";
import { normalizeTrust, TrustScoreCard, TrustSummary } from "@/components/TrustIndicators";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { featuredListingLabels, isFeaturedSupplier } from "@/data/featuredListings";
import { productCategories } from "@/data/products";
import type { SupplierProfile } from "@/types";

type SupplierDirectoryProps = {
  suppliers: SupplierProfile[];
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function relatedMarketplaceCategory(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("packaging")) {
    return productCategories.find((item) => item.slug === "packaging");
  }

  if (normalized.includes("logistics") || normalized.includes("storage")) {
    return productCategories.find((item) => item.slug === "logistics-services");
  }

  if (
    normalized.includes("seed") ||
    normalized.includes("fertilizer") ||
    normalized.includes("agrochemical") ||
    normalized.includes("equipment") ||
    normalized.includes("irrigation")
  ) {
    return productCategories.find((item) => item.slug === "farm-inputs");
  }

  return productCategories.find((item) => item.slug === "farm-inputs");
}

export function SupplierDirectory({ suppliers }: SupplierDirectoryProps) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [district, setDistrict] = useState("All");
  const [category, setCategory] = useState("All");
  const [coverage, setCoverage] = useState("All");

  const regions = useMemo(() => unique(suppliers.map((supplier) => supplier.region)), [suppliers]);
  const districts = useMemo(() => unique(suppliers.map((supplier) => supplier.district)), [suppliers]);
  const categories = useMemo(() => unique(suppliers.map((supplier) => supplier.supplierCategory)), [suppliers]);
  const coverageAreas = useMemo(() => unique(suppliers.map((supplier) => supplier.serviceCoverageArea)), [suppliers]);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.trim().toLowerCase();
    const searchable = [
      supplier.companyName,
      supplier.contactPerson,
      supplier.supplierCategory,
      supplier.region,
      supplier.district,
      supplier.serviceCoverageArea,
      supplier.shortDescription,
      supplier.productsServices.join(" ")
    ].join(" ").toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (region === "All" || supplier.region === region) &&
      (district === "All" || supplier.district === district) &&
      (category === "All" || supplier.supplierCategory === category) &&
      (coverage === "All" || supplier.serviceCoverageArea === coverage)
    );
  });

  const filters = [
    { label: "Region", value: region, setValue: setRegion, options: regions },
    { label: "District", value: district, setValue: setDistrict, options: districts },
    { label: "Supplier Category", value: category, setValue: setCategory, options: categories },
    { label: "Service Coverage Area", value: coverage, setValue: setCoverage, options: coverageAreas }
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                <SlidersHorizontal size={17} aria-hidden="true" />
                Supplier discovery
              </p>
              <h2 className="mt-2 text-3xl font-black text-ink">Search agricultural suppliers and service providers</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Find seed suppliers, input providers, equipment dealers, packaging companies, logistics partners,
                storage operators, finance providers, and agricultural consultants across Ghana.
              </p>
            </div>
            <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-ink/70">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </p>
          </div>

          <label className="mt-6 grid gap-2 text-sm font-bold text-ink/75">
            Search suppliers
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-600" size={18} aria-hidden="true" />
              <input
                className="focus-ring min-h-12 w-full rounded-md border border-leaf-900/15 bg-white py-3 pl-10 pr-3 font-normal"
                placeholder="Search by company, category, service, region, district, or coverage area"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filters.map((filter) => (
              <label key={filter.label} className="grid gap-2 text-sm font-bold text-ink/75">
                {filter.label}
                <select
                  className="focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal"
                  value={filter.value}
                  onChange={(event) => filter.setValue(event.target.value)}
                >
                  <option value="All">All {filter.label.toLowerCase()}s</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier) => (
            <article
              key={supplier.slug}
              className={`rounded-md bg-white p-5 shadow-soft ${
                isFeaturedSupplier(supplier.slug) ? "border-2 border-earth-500" : "border border-leaf-900/10"
              }`}
            >
              {(() => {
                const trust = normalizeTrust(supplier.trust);
                const categoryMatch = relatedMarketplaceCategory(supplier.supplierCategory);

                return (
                  <>
              {isFeaturedSupplier(supplier.slug) ? (
                <div className="mb-4">
                  <FeaturedRibbon label={featuredListingLabels.suppliers} />
                </div>
              ) : null}
              <SafeImage
                src={supplier.photos[0] ?? "/images/suppliers/supplier-1.jpg"}
                alt={`${supplier.companyName} supplier photo`}
                width={520}
                height={320}
                className="mb-5 h-44 w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover"
                fallbackSrc="/images/suppliers/supplier-1.jpg"
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-earth-700">{supplier.supplierCategory}</p>
                  <h3 className="mt-1 text-2xl font-black text-ink">{supplier.companyName}</h3>
                  <p className="mt-2 text-sm font-bold text-leaf-700">{supplier.district}, {supplier.region}</p>
                </div>
              </div>
              <div className="mt-4">
                <TrustSummary kind="supplier" trust={trust} />
              </div>

              <p className="mt-4 text-sm leading-6 text-ink/65">{supplier.shortDescription}</p>

              <dl className="mt-5 grid gap-3 text-sm text-ink/70">
                <div>
                  <dt className="font-black text-ink">Products/Services Offered</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {supplier.productsServices.map((item) => (
                      <span key={item} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Service Coverage Area</dt>
                  <dd>{supplier.serviceCoverageArea}</dd>
                </div>
              </dl>

              <div className="mt-5">
                <TrustScoreCard score={trust.score} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <WhatsAppButton message={supplier.whatsappMessage} className="w-full" />
                <Link
                  href={`/supplier-directory/${supplier.slug}`}
                  className="focus-ring inline-flex items-center justify-center rounded-md bg-earth-500 px-4 py-3 text-sm font-black text-ink shadow-soft transition hover:bg-earth-700 hover:text-white"
                >
                  View Profile
                </Link>
              </div>
              {categoryMatch ? (
                <Link
                  href="/marketplace"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-2.5 text-sm font-black text-leaf-800 transition hover:border-leaf-700 hover:bg-white"
                >
                  View Products: {categoryMatch.name}
                </Link>
              ) : null}
                  </>
                );
              })()}
            </article>
          ))}
        </div>

        {filteredSuppliers.length === 0 ? (
          <p className="mt-8 rounded-md bg-leaf-50 p-5 text-sm font-bold text-ink/70">
            No supplier profiles match these filters. Try another region, district, category, or service coverage area.
          </p>
        ) : null}
      </div>
    </section>
  );
}
