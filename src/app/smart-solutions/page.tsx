import { CropHealthCheck } from "@/components/smart-solutions/CropHealthCheck";
import { FarmerAssistant } from "@/components/smart-solutions/FarmerAssistant";
import { MarketPricesDashboard } from "@/components/smart-solutions/MarketPricesDashboard";
import { WeatherUpdates } from "@/components/smart-solutions/WeatherUpdates";
import { smartTools } from "@/data/smartTools";
import { getMarketPricesData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Digital Farm",
  description:
    "Weather updates, market prices, crop health checks, and farming advice for Ghanaian farmers."
};

export default async function SmartSolutionsPage() {
  const marketPrices = await getMarketPricesData();

  return (
    <>
      <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="gg-eyebrow">Digital Farm</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Digital Farm</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
            Weather, crop health, market prices, and farming advice for Ghanaian farmers.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {smartTools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="gg-button-primary"
            >
              {tool.cta}
            </a>
          ))}
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:px-8">
          <WeatherUpdates />
          <CropHealthCheck />
          <FarmerAssistant />
          <MarketPricesDashboard prices={marketPrices} />
        </div>
      </section>
    </>
  );
}
