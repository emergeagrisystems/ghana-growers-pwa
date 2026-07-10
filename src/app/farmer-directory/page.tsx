import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { FarmerDirectory } from "@/components/FarmerDirectory";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { isFeaturedActive } from "@/lib/featured";
import { cleanProductList, productImageForName } from "@/lib/productDisplay";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";
import type { FarmerProfile } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Farmer Directory",
  description:
    "Discover farmers across Ghana by region, district, product, and farm type through the Ghana Growers Farmer Directory.",
  path: "/farmer-directory"
});

type FarmerDirectoryPageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

function searchQuery(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

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
    .replace(/\bAquaculture And Poultry\b/gi, "Aquaculture & Poultry")
    .replace(/\bCabbages And Chili Pepper\b/gi, "Cabbage & Chili Pepper");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanFarmerLocation(farmer: FarmerProfile) {
  const region = cleanProfileLabel(farmer.region);
  let district = cleanProfileLabel(farmer.district);

  if (region) {
    district = district
      .replace(new RegExp(`^${escapeRegExp(region)}\\s*`, "i"), "")
      .replace(new RegExp(`,?\\s*${escapeRegExp(region)}$`, "i"), "")
      .trim()
      .replace(/^,|,$/g, "")
      .trim();
  }

  if (!district) {
    return region || "Ghana";
  }

  return region ? `${district}, ${region}` : district;
}

function farmerProducts(farmer: FarmerProfile) {
  return cleanProductList(farmer.products).map(cleanProfileLabel);
}

function farmerCardImage(farmer: FarmerProfile, products: string[]) {
  if (farmer.hasRealPhoto && farmer.photos[0]) {
    return farmer.photos[0];
  }

  return productImageForName(products[0] ?? "Produce", farmer.farmType);
}

function farmerImagePosition(farmer: FarmerProfile) {
  return farmer.farmName.toLowerCase().includes("nart") ? "object-[center_18%]" : "object-[center_30%]";
}

export default async function FarmerDirectoryPage({ searchParams }: FarmerDirectoryPageProps) {
  const farmers = await getFarmersData();
  const featuredFarmers = farmers.filter((farmer) => isFeaturedActive(farmer) || farmer.verificationStatus === "Verified" || farmer.source === "Founding Farmer").slice(0, 4);
  const initialSearch = searchQuery(searchParams?.q);

  return (
    <>
      <PageHero
        eyebrow="Farmer Directory"
        title="Find Farmers Across Ghana"
        description="Search farmer profiles by location, crop, and farm type, then request through Ghana Growers."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/buyer-requests">View Produce Demand</ButtonLink>
          <ButtonLink href="/join/farmer" variant="secondary">Join as a Farmer</ButtonLink>
          <ButtonLink href="/marketplace" variant="light">Browse Marketplace</ButtonLink>
        </div>
      </PageHero>
      {featuredFarmers.length > 0 ? (
        <section className="bg-leaf-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="gg-eyebrow">Featured farmers</p>
                <h2 className="mt-2 text-3xl font-black text-ink">Active farmer profiles</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/66">
                  Browse selected farmer profiles from the Ghana Growers network.
                </p>
              </div>
              <ButtonLink href="/farmer-directory" variant="secondary">View Farmer Directory</ButtonLink>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featuredFarmers.map((farmer) => {
                const products = farmerProducts(farmer);
                const mainProducts = products.slice(0, 3);
                const extraProductCount = Math.max(0, products.length - mainProducts.length);
                const isVerified = farmer.verificationStatus === "Verified" || farmer.trust?.status === "Verified";

                return (
                  <article key={farmer.slug} className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                    <SafeImage
                      src={farmerCardImage(farmer, products)}
                      alt={`${farmer.farmName} farm photo`}
                      width={320}
                      height={320}
                      className={`aspect-square w-full bg-leaf-50 object-cover ${farmerImagePosition(farmer)}`}
                      fallbackKind="crop"
                      sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">{cleanProfileLabel(farmer.farmType)}</p>
                          <h3 className="mt-1 text-lg font-black text-ink">{farmer.farmName}</h3>
                        </div>
                        {isVerified ? (
                          <span aria-label="Verified by Ghana Growers" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink/58">{cleanFarmerLocation(farmer)}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {mainProducts.map((product) => (
                          <span key={product} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                            {product}
                          </span>
                        ))}
                        {extraProductCount > 0 ? (
                          <span className="rounded-md bg-earth-50 px-3 py-1 text-xs font-bold text-earth-700">
                            +{extraProductCount} more
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-auto pt-5">
                        <Link href={`/farmer-directory/${farmer.slug}`} className="gg-button-secondary w-full" aria-label={`View profile for ${farmer.farmName}`}>
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
      <FarmerDirectory farmers={farmers} initialSearch={initialSearch} />
    </>
  );
}
