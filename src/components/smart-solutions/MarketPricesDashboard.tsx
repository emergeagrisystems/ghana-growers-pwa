"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { marketPrices } from "@/data/marketPrices";

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Rising") {
    return <TrendingUp className="text-tomato" size={18} aria-hidden="true" />;
  }

  if (trend === "Falling") {
    return <TrendingDown className="text-leaf-600" size={18} aria-hidden="true" />;
  }

  return <Minus className="text-earth-700" size={18} aria-hidden="true" />;
}

export function MarketPricesDashboard() {
  const [crop, setCrop] = useState("All");
  const [region, setRegion] = useState("All");
  const [market, setMarket] = useState("All");

  const crops = useMemo(() => unique(marketPrices.map((item) => item.crop)), []);
  const regions = useMemo(() => unique(marketPrices.map((item) => item.region)), []);
  const markets = useMemo(() => unique(marketPrices.map((item) => item.market)), []);

  const filtered = marketPrices.filter((item) => {
    return (
      (crop === "All" || item.crop === crop) &&
      (region === "All" || item.region === region) &&
      (market === "All" || item.market === market)
    );
  });

  const filters = [
    { label: "Crop", value: crop, setValue: setCrop, options: crops },
    { label: "Region", value: region, setValue: setRegion, options: regions },
    { label: "Market", value: market, setValue: setMarket, options: markets }
  ];

  return (
    <section id="market-prices" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <p className="text-sm font-black uppercase text-earth-700">Ghana Market Prices</p>
      <h2 className="mt-2 text-2xl font-black text-ink">View Market Prices</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Compare indicative wholesale and retail prices before calling buyers, suppliers, or transporters. Prices should be verified before trading.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {filters.map((filter) => (
          <label key={filter.label} className="grid gap-2 text-sm font-bold text-ink/75">
            {filter.label}
            <select
              className="focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal"
              value={filter.value}
              onChange={(event) => filter.setValue(event.target.value)}
            >
              <option value="All">All {filter.label.toLowerCase()}s</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-leaf-900/10">
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_0.7fr] bg-ink px-4 py-3 text-xs font-black uppercase text-white md:grid">
          <span>Crop</span>
          <span>Market</span>
          <span>Region</span>
          <span>Wholesale</span>
          <span>Retail</span>
          <span>Updated</span>
          <span>Trend</span>
        </div>
        <div className="divide-y divide-leaf-900/10">
          {filtered.map((item) => (
            <div key={`${item.crop}-${item.market}`} className="grid gap-3 bg-white p-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_0.7fr] md:items-center">
              <p><span className="font-black md:hidden">Crop: </span>{item.crop}</p>
              <p><span className="font-black md:hidden">Market: </span>{item.market}</p>
              <p><span className="font-black md:hidden">Region: </span>{item.region}</p>
              <p><span className="font-black md:hidden">Wholesale: </span>{item.wholesalePrice}</p>
              <p><span className="font-black md:hidden">Retail: </span>{item.retailPrice}</p>
              <p><span className="font-black md:hidden">Updated: </span>{item.dateUpdated}</p>
              <p className="inline-flex items-center gap-2 font-bold">
                <TrendIcon trend={item.trend} />
                {item.trend}
              </p>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="bg-leaf-50 p-5 text-sm font-bold text-ink/70">No price records match these filters.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
