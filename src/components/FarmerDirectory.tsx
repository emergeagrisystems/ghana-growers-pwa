"use client";

import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import {
  cleanFarmerLocation,
  cleanFarmerProfileLabel,
  farmerCardImage,
  farmerImagePosition,
  farmerProducts,
  FARMERS_PER_PAGE,
  paginateFarmers,
  paginationPages,
  isVerifiedFarmer
} from "@/lib/farmerDirectory";
import type { FarmerProfile } from "@/types";

type FarmerDirectoryProps = {
  farmers: FarmerProfile[];
  initialSearch?: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function FarmerBadge({ status }: { status: string }) {
  if (status === "Verified") {
    return (
      <span aria-label="Verified by Ghana Growers" className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-xs font-black text-leaf-700 shadow-sm">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Verified
      </span>
    );
  }

  return null;
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
    { label: "Region", value: region, setValue: setRegion, options: regions, disabled: false },
    { label: "District", value: district, setValue: setDistrict, options: districts, disabled: region === "All" },
    { label: "Product", value: product, setValue: setProduct, options: products, disabled: false },
    { label: "Farm Type", value: farmType, setValue: setFarmType, options: farmTypes, disabled: false }
  ];
  const paginatedFarmers = paginateFarmers(filteredFarmers, currentPage, FARMERS_PER_PAGE);
  const showingStart = filteredFarmers.length === 0 ? 0 : paginatedFarmers.startIndex + 1;
  const showingEnd = paginatedFarmers.endIndex;

  return (
    <section id="farmer-discovery" ref={sectionRef} className="scroll-mt-24 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
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
              {filteredFarmers.length > 0
                ? `Showing ${showingStart}-${showingEnd} of ${filteredFarmers.length} farmers`
                : `Showing 0 of ${farmers.length} farmers`}
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
            <button type="button" onClick={clearFilters} className="gg-button-secondary mt-5">
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
              <article key={farmer.slug} className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              {(() => {
                const products = farmerProducts(farmer);
                const mainProducts = products.slice(0, 3);
                const extraProductCount = Math.max(0, products.length - mainProducts.length);
                const imageSrc = farmerCardImage(farmer, products);
                const hasRealPhoto = Boolean(farmer.hasRealPhoto && farmer.photos[0]);

                return (
                  <>
                    <div className="relative">
                      <SafeImage
                        src={imageSrc}
                        alt={hasRealPhoto ? `${farmer.farmName} farm photo` : ""}
                        width={360}
                        height={360}
                        className={`aspect-square w-full rounded-t-md bg-leaf-50 object-cover ${farmerImagePosition(farmer)}`}
                        fallbackKind="crop"
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                      {!hasRealPhoto ? (
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-ink/60 shadow-sm">
                          Profile photo pending
                        </span>
                      ) : null}
                      <FarmerBadge status={isVerifiedFarmer(farmer) ? "Verified" : farmer.verificationStatus} />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="min-h-[3.25rem] text-xl font-black leading-tight text-ink [text-wrap:balance] line-clamp-2">{farmer.farmName}</h3>

                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink/58">{cleanFarmerLocation(farmer)}</p>

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
