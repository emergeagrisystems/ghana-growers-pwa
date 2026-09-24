import Link from "next/link";
import { ArrowRight, ClipboardList, Handshake, Search, Sprout, Store, UserRoundCheck, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { PublicDataUnavailable } from "@/components/PublicDataUnavailable";
import { SafeImage } from "@/components/SafeImage";
import { cleanFarmerLocation } from "@/lib/farmerDirectory";
import { isFeaturedActive } from "@/lib/featured";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";
import type { PublicFarmerProfile } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Directory",
  description: "Browse farmers currently published on Ghana Growers. Supplier and agricultural service profiles will appear as they are approved.",
  path: "/directory"
});

const directoryCards = [
  {
    title: "Published Farmers",
    description: "Browse farmer profiles, crops, locations, and available produce.",
    href: "/farmer-directory",
    cta: "Find Farmers",
    icon: Sprout
  },
  {
    title: "Supplier Profiles",
    description: "Approved supplier profiles will appear here as they become available.",
    href: "/supplier-directory",
    cta: "Supplier profiles coming soon",
    icon: Store
  },
  {
    title: "Agricultural Services",
    description: "Approved agricultural service profiles will appear as they become available.",
    href: "/supplier-directory?q=service",
    cta: "Supplier profiles coming soon",
    icon: Wrench
  }
];

const directorySteps = [
  {
    title: "Search",
    description: "Find farmers, suppliers, or services.",
    icon: Search
  },
  {
    title: "View Profile",
    description: "Check products, location, and details.",
    icon: UserRoundCheck
  },
  {
    title: "Request",
    description: "Tell Ghana Growers what you need.",
    icon: ClipboardList
  },
  {
    title: "Connect",
    description: "Ghana Growers supports the next step.",
    icon: Handshake
  }
];

function titleCaseValue(value: string) {
  return value
    .trim()
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\s+/g, " ")
    .split(/(\s+|-|,)/)
    .map((part) => {
      if (/^(\s+|-|,)$/.test(part)) {
        return part;
      }

      const lower = part.toLowerCase();
      return lower ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower;
    })
    .join("")
    .replace(/\bRegion\b/gi, "Region");
}

function cleanProfileLabel(value: string) {
  return titleCaseValue(value)
    .replace(/\bMaise\b/gi, "Maize")
    .replace(/\bAquaculture And Poultry\b/gi, "Aquaculture & Poultry");
}

function featuredImagePosition(farmer: PublicFarmerProfile) {
  return farmer.farmName.toLowerCase().includes("nart") ? "object-[center_18%]" : "object-[center_30%]";
}

export default async function DirectoryPage() {
  const farmerResult = await getFarmersData();
  const featuredFarmers = farmerResult.status === "ready"
    ? farmerResult.data.filter((farmer) => isFeaturedActive(farmer)).slice(0, 4)
    : [];

  return (
    <>
      <PageHero
        eyebrow="Directory"
        title="Explore the Ghana Growers Directory."
        description="Browse farmers currently published on Ghana Growers. Supplier and agricultural service profiles will appear as they are approved."
        variant="compact"
      >
        <form action="/farmer-directory" method="get" className="max-w-3xl rounded-md border border-leaf-900/10 bg-white p-2 shadow-soft">
          <label htmlFor="directory-search" className="sr-only">
            Search Ghana Growers directory
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <span className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-leaf-600" size={18} aria-hidden="true" />
              <input
                id="directory-search"
                name="q"
                type="search"
                placeholder="Search farmers, crops, suppliers, inputs, location..."
                className="focus-ring min-h-12 w-full rounded-md border border-leaf-900/10 bg-leaf-50/60 py-3 pl-11 pr-3 text-sm font-semibold text-ink placeholder:text-ink/45"
              />
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="submit" className="gg-button-primary min-h-12 whitespace-nowrap">
                Search Farmers
              </button>
              <button type="submit" formAction="/supplier-directory" className="gg-button-secondary min-h-12 whitespace-nowrap">
                Search Suppliers
              </button>
            </div>
          </div>
        </form>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {directoryCards.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.title} className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft sm:p-6">
                  <span className="gg-icon bg-leaf-600 text-white ring-leaf-700/10">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-xl font-black text-ink">{card.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-ink/68">{card.description}</p>
                  <Link href={card.href} className="gg-button-primary mt-6 w-full" aria-label={`${card.cta} in the Ghana Growers directory`}>
                    {card.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {farmerResult.status === "unavailable" ? (
        <PublicDataUnavailable kind="farmer" />
      ) : featuredFarmers.length > 0 ? (
        <section className="bg-leaf-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="gg-eyebrow">Featured profiles</p>
                <h2 className="mt-2 text-3xl font-black text-ink">Explore active profiles</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/66">
                  Explore active profiles from the Ghana Growers network.
                </p>
              </div>
              <ButtonLink href="/farmer-directory" variant="secondary">View Farmer Directory</ButtonLink>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featuredFarmers.map((farmer) => (
                <article key={farmer.slug} className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                  <SafeImage
                    src={farmer.mainImage ?? "/images/farmers/farmer-1.jpg"}
                    alt={`${farmer.farmName} farm photo`}
                    width={320}
                    height={320}
                    className={`aspect-square w-full bg-leaf-50 object-cover ${featuredImagePosition(farmer)}`}
                    fallbackKind="farmer"
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-earth-700">{cleanProfileLabel(farmer.region)}</p>
                        <h3 className="mt-1 text-lg font-black text-ink">{farmer.farmName}</h3>
                      </div>
                      {farmer.verificationStatus === "Verified" ? (
                        <span className="shrink-0 rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink/58">{cleanFarmerLocation(farmer)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {farmer.products.slice(0, 3).map((product) => (
                        <span key={product} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                          {cleanProfileLabel(product)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto pt-5">
                      <Link href={`/farmer-directory/${farmer.slug}`} className="gg-button-secondary w-full" aria-label={`View profile for ${farmer.farmName}`}>
                      View Profile
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-900 p-5 text-white shadow-soft sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-100">How the directory works</p>
                <h2 className="mt-2 text-2xl font-black">Search, request, and connect</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-white/76">
                Ghana Growers helps route connection requests so buyers, farmers, suppliers, and service providers can take the next step.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {directorySteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="rounded-md border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-earth-100 text-leaf-900">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <h3 className="font-black">{step.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/72">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="gg-eyebrow">Join the Network</p>
                <h2 className="mt-2 text-3xl font-black text-ink">Want to be listed?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/68">
                  Join the Ghana Growers Network as a farmer, supplier, buyer, or service provider.
                </p>
              </div>
              <Link href="/join" className="gg-button-primary shrink-0">
                Join the Network
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
