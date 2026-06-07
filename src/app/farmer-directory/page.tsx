import { FarmerDirectory } from "@/components/FarmerDirectory";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { farmerDirectory } from "@/data/farmers";

export const metadata = {
  title: "Farmer Directory",
  description:
    "Discover Ghanaian farmers by region, district, product, and farm type through the Ghana Growers Farmer Directory."
};

export default function FarmerDirectoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Farmer Directory"
        title="Discover farmers and farm supply across Ghana"
        description="Search farmer profiles by region, district, product, and farm type, then contact Ghana Growers on WhatsApp to start a trusted buying conversation."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/buyer-requests">View Buyer Requests</ButtonLink>
          <ButtonLink href="/join/farmer" variant="secondary">Register a Farm</ButtonLink>
          <ButtonLink href="/marketplace" variant="light">Browse Marketplace</ButtonLink>
        </div>
      </PageHero>
      <FarmerDirectory farmers={farmerDirectory} />
    </>
  );
}
