import Link from "next/link";
import { ArrowRight, Handshake, MapPinned, Search, ShieldCheck, Sprout, Tractor, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Buy",
  description: "Buy fresh produce and farm inputs through Ghana Growers.",
  path: "/buy"
});

const categories = [
  ["Vegetables", "/marketplace", "/images/products/vegetables.jpg"],
  ["Fruits", "/marketplace", "/images/products/fruits.jpg"],
  ["Grains", "/marketplace", "/images/products/cereals.jpg"],
  ["Roots & Tubers", "/marketplace", "/images/products/tubers.jpg"],
  ["Seeds", "/supplier-directory", "/images/products/farm-inputs.jpg"],
  ["Fertilizer", "/supplier-directory", "/images/marketplace/farm-inputs.jpg"],
  ["Tools", "/supplier-directory", "/images/suppliers/supplier-2.jpg"],
  ["Equipment", "/supplier-directory", "/images/marketplace/logistics-truck.jpg"]
];

const featuredListings = [
  {
    title: "Fresh Tomatoes",
    metaLabel: "Region",
    meta: "Greater Accra",
    status: "Available",
    href: "/farmer-directory",
    cta: "View Farmers",
    image: "/images/marketplace/fresh-tomatoes.jpg"
  },
  {
    title: "White Maize",
    metaLabel: "Region",
    meta: "Ashanti",
    status: "Available",
    href: "/farmer-directory",
    cta: "View Farmers",
    image: "/images/products/cereals.jpg"
  },
  {
    title: "Fertilizer",
    metaLabel: "Category",
    meta: "Farm Inputs",
    status: "Suppliers Available",
    href: "/supplier-directory",
    cta: "Find Suppliers",
    image: "/images/products/farm-inputs.jpg"
  },
  {
    title: "Seeds",
    metaLabel: "Category",
    meta: "Farm Inputs",
    status: "Suppliers Available",
    href: "/supplier-directory",
    cta: "Find Suppliers",
    image: "/images/marketplace/farm-inputs.jpg"
  }
];

const trustCards = [
  ["Verified Network", "Reviewed farmers and suppliers.", ShieldCheck],
  ["Reliable Sourcing", "Clear routes to produce and inputs.", Truck],
  ["Across Ghana", "Regional supply visibility.", MapPinned],
  ["Personal Support", "Help when search is not enough.", Handshake]
];

export default function BuyPage() {
  return (
    <>
      <section className="bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <p className="gg-eyebrow text-earth-700/80">Marketplace</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-ink sm:text-5xl">
                Buy Fresh Produce & Farm Inputs
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
                Search Ghana&apos;s agricultural marketplace for fresh produce, farm inputs, and trusted suppliers.
              </p>
            </div>

            <form className="rounded-md border border-leaf-900/10 bg-white p-3 shadow-soft" action="/marketplace">
              <label className="flex min-h-14 items-center gap-3 rounded-md bg-leaf-50 px-4">
                <Search size={20} className="shrink-0 text-leaf-700" aria-hidden="true" />
                <span className="sr-only">Search the marketplace</span>
                <input
                  name="q"
                  type="search"
                  placeholder="Search tomatoes, maize, fertilizer, seeds..."
                  className="min-w-0 flex-1 bg-transparent text-base font-bold text-ink placeholder:text-ink/45 focus:outline-none"
                />
              </label>
            </form>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map(([category, href, image]) => (
              <Link
                key={category}
                href={href}
                className="group rounded-md border border-leaf-900/10 bg-white p-2 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft"
              >
                <SafeImage
                  src={image}
                  alt={`${category} category`}
                  width={260}
                  height={180}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 12vw, (min-width: 640px) 25vw, 50vw"
                  className="h-16 w-full rounded-md object-cover sm:h-20"
                />
                <p className="mt-2 text-center text-xs font-black text-ink group-hover:text-leaf-700 sm:text-sm">{category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="gg-eyebrow text-earth-700/75">Featured Marketplace</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Start with popular requests.</h2>
            </div>
            <Link href="/marketplace" className="hidden text-sm font-black text-leaf-700 hover:text-leaf-900 sm:inline-flex">
              Browse all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredListings.map((listing) => (
              <article key={listing.title} className="group overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                <SafeImage
                  src={listing.image}
                  alt={`${listing.title} marketplace listing`}
                  width={520}
                  height={360}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="h-36 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-ink">{listing.title}</h3>
                    <span className="rounded-md bg-leaf-50 px-2 py-1 text-[0.68rem] font-black uppercase text-leaf-700">
                      {listing.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-ink/62">
                    {listing.metaLabel}: <span className="text-ink">{listing.meta}</span>
                  </p>
                  <Link href={listing.href} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900">
                    {listing.cta}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-2xl font-black text-ink">Can&apos;t find what you need?</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink/66">
              Request produce, inputs, or suppliers and Ghana Growers will help you source it.
            </p>
          </div>
          <ButtonLink href="/submit-buyer-request">Request Help</ButtonLink>
        </div>
      </section>

      <section className="bg-earth-50 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map(([title, description, Icon]) => (
              <article key={title as string} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-black text-ink">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/64">{description as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          <Link href="/marketplace" className="group rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
            <Sprout className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-ink">Browse produce</h2>
            <p className="mt-2 text-sm leading-6 text-ink/66">Explore sample marketplace produce and farmer connections.</p>
          </Link>
          <Link href="/supplier-directory" className="group rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
            <Tractor className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-ink">Find suppliers</h2>
            <p className="mt-2 text-sm leading-6 text-ink/66">Search agricultural input suppliers, services and products.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
