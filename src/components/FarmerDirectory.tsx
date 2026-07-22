"use client";

import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Sprout, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import {
  cleanFarmerLocation,
  cleanFarmerProfileLabel,
  farmerCardProducts,
  farmerImagePosition,
  farmerProducts,
  FARMERS_PER_PAGE,
  paginateFarmers,
  paginationPages,
  isVerifiedFarmer
} from "@/lib/farmerDirectory";
import type { PublicFarmerProfile } from "@/types";

type FarmerDirectoryProps = {
  farmers: PublicFarmerProfile[];
  initialSearch?: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function FarmerBadge({ status }: { status: string }) {
  if (status === "Verified") {
    return (
      <span aria-label="Verified by Ghana Growers" className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[0.68rem] font-bold text-leaf-700 shadow-sm">
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Verified
      </span>
    );
  }

  return null;
}

function FarmerPhotoPlaceholder() {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-t-md bg-gradient-to-br from-leaf-50 to-earth-50 text-center text-leaf-700">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white/80 shadow-sm ring-1 ring-leaf-900/10">
        <Sprout className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="text-xs font-bold text-ink/55">Photo coming soon</span>
    </div>
  );
}

export function FarmerDirectory({ farmers, initialSearch = "" }: FarmerDirectoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [search, setSearch] = useState(initialSearch);
  const [region, setRegion] = useState("All");
  const [district, setDistrict] = useState("All");
  const [product, setProduct] = useState("All");
  const [farmType, setFarmType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const regions = useMemo(() => unique(farmers.map((farmer) => farmer.region)), [farmers]);
  const districts = useMemo(() => {
    const districtSource = region === "All" ? farmers : farmers.filter((farmer) => farmer.region === region);
    return unique(districtSource.map((farmer) => farmer.district));
  }, [farmers, region]);
  const products = useMemo(() => unique(farmers.flatMap((farmer) => farmer.products)), [farmers]);
  const farmTypes = useMemo(() => unique(farmers.map((farmer) => farmer.farmType)), [farmers]);
  const hasActiveFilters = search.trim().length > 0 || region !== "All" || district !== "All" || product !== "All" || farmType !== "All";

  useEffect(() => {
    setCurrentPage(1);
  }, [search, region, district, product, farmType]);

  function scrollToDiscovery() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  function changePage(page: number) {
    setCurrentPage(page);
    window.requestAnimationFrame(scrollToDiscovery);
  }

  function clearFilters() {
    setSearch("");
    setRegion("All");
    setDistrict("All");
    setProduct("All");
    setFarmType("All");
  }

  const filteredFarmers = farmers.filter((farmer) => {
    const query = search.trim().toLowerCase();
    const searchable = [
      farmer.farmName,
      farmer.farmerName,
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
    { label: "Region", value: region, setValue: setRegion, options: regions, disabled: false },
    { label: "District", value: district, setValue: setDistrict, options: districts, disabled: region === "All" },
    { label: "Product", value: product, setValue: setProduct, options: products, disabled: false },
    { label: "Farm Type", value: farmType, setValue: setFarmType, options: farmTypes, disabled: false }
  ];
  const paginatedFarmers = paginateFarmers(filteredFarmers, currentPage, FARMERS_PER_PAGE);
  const showingStart = filteredFarmers.length === 0 ? 0 : paginatedFarmers.startIndex + 1;
  const showingEnd = paginatedFarmers.endIndex;

  return (
    <section id="farmer-discovery" ref={sectionRef} className="scroll-mt-24 bg-earth-50 py-12 sm:py-14">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-earth-700">
                <SlidersHorizontal size={15} aria-hidden="true" />
                Farmer discovery
              </p>
              <h2 className="mt-1 text-xl font-black text-ink sm:text-2xl">Search farmer profiles</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/65">
                Browse farmers by region, district, product, and farm type.
              </p>
            </div>
            <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-ink/70">
              {filteredFarmers.length > 0
                ? `Showing ${showingStart}–${showingEnd} of ${filteredFarmers.length} farmers`
                : `Showing 0 of ${farmers.length} farmers`}
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(420px,2fr)_repeat(4,minmax(0,1fr))] lg:items-end">
            <label className="grid gap-1.5 text-sm font-bold text-ink/75">
              Search farmers
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-600" size={18} aria-hidden="true" />
                <input
                  className="focus-ring min-h-11 w-full rounded-md border border-leaf-900/15 bg-white py-2.5 pl-10 pr-3 font-normal"
                  placeholder="Search by farm, product, region, district, or contact name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </span>
            </label>
            {filters.map((filter) => (
              <label key={filter.label} className="grid gap-1.5 text-sm font-bold text-ink/75">
                {filter.label}
                <select
                  className="focus-ring min-h-11 rounded-md border border-leaf-900/15 bg-white px-3 py-2.5 font-normal disabled:cursor-not-allowed disabled:bg-white/55 disabled:text-ink/40"
                  value={filter.value}
                  disabled={filter.disabled}
                  onChange={(event) => {
                    filter.setValue(event.target.value);
                    if (filter.label === "Region") {
                      setDistrict("All");
                    }
                  }}
                >
                  <option value="All">All {filter.label.toLowerCase()}s</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {cleanFarmerProfileLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="gg-button-secondary mt-4 min-h-10 px-4 py-2">
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          ) : null}
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedFarmers.pageItems.map((farmer) => (
              <article key={farmer.slug} className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              {(() => {
                const products = farmerCardProducts(farmer);
                const mainProducts = products.slice(0, 2);
                const extraProductCount = Math.max(0, products.length - mainProducts.length);
                const hasRealPhoto = Boolean(farmer.hasRealPhoto && farmer.photos[0]);

                return (
                  <>
                    <div className="relative">
                      {hasRealPhoto ? (
                        <SafeImage
                          src={farmer.photos[0]}
                          alt={`${farmer.farmName} farm photo`}
                          width={360}
                          height={270}
                          className={`aspect-[4/3] w-full rounded-t-md bg-leaf-50 object-cover ${farmerImagePosition(farmer)}`}
                          fallbackKind="crop"
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <FarmerPhotoPlaceholder />
                      )}
                      <FarmerBadge status={isVerifiedFarmer(farmer) ? "Verified" : farmer.verificationStatus} />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="min-h-[2.9rem] text-lg font-extrabold leading-tight text-ink [text-wrap:balance] line-clamp-2">
                        <Link
                          href={`/farmer-directory/${farmer.slug}`}
                          className="focus-ring rounded-sm hover:text-leaf-700"
                          aria-label={`View profile for ${farmer.farmName}`}
                        >
                          {farmer.farmName}
                        </Link>
                      </h3>

                      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-ink/58">{cleanFarmerLocation(farmer)}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {mainProducts.map((item) => (
                            <span key={item} className="rounded-md bg-leaf-50 px-2.5 py-1 text-[0.72rem] font-semibold text-leaf-700">
                              {item}
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
              onClick={clearFilters}
              className="gg-button-secondary mt-4"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          </div>
        ) : null}

        {filteredFarmers.length > FARMERS_PER_PAGE ? (
          <Pagination
            currentPage={paginatedFarmers.currentPage}
            totalPages={paginatedFarmers.totalPages}
            onPageChange={changePage}
          />
        ) : null}
      </div>
    </section>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = paginationPages(currentPage, totalPages);

  return (
    <nav className="mt-8 flex flex-col items-center justify-between gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-3 sm:flex-row" aria-label="Farmer directory pagination">
      <button
        type="button"
        className="gg-button-secondary w-full sm:w-auto"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Go to previous farmer results page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </button>

      <div className="text-sm font-black text-ink/65 sm:hidden">
        Page {currentPage} of {totalPages}
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm font-black text-ink/45">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Go to farmer results page ${page}`}
              className={`focus-ring grid h-10 min-w-10 place-items-center rounded-md px-3 text-sm font-black transition ${
                page === currentPage ? "bg-leaf-700 text-white" : "bg-white text-leaf-700 hover:bg-leaf-100"
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="gg-button-secondary w-full sm:w-auto"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Go to next farmer results page"
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
