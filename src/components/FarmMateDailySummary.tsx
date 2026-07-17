"use client";

import { useEffect, useState } from "react";
import { getFarmMateDailySummary, type FarmMateDailySummary as FarmMateDailySummaryData } from "@/lib/farmmate/daily-summary";

export function FarmMateDailySummary({ weatherNote }: { weatherNote?: string }) {
  const [summary, setSummary] = useState<FarmMateDailySummaryData>(() => getFarmMateDailySummary());

  useEffect(() => {
    setSummary(getFarmMateDailySummary(new Date()));
  }, []);

  return (
    <article className="rounded-md border border-leaf-900/10 bg-white/90 p-4 shadow-sm" aria-label="Today at a glance">
      <h2 className="text-base font-black text-ink">Today at a glance</h2>
      <div className="mt-3 grid gap-2.5">
        <div className="rounded-md bg-leaf-50 px-3 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-leaf-700">Field note</p>
          <p className="mt-1 text-sm font-bold leading-5 text-ink/70">{summary.mainRecommendation}</p>
        </div>
        <div className="rounded-md bg-earth-50 px-3 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-earth-700">Weather note</p>
          <p className="mt-1 text-sm font-bold leading-5 text-ink/70">{weatherNote || summary.rainOutlookNote}</p>
        </div>
        <div className="rounded-md bg-white px-3 py-2.5 ring-1 ring-leaf-900/10">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-leaf-700">Practical tip</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-ink/68">{summary.todaysTip}</p>
        </div>
      </div>
    </article>
  );
}
