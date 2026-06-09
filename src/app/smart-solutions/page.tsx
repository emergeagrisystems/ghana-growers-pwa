import { CropHealthCheck } from "@/components/smart-solutions/CropHealthCheck";
import { FarmerAssistant } from "@/components/smart-solutions/FarmerAssistant";
import { MarketPricesDashboard } from "@/components/smart-solutions/MarketPricesDashboard";
import { WeatherUpdates } from "@/components/smart-solutions/WeatherUpdates";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { smartTools } from "@/data/smartTools";
import { getMarketPricesData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Farmer Tools",
  description:
    "Weather updates, market prices, crop health checks, and farming advice for Ghanaian farmers."
};

export default async function SmartSolutionsPage() {
  const marketPrices = await getMarketPricesData();

  return (
    <>
      <PageHero
        eyebrow="Farmer Tools"
        title="Farmer Tools"
        description="Weather Updates, Market Prices, Crop Health Checks, and Farming Advice for Ghanaian Farmers."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {smartTools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="focus-ring inline-flex items-center justify-center rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white shadow-soft transition hover:bg-leaf-700"
            >
              {tool.cta}
            </a>
          ))}
        </div>
        <div className="mt-3">
          <ButtonLink href="/whatsapp-communities" variant="light">
            Join WhatsApp Communities
          </ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Dashboard"
            title="Farmer Tools dashboard"
            description="Open the tool you need now, or scroll through the full dashboard. Each card is built around a practical farm decision."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {smartTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.title}
                  href={tool.href}
                  className="focus-ring rounded-md border border-leaf-900/10 bg-leaf-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-soft"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-ink">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{tool.description}</p>
                  <span className="mt-5 inline-flex rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700">
                    {tool.cta}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:px-8">
          <WeatherUpdates />
          <div className="grid gap-8 xl:grid-cols-2">
            <CropHealthCheck />
            <FarmerAssistant />
          </div>
          <MarketPricesDashboard prices={marketPrices} />
        </div>
      </section>
    </>
  );
}
