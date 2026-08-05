import Link from "next/link";
import { FarmerDirectory } from "@/components/FarmerDirectory";
import { PageHero } from "@/components/PageHero";
import { PublicDataUnavailable } from "@/components/PublicDataUnavailable";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import { farmerDirectoryProfile } from "@/lib/farmerDirectory";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Farmer Directory",
  description:
    "Explore farmers currently published on Ghana Growers, including their locations and products.",
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
  const result = await getFarmersData();
  const farmers = result.status === "ready" ? result.data.map(farmerDirectoryProfile) : [];
  const initialSearch = searchQuery(searchParams?.q);

  return (
    <>
      <PageHero
        eyebrow="Farmer Directory"
        title="Meet farmers on Ghana Growers."
        variant="compact"
        description="Explore farmers currently published on Ghana Growers, including their locations and products."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="#farmer-discovery" className="gg-button-primary">
            Search Farmers
          </Link>
          <RequestConnectionButton
            label="Request Produce"
            ariaLabel="Request produce through Ghana Growers"
            sourceType="Buyer Request"
            sourceId="generic-sourcing"
            sourceName="General Produce Request"
            requestSource="generic_sourcing"
            productInterest="Fresh produce"
            className="bg-earth-500 text-ink hover:bg-earth-700 hover:text-white"
          />
          <Link href="/join/farmer" className="gg-text-link">
            Join as a Farmer
          </Link>
        </div>
      </PageHero>
      {result.status === "unavailable" ? (
        <PublicDataUnavailable kind="farmer" />
      ) : (
        <FarmerDirectory farmers={farmers} initialSearch={initialSearch} />
      )}
    </>
  );
}
