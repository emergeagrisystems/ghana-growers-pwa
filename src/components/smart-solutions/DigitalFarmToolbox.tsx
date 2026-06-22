"use client";

import { Bot, CloudSun, LineChart, ScanSearch } from "lucide-react";
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
    id: "crop-health",
    label: "Crop Health",
    icon: ScanSearch,
    description: "Upload a crop photo for advisory guidance."
  },
  {
    id: "weather",
    label: "Live Weather Updates",
    icon: CloudSun,
    description: "Check today before spraying, harvesting, or drying."
  },
  {
    id: "assistant",
    label: "Farm Assistant",
    icon: Bot,
    description: "Ask practical farming and market questions."
  },
  {
    id: "market-prices",
    label: "Current Market Prices",
    icon: LineChart,
    description: "Compare quick crop price signals."
  }
] as const;

type ToolId = (typeof tools)[number]["id"];

export function DigitalFarmToolbox({ marketPrices }: DigitalFarmToolboxProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("crop-health");

  return (
    <section className="bg-earth-50 py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-3 shadow-sm">
            <p className="px-2 py-2 text-xs font-black uppercase tracking-[0.08em] text-earth-700/75">Digital Farm</p>
            <div className="grid gap-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === activeTool;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={`focus-ring flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                      isActive
                        ? "bg-leaf-700 text-white shadow-sm"
                        : "text-ink/70 hover:bg-leaf-50 hover:text-leaf-800"
                    }`}
                    aria-pressed={isActive}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${isActive ? "bg-white/15" : "bg-leaf-50 text-leaf-700"}`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{tool.label}</span>
                      <span className={`block text-xs leading-5 ${isActive ? "text-white/75" : "text-ink/50"}`}>
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
          {activeTool === "weather" ? <WeatherUpdates /> : null}
          {activeTool === "crop-health" ? <CropHealthCheck /> : null}
          {activeTool === "assistant" ? <FarmerAssistant /> : null}
          {activeTool === "market-prices" ? <MarketPricesDashboard prices={marketPrices} /> : null}
        </div>
      </div>
    </section>
  );
}
