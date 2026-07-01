"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  PackageCheck,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  UsersRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeaturedPlacementCTA } from "@/components/FeaturedPlacementCTA";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
import type { BuyerRequest } from "@/data/buyerRequests";
import { productImageForListing } from "@/lib/productDisplay";
import type { FarmerProfile, Product, SupplierProfile } from "@/types";

type MarketplaceListingsProps = {
  products: Product[];
  farmers?: FarmerProfile[];
  suppliers?: SupplierProfile[];
  buyerRequests?: BuyerRequest[];
};

type FilterConfig = {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
};

const availabilityOptions = ["All", "Available Now", "Limited Stock", "Harvesting Soon", "Sold Out"];
const categoryGroupTerms: Record<string, string[]> = {
  "fresh-produce": ["vegetable", "fruit", "tuber", "cereal", "crop", "produce", "tomato", "onion", "maize", "cassava", "yam", "plantain", "rice"],
  "farm-inputs": ["input", "seed", "fertilizer", "agro", "chemical", "tool", "equipment", "irrigation", "feed"],
  "farm-services": ["service", "advisory", "consulting", "mechanization", "labour", "labor", "land", "support"],
  livestock: ["livestock", "poultry", "egg", "goat", "sheep", "cattle", "fish", "animal"],
  logistics: ["logistics", "transport", "delivery", "haulage", "aggregation", "cold", "storage"],
  "packaging-storage": ["packaging", "storage", "crate", "sack", "carton", "label", "warehouse"]
};

function listingGalleryImages(product: Product) {
  const images = product.images?.length ? product.images : [product.image];
  return Array.from(new Set(images.filter(Boolean).map((image) => productImageForListing(product.name, product.category, image))));
}

function SearchBox({
  searchTerm,
  setSearchTerm
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">Search</span>
      <span className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search crops, livestock, suppliers..."
          className="w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm outline-none transition focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
        />
      </span>
    </label>
  );
}

function FilterControls({ filters }: { filters: FilterConfig[] }) {
  return (
    <div className="grid gap-4">
      {filters.map((filter) => (
        <label key={filter.label} className="block">
          <span className="mb-2 block text-sm font-black text-ink">{filter.label}</span>
          <span className="relative block">
            <select
              value={filter.value}
              onChange={(event) => filter.setValue(event.target.value)}
              className="w-full appearance-none rounded-md border border-leaf-900/10 bg-white px-3 py-3 pr-9 text-sm text-ink/75 shadow-sm outline-none transition focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
            >
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          </span>
        </label>
      ))}
    </div>
  );
}

function MarketplaceStats({
  activeListings,
  productsAvailable,
  verifiedSellers
}: {
  activeListings: number;
  productsAvailable: number;
  verifiedSellers: number;
}) {
  const stats = [
    { label: "Active listings", value: activeListings, icon: PackageCheck },
    { label: "Products available", value: productsAvailable, icon: Tag },
    { label: "Verified sellers", value: verifiedSellers, icon: UsersRound }
  ];

  return (
    <div className="grid gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3 rounded-md border border-leaf-900/10 bg-white px-3 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-leaf-100 text-leaf-700">
              <Icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-lg font-black leading-none text-ink">{stat.value}</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-ink/45">{stat.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ListingCard({
  product,
  farmerBySlug,
  farmerById,
  supplierById,
  supplierBySlug,
  onViewDetails
}: {
  product: Product;
  farmerBySlug: Map<string, FarmerProfile>;
  farmerById: Map<string, FarmerProfile>;
  supplierById: Map<string, SupplierProfile>;
  supplierBySlug: Map<string, SupplierProfile>;
  onViewDetails: (product: Product) => void;
}) {
  const farmer = (product.ownerId ? farmerById.get(product.ownerId) : undefined) ?? (product.farmerSlug ? farmerBySlug.get(product.farmerSlug) : undefined);
  const supplier = product.ownerType === "Supplier"
    ? (product.ownerId ? supplierById.get(product.ownerId) : undefined) ?? supplierBySlug.get(product.ownerName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ?? "")
    : undefined;
  const productImage = listingGalleryImages(product)[0];
  const profileHref = farmer ? `/farmer-directory/${farmer.slug}` : supplier ? `/supplier-directory/${supplier.slug}` : "";
  const sellerName = farmer?.farmName ?? supplier?.companyName ?? product.seller;

  return (
    <article className="group overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-leaf-900/10 transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative">
        {profileHref ? (
          <Link href={profileHref} aria-label={`View ${sellerName} profile`}>
            <SafeImage
              src={productImage}
              alt={`${product.name} available in ${product.region}`}
              width={420}
              height={260}
              fallbackKind="marketplace"
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-52"
            />
          </Link>
        ) : (
          <SafeImage
            src={productImage}
            alt={`${product.name} available in ${product.region}`}
            width={420}
            height={260}
            fallbackKind="marketplace"
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-52"
          />
        )}
        {product.verified ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-xs font-black text-leaf-700 shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        ) : null}
        {product.featured ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-xs font-black text-earth-700 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-current" />
            Featured
          </span>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">
        <h2 className="text-lg font-black text-ink sm:text-xl">{product.name}</h2>
        <div className="mt-3 grid gap-1.5 text-sm leading-6 text-ink/62">
          <p>{product.region}</p>
          <p>
            {profileHref ? (
              <Link href={profileHref} className="font-black text-leaf-700 hover:text-leaf-800">
                {sellerName}
              </Link>
            ) : (
              <span className="font-black text-ink/72">{product.seller}</span>
            )}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-leaf-900/10 pt-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-ink/40">Quantity</p>
            <p className="mt-1 text-sm font-black leading-5 text-ink">{product.quantity} {product.unit}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-ink/40">Availability</p>
            <p className="mt-1 text-sm font-black leading-5 text-leaf-700">{product.available}</p>
          </div>
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="gg-button-primary w-full"
          >
            View Listing
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductDetailsModal({
  product,
  farmerBySlug,
  farmerById,
  supplierById,
  supplierBySlug,
  products,
  onClose
}: {
  product: Product;
  farmerBySlug: Map<string, FarmerProfile>;
  farmerById: Map<string, FarmerProfile>;
  supplierById: Map<string, SupplierProfile>;
  supplierBySlug: Map<string, SupplierProfile>;
  products: Product[];
  onClose: () => void;
}) {
  const farmer = (product.ownerId ? farmerById.get(product.ownerId) : undefined) ?? (product.farmerSlug ? farmerBySlug.get(product.farmerSlug) : undefined);
  const supplier = product.ownerType === "Supplier"
    ? (product.ownerId ? supplierById.get(product.ownerId) : undefined) ?? supplierBySlug.get(product.ownerName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ?? "")
    : undefined;
  const galleryImages = useMemo(() => listingGalleryImages(product), [product]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const relatedProducts = products
    .filter((listing) => listing.id !== product.id && (listing.category === product.category || listing.region === product.region))
    .slice(0, 4);

  useEffect(() => {
    setSelectedImage(galleryImages[0]);
  }, [galleryImages, product.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-md bg-white shadow-soft sm:rounded-md">
        <div className="flex items-center justify-between border-b border-leaf-900/10 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Marketplace Listing</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="grid h-10 w-10 place-items-center rounded-md border border-leaf-900/10 text-ink/65 transition hover:bg-leaf-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_1fr] lg:gap-7">
          <div className="grid gap-3">
            <SafeImage
              src={selectedImage}
              alt={`${product.name} listing photo`}
              width={560}
              height={420}
              fallbackKind="marketplace"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-56 w-full rounded-md object-cover sm:h-80 lg:h-[420px]"
            />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View ${product.name} image ${index + 1}`}
                  className={`overflow-hidden rounded-md border bg-white p-1 transition ${
                    selectedImage === image ? "border-leaf-700 shadow-sm" : "border-leaf-900/10 hover:border-leaf-600"
                  }`}
                >
                  <SafeImage
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    width={120}
                    height={90}
                    fallbackKind="marketplace"
                    sizes="96px"
                    className="aspect-[4/3] w-full rounded-[8px] object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight text-ink sm:text-3xl">{product.name}</h2>
            <div className="mt-5 grid gap-3 text-sm text-ink/68">
              <Detail label="Seller" value={farmer?.farmName ?? supplier?.companyName ?? product.seller} />
              {farmer ? (
                <Link href={`/farmer-directory/${farmer.slug}`} className="inline-flex w-fit rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-white hover:text-leaf-800">
                  View Farmer Profile
                </Link>
              ) : null}
              {supplier ? (
                <Link href={`/supplier-directory/${supplier.slug}`} className="inline-flex w-fit rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-white hover:text-leaf-800">
                  View Supplier Profile
                </Link>
              ) : null}
              <Detail label="Region" value={product.region} />
              <Detail label="Quantity" value={`${product.quantity} ${product.unit}`} />
              <Detail label="Availability" value={product.available} />
            </div>
            <div className="mt-5 rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
              <h3 className="font-black text-ink">Description</h3>
              <p className="mt-2 text-sm leading-6 text-ink/68">{product.description}</p>
            </div>
            <div className="mt-5">
              <RequestConnectionButton
                label="Request Connection"
                sourceType={supplier ? "Supplier Listing" : "Marketplace Listing"}
                sourceId={product.id}
                sourceName={product.name}
                productInterest={product.name}
                className="w-full"
                helperText="Ghana Growers reviews your request before helping route the connection."
              />
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 ? (
          <div className="border-t border-leaf-900/10 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Related Products</p>
                <h3 className="mt-2 text-xl font-black text-ink">Similar listings to compare</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((listing) => (
                <article key={listing.id} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                  <SafeImage
                    src={listingGalleryImages(listing)[0]}
                    alt={`${listing.name} related listing`}
                    width={280}
                    height={180}
                    fallbackKind="marketplace"
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="h-28 w-full object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-black text-ink">{listing.name}</h4>
                    <p className="mt-1 text-sm text-ink/58">{listing.region}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
      <p className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-semibold text-ink/78">{value}</p>
    </div>
  );
}

export function MarketplaceListings({ products, farmers = [], suppliers = [] }: MarketplaceListingsProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const initialCategoryGroup = searchParams.get("category") ?? "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [productName, setProductName] = useState("All");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const regions = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.region)))], [products]);
  const productNames = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.name)))], [products]);

  const filters: FilterConfig[] = [
    { label: "Category", value: category, setValue: setCategory, options: categories },
    { label: "Region", value: region, setValue: setRegion, options: regions },
    { label: "Availability", value: availability, setValue: setAvailability, options: availabilityOptions },
    { label: "Crop/Product", value: productName, setValue: setProductName, options: productNames }
  ];

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const categoryGroup = initialCategoryGroup.trim().toLowerCase();
    const groupTerms = categoryGroupTerms[categoryGroup] ?? [];

    return products.filter((product) => {
      const searchableText = [product.name, product.category, product.region, product.location, product.seller, product.description]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);
      const matchesCategoryGroup =
        !groupTerms.length ||
        groupTerms.some((term) => searchableText.includes(term));
      const matchesCategory = category === "All" || product.category === category;
      const matchesRegion = region === "All" || product.region === region;
      const matchesAvailability = availability === "All" || product.available === availability;
      const matchesProduct = productName === "All" || product.name === productName;

      return matchesSearch && matchesCategoryGroup && matchesCategory && matchesRegion && matchesAvailability && matchesProduct;
    });
  }, [availability, category, initialCategoryGroup, productName, products, region, searchTerm]);

  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);
  const activeListings = products.length;
  const productsAvailable = products.filter((product) => product.available !== "Sold Out").length;
  const verifiedSellers = products.filter((product) => product.verified).length;
  const farmerBySlug = useMemo(() => new Map(farmers.map((farmer) => [farmer.slug, farmer])), [farmers]);
  const farmerById = useMemo(
    () => new Map(farmers.filter((farmer) => farmer.id).map((farmer) => [farmer.id as string, farmer])),
    [farmers]
  );
  const supplierBySlug = useMemo(() => new Map(suppliers.map((supplier) => [supplier.slug, supplier])), [suppliers]);
  const supplierById = useMemo(
    () => new Map(suppliers.filter((supplier) => supplier.id).map((supplier) => [supplier.id as string, supplier])),
    [suppliers]
  );

  return (
    <>
      <section id="marketplace-listings" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                <h2 className="text-lg font-black text-ink">Find listings</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">Filter produce, livestock, and supply listings by what matters most.</p>
                <div className="mt-5">
                  <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </div>
                <div className="mt-5">
                  <FilterControls filters={filters} />
                </div>
                <div className="mt-6 border-t border-leaf-900/10 pt-5">
                  <MarketplaceStats
                    activeListings={activeListings}
                    productsAvailable={productsAvailable}
                    verifiedSellers={verifiedSellers}
                  />
                </div>
              </div>
            </aside>

            <div>
              <div className="lg:hidden">
                <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                  <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters((value) => !value)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink transition hover:bg-leaf-50"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {showMobileFilters ? "Hide Filters" : "Show Filters"}
                  </button>
                  {showMobileFilters ? (
                    <div className="mt-4 border-t border-leaf-900/10 pt-4">
                      <FilterControls filters={filters} />
                      <div className="mt-5">
                        <MarketplaceStats
                          activeListings={activeListings}
                          productsAvailable={productsAvailable}
                          verifiedSellers={verifiedSellers}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between lg:mt-0">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Available listings</p>
                  <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Browse marketplace products</h2>
                </div>
                <p className="text-sm font-semibold text-ink/55">
                  Showing {filteredProducts.length} of {products.length} listings
                </p>
              </div>

              {products.length === 0 ? (
                <div className="gg-empty-state mt-8">
                  <h3 className="gg-card-title">No records available yet</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/62">
                    Ghana Growers is currently onboarding farmers and suppliers before public marketplace listings go live.
                  </p>
                  <Link
                    href="/join"
                    className="gg-button-primary mt-5"
                  >
                    Join the Network
                  </Link>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ListingCard
                      key={product.id}
                      product={product}
                      farmerBySlug={farmerBySlug}
                      farmerById={farmerById}
                      supplierBySlug={supplierBySlug}
                      supplierById={supplierById}
                      onViewDetails={setSelectedProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="gg-empty-state mt-8">
                  <h3 className="gg-card-title">No records available yet</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">Try another search, category, availability, or region.</p>
                </div>
              )}
            </div>
          </div>
          <FeaturedPlacementCTA defaultRole="Listing Owner" className="mt-10" />
        </div>
      </section>

      <section className="bg-earth-50 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Featured Produce</p>
            <h2 className="mt-3 text-3xl font-black text-ink">Strong opportunities this week</h2>
            <p className="mt-3 leading-7 text-ink/65">
              A short editorial highlight of listings with quality imagery, strong availability, and direct inquiry paths.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-md border border-white/70 bg-white shadow-sm">
                <SafeImage
                  src={productImageForListing(product.name, product.category, product.image)}
                  alt={`${product.name} featured marketplace listing`}
                  width={360}
                  height={220}
                  fallbackKind="marketplace"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">{product.region}</p>
                  <h3 className="mt-2 font-black text-ink">{product.name}</h3>
                  <p className="mt-1 text-sm text-ink/58">
                    {product.quantity} {product.unit} available
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="mt-4 w-full rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-2.5 text-sm font-black text-leaf-800 transition hover:border-leaf-700 hover:bg-white"
                  >
                    View Listing
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {selectedProduct ? (
        <ProductDetailsModal
          product={selectedProduct}
          farmerBySlug={farmerBySlug}
          farmerById={farmerById}
          supplierBySlug={supplierBySlug}
          supplierById={supplierById}
          products={products}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </>
  );
}
