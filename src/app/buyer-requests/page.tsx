import { ButtonLink } from "@/components/ButtonLink";
import { BuyerRequestsBoard } from "@/components/BuyerRequestsBoard";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "Buyer Requests",
  description:
    "Browse buyer demand for maize, tomatoes, cassava, plantain, yam, eggs, poultry, and other farm products in Ghana."
};

export default function BuyerRequestsPage() {
  return (
    <>
      <PageHero
        eyebrow="Buyer Requests"
        title="Buyer demand board for Ghanaian farmers"
        description="See what buyers are looking for, filter demand by product and region, and contact Ghana Growers on WhatsApp when you can supply."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/join/farmer">Register Your Farm</ButtonLink>
          <ButtonLink href="/join/buyer" variant="secondary">Post Buyer Demand</ButtonLink>
        </div>
      </PageHero>
      <BuyerRequestsBoard />
    </>
  );
}
