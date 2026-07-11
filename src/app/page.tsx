import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  Handshake,
  LineChart,
  PackageCheck,
  ScanSearch,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sprout
} from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { FeaturedListings } from "@/components/FeaturedListings";
import { MarketplaceCategoryShowcase } from "@/components/MarketplaceCategoryShowcase";
import { SafeImage } from "@/components/SafeImage";
import { featuredFarmers as configuredFeaturedFarmers, featuredFarmerSlugs } from "@/data/featuredListings";
import { homepageFeaturedFarmerProfiles } from "@/lib/farmerDirectory";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";

export const metadata = createPageMetadata({
  title: "Trusted Agriculture Platform for Ghana",
  description:
    "Ghana Growers connects Ghanaian farmers, buyers, suppliers, market women, processors, and agribusiness partners through GG FarmMate tools, directories, buyer requests, and reviewed lead requests.",
  path: "/"
});

const howItWorks = [
  {
    title: "Discover",
    text: "Browse marketplace listings, farmer profiles, suppliers, services, and produce demand.",
    icon: Search
  },
  {
    title: "Send a request",
    text: "Tell Ghana Growers what you want to buy, sell, supply, or source.",
    icon: ClipboardCheck
  },
  {
    title: "We confirm details",
    text: "Availability, quantity, price guidance, location, and delivery or pickup details are reviewed.",
    icon: PackageCheck
  },
  {
    title: "We help connect",
    text: "Ghana Growers supports communication so the right parties can move forward with confidence.",
    icon: Handshake
  }
];

const farmMateTools = [
  {
    title: "Crop Doctor",
    description: "Upload a crop photo and receive practical next steps.",
    icon: ScanSearch
  },
  {
    title: "Live Weather",
    description: "Check today's farming conditions before heading to the field.",
    icon: CloudSun
  },
  {
    title: "Market Price Check",
    description: "Compare crop prices before you negotiate.",
    icon: LineChart
  },
  {
    title: "Ask FarmMate",
    description: "Ask practical farming questions anytime.",
    icon: Bot
  }
];

const trustPoints = ["Reviewed Profiles", "Reviewed Listings", "Buyer Request Support"];

export default async function HomePage() {
  const farmers = await getFarmersData();
  const homepageFeaturedFarmers = homepageFeaturedFarmerProfiles(farmers, configuredFeaturedFarmers, 4, featuredFarmerSlugs);

  return (
    <>
      <section className="overflow-hidden bg-earth-50">
        <div className="mx-auto grid max-w-[1480px] items-center gap-8 px-4 pb-7 pt-9 sm:px-6 lg:grid-cols-[minmax(0,620px)_minmax(340px,560px)] lg:justify-between lg:gap-[clamp(3.5rem,6vw,6rem)] lg:px-8 lg:pb-9 lg:pt-12 xl:grid-cols-[minmax(0,700px)_minmax(420px,640px)]">
          <div className="relative z-10 max-w-[720px]">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-earth-700/75 shadow-sm">
              <ShieldCheck size={17} aria-hidden="true" />
              BUILT FOR GHANAIAN AGRICULTURE
            </p>
            <h1 className="mt-6 max-w-[700px] gg-hero-title !text-[clamp(1.9rem,9vw,3.2rem)] !leading-[0.96] !tracking-[-0.035em] lg:!text-[clamp(3.55rem,4.35vw,4.55rem)]">
              <span className="block whitespace-nowrap">Buy Farm-Fresh.</span>
              <span className="block whitespace-nowrap">Sell Your Harvest.</span>
              <span className="block whitespace-nowrap">Grow With Us.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg sm:leading-8">
              Buy fresh produce from reviewed local farmers. Sell your harvest with confidence, or offer agricultural inputs and services through Ghana Growers. Grow through better market access, practical learning, and smart farming tools.
            </p>
            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <Link
                href="/marketplace"
                className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#143A1F] px-6 py-3 text-center text-sm font-black leading-none text-white shadow-sm transition duration-200 ease-out hover:bg-leaf-900 sm:w-auto"
              >
                <ShoppingBasket size={17} aria-hidden="true" className="shrink-0" />
                Explore Marketplace
              </Link>
              <Link
                href="/sell"
                className="focus-ring inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#D6A84A] px-6 py-3 text-center text-sm font-black leading-none text-ink shadow-sm transition duration-200 ease-out hover:bg-earth-700 hover:text-white sm:w-auto"
              >
                Sell Your Harvest
              </Link>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-leaf-800">
              <CheckCircle2 size={16} aria-hidden="true" />
              Connecting reviewed farmers, buyers and suppliers across Ghana.
            </p>
          </div>

          <div className="relative w-full max-w-[640px] justify-self-center overflow-hidden rounded-md border border-white/70 bg-white p-0.5 shadow-soft lg:justify-self-end">
            <SafeImage
              src="/images/hero/ghana-growers-trade-hero.png"
              alt="Ghanaian agriculture marketplace with farmers, buyers, and fresh produce"
              width={1778}
              height={885}
              fallbackSrc="/images/marketplace/ghana-market-1.jpg"
              fallbackKind="default"
              priority
              sizes="(min-width: 1536px) 640px, (min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/3] w-full rounded-md object-cover object-[center_42%]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#F7F6EF] py-8 sm:py-10" aria-labelledby="farmmate-strip-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card sm:p-6 lg:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.25fr_auto] lg:items-center">
              <div>
                <p className="gg-eyebrow text-earth-700/70">GG FarmMate</p>
                <h2 id="farmmate-strip-title" className="mt-2 text-2xl font-black leading-tight text-ink sm:text-3xl">
                  Digital farming tools by Ghana Growers
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink/64">
                  Check weather, diagnose crop problems, compare market prices, and get practical farming advice in one place.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {farmMateTools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Link
                      key={tool.title}
                      href="/farmer-hub"
                      className="focus-ring group flex items-center gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-3 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-card"
                    >
                      <span className="gg-icon gg-icon-farmer-hub h-10 w-10 shrink-0">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-ink group-hover:text-leaf-700">{tool.title}</span>
                        <span className="mt-0.5 block text-xs font-semibold leading-5 text-ink/55">{tool.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>

              <ButtonLink href="/farmer-hub">
                Open GG FarmMate
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceCategoryShowcase />

      <section className="bg-[#F7F6EF] py-12 sm:py-14 lg:py-16" aria-labelledby="how-ghana-growers-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow text-earth-700/70">How It Works</p>
            <h2 id="how-ghana-growers-works" className="mt-3 gg-section-title">
              A simple way to trade through Ghana Growers
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg">
              Ghana Growers supports agricultural connections before, during, and after a request is made.
            </p>
          </div>

          <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.title} className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between gap-4">
                    <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-black text-earth-700/65">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-black text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/64">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {homepageFeaturedFarmers.length > 0 ? (
        <FeaturedListings
          kinds={["farmers"]}
          title="Featured farmers"
          description="Meet reviewed farmers from the Ghana Growers network."
          background="earth"
          limit={4}
          compact
          farmers={homepageFeaturedFarmers}
        />
      ) : null}

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-earth-50 p-6 shadow-card lg:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
              <div>
                <p className="gg-eyebrow">Ghana Growers Checks</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Why connect through Ghana Growers</h2>
                <p className="mt-3 text-sm leading-6 text-ink/64">
                  Ghana Growers reviews profiles, listings, and buyer requests to support clearer communication and more reliable agricultural connections. This framework is separate from formal certification.
                </p>
              </div>
              <div className="grid gap-3 text-sm font-black text-ink/76 sm:grid-cols-3 lg:grid-cols-1">
                {trustPoints.map((item) => (
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
        </div>
      </section>

      <section className="bg-[#143A1F] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="gg-eyebrow text-earth-500">Join the Network</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Build trusted agricultural connections across Ghana.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
            Register as a farmer, buyer, supplier, or service provider. Ghana Growers will review your details before your profile, listing, or request is published.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/join" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black text-leaf-900 shadow-sm transition duration-200 ease-out hover:bg-earth-50">
              Join the Network
            </Link>
            <Link href="/contact" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-white/35 px-6 py-3 text-sm font-black text-white transition duration-200 ease-out hover:border-earth-500 hover:text-earth-500">
              Contact Ghana Growers
            </Link>
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
