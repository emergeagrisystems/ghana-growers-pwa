import { Bot, CheckCircle2, CloudSun, LineChart, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { FeaturedListings } from "@/components/FeaturedListings";
import { MarketplaceCategoryShowcase } from "@/components/MarketplaceCategoryShowcase";
import { SafeImage } from "@/components/SafeImage";
import { isFeaturedActive } from "@/lib/featured";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData, getMarketplaceListingsData } from "@/lib/supabase/publicData";

const heroMarketplaceTiles = [
  { label: "Fresh Produce", icon: "🥬", href: "/marketplace?category=fresh-produce" },
  { label: "Farm Inputs", icon: "🌱", href: "/marketplace?category=farm-inputs" },
  { label: "Farm Services", icon: "🚜", href: "/marketplace?category=farm-services" },
  { label: "Livestock", icon: "🐄", href: "/marketplace?category=livestock" },
  { label: "Logistics & Transport", icon: "🚚", href: "/marketplace?category=logistics" },
  { label: "Packaging & Storage", icon: "📦", href: "/marketplace?category=packaging-storage" }
];

export const metadata = createPageMetadata({
  title: "Trusted Agriculture Platform for Ghana",
  description:
    "Ghana Growers connects Ghanaian farmers, buyers, suppliers, market women, processors, and agribusiness partners through Farmer Hub tools, directories, buyer requests, and reviewed lead requests.",
  path: "/"
});

export default async function HomePage() {
  const farmers = await getFarmersData();
  const marketplaceListings = await getMarketplaceListingsData();
  const realFarmers = farmers.filter((farmer) => {
    const source = (farmer.source ?? "").toLowerCase();
    const name = `${farmer.farmName} ${farmer.contactName}`.toLowerCase();
    return (
      !source.includes("demo") &&
      !source.includes("sample") &&
      !["akumadan growers group", "nsawam fruit farmers", "northern root crops network"].some((demoName) =>
        name.includes(demoName)
      )
    );
  });
  const homepageFeaturedFarmers = realFarmers.filter(
    (farmer) =>
      isFeaturedActive(farmer) ||
      farmer.verificationStatus === "Verified" ||
      farmer.source === "Founding Farmer"
  );

  return (
    <>
      <section className="overflow-hidden bg-[#F7F6EF]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10 lg:px-8 lg:py-16 xl:gap-14">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-earth-700/75 shadow-sm">
              <ShieldCheck size={17} aria-hidden="true" />
              Trusted Agriculture Platform
            </p>
            <h1 className="mt-5 max-w-[18rem] break-words text-[1.55rem] font-black leading-tight text-ink sm:max-w-3xl sm:text-5xl lg:text-[3.1rem] xl:text-[3.45rem]">
              Ghana&apos;s Network for Farmers, Buyers &amp; Suppliers
            </h1>
            <p className="mt-4 max-w-[18rem] text-base leading-7 text-ink/68 sm:max-w-xl sm:text-lg sm:leading-8">
              Search the marketplace, open Farmer Hub, and connect with Ghana&apos;s agricultural network.
            </p>
            <div className="mt-6 flex flex-row gap-3">
              <ButtonLink href="/smart-solutions">Open Farmer Hub</ButtonLink>
              <ButtonLink href="/marketplace" variant="secondary">
                Explore Marketplace
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-md border border-white/70 bg-white p-0.5 shadow-soft">
              <SafeImage
                src="/images/hero/ghana-growers-trade-hero.png"
                alt="Ghanaian farmer, buyer, and supplier exchanging fresh produce at a farm marketplace"
                width={1778}
                height={885}
                fallbackSrc="/images/marketplace/ghana-market-1.jpg"
                fallbackKind="default"
                priority
                sizes="(min-width: 1024px) 54vw, 100vw"
                className="h-48 w-full rounded-md object-cover sm:h-80 lg:h-[430px]"
              />
            </div>
            <div className="relative z-10 mx-auto -mt-8 max-w-2xl rounded-md border border-leaf-900/10 bg-white p-3 shadow-soft sm:p-5 lg:absolute lg:bottom-5 lg:right-5 lg:mt-0 lg:w-[min(92%,600px)]">
              <h2 className="text-lg font-black text-ink">What are you looking for today?</h2>
              <form action="/marketplace" className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="hero-marketplace-search">
                  Search produce, suppliers or services
                </label>
                <input
                  id="hero-marketplace-search"
                  name="search"
                  placeholder="Search produce, suppliers or services..."
                  className="min-h-11 flex-1 rounded-md border border-leaf-900/10 bg-[#F7F6EF] px-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/42 focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
                />
                <button type="submit" className="gg-button-primary min-h-11 px-5">
                  Search
                </button>
              </form>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {heroMarketplaceTiles.map((tile) => (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    className="group rounded-md border border-leaf-900/10 bg-[#F7F6EF] px-3 py-3 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:border-leaf-600/30 hover:bg-leaf-50 hover:text-leaf-700"
                  >
                    <span className="mr-2" aria-hidden="true">
                      {tile.icon}
                    </span>
                    {tile.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceCategoryShowcase listings={marketplaceListings} />

      <section id="farmer-hub-teaser" className="bg-[#143A1F] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="gg-eyebrow text-earth-500">Farmer Hub</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Farmer Hub</h2>
            <p className="mt-3 text-xl font-black text-white/90 sm:text-2xl">
              Everything you need before you step onto your farm.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
              Check weather, diagnose crop problems, compare market prices and get practical farming advice - all in one place.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <Link
              href="/smart-solutions"
              className="group rounded-md border border-white/10 bg-white p-6 text-ink shadow-sm transition hover:-translate-y-1 hover:shadow-soft lg:p-8"
            >
              <span className="grid h-16 w-16 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-700/10">
                <ScanSearch size={30} aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-2xl font-black text-ink group-hover:text-leaf-700">Crop Health</h3>
              <p className="mt-3 text-sm leading-6 text-ink/66">Upload a crop photo and receive farming advice.</p>
              <span className="mt-5 inline-flex rounded-md bg-earth-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-earth-700">
                Flagship tool
              </span>
            </Link>

            {[
              {
                title: "Live Weather",
                description: "Check today's farming conditions before heading to the field.",
                icon: CloudSun
              },
              {
                title: "Current Market Prices",
                description: "See today's crop prices before you negotiate.",
                icon: LineChart
              },
              {
                title: "Farm Assistant",
                description: "Ask practical farming questions anytime.",
                icon: Bot
              }
            ].map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.title}
                  href="/smart-solutions"
                  className="group rounded-md border border-white/10 bg-white p-5 text-ink shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-700/10">
                    <Icon size={26} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-ink group-hover:text-leaf-700">{tool.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/66">{tool.description}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-9 flex flex-col items-center gap-5 text-center">
            <p className="inline-flex flex-col items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-ink/70 shadow-sm sm:flex-row">
              <span className="inline-flex items-center gap-2 text-leaf-700">
                <CheckCircle2 size={18} aria-hidden="true" />
                Free for Ghanaian farmers
              </span>
              <span className="hidden h-4 w-px bg-leaf-900/15 sm:block" aria-hidden="true" />
              <span>No registration required to explore Farmer Hub.</span>
            </p>
            <ButtonLink href="/smart-solutions" variant="light">Open Farmer Hub</ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-md border border-leaf-900/10 bg-[#F7F6EF] px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="gg-eyebrow">Quality Standard</p>
              <h2 className="mt-2 text-xl font-black text-ink sm:text-2xl">Ghana Growers Quality Standard</h2>
            </div>
            <div className="grid gap-3 text-sm font-black text-ink/76 sm:grid-cols-3 lg:flex lg:items-center lg:gap-5">
              {["Sustainable Farming", "Reliable Supply", "Quality Produce"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-leaf-700" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
            <ButtonLink href="/gg-standard" variant="secondary">
              Learn More
            </ButtonLink>
          </div>
        </div>
      </section>

      <FeaturedListings
        kinds={["farmers"]}
        title="Featured farmers"
        description="Three trusted farmers from the Ghana Growers network."
        background="earth"
        limit={3}
        compact
        farmers={homepageFeaturedFarmers}
      />

      <section className="bg-[#143A1F] py-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="gg-eyebrow text-earth-500">Join the Network</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Build trusted agricultural connections across Ghana.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Register as a farmer, buyer, or supplier and Ghana Growers will review your details before publication or follow-up.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/join" variant="light">
              Join the Network
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="border-y border-leaf-900/10 bg-[#F7F6EF] py-8" aria-label="End of homepage content">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px bg-leaf-900/10" />
        </div>
      </section>
    </>
  );
}
