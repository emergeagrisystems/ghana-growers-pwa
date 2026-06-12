import { ButtonLink } from "@/components/ButtonLink";
import { BuyerRequestsBoard } from "@/components/BuyerRequestsBoard";
import { getBuyerRequestsData, getFarmersData, getMarketplaceListingsData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buyer Demand Board | Ghana Growers",
  description:
    "Find active buyer requests for produce, livestock, and agricultural supply across Ghana."
};

export default async function BuyerRequestsPage() {
  const [requests, marketplaceProducts, farmers] = await Promise.all([
    getBuyerRequestsData(),
    getMarketplaceListingsData(),
    getFarmersData()
  ]);

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-gradient-to-br from-white via-leaf-50/40 to-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Demand Board</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
              Buyer Demand Board
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Find active buyer requests for produce, livestock, and agricultural supply across Ghana.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/submit-buyer-request">Post Buyer Request</ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <BuyerRequestsBoard requests={requests} marketplaceProducts={marketplaceProducts} farmers={farmers} />
    </>
  );
}
