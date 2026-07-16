"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, ChevronDown, Filter, MapPin, PackageCheck, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { marketplaceListingImages } from "@/lib/marketplace/images";
import {
  MARKETPLACE_LISTINGS_PER_PAGE,
  marketplaceResultRange,
  paginateMarketplaceListings,
  publicMarketplaceListings,
  type MarketplaceDisplayListing
} from "@/lib/marketplace/publicListings";
import { normalizeMarketplaceCategoryFilter } from "@/lib/marketplace/taxonomy";
import type { FarmerProfile, Product, SupplierProfile } from "@/types";

type MarketplaceListingsProps = {
  products: Product[];
  farmers?: FarmerProfile[];
  suppliers?: SupplierProfile[];
};

type SelectFilter = {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: { label: string; value: string }[];
};

const categoryOptions = [
  { label: "All categories", value: "all" },
  { label: "Fresh Produce", value: "fresh-produce" },
  { label: "Farm Inputs", value: "farm-inputs" },
  { label: "Livestock", value: "livestock" },
  { label: "Tools & Equipment", value: "tools-equipment" }
];

const availabilityOptions = [
  { label: "All availability", value: "all" },
  { label: "Available now", value: "Available now" },
  { label: "Seasonal", value: "Seasonal" },
  { label: "Ask availability", value: "Ask availability" },
  { label: "Unavailable", value: "Unavailable" }
];

const categoryGroupTerms: Record<string, string[]> = {
  "fresh-produce": ["vegetable", "fruit", "tuber", "root", "grain", "cereal", "legume", "herb", "spice", "nut", "crop", "produce", "tomato", "onion", "maize", "cassava", "yam", "plantain", "rice", "sorghum", "millet", "wheat", "beans", "cowpea", "soybean", "groundnut", "cashew", "kola"],
  "farm-inputs": ["input", "seed", "fertilizer", "agro", "chemical", "feed"],
  livestock: ["livestock", "poultry", "egg", "goat", "sheep", "cattle", "fish", "animal", "broiler"],
  "tools-equipment": ["tool", "equipment", "tractor", "machinery", "mechanization", "irrigation"]
};

function listingImages(listing: MarketplaceDisplayListing) {
  return marketplaceListingImages(listing.product);
}

function filterLabelCount(values: string[]) {
  return values.filter((value) => value && value !== "all").length;
}

function SelectControl({ filter }: { filter: SelectFilter }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-ink/45">{filter.label}</span>
      <span className="relative block">
        <select
          value={filter.value}
          onChange={(event) => filter.setValue(event.target.value)}
          className="h-11 w-full appearance-none rounded-md border border-leaf-900/10 bg-white px-3 pr-9 text-sm font-bold text-ink/78 outline-none transition focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/42" aria-hidden="true" />
      </span>
    </label>
  );
}

function SearchControl({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-ink/45">Search</span>
      <span className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-700" aria-hidden="true" />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search tomatoes, maize, fertilizer, seeds..."
          className="h-11 w-full rounded-md border border-leaf-900/10 bg-white pl-10 pr-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/42 focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
          type="search"
        />
      </span>
    </label>
  );
}

function ListingCard({ listing }: { listing: MarketplaceDisplayListing }) {
  const image = listingImages(listing)[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-leaf-700/25 hover:shadow-card">
      <Link href={listing.href} className="focus-ring block" aria-label={`View listing for ${listing.title}`}>
        <div className="relative overflow-hidden bg-leaf-50">
          <SafeImage
            src={image}
            alt={`${listing.title} available from ${listing.sellerName}`}
            width={420}
            height={315}
            fallbackKind="marketplace"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:aspect-[4/3]"
          />
          {listing.isSellerVerified ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-xs font-black text-leaf-700 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verified
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h2 className="text-base font-black leading-tight text-ink">
            <Link href={listing.href} className="focus-ring rounded-sm transition hover:text-leaf-700">
              {listing.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm font-black text-ink/72">{listing.sellerName}</p>
          <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold leading-5 text-ink/58">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
            {listing.location || "Ghana"}
          </p>
          <div className="mt-4 grid gap-2 border-t border-leaf-900/10 pt-3 text-sm">
            <p className="flex items-start justify-between gap-3">
              <span className="font-semibold text-ink/48">Price</span>
              <span className="text-right font-black text-ink">{listing.priceLine}</span>
            </p>
            <p className="flex items-start justify-between gap-3">
              <span className="font-semibold text-ink/48">{listing.quantityLabel}</span>
              <span className="text-right font-black text-ink">{listing.quantity}</span>
            </p>
            <p className="flex items-start justify-between gap-3">
              <span className="font-semibold text-ink/48">Status</span>
              <span className="text-right font-black text-leaf-700">{listing.availability}</span>
            </p>
            {listing.supplyFrequency ? (
              <p className="flex items-start justify-between gap-3">
                <span className="font-semibold text-ink/48">Supply frequency</span>
                <span className="text-right font-black text-ink">{listing.supplyFrequency}</span>
              </p>
            ) : null}
          </div>
        </div>
        <Link href={listing.href} className="focus-ring mt-4 inline-flex w-fit items-center text-sm font-black text-leaf-700 transition group-hover:text-leaf-900">
          View listing →
        </Link>
      </div>
    </article>
  );
}

export function MarketplaceListings({ products, farmers = [], suppliers = [] }: MarketplaceListingsProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const initialCategory = normalizeMarketplaceCategoryFilter(searchParams.get("category") ?? "all") || "all";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory || "all");
  const [region, setRegion] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [productName, setProductName] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);

  const publicListings = useMemo(() => publicMarketplaceListings(products, farmers, suppliers), [farmers, products, suppliers]);
  const regionOptions = useMemo(() => {
    const regions = Array.from(new Set(publicListings.map((listing) => listing.location.split(",").pop()?.trim()).filter(Boolean)));
    return [{ label: "All regions", value: "all" }, ...regions.map((item) => ({ label: item as string, value: item as string }))];
  }, [publicListings]);
  const productOptions = useMemo(() => {
    const names = Array.from(new Set(publicListings.map((listing) => listing.title))).sort((a, b) => a.localeCompare(b));
    return [{ label: "All products", value: "all" }, ...names.map((item) => ({ label: item, value: item }))];
  }, [publicListings]);

  const filters: SelectFilter[] = [
    { label: "Category", value: category, setValue: setCategory, options: categoryOptions },
    { label: "Region", value: region, setValue: setRegion, options: regionOptions },
    { label: "Availability", value: availability, setValue: setAvailability, options: availabilityOptions },
    { label: "Product", value: productName, setValue: setProductName, options: productOptions }
  ];
  const activeFilterCount = filterLabelCount([category, region, availability, productName]) + (searchTerm.trim() ? 1 : 0);

  const filteredListings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const groupTerms = categoryGroupTerms[category] ?? [];

    return publicListings.filter((listing) => {
      const searchableText = [
        listing.title,
        listing.product.category,
        listing.location,
        listing.sellerName,
        listing.product.description,
        listing.product.available
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCategory = category === "all" || groupTerms.some((term) => searchableText.includes(term));
      const matchesRegion = region === "all" || listing.location.includes(region);
      const matchesAvailability = availability === "all" || listing.availability === availability;
      const matchesProduct = productName === "all" || listing.title === productName;

      return matchesSearch && matchesCategory && matchesRegion && matchesAvailability && matchesProduct;
    });
  }, [availability, category, productName, publicListings, region, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [availability, category, productName, region, searchTerm]);

  const paginated = paginateMarketplaceListings(filteredListings, page, MARKETPLACE_LISTINGS_PER_PAGE);

  function clearFilters() {
    setSearchTerm("");
    setCategory("all");
    setRegion("all");
    setAvailability("all");
    setProductName("all");
  }

  return (
    <section id="marketplace-listings" className="bg-white py-10 sm:py-12 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {publicListings.length > 0 ? (
          <>
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                <SearchControl searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <div className="hidden lg:contents">
                  {filters.map((filter) => (
                    <SelectControl key={filter.label} filter={filter} />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:mt-4">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters((value) => !value)}
                  aria-expanded={showMobileFilters}
                  aria-controls="marketplace-mobile-filters"
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-leaf-900/10 bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-leaf-50 lg:hidden"
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Filters
                  {activeFilterCount > 0 ? <span className="rounded-full bg-leaf-700 px-2 py-0.5 text-xs text-earth-50">{activeFilterCount}</span> : null}
                </button>

                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="focus-ring inline-flex min-h-10 w-fit items-center gap-2 rounded-md px-2 text-sm font-black text-leaf-700 transition hover:bg-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear filters
                  </button>
                ) : null}
              </div>

              {showMobileFilters ? (
                <div id="marketplace-mobile-filters" className="mt-4 grid gap-3 border-t border-leaf-900/10 pt-4 lg:hidden">
                  {filters.map((filter) => (
                    <SelectControl key={filter.label} filter={filter} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="gg-eyebrow text-earth-700/75">Available listings</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Browse marketplace products</h2>
              </div>
              <p className="text-sm font-semibold text-ink/55">{marketplaceResultRange(page, filteredListings.length)}</p>
            </div>

            {filteredListings.length > 0 ? (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
                  {paginated.pageItems.map((listing) => (
                    <ListingCard key={listing.product.id} listing={listing} />
                  ))}
                </div>

                {paginated.totalPages > 1 ? (
                  <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Marketplace pagination">
                    {Array.from({ length: paginated.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        aria-current={pageNumber === paginated.currentPage ? "page" : undefined}
                        className={`focus-ring grid h-10 min-w-10 place-items-center rounded-md px-3 text-sm font-black transition ${
                          pageNumber === paginated.currentPage
                            ? "bg-leaf-700 text-earth-50"
                            : "border border-leaf-900/10 bg-white text-leaf-700 hover:bg-leaf-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="gg-empty-state mt-7">
                <h3 className="gg-card-title">No listings match your search</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/62">
                  Try clearing a filter or ask Ghana Growers to help source what you need.
                </p>
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={clearFilters} className="gg-button-secondary">
                    Clear filters
                  </button>
                  <Link href="/submit-buyer-request" className="gg-button-primary">
                    Request Sourcing Support
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="gg-empty-state">
            <PackageCheck className="mx-auto h-10 w-10 text-leaf-700" aria-hidden="true" />
            <h2 className="gg-card-title mt-4">Marketplace listings are coming soon</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/62">
              Ghana Growers is reviewing farmer and supplier listings before they appear publicly.
            </p>
            <Link href="/submit-buyer-request" className="gg-button-primary mt-5">
              Request Sourcing Support
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
