import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Handshake,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Sprout,
  Truck,
  UsersRound
} from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ButtonLink } from "@/components/ButtonLink";
import { FeaturedListings } from "@/components/FeaturedListings";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import platformContent from "@/data/platformContent.json";
import { productCategories } from "@/data/products";

export const metadata = {
  title: "Trusted Agriculture Platform for Ghana",
  description:
    "Ghana Growers connects Ghanaian farmers, buyers, suppliers, market women, processors, and agribusiness partners through directories, buyer requests, smart tools, and trusted WhatsApp follow-up.",
  openGraph: {
    title: "Ghana Growers | Trusted Agriculture Platform for Ghana",
    description:
      "Discover farmers, suppliers, buyer requests, market intelligence, and smart agricultural tools built for Ghana.",
    images: ["/images/og.svg"]
  }
};

const platformPillars = [
  {
    title: "Verified directories",
    description: "Search farmers and suppliers by region, district, product, farm type, category, and service coverage.",
    icon: Search
  },
  {
    title: "Active buyer demand",
    description: "Farmers can see sample demand from market women, processors, hotels, restaurants, caterers, and exporters.",
    icon: PackageCheck
  },
  {
    title: "Smart farm support",
    description: "Weather tools, market intelligence, crop health guidance, and an AI farmer assistant support better decisions.",
    icon: BarChart3
  },
  {
    title: "WhatsApp-first connection",
    description: "Ghana Growers keeps communication practical for farmers, buyers, and suppliers already using WhatsApp.",
    icon: MessageCircle
  }
];

const ghanaVisuals = [
  { title: "Farmers and farmer groups", image: "/images/farmers/farmer-1.jpg" },
  { title: "Farm activities", image: "/images/marketplace/farm-activity-1.jpg" },
  { title: "Ghana market scenes", image: "/images/marketplace/ghana-market-1.jpg" },
  { title: "Agricultural supply chains", image: "/images/marketplace/logistics-truck.jpg" }
];

const trustBadges = ["Verified Farmer", "Verified Buyer", "Verified Supplier", "Premium Member"];

export default function HomePage() {
  return (
    <>
      <section className="ghana-grid bg-leaf-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black uppercase text-earth-700 shadow-soft">
              <ShieldCheck size={17} aria-hidden="true" />
              Trusted agricultural trade in Ghana
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
              Farmers, buyers, and suppliers connected through one active platform
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              Ghana Growers helps farmer groups showcase produce, buyers discover reliable supply, and agricultural suppliers reach the communities that need inputs, packaging, logistics, storage, finance, and advisory services.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/farmer-directory">Find Farmers</ButtonLink>
              <ButtonLink href="/buyer-requests" variant="secondary">View Buyer Requests</ButtonLink>
              <ButtonLink href="/supplier-directory" variant="light">Find Suppliers</ButtonLink>
              <ButtonLink href="/smart-solutions" variant="secondary">Use Smart Solutions</ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 shadow-soft">
                  <BadgeCheck size={15} aria-hidden="true" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <Image
              src="/images/hero-market.svg"
              alt="Ghana Growers marketplace illustration with fresh produce and trade connections"
              width={720}
              height={560}
              priority
              className="h-auto w-full rounded-md border border-leaf-900/10 bg-white shadow-soft"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-white p-4 shadow-soft">
                <p className="text-2xl font-black text-leaf-700">10</p>
                <p className="text-xs font-bold uppercase text-ink/55">Regions represented</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-soft">
                <p className="text-2xl font-black text-leaf-700">24/7</p>
                <p className="text-xs font-bold uppercase text-ink/55">WhatsApp inquiry access</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-soft">
                <p className="text-2xl font-black text-leaf-700">AI</p>
                <p className="text-xs font-bold uppercase text-ink/55">Farmer guidance tools</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {platformContent.statistics.map((stat) => (
            <div key={stat.label} className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
              <p className="text-4xl font-black text-leaf-700">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm font-black uppercase text-ink/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-earth-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="How Ghana Growers Works"
            title="A practical path from farm supply to trusted opportunity"
            description="The platform is designed for how agricultural trade already happens in Ghana: local relationships, WhatsApp communication, regional supply, and growing demand for verified information."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {platformContent.howGhanaGrowersWorks.map((step, index) => {
              const Icon = [Sprout, Search, Truck, Handshake][index];

              return (
                <article key={step.title} className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                  <span className="inline-flex rounded-md bg-leaf-600 px-3 py-2 text-xs font-black uppercase text-white">{step.step}</span>
                  <div className="mt-5 grid h-12 w-12 place-items-center rounded-md bg-earth-500 text-ink">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Ghana-specific platform activity"
            title="Built around real agricultural workflows"
            description="From farm gates and aggregation points to urban markets, hotels, processors, and supplier networks, Ghana Growers gives each participant a clearer place to be found."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {platformPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-ink">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <FeaturedListings
        kinds={["farmers"]}
        title="Featured farmers"
        description="Verified and priority farmer profiles from different Ghana regions, ready for buyer discovery and WhatsApp follow-up."
        background="leaf"
      />

      <FeaturedListings
        kinds={["suppliers"]}
        title="Featured suppliers"
        description="Input dealers, logistics firms, packaging providers, machinery services, and irrigation suppliers supporting agricultural trade."
      />

      <FeaturedListings
        kinds={["buyerRequests"]}
        title="Featured buyer requests"
        description="Active demand examples from buyers looking for produce by product, volume, location, and date posted."
        background="earth"
      />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="What the community says"
            title="Practical value for farmers, buyers, and suppliers"
            description="These example testimonials show the kind of trust and coordination Ghana Growers is designed to support."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {platformContent.testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                <p className="text-sm leading-7 text-ink/70">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-5 border-t border-leaf-900/10 pt-4">
                  <h3 className="font-black text-ink">{testimonial.name}</h3>
                  <p className="mt-1 text-sm font-bold text-leaf-700">{testimonial.role}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-ink/50">{testimonial.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Ghana agricultural visuals"
            title="A platform shaped around crops, markets, activities, and supply chains"
            description="Local placeholder visuals keep the site fast today while giving future image uploads clear places to land."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ghanaVisuals.map((visual) => (
              <article key={visual.title} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft">
                <SafeImage src={visual.image} alt={visual.title} width={360} height={220} className="h-36 w-full rounded-md bg-earth-50 object-cover" />
                <h3 className="mt-4 font-black text-ink">{visual.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Marketplace categories"
            title="Fresh produce, inputs, packaging, logistics, and services in one ecosystem"
            description="Editable local data powers the current listings and can later connect to a database, CMS, or partner integrations."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productCategories.slice(0, 8).map((category) => (
              <Link
                href="/marketplace"
                key={category.slug}
                className="focus-ring rounded-md border border-leaf-900/10 bg-earth-50 p-4 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <SafeImage src={category.image} alt={`${category.name} category placeholder`} width={220} height={140} className="h-28 w-full rounded-md object-cover" />
                <h3 className="mt-4 font-black text-ink">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/65">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
              <UsersRound size={18} aria-hidden="true" />
              Join the network
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Grow trusted agricultural connections across Ghana</h2>
            <p className="mt-4 leading-7 text-white/70">
              Register interest, browse directories, join WhatsApp communities, and use Smart Solutions to make better decisions before buying, selling, supplying, or transporting agricultural products.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/verification-requirements" className="inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
                Understand verification <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/whatsapp-communities" className="inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
                Join a WhatsApp community <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/market-intelligence" className="inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
                View market intelligence <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8">
              <WhatsAppButton message="Hello Ghana Growers, I want help joining the platform or finding agricultural opportunities." className="bg-earth-500 text-ink hover:bg-white" />
            </div>
          </div>
          <RegistrationForm title="Register your interest" audience="farmer" />
        </div>
      </section>
    </>
  );
}
