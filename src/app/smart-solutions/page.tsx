import { DigitalFarmToolbox } from "@/components/smart-solutions/DigitalFarmToolbox";
import { createPageMetadata } from "@/lib/seo";
import { getMarketPricesData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Digital Farm",
  description:
    "Weather updates, market prices, crop health checks, and farming advice for Ghanaian farmers.",
  path: "/smart-solutions"
});

export default async function SmartSolutionsPage() {
  const marketPrices = await getMarketPricesData();

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <p className="gg-eyebrow">Digital Farm</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Digital Farm Toolbox</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 sm:text-lg">
            Choose one farming task at a time: check weather, upload a crop photo, ask for farming advice, or compare market prices.
          </p>
        </div>
      </section>

      <DigitalFarmToolbox marketPrices={marketPrices} />
    </>
  );
}
