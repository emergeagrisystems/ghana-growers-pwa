"use client";

import { BadgeCheck, MessageCircle, PackageCheck, Search, Tag, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import type { Product } from "@/types";

type MarketplaceListingsProps = {
  products: Product[];
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function contactUrl(product: Product) {
  const number = product.whatsappNumber || "233000000000";
  const message = `Hello Ghana Growers, I am interested in ${product.name} from ${product.seller}. Is ${product.quantity} ${product.unit} still available in ${product.region}?`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function ListingCard({ product, featured = false, onViewDetails }: { product: Product; featured?: boolean; onViewDetails: (product: Product) => void }) {
  return (
    <article className={`overflow-hidden rounded-md bg-white shadow-soft ${featured ? "border-2 border-earth-500" : "border border-leaf-900/10"}`}>
      <div className="relative">
        <SafeImage src={product.image} alt={product.name} width={520} height={340} className="h-36 w-full object-cover sm:h-40" />
        {featured ? (
          <span className="absolute left-3 top-3 rounded-md bg-earth-500 px-2 py-1 text-[10px] font-black uppercase text-ink shadow-soft">
            Featured
          </span>
        ) : null}
        {product.verified ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-black uppercase text-leaf-700 shadow-soft">
            <BadgeCheck size={12} aria-hidden="true" />
            Verified
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-xs font-black uppercase text-earth-700">{product.category}</p>
        <h3 className="mt-1 text-lg font-black text-ink">{product.name}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-black uppercase text-ink/45">Region</p>
            <p className="mt-1 font-bold text-ink/75">{product.region}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-ink/45">Quantity</p>
            <p className="mt-1 font-bold text-ink/75">{product.quantity} {product.unit}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="focus-ring inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
          >
            View Details
          </button>
          <a
            href={contactUrl(product)}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-earth-500 px-4 py-3 text-sm font-black text-ink transition hover:bg-earth-700 hover:text-white"
          >
            <MessageCircle size={17} aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-ink/65 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-md bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-leaf-900/10 px-4 py-3 sm:px-5">
          <p className="text-sm font-black uppercase text-earth-700">Product Details</p>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-leaf-50 text-ink hover:bg-leaf-100"
            aria-label="Close product details"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[0.95fr_1.05fr]">
          <SafeImage src={product.image} alt={`${product.name} product listing`} width={720} height={480} className="h-64 w-full rounded-md object-cover lg:h-full" />
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-earth-700">{product.category}</p>
                <h2 id="product-detail-title" className="mt-2 text-3xl font-black text-ink">{product.name}</h2>
              </div>
              <span className={`rounded-md px-3 py-2 text-xs font-black uppercase ${product.verified ? "bg-leaf-50 text-leaf-700" : "bg-earth-50 text-ink/65"}`}>
                {product.verified ? "Verified Seller" : "Pending Verification"}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink/65">{product.description}</p>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Seller/Farmer", product.seller],
                ["Region", product.region],
                ["District", product.location],
                ["Quantity", `${product.quantity} ${product.unit}`],
                ["Availability", product.available],
                ["Date posted", product.datePosted],
                ["Category", product.category],
                ["Verification status", product.verified ? "Verified" : "Pending Verification"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-leaf-50 p-3">
                  <dt className="text-xs font-black uppercase text-ink/50">{label}</dt>
                  <dd className="mt-1 font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={contactUrl(product)}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-700"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Contact Seller
              </a>
              <a
                href={contactUrl(product)}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-earth-500 px-4 py-3 text-sm font-black text-ink transition hover:bg-earth-700 hover:text-white"
              >
                WhatsApp Inquiry
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceListings({ products }: MarketplaceListingsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productsAvailable = uniqueValues(products.map((product) => product.name));
  const regions = uniqueValues(products.map((product) => product.region));
  const categories = uniqueValues(products.map((product) => product.category));
  const availability = uniqueValues(products.map((product) => product.available));

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const searchableText = [product.name, product.category, product.region, product.location, product.seller, product.available]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
        (productFilter === "All" || product.name === productFilter) &&
        (regionFilter === "All" || product.region === regionFilter) &&
        (categoryFilter === "All" || product.category === categoryFilter) &&
        (availabilityFilter === "All" || product.available === availabilityFilter)
      );
    });
  }, [availabilityFilter, categoryFilter, productFilter, products, regionFilter, searchTerm]);

  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const verifiedSellerCount = products.filter((product) => product.verified).length;

  const filters = [
    { label: "Crop/Product", value: productFilter, setValue: setProductFilter, options: productsAvailable },
    { label: "Region", value: regionFilter, setValue: setRegionFilter, options: regions },
    { label: "Category", value: categoryFilter, setValue: setCategoryFilter, options: categories },
    { label: "Availability", value: availabilityFilter, setValue: setAvailabilityFilter, options: availability }
  ];

  return (
    <>
      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            { label: "Active Listings", value: products.length, icon: PackageCheck },
            { label: "Products Available", value: productsAvailable.length, icon: Tag },
            { label: "Verified Sellers", value: verifiedSellerCount, icon: BadgeCheck }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-4 rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-3xl font-black text-leaf-700">{stat.value}</p>
                  <p className="text-xs font-black uppercase text-ink/60">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-earth-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-earth-700">Featured Produce</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Priority marketplace opportunities</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
              Strong supply leads for buyers, traders, restaurants, wholesalers, processors, and exporters sourcing in Ghana.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ListingCard key={product.id} product={product} featured onViewDetails={setSelectedProduct} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-soft sm:p-5">
            <label className="block text-sm font-black text-ink" htmlFor="marketplace-search">
              Search Marketplace
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-white px-3 py-2 ring-1 ring-leaf-900/10">
              <Search className="shrink-0 text-leaf-600" size={18} aria-hidden="true" />
              <input
                id="marketplace-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search crops, livestock, suppliers..."
                className="min-h-10 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filters.map((filter) => (
                <label key={filter.label} className="grid gap-2 text-sm font-black text-ink">
                  {filter.label}
                  <select
                    value={filter.value}
                    onChange={(event) => filter.setValue(event.target.value)}
                    className="focus-ring min-h-11 rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-sm font-semibold text-ink/75"
                  >
                    <option value="All">All</option>
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

          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-earth-700">Marketplace Listings</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Available produce and livestock</h2>
            </div>
            <p className="rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-700">
              {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ListingCard key={product.id} product={product} onViewDetails={setSelectedProduct} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-md border border-dashed border-leaf-900/20 bg-earth-50 p-8 text-center">
              <UsersRound className="mx-auto text-leaf-600" size={34} aria-hidden="true" />
              <h3 className="mt-4 text-xl font-black text-ink">No listings found.</h3>
              <p className="mt-2 text-sm leading-6 text-ink/65">Try another search or region.</p>
            </div>
          )}
        </div>
      </section>

      {selectedProduct ? <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} /> : null}
    </>
  );
}
