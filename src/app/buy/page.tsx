import Link from "next/link";
import {
  ArrowRight,
  Beef,
  Boxes,
  Carrot,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  Shovel,
  Sprout,
  Tractor,
  Truck,
  Wheat
} from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Buy",
  description: "Find fresh produce, farm inputs, livestock, tools, and trusted suppliers across Ghana.",
  path: "/buy"
});

type BuyCategory = {
  id: string;
  label: string;
  group: "produce" | "inputs";
  description: string;
  href: string;
  icon: typeof Carrot;
};

const categories: BuyCategory[] = [
  { id: "vegetables", label: "Vegetables", group: "produce", description: "Fresh greens, tomatoes, pepper and market vegetables.", href: "/marketplace?search=vegetables&category=fresh-produce", icon: Carrot },
  { id: "fruits", label: "Fruits", group: "produce", description: "Seasonal fruit supply from farmers and aggregators.", href: "/marketplace?search=fruits&category=fresh-produce", icon: Sprout },
  { id: "grains", label: "Grains", group: "produce", description: "Maize, rice and other grains.", href: "/marketplace?search=maize&category=fresh-produce", icon: Wheat },
  { id: "roots-tubers", label: "Roots & Tubers", group: "produce", description: "Cassava, yam and other staple crops.", href: "/marketplace?search=yam%20cassava&category=fresh-produce", icon: Shovel },
  { id: "legumes", label: "Legumes", group: "produce", description: "Beans, cowpea, soybeans and groundnuts.", href: "/marketplace?search=beans%20groundnuts&category=fresh-produce", icon: Sprout },
  { id: "herbs-spices", label: "Herbs & Spices", group: "produce", description: "Fresh or dried agricultural herbs and spices.", href: "/marketplace?search=herbs%20spices&category=fresh-produce", icon: Carrot },
  { id: "nuts", label: "Nuts", group: "produce", description: "Cashew, kola, shea nuts and similar crops.", href: "/marketplace?search=cashew%20kola%20shea&category=fresh-produce", icon: PackageCheck },
  { id: "livestock", label: "Livestock", group: "produce", description: "Find livestock and animal products.", href: "/marketplace?search=livestock&category=livestock", icon: Beef },
  { id: "seeds", label: "Seeds", group: "inputs", description: "Find seed suppliers and planting material.", href: "/supplier-directory?search=seeds", icon: Sprout },
  { id: "fertilizer", label: "Fertilizer", group: "inputs", description: "Source fertilizer and soil fertility suppliers.", href: "/supplier-directory?search=fertilizer", icon: PackageCheck },
  { id: "tools", label: "Tools", group: "inputs", description: "Farm tools and practical field supplies.", href: "/supplier-directory?search=tools", icon: Tractor },
  { id: "equipment", label: "Equipment", group: "inputs", description: "Equipment, mechanization and larger farm support.", href: "/supplier-directory?search=equipment", icon: Boxes },
  { id: "transport", label: "Transport", group: "inputs", description: "Find transport and delivery support.", href: "/supplier-directory?search=transport", icon: Truck },
  { id: "packaging", label: "Packaging", group: "inputs", description: "Find crates, sacks and produce packaging.", href: "/supplier-directory?search=packaging", icon: PackageCheck }
];

const categoryGroups = [
  {
    id: "produce" as const,
    title: "Farm-Fresh Produce",
    description: "Browse crops, legumes, nuts, livestock and fresh harvests.",
    categories: categories.filter((category) => category.group === "produce")
  },
  {
    id: "inputs" as const,
    title: "Farm Inputs & Supplies",
    description: "Find suppliers for farm inputs, tools and equipment.",
    categories: categories.filter((category) => category.group === "inputs")
  }
];

const howBuyingWorks = [
  { title: "Search", icon: Search },
  { title: "Request", icon: Send },
  { title: "Confirm", icon: CheckCircle2 },
  { title: "Connect", icon: Handshake }
];

const buyActionCards = [
  {
    title: "I want to buy produce",
    description: "Browse farmer listings, fresh harvests, and available crops through Ghana Growers.",
    href: "/marketplace?category=fresh-produce",
    cta: "Browse Produce",
    note: "Availability confirmed during request.",
    image: "/images/marketplace/fresh-tomatoes.jpg",
    alt: "Fresh tomatoes and produce ready for sourcing through Ghana Growers"
  },
  {
    title: "I want to source farm inputs",
    description: "Find seeds, fertilizer, tools, equipment, and trusted agricultural suppliers.",
    href: "/supplier-directory",
    cta: "Source Inputs",
    note: "Supplier connections routed by Ghana Growers.",
    image: "/images/products/farm-inputs.jpg",
    alt: "Farm inputs and agricultural supplies available through suppliers"
  }
];

const popularSearches = [
  { label: "Tomatoes", href: "/marketplace?search=tomatoes&category=fresh-produce" },
  { label: "Maize", href: "/marketplace?search=maize&category=fresh-produce" },
  { label: "Yam", href: "/marketplace?search=yam&category=fresh-produce" },
  { label: "Fertilizer", href: "/supplier-directory?search=fertilizer" },
  { label: "Seeds", href: "/supplier-directory?search=seeds" },
  { label: "Poultry", href: "/marketplace?search=poultry&category=livestock" },
  { label: "Transport", href: "/supplier-directory?search=transport" }
];

const trustCards = [
  ["Reviewed Network", "Find farmers and suppliers more easily.", ShieldCheck],
  ["Request Support", "Ghana Growers helps confirm quantity and availability.", Truck],
  ["No Payment Required Yet", "No payment is required at the request stage.", CircleDollarSign]
];

export default function BuyPage() {
  return (
    <>
      <section className="bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="gg-eyebrow text-earth-700/80">Buy through Ghana Growers</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-ink sm:text-5xl">
                Source Fresh Produce
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
                Find fresh produce, farm inputs, livestock, tools, and trusted suppliers across Ghana.
              </p>
            </div>

            <div className="grid gap-4">
              <form className="rounded-md border border-white bg-white p-3 shadow-soft ring-1 ring-leaf-900/10" action="/marketplace">
                <label htmlFor="buy-marketplace-search" className="flex min-h-14 items-center gap-3 rounded-md bg-leaf-50/80 px-4 ring-1 ring-leaf-900/5">
                  <Search size={20} className="shrink-0 text-leaf-800" aria-hidden="true" />
                  <span className="sr-only">Search marketplace</span>
                  <input
                    id="buy-marketplace-search"
                    name="search"
                    type="search"
                    placeholder="Search tomatoes, maize, fertilizer, seeds..."
                    className="min-w-0 flex-1 bg-transparent text-base font-bold text-ink placeholder:text-ink/52 focus:outline-none"
                  />
                </label>
              </form>
              <div className="grid gap-3 rounded-md border border-leaf-900/10 bg-white p-2 shadow-card sm:grid-cols-[1fr_auto] sm:items-center">
                <SafeImage
                  src="/images/marketplace/ghana-market-2.jpg"
                  alt="Fresh tomatoes at a Ghanaian market for buyers to source through Ghana Growers"
                  width={760}
                  height={420}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="h-40 w-full rounded-md object-cover sm:h-48 lg:h-56"
                />
                <div className="hidden max-w-[11rem] p-3 sm:block">
                  <p className="text-sm font-black leading-5 text-ink">Fresh produce and trusted suppliers in one place.</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink/58">Search first, then request what you need.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="brand-surface-dark mx-auto max-w-7xl rounded-md border border-earth-100/15 p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">How buying works</h2>
              <p className="brand-body mt-1 text-sm font-semibold">No payment is required at the request stage.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {howBuyingWorks.map((step) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="flex min-h-14 items-center gap-3 rounded-md bg-white/10 px-3 py-3 ring-1 ring-white/10">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-earth-500 text-leaf-900">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <p className="text-sm font-black">{step.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="gg-eyebrow text-leaf-700">Browse categories</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Choose what you want to source</h2>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            {categoryGroups.map((group) => (
              <article key={group.id} className="rounded-md border border-leaf-900/10 bg-earth-50 p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-ink">{group.title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-ink/62">{group.description}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                  {group.categories.map((category) => {
                    const Icon = category.icon;

                    return (
                      <Link
                        key={category.id}
                        href={category.href}
                        aria-label={`Browse ${category.label}`}
                        className="group rounded-md border border-leaf-900/10 bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-leaf-700/20 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-700/10 transition group-hover:bg-leaf-600 group-hover:text-white">
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <p className="mt-2.5 text-sm font-black text-ink group-hover:text-leaf-700">{category.label}</p>
                        <p className="mt-1 hidden text-xs font-semibold leading-5 text-ink/52 sm:block">{category.description}</p>
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 py-11 sm:py-14">
        <div className="mx-auto grid max-w-7xl items-stretch gap-5 px-4 sm:px-6 md:grid-cols-2 lg:gap-10 lg:px-8 xl:gap-12">
          {buyActionCards.map((card) => (
            <article
              key={card.title}
              className="group flex h-full overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-leaf-700/20 hover:shadow-soft"
            >
              <Link href={card.href} className="grid w-full gap-3 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2 sm:p-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
                <div className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-black leading-tight text-ink">{card.title}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/66">{card.description}</p>
                    <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-leaf-800">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {card.note}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-leaf-600 px-5 py-2 text-sm font-black text-white transition group-hover:bg-leaf-900">
                    {card.cta}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </div>
                <SafeImage
                  src={card.image}
                  alt={card.alt}
                  width={620}
                  height={420}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 24vw, (min-width: 768px) 50vw, 100vw"
                  className="h-32 w-full rounded-md object-cover transition duration-500 group-hover:scale-[1.02] sm:h-40 lg:h-full lg:min-h-40"
                />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-sm sm:p-6">
            <div>
              <p className="gg-eyebrow text-leaf-700">Popular searches</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Start with common requests</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="min-h-11 rounded-md border border-leaf-900/10 bg-white px-4 py-2 text-sm font-black text-leaf-700 transition hover:-translate-y-0.5 hover:border-leaf-700/25 hover:bg-leaf-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="brand-surface-dark px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-md border border-white/10 bg-white p-5 text-ink shadow-soft sm:p-6">
            <h2 className="text-2xl font-black">Can&apos;t find what you need?</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink/66">
              Tell Ghana Growers what you are looking for. We can help confirm availability, quantity, price, and pickup or delivery details.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/submit-buyer-request">Request Sourcing Support</ButtonLink>
              <ButtonLink href="/directory" variant="secondary">View Directory</ButtonLink>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {trustCards.map(([title, description, Icon]) => (
              <article key={title as string} className="rounded-md bg-white/10 p-4 shadow-[0_8px_22px_rgba(0,0,0,0.08)] ring-1 ring-white/12">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-earth-500 text-leaf-900">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black">{title as string}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/68">{description as string}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
