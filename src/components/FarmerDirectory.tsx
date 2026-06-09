"use client";

import Link from "next/link";
import { BadgeCheck, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { normalizeTrust } from "@/components/TrustIndicators";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import type { FarmerProfile } from "@/types";

type FarmerDirectoryProps = {
  farmers: FarmerProfile[];
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function FarmerBadge({ status }: { status: string }) {
  if (status === "Verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified by Ghana Growers
      </span>
    );
  }

  return null;
}

export function FarmerDirectory({ farmers }: FarmerDirectoryProps) {
  const [search, setSearch] = useState("");
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
      farmer.farmType,
      farmer.availabilityStatus,
      farmer.products.join(" ")
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
              <h2 className="mt-2 text-3xl font-black text-ink">Search verified-ready farmer profiles</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Browse farmers across the Ghana Growers network by region, district, product, and farm type. Profiles include location,
                products, verification status, and contact options.
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
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredFarmers.map((farmer) => (
            <article key={farmer.slug} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              {(() => {
                const trust = normalizeTrust(farmer.trust);
                const mainProducts = farmer.products.slice(0, 3);

                return (
                  <>
                    <SafeImage
                      src={farmer.photos[0] ?? "/images/farmers/farmer-1.jpg"}
                      alt={`${farmer.farmName} farm photo`}
                      width={520}
                      height={320}
                      className="h-48 w-full bg-leaf-50 object-cover"
                      fallbackSrc="/images/farmers/farmer-1.jpg"
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">{farmer.region}</p>
                          <h3 className="mt-1 text-2xl font-black text-ink">{farmer.farmName}</h3>
                        </div>
                        <FarmerBadge status={trust.status} />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-ink/58">{farmer.district}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {mainProducts.map((item) => (
                            <span key={item} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                              {item}
                            </span>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/farmer-directory/${farmer.slug}`}
                          className="inline-flex w-full items-center justify-center rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800"
                        >
                          View Profile
                        </Link>
                        <WhatsAppButton
                          message={farmer.whatsappMessage}
                          label="WhatsApp"
                          sourceType="Farmer"
                          sourceId={farmer.slug}
                          sourceName={farmer.farmName}
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

        {filteredFarmers.length === 0 ? (
          <p className="mt-8 rounded-md bg-leaf-50 p-5 text-sm font-bold text-ink/70">
            No farmer profiles match these filters. Try another region, district, product, or farm type.
          </p>
        ) : null}
      </div>
    </section>
  );
}
