import { FarmerDirectory } from "@/components/FarmerDirectory";
import { ButtonLink } from "@/components/ButtonLink";
import { FeaturedListings } from "@/components/FeaturedListings";
import { PageHero } from "@/components/PageHero";
import { isFeaturedActive } from "@/lib/featured";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Farmer Directory",
  description:
    "Discover Ghanaian farmers by region, district, product, and farm type through the Ghana Growers Farmer Directory.",
  path: "/farmer-directory"
});

export default async function FarmerDirectoryPage() {
  const farmers = await getFarmersData();
  const featuredFarmers = farmers.filter((farmer) => isFeaturedActive(farmer) || farmer.verificationStatus === "Verified" || farmer.source === "Founding Farmer").slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="Farmer Directory"
        title="Discover farmers and farm supply across Ghana"
        description="Search farmer profiles by region, district, product, and farm type, then request a reviewed connection through Ghana Growers."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/buyer-requests">View Produce Demand</ButtonLink>
          <ButtonLink href="/join/farmer" variant="secondary">Join as a Farmer</ButtonLink>
          <ButtonLink href="/marketplace" variant="light">Browse Marketplace</ButtonLink>
        </div>
      </PageHero>
      <FeaturedListings
        kinds={["farmers"]}
        title="Featured farmers"
        description="Priority farmer profiles selected from active Ghana Growers farmers."
        background="leaf"
        farmers={featuredFarmers}
      />
      <FarmerDirectory farmers={farmers} />
    </>
  );
}
