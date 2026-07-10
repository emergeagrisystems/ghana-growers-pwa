import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { FarmerDirectory } from "@/components/FarmerDirectory";
import { PageHero } from "@/components/PageHero";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { SafeImage } from "@/components/SafeImage";
import { isFeaturedActive } from "@/lib/featured";
import {
  cleanFarmerLocation,
  cleanFarmerProfileLabel,
  farmerCardImage,
  farmerImagePosition,
  farmerProducts,
  isVerifiedFarmer,
  publicFarmerProfiles
} from "@/lib/farmerDirectory";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";

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

export default async function FarmerDirectoryPage({ searchParams }: FarmerDirectoryPageProps) {
  const farmers = publicFarmerProfiles(await getFarmersData());
  const featuredFarmers = farmers
    .filter((farmer) => isVerifiedFarmer(farmer) && isFeaturedActive(farmer))
    .slice(0, 4);
  const initialSearch = searchQuery(searchParams?.q);

  return (
    <>
      <PageHero
        eyebrow="Farmer Directory"
        title="Find Farmers Across Ghana"
        variant="compact"
        description="Search farmer profiles by location, crop, and farm type, then request through Ghana Growers."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="#farmer-discovery" className="gg-button-primary">
            Search Farmers
          </Link>
          <RequestConnectionButton
            label="Request Produce"
            ariaLabel="Request produce through Ghana Growers"
            sourceType="Farmer"
            sourceId="general-produce-request"
            sourceName="General Produce Request"
            productInterest="Fresh produce"
            className="bg-earth-500 text-ink hover:bg-earth-700 hover:text-white"
          />
          <Link href="/join/farmer" className="gg-text-link">
            Join as a Farmer
          </Link>
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
              <Link href="#farmer-discovery" className="gg-button-secondary">Browse All Farmers</Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featuredFarmers.map((farmer) => {
                const products = farmerProducts(farmer);
                const mainProducts = products.slice(0, 3);
                const extraProductCount = Math.max(0, products.length - mainProducts.length);
                const imageSrc = farmerCardImage(farmer, products);
                const hasRealPhoto = Boolean(farmer.hasRealPhoto && farmer.photos[0]);

                return (
                  <article key={farmer.slug} className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                    <div className="relative">
                      <SafeImage
                        src={imageSrc}
                        alt={hasRealPhoto ? `${farmer.farmName} farm photo` : ""}
                        width={320}
                        height={320}
                        className={`aspect-square w-full rounded-t-md bg-leaf-50 object-cover ${farmerImagePosition(farmer)}`}
                        fallbackKind="crop"
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                      />
                      {!hasRealPhoto ? (
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-ink/60 shadow-sm">
                          Profile photo pending
                        </span>
                      ) : null}
                      <span aria-label="Verified by Ghana Growers" className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-xs font-black text-leaf-700 shadow-sm">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Verified
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="min-h-[3rem] text-lg font-black leading-tight text-ink [text-wrap:balance] line-clamp-2">{farmer.farmName}</h3>
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
