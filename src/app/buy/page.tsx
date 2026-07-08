import Link from "next/link";
import { Handshake, MapPinned, Search, ShieldCheck, Sprout, Tractor, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Buy",
  description: "Buy fresh produce and farm inputs through Ghana Growers.",
  path: "/buy"
});

const categories = [
  { title: "Vegetables", href: "/marketplace", image: "/images/products/vegetables.jpg" },
  { title: "Fruits", href: "/marketplace", image: "/images/products/fruits.jpg" },
  { title: "Grains", href: "/marketplace", image: "/images/products/cereals.jpg" },
  { title: "Roots & Tubers", href: "/marketplace", image: "/images/marketplace/yam-cassava.jpg" },
  { title: "Seeds", href: "/supplier-directory", image: "/images/crops/inputs.jpg" },
  { title: "Fertilizer", href: "/supplier-directory", image: "/images/marketplace/farm-inputs.jpg" },
  { title: "Tools", href: "/supplier-directory", image: "/images/suppliers/supplier-2.jpg" },
  { title: "Equipment", href: "/supplier-directory", image: "/images/marketplace/logistics-truck.jpg" },
  { title: "Livestock", href: "/marketplace", image: "/images/products/livestock.jpg" }
];

const buyActionCards = [
  {
    title: "Buy Fresh Produce",
    description: "Buy directly from trusted farmers.",
    href: "/marketplace",
    cta: "Browse Produce",
    image: "/images/marketplace/fresh-tomatoes.jpg",
    alt: "Fresh produce from trusted Ghanaian farmers"
  },
  {
    title: "Buy Farm Inputs",
    description: "Find seeds, fertilizer, tools and agricultural supplies.",
    href: "/supplier-directory",
    cta: "Find Suppliers",
    image: "/images/products/farm-inputs.jpg",
    alt: "Farm inputs and agricultural supplies"
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

            <form className="rounded-md border border-leaf-900/15 bg-white p-3 shadow-[0_18px_45px_rgba(22,69,38,0.12)]" action="/marketplace">
              <label className="flex min-h-14 items-center gap-3 rounded-md bg-leaf-50/80 px-4 ring-1 ring-leaf-900/5">
                <Search size={20} className="shrink-0 text-leaf-800" aria-hidden="true" />
                <span className="sr-only">Search the marketplace</span>
                <input
                  name="q"
                  type="search"
                  placeholder="Search tomatoes, maize, fertilizer, seeds..."
                  className="min-w-0 flex-1 bg-transparent text-base font-bold text-ink placeholder:text-ink/52 focus:outline-none"
                />
              </label>
            </form>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-[0_10px_28px_rgba(22,69,38,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-soft"
              >
                <SafeImage
                  src={category.image}
                  alt={`${category.title} category`}
                  width={320}
                  height={220}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 11vw, (min-width: 768px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="h-20 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-24 lg:h-[5.75rem]"
                />
                <p className="px-2 py-3 text-center text-xs font-black leading-tight text-ink group-hover:text-leaf-700 sm:text-sm">{category.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl items-stretch gap-5 px-4 sm:px-6 md:grid-cols-2 lg:gap-10 lg:px-8 xl:gap-12">
          {buyActionCards.map((card) => (
            <article
              key={card.title}
              className="group flex h-full overflow-hidden rounded-md border border-leaf-900/10 bg-earth-50 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft"
            >
              <Link href={card.href} className="grid w-full gap-0 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2 sm:p-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch lg:gap-5">
                <div className="flex flex-col justify-between p-1 sm:p-2">
                  <div>
                    <h2 className="text-2xl font-black text-ink">{card.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/66">{card.description}</p>
                  </div>
                  <span className="mt-5 inline-flex min-h-11 w-fit items-center rounded-md bg-leaf-600 px-5 py-2 text-sm font-black text-white transition group-hover:bg-leaf-900">
                    {card.cta}
                  </span>
                </div>
                <SafeImage
                  src={card.image}
                  alt={card.alt}
                  width={620}
                  height={420}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 24vw, (min-width: 768px) 50vw, 100vw"
                  className="mt-5 h-40 w-full rounded-md object-cover transition duration-500 group-hover:scale-[1.02] sm:h-44 lg:mt-0 lg:h-full lg:min-h-48"
                />
              </Link>
            </article>
          ))}
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
