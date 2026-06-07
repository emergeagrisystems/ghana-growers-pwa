import { CropHealthCheck } from "@/components/smart-solutions/CropHealthCheck";
import { FarmerAssistant } from "@/components/smart-solutions/FarmerAssistant";
import { MarketPricesDashboard } from "@/components/smart-solutions/MarketPricesDashboard";
import { WeatherUpdates } from "@/components/smart-solutions/WeatherUpdates";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { smartTools } from "@/data/smartTools";

export const metadata = {
  title: "Smart Solutions",
  description:
    "Practical digital tools for Ghanaian farmers including weather updates, crop health checks, AI farming advice, and market prices."
};

export default function SmartSolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Smart Solutions"
        title="Practical digital tools for Ghanaian farmers"
        description="Check weather, review crop health, ask farming questions, and monitor indicative Ghana market prices from one mobile-friendly dashboard."
      />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Tools built for everyday farm decisions"
            description="These tools start with frontend experiences and editable local data, with clear paths to connect weather, crop disease, AI, and market data APIs later."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {smartTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-ink">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{tool.description}</p>
                </div>
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
          <MarketPricesDashboard />
        </div>
      </section>
    </>
  );
}
