import { ButtonLink } from "@/components/ButtonLink";
import { BuyerRequestsBoard } from "@/components/BuyerRequestsBoard";
import { createPageMetadata } from "@/lib/seo";
import { getBuyerRequestsData, getFarmersData, getMarketplaceListingsData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Produce Sourcing",
  description:
    "Request produce, livestock, farm inputs, and agricultural supply sourcing support through Ghana Growers.",
  path: "/buyer-requests"
});

export default async function BuyerRequestsPage() {
  const [requests, marketplaceProducts, farmers] = await Promise.all([
    getBuyerRequestsData(),
    getMarketplaceListingsData(),
    getFarmersData()
  ]);

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-4xl">
            <p className="gg-eyebrow">Produce Sourcing</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
              Need Produce?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Tell Ghana Growers what you need, or view published demand opportunities already being reviewed for matching.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/submit-buyer-request">Request Supply</ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <BuyerRequestsBoard requests={requests} marketplaceProducts={marketplaceProducts} farmers={farmers} />
    </>
  );
}
