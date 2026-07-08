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
  Sprout,
  Truck,
  UserRound,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { FeaturedListings } from "@/components/FeaturedListings";
import { MarketplaceCategoryShowcase } from "@/components/MarketplaceCategoryShowcase";
import { SafeImage } from "@/components/SafeImage";
import { isFeaturedActive } from "@/lib/featured";
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

const networkRoles = [
  {
    title: "For Buyers",
    text: "Find produce, request availability, and connect through Ghana Growers.",
    href: "/buy",
    action: "Buy Produce",
    icon: ShoppingBasket
  },
  {
    title: "For Farmers",
    text: "Create a profile, list your harvest, and reach more buyers.",
    href: "/sell",
    action: "Sell Harvest",
    icon: Sprout
  },
  {
    title: "For Suppliers",
    text: "Showcase inputs, packaging, equipment, logistics, or services.",
    href: "/join/supplier",
    action: "Join as Supplier",
    icon: Truck
  },
  {
    title: "For Partners",
    text: "Discover agricultural actors and support stronger supply chains.",
    href: "/about/partner-with-us",
    action: "Partner with Ghana Growers",
    icon: UsersRound
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

const trustPoints = ["Verified Profiles", "Reviewed Listings", "Buyer Request Support"];

export default async function HomePage() {
  const farmers = await getFarmersData();
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
      <section className="overflow-hidden bg-earth-50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-8 lg:pb-10 lg:pt-14 xl:gap-14">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-earth-700/75 shadow-sm">
              <ShieldCheck size={17} aria-hidden="true" />
              Built for Ghanaian Agriculture
            </p>
            <h1 className="mt-6 max-w-3xl gg-hero-title !text-[2.45rem] sm:!text-[3.35rem] lg:!text-[3.8rem] xl:!text-[4.35rem]">
              Ghana&apos;s trusted agricultural marketplace.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-black leading-8 text-leaf-800 sm:text-xl">
              Buy farm produce, sell harvests, find trusted suppliers, and grow smarter with GG FarmMate.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg sm:leading-8">
              Ghana Growers connects farmers, buyers, suppliers, and agricultural service providers through verified profiles, marketplace listings, produce requests, and practical farming support.
            </p>
            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <ButtonLink href="/marketplace">
                <ShoppingBasket size={17} aria-hidden="true" className="mr-2" />
                Explore Marketplace
              </ButtonLink>
              <ButtonLink href="/join" variant="secondary">
                <UserRound size={17} aria-hidden="true" className="mr-2" />
                Join the Network
              </ButtonLink>
              <Link href="/farmer-hub" className="focus-ring rounded-md px-1 py-2 text-sm font-black text-leaf-800 hover:text-leaf-900">
                Open GG FarmMate
              </Link>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-leaf-800">
              <CheckCircle2 size={16} aria-hidden="true" />
              Building Ghana&apos;s trusted agricultural network.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-md border border-white/70 bg-white p-0.5 shadow-soft">
            <SafeImage
              src="/images/hero/ghana-growers-trade-hero.png"
              alt="Ghanaian agriculture marketplace with farmers, buyers, and fresh produce"
              width={1778}
              height={885}
              fallbackSrc="/images/marketplace/ghana-market-1.jpg"
              fallbackKind="default"
              priority
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="aspect-[4/3] w-full rounded-md object-cover sm:aspect-[16/9]"
            />
          </div>
        </div>
      </section>

      <MarketplaceCategoryShowcase />

      <section className="bg-[#F7F6EF] py-16 sm:py-20 lg:py-24" aria-labelledby="how-ghana-growers-works">
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

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card">
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

      <section className="bg-white py-16 sm:py-20 lg:py-24" aria-labelledby="who-ghana-growers-serves">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow text-earth-700/70">Who It Serves</p>
            <h2 id="who-ghana-growers-serves" className="mt-3 gg-section-title">
              Built for Ghana&apos;s agricultural network
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {networkRoles.map((role) => {
              const Icon = role.icon;

              return (
                <Link
                  key={role.title}
                  href={role.href}
                  className="focus-ring group flex h-full flex-col rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-soft"
                >
                  <span className="gg-icon bg-white text-leaf-700 ring-leaf-700/10">
                    <Icon size={23} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-ink group-hover:text-leaf-700">{role.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-ink/64">{role.text}</p>
                  <span className="mt-5 text-sm font-black text-leaf-700">{role.action}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <FeaturedListings
        kinds={["farmers"]}
        title="Featured farmers"
        description="Meet trusted farmers from the Ghana Growers network."
        background="earth"
        limit={3}
        compact
        farmers={homepageFeaturedFarmers}
      />

      <section id="farmer-hub-teaser" className="bg-mist py-16 text-ink sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="gg-eyebrow text-earth-700/70">By Ghana Growers</p>
            <h2 className="mt-3 gg-editorial-heading text-4xl leading-tight text-ink sm:text-5xl">GG FarmMate</h2>
            <p className="mt-3 text-xl font-black text-leaf-800 sm:text-2xl">
              Your AI-powered farming companion.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/66 sm:text-lg">
              Check weather, diagnose crop problems, compare market prices, and get practical farming advice in one place.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-ink/58">
              Built into Ghana Growers to help farmers make better daily decisions before they plant, harvest, sell, or buy inputs.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {farmMateTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.title}
                  href="/farmer-hub"
                  className="focus-ring group flex h-full min-h-[12rem] flex-col rounded-md border border-leaf-900/10 bg-white p-5 text-ink shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="gg-icon gg-icon-farmer-hub h-14 w-14">
                    <Icon size={26} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-ink group-hover:text-leaf-700">{tool.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/66">{tool.description}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <ButtonLink href="/farmer-hub">
              Open GG FarmMate
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-earth-50 p-6 shadow-card lg:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
              <div>
                <p className="gg-eyebrow">Ghana Growers Checks</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Why source through Ghana Growers</h2>
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

      <section className="bg-[#143A1F] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="gg-eyebrow text-earth-500">Join the Network</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Build trusted agricultural connections across Ghana.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
            Register as a farmer, buyer, supplier, or service provider. Ghana Growers will review your details before your profile, listing, or request is published.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/join" variant="light">
              Join the Network
            </ButtonLink>
            <ButtonLink href="/contact" variant="light">
              Contact Ghana Growers
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
