import { Activity, BarChart3, CalendarDays, MapPinned, SignalHigh, TrendingDown, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { createPageMetadata } from "@/lib/seo";
import {
  demandSignals,
  marketIntelligenceMeta,
  priceTrends,
  regionalOpportunities,
  seasonalCalendar,
  type DemandLevel,
  type PriceTrendRecord
} from "@/data/marketIntelligence";

export const metadata = createPageMetadata({
  title: "Market Intelligence",
  description:
    "Use Ghana Growers market intelligence to compare price trends, demand signals, seasonal calendars, and regional opportunities.",
  path: "/market-intelligence"
});

function formatMoney(value: number) {
  return `${marketIntelligenceMeta.currency} ${value.toLocaleString("en-US")}`;
}

function trendDirection(record: PriceTrendRecord) {
  const first = record.history[0]?.price ?? record.currentPrice;
  const last = record.history[record.history.length - 1]?.price ?? record.currentPrice;

  if (last > first) {
    return "Rising";
  }

  if (last < first) {
    return "Falling";
  }

  return "Stable";
}

function demandStyle(level: DemandLevel) {
  if (level === "High Demand") {
    return "bg-tomato text-white";
  }

  if (level === "Moderate Demand") {
    return "bg-earth-500 text-ink";
  }

  return "bg-leaf-50 text-leaf-700";
}

function MiniBarChart({ record }: { record: PriceTrendRecord }) {
  const maxPrice = Math.max(...record.history.map((point) => point.price));
  const minPrice = Math.min(...record.history.map((point) => point.price));
  const range = Math.max(maxPrice - minPrice, 1);

  return (
    <div className="mt-5 flex h-28 items-end gap-2 rounded-md bg-leaf-50 p-3">
      {record.history.map((point) => {
        const height = 32 + ((point.price - minPrice) / range) * 64;

        return (
          <div key={point.period} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-leaf-600"
              style={{ height: `${height}px` }}
              title={`${point.period}: ${formatMoney(point.price)}`}
            />
            <span className="text-[10px] font-black uppercase text-ink/55">{point.period}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MarketIntelligencePage() {
  return (
    <>
      <PageHero
        eyebrow="Market Intelligence"
        title="Market data for better farm and buying decisions"
        description="Compare price trends, demand signals, seasonal timing, and regional opportunities before planning harvests, sourcing, logistics, or buyer conversations."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/marketplace">Browse Marketplace</ButtonLink>
          <ButtonLink href="/buyer-requests" variant="secondary">View Produce Demand</ButtonLink>
          <ButtonLink href="/farmer-hub" variant="light">Open GG FarmMate</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Price Trends"
            title="Historical and current crop prices"
            description={`Indicative prices in ${marketIntelligenceMeta.currency}. Last updated: ${marketIntelligenceMeta.lastUpdated}. Verify prices before trading.`}
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {priceTrends.map((record) => {
              const direction = trendDirection(record);
              const DirectionIcon = direction === "Falling" ? TrendingDown : TrendingUp;

              return (
                <article key={record.product} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-earth-700">{record.region}</p>
                      <h2 className="mt-1 text-2xl font-black text-ink">{record.product}</h2>
                      <p className="mt-2 text-sm font-bold text-leaf-700">
                        {formatMoney(record.currentPrice)} / {record.unit}
                      </p>
                    </div>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                      <BarChart3 size={22} aria-hidden="true" />
                    </div>
                  </div>
                  <MiniBarChart record={record} />
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-ink/65">6-period movement</span>
                    <span className="inline-flex items-center gap-2 rounded-md bg-earth-50 px-3 py-2 font-black text-ink">
                      <DirectionIcon size={16} className={direction === "Falling" ? "text-leaf-600" : "text-tomato"} aria-hidden="true" />
                      {direction}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Demand Signals"
            title="Where buyers are showing interest"
            description="Use these signals to guide harvest planning, aggregation, pricing conversations, and transport decisions."
          />
          <div className="mt-8 overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-soft">
            <div className="hidden grid-cols-[1fr_1fr_1fr_1fr] bg-ink px-4 py-3 text-xs font-black uppercase text-white md:grid">
              <span>Product</span>
              <span>Region</span>
              <span>Demand Level</span>
              <span>Last Updated</span>
            </div>
            <div className="divide-y divide-leaf-900/10">
              {demandSignals.map((signal) => (
                <div key={`${signal.product}-${signal.region}`} className="grid gap-3 p-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr] md:items-center">
                  <p><span className="font-black md:hidden">Product: </span>{signal.product}</p>
                  <p><span className="font-black md:hidden">Region: </span>{signal.region}</p>
                  <p>
                    <span className="font-black md:hidden">Demand Level: </span>
                    <span className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black ${demandStyle(signal.demandLevel)}`}>
                      <SignalHigh size={15} aria-hidden="true" />
                      {signal.demandLevel}
                    </span>
                  </p>
                  <p><span className="font-black md:hidden">Last Updated: </span>{signal.lastUpdated}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Seasonal Calendar"
            title="Plan around planting, growing, and harvest windows"
            description="Seasonal timing varies by district, rainfall, irrigation, and variety. Use this as a practical planning guide."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {seasonalCalendar.map((item) => (
              <article key={item.product} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                    <CalendarDays size={22} aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-black text-ink">{item.product}</h2>
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Planting season", item.plantingSeason],
                    ["Growing season", item.growingSeason],
                    ["Harvest season", item.harvestSeason]
                  ].map(([label, value], index) => (
                    <div key={label} className="flex gap-3 rounded-md bg-leaf-50 p-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-earth-500 text-xs font-black text-ink">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase text-earth-700">{label}</p>
                        <p className="mt-1 text-sm font-bold text-ink/75">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Regional Opportunities"
            title="Product opportunities by region"
            description="Use these notes to spot where aggregation, logistics, storage, or buyer outreach could create better trade outcomes."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {regionalOpportunities.map((opportunity) => (
              <article key={opportunity.region} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-earth-700">Opportunity Region</p>
                    <h2 className="mt-1 text-2xl font-black text-ink">{opportunity.region}</h2>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                    <MapPinned size={22} aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {opportunity.mostRequestedProducts.map((product) => (
                    <span key={product} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                      {product}
                    </span>
                  ))}
                </div>
                <p className="mt-4 flex gap-2 text-sm leading-6 text-ink/70">
                  <Activity className="mt-1 shrink-0 text-leaf-600" size={17} aria-hidden="true" />
                  {opportunity.marketNotes}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
