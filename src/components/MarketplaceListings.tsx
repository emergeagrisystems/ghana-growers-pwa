"use client";

import { BadgeCheck, CalendarDays, MapPin, MessageCircle, PackageCheck, Search, Store, Tag, UsersRound } from "lucide-react";
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

function ListingCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-md bg-white shadow-soft ${featured ? "border-2 border-earth-500" : "border border-leaf-900/10"}`}>
      <div className="relative">
        <SafeImage src={product.image} alt={`${product.name} from ${product.seller}`} width={520} height={340} className="h-48 w-full object-cover" />
        {featured ? (
          <span className="absolute left-3 top-3 rounded-md bg-earth-500 px-3 py-2 text-xs font-black uppercase text-ink shadow-soft">
            Featured Produce
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-earth-700">{product.category}</p>
            <h3 className="mt-1 text-xl font-black text-ink">{product.name}</h3>
          </div>
          {product.verified ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-leaf-50 px-2 py-1 text-xs font-black text-leaf-700">
              <BadgeCheck size={14} aria-hidden="true" />
              Verified
            </span>
          ) : null}
        </div>

        <dl className="mt-4 grid gap-3 text-sm text-ink/70">
          <div className="flex gap-2">
            <Store className="mt-0.5 shrink-0 text-leaf-600" size={16} aria-hidden="true" />
            <div>
              <dt className="font-black text-ink">Seller/Farmer</dt>
              <dd>{product.seller}</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <MapPin className="mt-0.5 shrink-0 text-leaf-600" size={16} aria-hidden="true" />
            <div>
              <dt className="font-black text-ink">Region</dt>
              <dd>{product.region} · {product.location}</dd>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-black text-ink">Quantity</dt>
              <dd>{product.quantity} {product.unit}</dd>
            </div>
            <div>
              <dt className="font-black text-ink">Availability</dt>
              <dd>{product.available}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="shrink-0 text-leaf-600" size={16} aria-hidden="true" />
            <div>
              <dt className="sr-only">Date posted</dt>
              <dd>Posted {product.datePosted}</dd>
            </div>
          </div>
        </dl>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
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
    </article>
  );
}

export function MarketplaceListings({ products }: MarketplaceListingsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

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

      <section className="bg-earth-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-earth-700">Featured Produce</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Priority marketplace opportunities</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
                Strong supply leads for buyers, traders, restaurants, wholesalers, processors, and exporters sourcing in Ghana.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ListingCard key={product.id} product={product} featured />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
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
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ListingCard key={product.id} product={product} />
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
    </>
  );
}
