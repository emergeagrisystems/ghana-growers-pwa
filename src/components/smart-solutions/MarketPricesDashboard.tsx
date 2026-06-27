"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { marketPriceMeta, marketPrices as fallbackMarketPrices, type MarketPrice } from "@/data/marketPrices";

type MarketPricesDashboardProps = {
  prices?: MarketPrice[];
};

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

export function MarketPricesDashboard({ prices = fallbackMarketPrices }: MarketPricesDashboardProps) {
  const [crop, setCrop] = useState("All");
  const [region, setRegion] = useState("All");
  const [market, setMarket] = useState("All");
  const [showFullTable, setShowFullTable] = useState(false);

  const crops = useMemo(() => unique(prices.map((item) => item.crop)), [prices]);
  const regions = useMemo(() => unique(prices.map((item) => item.region)), [prices]);
  const markets = useMemo(() => unique(prices.map((item) => item.market)), [prices]);

  const filtered = prices.filter((item) => {
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
  const topCropOrder = ["Maize", "Tomatoes", "Onions", "Cassava", "Yam", "Plantain", "Rice", "Eggs"];
  const snapshot = topCropOrder
    .map((name) => prices.find((item) => item.crop.toLowerCase() === name.toLowerCase()))
    .filter((item): item is MarketPrice => Boolean(item))
    .slice(0, 6);
  const topGainers = prices.filter((item) => item.trend === "Rising").slice(0, 3);
  const topLosers = prices.filter((item) => item.trend === "Falling").slice(0, 3);

  return (
    <section id="market-prices" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black text-ink">Current Market Prices</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Today&apos;s market snapshot for top traded crops. {marketPriceMeta.note}
      </p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-earth-700/80">
        Last updated: {marketPriceMeta.lastUpdated}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-md bg-leaf-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-ink/45">Top gainers</p>
          <div className="mt-3 grid gap-2">
            {(topGainers.length ? topGainers : []).map((item) => (
              <p key={`${item.crop}-gainer`} className="flex items-center justify-between gap-3 text-sm font-black text-ink">
                <span>{item.crop}</span>
                <TrendingUp className="text-tomato" size={16} aria-hidden="true" />
              </p>
            ))}
            {topGainers.length === 0 ? <p className="text-sm font-semibold text-ink/60">No market alerts today.</p> : null}
          </div>
        </article>
        <article className="rounded-md bg-leaf-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-ink/45">Top losers</p>
          <div className="mt-3 grid gap-2">
            {(topLosers.length ? topLosers : []).map((item) => (
              <p key={`${item.crop}-loser`} className="flex items-center justify-between gap-3 text-sm font-black text-ink">
                <span>{item.crop}</span>
                <TrendingDown className="text-leaf-600" size={16} aria-hidden="true" />
              </p>
            ))}
            {topLosers.length === 0 ? <p className="text-sm font-semibold text-ink/60">No market drops today.</p> : null}
          </div>
        </article>
        <article className="rounded-md bg-earth-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-ink/45">Most requested crop</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/70">No buyer demand signal yet.</p>
        </article>
      </div>

      <h3 className="mt-5 text-lg font-black text-ink">Today&apos;s Market Snapshot</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(snapshot.length ? snapshot : prices.slice(0, 6)).map((item) => (
          <article key={`${item.crop}-${item.market}-snapshot`} className="rounded-md bg-leaf-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-ink">{item.crop}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/45">{item.market} · {item.region}</p>
              </div>
              <TrendIcon trend={item.trend} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-ink/45">Wholesale</p>
                <p className="mt-1 font-black text-ink">{item.wholesalePrice}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-ink/45">Retail</p>
                <p className="mt-1 font-black text-ink">{item.retailPrice}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowFullTable((value) => !value)}
        className="gg-button-secondary mt-5"
      >
        {showFullTable ? "Hide Full Market Prices" : "View Full Market Prices"}
      </button>

      {showFullTable ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {filters.map((filter) => (
              <label key={filter.label} className="grid gap-2 text-sm font-bold text-ink/75">
                {filter.label}
                <select
                  className="gg-field"
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
        </>
      ) : null}
    </section>
  );
}
