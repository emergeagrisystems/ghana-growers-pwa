import Link from "next/link";
import { FarmerDirectory } from "@/components/FarmerDirectory";
import { PageHero } from "@/components/PageHero";
import { RequestConnectionButton } from "@/components/RequestConnectionButton";
import {
  orderFarmerDirectoryProfiles,
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
  const farmers = orderFarmerDirectoryProfiles(publicFarmerProfiles(await getFarmersData()));
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
      <FarmerDirectory farmers={farmers} initialSearch={initialSearch} />
    </>
  );
}
