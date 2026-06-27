"use client";

import { Bot, CloudRain, CloudSun, LineChart, MapPin, ScanSearch, ThermometerSun } from "lucide-react";
import { useEffect, useState } from "react";
import type { MarketPrice } from "@/data/marketPrices";
import { CropHealthCheck } from "@/components/smart-solutions/CropHealthCheck";
import { FarmerAssistant } from "@/components/smart-solutions/FarmerAssistant";
import { MarketPricesDashboard } from "@/components/smart-solutions/MarketPricesDashboard";
import { WeatherUpdates } from "@/components/smart-solutions/WeatherUpdates";
import { weatherLocations } from "@/data/weatherLocations";

type DigitalFarmToolboxProps = {
  marketPrices: MarketPrice[];
};

const tools = [
  {
    id: "crop-health",
    label: "Crop Health",
    icon: ScanSearch,
    description: "Take or upload a crop photo."
  },
  {
    id: "weather",
    label: "Live Weather Updates",
    icon: CloudSun,
    description: "Plan spraying, harvesting, or drying."
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
    description: "Check crop price signals."
  }
] as const;

type ToolId = (typeof tools)[number]["id"];

type SnapshotWeather = {
  temperature: number;
  rainfallChance: number;
};

function sprayAdvice(weather?: SnapshotWeather) {
  if (!weather) {
    return "Check weather before spraying";
  }

  if (weather.rainfallChance >= 50) {
    return "Spraying Not Recommended";
  }

  if (weather.rainfallChance >= 30) {
    return "Spray With Caution";
  }

  return "Good Fieldwork Window";
}

function TodayFarmSnapshot() {
  const accra = weatherLocations.find((item) => item.name === "Accra") ?? weatherLocations[0];
  const [weather, setWeather] = useState<SnapshotWeather | undefined>();

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      latitude: String(accra.latitude),
      longitude: String(accra.longitude),
      current: "temperature_2m",
      hourly: "precipitation_probability",
      timezone: "Africa/Accra",
      forecast_days: "1"
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) {
          return;
        }

        setWeather({
          temperature: Math.round(Number(data.current?.temperature_2m ?? 0)),
          rainfallChance: Number(data.hourly?.precipitation_probability?.[0] ?? 0)
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [accra.latitude, accra.longitude]);

  return (
    <section className="mb-3 rounded-md border border-leaf-900/10 bg-[#ECE7D1] p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-earth-700">Today</p>
      <div className="mt-3 grid gap-2 text-sm font-bold text-ink/72">
        <span className="flex items-center gap-2">
          <MapPin size={15} aria-hidden="true" />
          Accra
        </span>
        <span className="flex items-center gap-2">
          <ThermometerSun size={15} aria-hidden="true" />
          {weather ? `${weather.temperature}°C` : "--"}
        </span>
        <span className="flex items-center gap-2">
          <CloudRain size={15} aria-hidden="true" />
          {weather ? `${weather.rainfallChance}% Rain` : "-- Rain"}
        </span>
      </div>
      <div className="mt-3 rounded-md bg-white p-3">
        <p className="text-xs font-black uppercase tracking-wide text-ink/45">Today&apos;s Advice</p>
        <p className="mt-1 text-sm font-black leading-5 text-ink">{sprayAdvice(weather)}</p>
      </div>
    </section>
  );
}

export function DigitalFarmToolbox({ marketPrices }: DigitalFarmToolboxProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("crop-health");

  return (
    <section className="bg-earth-50 py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(280px,0.25fr)_minmax(0,0.75fr)] lg:px-8">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-3 shadow-sm">
            <p className="px-2 py-2 text-xs font-black uppercase tracking-[0.08em] text-earth-700/75">Farmer Hub</p>
            <TodayFarmSnapshot />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
