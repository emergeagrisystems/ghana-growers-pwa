import {
  Bot,
  CloudSun,
  CheckCircle2,
  LineChart,
  ScanSearch,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { ChooseYourPath } from "@/components/ChooseYourPath";
import { FeaturedListings } from "@/components/FeaturedListings";
import { MarketplaceCategoryShowcase } from "@/components/MarketplaceCategoryShowcase";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SafeImage } from "@/components/SafeImage";
import { SuccessStoriesSection } from "@/components/SuccessStoriesSection";
import { isFeaturedActive } from "@/lib/featured";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData, getMarketplaceListingsData, getSuccessStoriesData } from "@/lib/supabase/publicData";

export const metadata = createPageMetadata({
  title: "Trusted Agriculture Platform for Ghana",
  description:
    "Ghana Growers connects Ghanaian farmers, buyers, suppliers, market women, processors, and agribusiness partners through Farmer Hub tools, directories, buyer requests, and reviewed lead requests.",
  path: "/"
});

export default async function HomePage() {
  const farmers = await getFarmersData();
  const marketplaceListings = await getMarketplaceListingsData();
  const successStories = await getSuccessStoriesData();
  const homepageFeaturedFarmers = farmers.filter((farmer) => isFeaturedActive(farmer) || farmer.verificationStatus === "Verified" || farmer.source === "Founding Farmer");

  return (
    <>
      <section className="overflow-hidden bg-[#ECE7D1]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16 xl:gap-14">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-earth-700/75 shadow-sm">
              <ShieldCheck size={17} aria-hidden="true" />
              Trusted Agriculture Platform
            </p>
            <h1 className="mt-5 max-w-[18rem] break-words text-[1.55rem] font-black leading-tight text-ink sm:max-w-3xl sm:text-5xl lg:text-[3.15rem] xl:text-[3.5rem]">
              Ghana&apos;s Network for Farmers, Buyers &amp; Suppliers
            </h1>
            <p className="mt-5 max-w-[18rem] text-base leading-7 text-ink/70 sm:max-w-2xl sm:text-lg sm:leading-8">
              Connect with trusted farmers, buyers and suppliers, check market prices, diagnose crop problems and access practical farming tools, all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/smart-solutions">Open Farmer Hub</ButtonLink>
              <ButtonLink href="/marketplace" variant="secondary">Explore Marketplace</ButtonLink>
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
                className="aspect-[4/3] w-full rounded-md object-cover sm:aspect-[16/10] lg:min-h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      <MarketplaceCategoryShowcase listings={marketplaceListings} />

      <section id="farmer-hub-teaser" className="bg-[#ECE7D1] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="gg-eyebrow">Farmer Hub</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">{"\uD83C\uDF31"} Farmer Hub</h2>
            <p className="mt-3 text-xl font-black text-leaf-800 sm:text-2xl">
              Everything you need before you step onto your farm.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg">
              Check weather, diagnose crop problems, compare market prices and get practical farming advice — all in one place.
            </p>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <Link
              href="/smart-solutions"
              className="group rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft lg:p-7"
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
                  className="group rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
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

          <div className="mt-8 flex flex-col items-center gap-5 text-center">
            <p className="inline-flex flex-col items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-ink/70 shadow-sm sm:flex-row">
              <span className="inline-flex items-center gap-2 text-leaf-700">
                <CheckCircle2 size={18} aria-hidden="true" />
                Free for Ghanaian farmers
              </span>
              <span className="hidden h-4 w-px bg-leaf-900/15 sm:block" aria-hidden="true" />
              <span>No registration required to explore Farmer Hub.</span>
            </p>
            <ButtonLink href="/smart-solutions">{"\uD83C\uDF31"} Open Farmer Hub</ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-md border border-leaf-900/10 bg-[#ECE7D1] p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="gg-eyebrow">GG Standard</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">What is the Ghana Growers Standard?</h2>
              <p className="mt-2 text-sm leading-7 text-ink/66">
                A practical commitment framework for members who want to show care for sustainable farming, reliable supply, and quality produce. It is separate from verification and is not a certification.
              </p>
            </div>
            <ButtonLink href="/gg-standard" variant="secondary">Learn About GG Standard</ButtonLink>
          </div>
        </div>
      </section>
      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="gg-eyebrow">Need Produce?</p>
              <h2 className="mt-1 text-xl font-black text-ink">Tell Ghana Growers what you want to buy.</h2>
            </div>
            <ButtonLink href="/submit-buyer-request">Submit Buyer Request</ButtonLink>
          </div>
        </div>
      </section>

      <ChooseYourPath />

      <FeaturedListings
        kinds={["farmers"]}
        title="Featured farmers"
        description="A small selection of farmers across the Ghana Growers network."
        background="leaf"
        limit={3}
        compact
        farmers={homepageFeaturedFarmers}
      />

      <FeaturedListings
        kinds={["buyerRequests"]}
        title="Featured buyer requests"
        description="Active demand examples from buyers looking for produce by product, volume, location, and date posted."
        background="earth"
        limit={3}
      />

      <SuccessStoriesSection stories={successStories} preview />

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-earth-500">
              <UsersRound size={18} aria-hidden="true" />
              Join the network
            </p>
            <h2 className="mt-4 text-2xl font-black sm:text-4xl">Grow trusted agricultural connections across Ghana</h2>
            <p className="mt-4 leading-7 text-white/70">
              Choose your role, submit your details, and Ghana Growers will review the information before helping with publication, matching, or follow-up.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/join" variant="light">Join the Network</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">Contact Ghana Growers</ButtonLink>
            </div>
          </div>
          <RegistrationForm title="Register your interest" audience="farmer" />
        </div>
      </section>

      <section className="border-y border-leaf-900/10 bg-earth-50 py-6" aria-label="End of homepage content">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px bg-leaf-900/10" />
        </div>
      </section>
    </>
  );
}
