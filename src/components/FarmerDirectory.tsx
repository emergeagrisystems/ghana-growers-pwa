"use client";

import Link from "next/link";
import { BadgeCheck, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { GGStandardBadge } from "@/components/GGStandard";
import { SafeImage } from "@/components/SafeImage";
import { normalizeTrust } from "@/components/TrustIndicators";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { cleanProductList, productImageForName } from "@/lib/productDisplay";
import type { FarmerProfile } from "@/types";

type FarmerDirectoryProps = {
  farmers: FarmerProfile[];
  initialSearch?: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function titleCaseValue(value: string) {
  return value
    .trim()
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\s+/g, " ")
    .split(/(\s+|-|,)/)
    .map((part) => {
      if (/^(\s+|-|,)$/.test(part)) {
        return part;
      }

      const lower = part.toLowerCase();
      return lower ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower;
    })
    .join("")
    .replace(/\bRegion\b/gi, "Region");
}

function cleanProfileLabel(value: string) {
  return titleCaseValue(value)
    .replace(/\bMaise\b/gi, "Maize")
    .replace(/\bAquaculture And Poultry\b/gi, "Aquaculture & Poultry")
    .replace(/\bCabbages And Chili Pepper\b/gi, "Cabbage & Chili Pepper");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanFarmerLocation(farmer: FarmerProfile) {
  const region = cleanProfileLabel(farmer.region);
  let district = cleanProfileLabel(farmer.district);

  if (region) {
    district = district
      .replace(new RegExp(`^${escapeRegExp(region)}\\s*`, "i"), "")
      .replace(new RegExp(`,?\\s*${escapeRegExp(region)}$`, "i"), "")
      .trim()
      .replace(/^,|,$/g, "")
      .trim();
  }

  if (!district) {
    return region || "Ghana";
  }

  return region ? `${district}, ${region}` : district;
}

function farmerProducts(farmer: FarmerProfile) {
  return cleanProductList(farmer.products).map(cleanProfileLabel);
}

function farmerCardImage(farmer: FarmerProfile, products: string[]) {
  if (farmer.hasRealPhoto && farmer.photos[0]) {
    return farmer.photos[0];
  }

  return productImageForName(products[0] ?? "Produce", farmer.farmType);
}

function farmerImagePosition(farmer: FarmerProfile) {
  return farmer.farmName.toLowerCase().includes("nart") ? "object-[center_18%]" : "object-[center_30%]";
}

function FarmerBadge({ status }: { status: string }) {
  if (status === "Verified") {
    return (
      <span aria-label="Verified by Ghana Growers" className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified
      </span>
    );
  }

  return null;
}

export function FarmerDirectory({ farmers, initialSearch = "" }: FarmerDirectoryProps) {
  const [search, setSearch] = useState(initialSearch);
  const [region, setRegion] = useState("All");
  const [district, setDistrict] = useState("All");
  const [product, setProduct] = useState("All");
  const [farmType, setFarmType] = useState("All");

  const regions = useMemo(() => unique(farmers.map((farmer) => farmer.region)), [farmers]);
  const districts = useMemo(() => unique(farmers.map((farmer) => farmer.district)), [farmers]);
  const products = useMemo(() => unique(farmers.flatMap((farmer) => farmer.products)), [farmers]);
  const farmTypes = useMemo(() => unique(farmers.map((farmer) => farmer.farmType)), [farmers]);

  const filteredFarmers = farmers.filter((farmer) => {
    const query = search.trim().toLowerCase();
    const searchable = [
      farmer.farmName,
      farmer.contactName,
      farmer.region,
      farmer.district,
      cleanFarmerLocation(farmer),
      farmer.farmType,
      farmer.availabilityStatus,
      farmer.products.join(" "),
      farmerProducts(farmer).join(" ")
    ].join(" ").toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (region === "All" || farmer.region === region) &&
      (district === "All" || farmer.district === district) &&
      (product === "All" || farmer.products.includes(product)) &&
      (farmType === "All" || farmer.farmType === farmType)
    );
  });

  const filters = [
    { label: "Region", value: region, setValue: setRegion, options: regions },
    { label: "District", value: district, setValue: setDistrict, options: districts },
    { label: "Product", value: product, setValue: setProduct, options: products },
    { label: "Farm Type", value: farmType, setValue: setFarmType, options: farmTypes }
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                <SlidersHorizontal size={17} aria-hidden="true" />
                Farmer discovery
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Search farmer profiles</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Browse farmers by region, district, product, and farm type.
              </p>
            </div>
            <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-ink/70">
              Showing {filteredFarmers.length} of {farmers.length} farmers
            </p>
          </div>

          <label className="mt-6 grid gap-2 text-sm font-bold text-ink/75">
            Search farmers
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-600" size={18} aria-hidden="true" />
              <input
                className="focus-ring min-h-12 w-full rounded-md border border-leaf-900/15 bg-white py-3 pl-10 pr-3 font-normal"
                placeholder="Search by farm, product, region, district, or contact name"
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
                      {cleanProfileLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        {farmers.length === 0 ? (
          <div className="gg-empty-state mt-8">
            <h3 className="gg-card-title">No records available yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/62">
              Ghana Growers is reviewing farmer profiles before they appear publicly.
            </p>
            <Link
              href="/join"
              className="gg-button-primary mt-5"
            >
              Join the Network
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredFarmers.map((farmer) => (
              <article key={farmer.slug} className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              {(() => {
                const trust = normalizeTrust(farmer.trust);
                const products = farmerProducts(farmer);
                const mainProducts = products.slice(0, 3);
                const extraProductCount = Math.max(0, products.length - mainProducts.length);

                return (
                  <>
                    <SafeImage
                      src={farmerCardImage(farmer, products)}
                      alt={`${farmer.farmName} farm photo`}
                      width={420}
                      height={360}
                      className={`aspect-[4/3] w-full bg-leaf-50 object-cover ${farmerImagePosition(farmer)}`}
                      fallbackKind="crop"
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">{cleanProfileLabel(farmer.farmType)}</p>
                          <h3 className="mt-1 text-xl font-black text-ink">{farmer.farmName}</h3>
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          <FarmerBadge status={trust.status} />
                          <GGStandardBadge status={farmer.ggStandardStatus} />
                        </div>
                      </div>

                      <p className="mt-3 text-sm font-semibold text-ink/58">{cleanFarmerLocation(farmer)}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {mainProducts.map((item) => (
                            <span key={item} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                              {item}
                            </span>
                        ))}
                        {extraProductCount > 0 ? (
                          <span className="rounded-md bg-earth-50 px-3 py-1 text-xs font-bold text-earth-700">
                            +{extraProductCount} more
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
                        <Link
                          href={`/farmer-directory/${farmer.slug}`}
                          className="gg-button-primary w-full"
                          aria-label={`View profile for ${farmer.farmName}`}
                        >
                          View Profile
                        </Link>
                        <RequestConnectionButton
                          label="Request Produce"
                          sourceType="Farmer"
                          sourceId={farmer.slug}
                          sourceName={farmer.farmName}
                          productInterest={mainProducts.join(", ")}
                          ariaLabel={`Request produce from ${farmer.farmName}`}
                          className="w-full border border-leaf-900/10 bg-white text-leaf-700 shadow-none hover:bg-leaf-50"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
              </article>
            ))}
          </div>
        )}

        {farmers.length > 0 && filteredFarmers.length === 0 ? (
          <div className="mt-8 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <h3 className="text-lg font-black text-ink">No matching farmers found.</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">
              Try another region, district, product, or farm type.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRegion("All");
                setDistrict("All");
                setProduct("All");
                setFarmType("All");
              }}
              className="gg-button-secondary mt-4"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
