import { DigitalFarmToolbox } from "@/components/smart-solutions/DigitalFarmToolbox";
import { createPageMetadata } from "@/lib/seo";
import { getMarketPricesData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Farmer Hub",
  description:
    "Free weather updates, crop health checks, market prices, and practical farming advice for Ghanaian farmers.",
  path: "/smart-solutions"
});

export default async function SmartSolutionsPage() {
  const marketPrices = await getMarketPricesData();

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <p className="gg-eyebrow">Farmer Hub</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">🌱 Farmer Hub</h1>
          <h2 className="mt-2 text-xl font-black text-leaf-700 sm:text-2xl">Your Daily Farming Companion</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 sm:text-lg">
            Free weather updates, crop health checks, market prices and practical farming advice for Ghanaian farmers.
          </p>
        </div>
      </section>

      <DigitalFarmToolbox marketPrices={marketPrices} />
    </>
  );
}
