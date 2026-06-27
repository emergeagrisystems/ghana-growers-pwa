"use client";

import {
  AlertTriangle,
  Bot,
  CloudRain,
  LineChart,
  MapPin,
  ScanSearch,
  Store,
  ThermometerSun
} from "lucide-react";
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

type ToolId = (typeof tools)[number]["id"] | "weather";

type SnapshotWeather = {
  temperature: number;
  rainfallChance: number;
  humidity: number;
};

function sprayAdvice(weather?: SnapshotWeather) {
  if (!weather) {
    return "Check weather before spraying";
  }

  if (weather.rainfallChance >= 50) {
    return "Spraying not recommended";
  }

  if (weather.rainfallChance >= 30) {
    return "Spray with caution";
  }

  return "Good fieldwork window";
}

function marketSignals(prices: MarketPrice[]) {
  return {
    rising: prices.find((item) => item.trend === "Rising"),
    falling: prices.find((item) => item.trend === "Falling"),
    stable: prices.find((item) => item.trend === "Stable") ?? prices[0]
  };
}

function useAccraSnapshot() {
  const accra = weatherLocations.find((item) => item.name === "Accra") ?? weatherLocations[0];
  const [weather, setWeather] = useState<SnapshotWeather | undefined>();

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      latitude: String(accra.latitude),
      longitude: String(accra.longitude),
      current: "temperature_2m,relative_humidity_2m",
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
          rainfallChance: Number(data.hourly?.precipitation_probability?.[0] ?? 0),
          humidity: Math.round(Number(data.current?.relative_humidity_2m ?? 0))
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [accra.latitude, accra.longitude]);

  return weather;
}

function TodayFarmSnapshot({ weather, isActive, onOpenWeather }: { weather?: SnapshotWeather; isActive: boolean; onOpenWeather: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenWeather}
      aria-pressed={isActive}
      className={`focus-ring mb-3 block w-full rounded-md border p-3 text-left transition ${
        isActive ? "border-leaf-700 bg-[#ECE7D1] shadow-sm" : "border-leaf-900/10 bg-[#ECE7D1] hover:border-leaf-700"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-earth-700">Today&apos;s Farm Snapshot</p>
      <div className="mt-3 grid gap-2 text-sm font-bold text-ink/72">
        <span className="flex items-center gap-2">
          <MapPin size={15} aria-hidden="true" />
          Accra
        </span>
        <span className="flex items-center gap-2">
          <ThermometerSun size={15} aria-hidden="true" />
          {weather ? `${weather.temperature}C` : "--"}
        </span>
        <span className="flex items-center gap-2">
          <CloudRain size={15} aria-hidden="true" />
          {weather ? `${weather.rainfallChance}% Rain` : "-- Rain"}
        </span>
      </div>
      <div className="mt-3 rounded-md bg-white p-3">
        <p className="text-xs font-black uppercase tracking-wide text-ink/45">Today&apos;s Recommendation</p>
        <p className="mt-1 text-sm font-black leading-5 text-ink">{sprayAdvice(weather)}</p>
      </div>
      <span className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800">
        View 7-Day Forecast
      </span>
    </button>
  );
}

function DailyInsightCards({ weather, marketPrices }: { weather?: SnapshotWeather; marketPrices: MarketPrice[] }) {
  const markets = marketSignals(marketPrices);
  const allInsights = [
    {
      title: "Today's Weather Tip",
      body: weather && weather.rainfallChance >= 40 ? "Delay spraying until tomorrow morning if clouds build up." : "Check the field early and keep harvested produce shaded.",
      icon: CloudRain
    },
    {
      title: "Market Watch",
      body: markets.rising ? `${markets.rising.crop} prices are rising in ${markets.rising.region}.` : "No market alerts today.",
      icon: LineChart
    },
    {
      title: "Crop Alert",
      body: weather && weather.humidity >= 80 ? "High humidity may increase fungal disease risk." : "No crop alerts today.",
      icon: AlertTriangle
    },
    {
      title: "Selling Opportunity",
      body: markets.stable ? `${markets.stable.crop} remains active in current market snapshots.` : "No buyer opportunities yet.",
      icon: Store
    }
  ];
  const start = new Date().getDate() % allInsights.length;
  const insights = [...allInsights.slice(start), ...allInsights.slice(0, start)].slice(0, 4);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {insights.map((insight) => {
        const Icon = insight.icon;
        return (
          <article key={insight.title} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#ECE7D1] text-leaf-700">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h3 className="font-black text-ink">{insight.title}</h3>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/66">{insight.body}</p>
          </article>
        );
      })}
    </section>
  );
}

export function DigitalFarmToolbox({ marketPrices }: DigitalFarmToolboxProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("crop-health");
  const weather = useAccraSnapshot();

  return (
    <section className="bg-earth-50 py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(280px,0.25fr)_minmax(0,0.75fr)] lg:px-8">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-3 shadow-sm">
            <TodayFarmSnapshot weather={weather} isActive={activeTool === "weather"} onOpenWeather={() => setActiveTool("weather")} />
            <div className="my-3 h-px bg-leaf-900/10" />
            <div className="grid gap-2 lg:grid-cols-1">
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

        <div className="grid min-w-0 gap-5">
          <DailyInsightCards weather={weather} marketPrices={marketPrices} />
          {activeTool === "weather" ? <WeatherUpdates /> : null}
          {activeTool === "crop-health" ? <CropHealthCheck /> : null}
          {activeTool === "assistant" ? <FarmerAssistant /> : null}
          {activeTool === "market-prices" ? <MarketPricesDashboard prices={marketPrices} /> : null}
        </div>
      </div>
    </section>
  );
}
