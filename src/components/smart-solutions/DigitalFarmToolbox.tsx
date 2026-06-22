"use client";

import { BookOpen, Bot, CloudSun, LineChart, ScanSearch } from "lucide-react";
import { useState } from "react";
import type { MarketPrice } from "@/data/marketPrices";
import { CropHealthCheck } from "@/components/smart-solutions/CropHealthCheck";
import { FarmerAssistant } from "@/components/smart-solutions/FarmerAssistant";
import { MarketPricesDashboard } from "@/components/smart-solutions/MarketPricesDashboard";
import { WeatherUpdates } from "@/components/smart-solutions/WeatherUpdates";

type DigitalFarmToolboxProps = {
  marketPrices: MarketPrice[];
};

const tools = [
  {
    id: "weather",
    label: "Weather",
    icon: CloudSun,
    description: "Check today before spraying, harvesting, or drying."
  },
  {
    id: "crop-health",
    label: "Crop Health",
    icon: ScanSearch,
    description: "Upload a crop photo for advisory guidance."
  },
  {
    id: "assistant",
    label: "Farm Assistant",
    icon: Bot,
    description: "Ask practical farming and market questions."
  },
  {
    id: "market-prices",
    label: "Market Prices",
    icon: LineChart,
    description: "Compare quick crop price signals."
  },
  {
    id: "guides",
    label: "Farmer Guides",
    icon: BookOpen,
    description: "Practical guides for selling and farm decisions."
  }
] as const;

type ToolId = (typeof tools)[number]["id"];

export function DigitalFarmToolbox({ marketPrices }: DigitalFarmToolboxProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("weather");
  const active = tools.find((tool) => tool.id === activeTool) ?? tools[0];

  return (
    <section className="bg-earth-50 py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-leaf-900/10 bg-white p-3 shadow-sm">
            <p className="px-2 py-2 text-xs font-black uppercase tracking-[0.08em] text-earth-700/75">Digital Farm</p>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === activeTool;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={`focus-ring flex min-w-[168px] items-center gap-3 rounded-md px-3 py-3 text-left transition lg:min-w-0 ${
                      isActive
                        ? "bg-leaf-700 text-white shadow-sm"
                        : "text-ink/70 hover:bg-leaf-50 hover:text-leaf-800"
                    }`}
                    aria-pressed={isActive}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${isActive ? "bg-white/15" : "bg-leaf-50 text-leaf-700"}`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-black">{tool.label}</span>
                      <span className={`hidden text-xs leading-5 lg:block ${isActive ? "text-white/75" : "text-ink/50"}`}>
                        {tool.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-earth-700/75">Selected Tool</p>
            <h2 className="mt-1 text-2xl font-black text-ink sm:text-3xl">{active.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{active.description}</p>
          </div>

          {activeTool === "weather" ? <WeatherUpdates /> : null}
          {activeTool === "crop-health" ? <CropHealthCheck /> : null}
          {activeTool === "assistant" ? <FarmerAssistant /> : null}
          {activeTool === "market-prices" ? <MarketPricesDashboard prices={marketPrices} /> : null}
          {activeTool === "guides" ? (
            <section id="farmer-guides" className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-black text-ink">Farmer Guides</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                Short practical guides for crop production, storage, market access, and working with buyers are being organized for Ghanaian farmers.
              </p>
              <a href="/learn" className="gg-button-secondary mt-5 inline-flex">
                Open Farmer Guides
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
