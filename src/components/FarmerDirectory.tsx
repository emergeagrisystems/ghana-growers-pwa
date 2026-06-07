"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, Sprout } from "lucide-react";
import { useMemo, useState } from "react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { normalizeTrust, TrustScoreCard, TrustSummary } from "@/components/TrustIndicators";
import type { FarmerProfile } from "@/types";

type FarmerDirectoryProps = {
  farmers: FarmerProfile[];
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
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
                Browse sample farmer records by region, district, product, and farm type. Ghana Growers can replace this
                local JSON data with verified database records as the network grows.
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
            <article key={farmer.slug} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              {(() => {
                const trust = normalizeTrust(farmer.trust);

                return (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase text-earth-700">{farmer.region}</p>
                        <h3 className="mt-1 text-2xl font-black text-ink">{farmer.farmName}</h3>
                        <p className="mt-2 text-sm font-bold text-leaf-700">{farmer.district}</p>
                      </div>
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                        <Sprout size={22} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <TrustSummary kind="farmer" trust={trust} />
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm text-ink/70">
                      <div>
                        <dt className="font-black text-ink">Products</dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {farmer.products.map((item) => (
                            <span key={item} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                              {item}
                            </span>
                          ))}
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <dt className="font-black text-ink">Farm Type</dt>
                          <dd>{farmer.farmType}</dd>
                        </div>
                        <div>
                          <dt className="font-black text-ink">Farm Size</dt>
                          <dd>{farmer.farmSize}</dd>
                        </div>
                      </div>
                      <div>
                        <dt className="font-black text-ink">Availability</dt>
                        <dd>{farmer.availabilityStatus}</dd>
                      </div>
                    </dl>

                    <div className="mt-5">
                      <TrustScoreCard score={trust.score} />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <WhatsAppButton message={farmer.whatsappMessage} className="w-full" />
                      <Link
                        href={`/farmer-directory/${farmer.slug}`}
                        className="focus-ring inline-flex items-center justify-center rounded-md bg-earth-500 px-4 py-3 text-sm font-black text-ink shadow-soft transition hover:bg-earth-700 hover:text-white"
                      >
                        View Profile
                      </Link>
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
