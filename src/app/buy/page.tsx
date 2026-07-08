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

type CategoryIcon = "vegetables" | "fruits" | "grains" | "roots" | "seeds" | "fertilizer" | "tools" | "equipment" | "livestock";

const categories: Array<{ title: string; href: string; icon: CategoryIcon }> = [
  { title: "Vegetables", href: "/marketplace", icon: "vegetables" },
  { title: "Fruits", href: "/marketplace", icon: "fruits" },
  { title: "Grains", href: "/marketplace", icon: "grains" },
  { title: "Roots & Tubers", href: "/marketplace", icon: "roots" },
  { title: "Seeds", href: "/supplier-directory", icon: "seeds" },
  { title: "Fertilizer", href: "/supplier-directory", icon: "fertilizer" },
  { title: "Tools", href: "/supplier-directory", icon: "tools" },
  { title: "Equipment", href: "/supplier-directory", icon: "equipment" },
  { title: "Livestock", href: "/marketplace", icon: "livestock" }
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

function CategoryGlyph({ icon }: { icon: CategoryIcon }) {
  const common = "fill-current";

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-8 w-8 text-leaf-700">
      {icon === "vegetables" && (
        <>
          <path className={common} d="M17 39c0-10 7-20 15-24 8 4 15 14 15 24 0 9-6 16-15 16s-15-7-15-16Z" opacity="0.2" />
          <path className={common} d="M32 13c8 5 14 14 14 25 0 11-7 18-14 18s-14-7-14-18c0-11 6-20 14-25Zm0 7c-5 4-9 11-9 18 0 7 4 12 9 12s9-5 9-12c0-7-4-14-9-18Z" />
          <path className={common} d="M32 16c-4-6-10-7-17-5 2 8 8 12 17 9v-4Z" />
        </>
      )}
      {icon === "fruits" && (
        <>
          <path className={common} d="M19 36c0-10 6-17 14-17s14 7 14 17-6 18-14 18-14-8-14-18Z" opacity="0.22" />
          <path className={common} d="M33 18c9 0 16 8 16 18 0 11-7 20-16 20s-16-9-16-20c0-10 7-18 16-18Zm0 6c-6 0-10 5-10 12 0 8 4 14 10 14s10-6 10-14c0-7-4-12-10-12Z" />
          <path className={common} d="M34 17c2-7 8-10 16-9-2 8-8 12-16 12v-3ZM29 18c-1-5 0-9 4-12 3 3 4 7 2 12h-6Z" />
        </>
      )}
      {icon === "grains" && (
        <>
          <path className={common} d="M31 10h5v44h-5z" opacity="0.26" />
          <path className={common} d="M29 15c-8 1-13 6-14 14 8-1 13-6 14-14ZM38 15c8 1 13 6 14 14-8-1-13-6-14-14ZM29 29c-8 1-13 6-14 14 8-1 13-6 14-14ZM38 29c8 1 13 6 14 14-8-1-13-6-14-14ZM29 43c-7 1-11 5-12 11 7-1 11-5 12-11ZM38 43c7 1 11 5 12 11-7-1-11-5-12-11Z" />
        </>
      )}
      {icon === "roots" && (
        <>
          <path className={common} d="M21 19c10 1 20 7 24 17-5 7-13 13-22 16-5-10-6-22-2-33Z" opacity="0.22" />
          <path className={common} d="M20 17c12 1 23 8 28 19-6 9-16 16-27 19-6-12-7-26-1-38Zm5 7c-3 7-2 16 1 23 6-3 11-7 15-12-4-6-9-10-16-11Z" />
          <path className={common} d="M22 18c-1-6-5-9-12-10 1 7 5 11 12 12v-2ZM28 18c2-6 7-9 14-8-2 7-7 11-14 11v-3Z" />
        </>
      )}
      {icon === "seeds" && (
        <>
          <path className={common} d="M15 43c0-7 5-12 12-12s12 5 12 12-5 12-12 12-12-5-12-12Z" opacity="0.22" />
          <path className={common} d="M13 43c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14Zm6 0c0 5 3 8 8 8s8-3 8-8-3-8-8-8-8 3-8 8ZM36 22c2-8 8-13 17-14-1 10-7 16-17 17v-3ZM30 28c-1-9-6-15-15-18 0 10 5 17 15 21v-3Z" />
        </>
      )}
      {icon === "fertilizer" && (
        <>
          <path className={common} d="M18 24h28l5 28H13l5-28Z" opacity="0.22" />
          <path className={common} d="M18 22h28c2 0 4 2 4 4l5 26c0 3-2 5-5 5H14c-3 0-5-2-5-5l5-26c0-2 2-4 4-4Zm2 6-4 23h32l-4-23H20ZM21 14h22v8H21z" />
          <path className={common} d="M25 39h14v5H25z" />
        </>
      )}
      {icon === "tools" && (
        <>
          <path className={common} d="M17 47 42 22l7 7-25 25c-3 3-8 1-10-2 1-2 1-3 3-5Z" opacity="0.22" />
          <path className={common} d="m15 45 26-26 10 10-26 26c-4 4-10 3-13-1-1-3-1-6 3-9Zm5 4c-1 1-1 2 0 3s2 1 3 0l20-20-3-3-20 20ZM43 8l13 13-5 5-13-13 5-5Z" />
        </>
      )}
      {icon === "equipment" && (
        <>
          <path className={common} d="M14 39h33l6 10H14V39Z" opacity="0.22" />
          <path className={common} d="M12 36h18V20h14l8 16h4v13h-8a10 10 0 0 1-20 0h-4a10 10 0 0 1-20 0H2V36h10Zm24-10v10h9l-5-10h-4ZM14 53a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm24 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        </>
      )}
      {icon === "livestock" && (
        <>
          <path className={common} d="M13 30c4-8 13-13 24-11 9 1 15 8 15 17 0 10-8 18-19 18-13 0-24-11-20-24Z" opacity="0.22" />
          <path className={common} d="M37 17c11 2 19 10 19 20 0 12-10 20-23 20-15 0-27-12-23-27 4-10 15-15 27-13Zm-1 6c-9-1-17 3-20 10-2 10 6 18 17 18 10 0 17-6 17-14 0-7-6-13-14-14Z" />
          <path className={common} d="M18 23c-4-4-9-5-14-2 4 6 9 8 16 6l-2-4ZM46 24c4-4 9-5 14-2-4 6-9 8-16 6l2-4ZM26 37a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM44 37a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </>
      )}
    </svg>
  );
}

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

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group flex min-h-24 flex-col items-center justify-center rounded-md border border-leaf-900/10 bg-white/86 px-3 py-4 shadow-[0_10px_24px_rgba(22,69,38,0.05)] transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-soft"
              >
                <span className="grid h-12 w-12 place-items-center rounded-md bg-leaf-50 ring-1 ring-leaf-900/5 transition group-hover:bg-earth-50">
                  <CategoryGlyph icon={category.icon} />
                </span>
                <p className="mt-3 text-center text-xs font-black leading-tight text-ink group-hover:text-leaf-700 sm:text-sm">{category.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:gap-10 lg:px-8 xl:gap-12">
          {buyActionCards.map((card) => (
            <article
              key={card.title}
              className="group overflow-hidden rounded-md border border-leaf-900/10 bg-earth-50 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft"
            >
              <Link href={card.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2">
                <div className="p-5 sm:p-6 lg:p-7">
                  <h2 className="text-2xl font-black text-ink">{card.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/66">{card.description}</p>
                  <span className="mt-5 inline-flex min-h-11 items-center rounded-md bg-leaf-600 px-5 py-2 text-sm font-black text-white transition group-hover:bg-leaf-900">
                    {card.cta}
                  </span>
                </div>
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
                  <SafeImage
                    src={card.image}
                    alt={card.alt}
                    width={760}
                    height={420}
                    fallbackKind="crop"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="h-44 w-full rounded-md object-cover transition duration-500 group-hover:scale-[1.02] sm:h-52"
                  />
                </div>
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
