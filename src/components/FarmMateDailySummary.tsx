"use client";

import { useEffect, useState } from "react";
import { getFarmMateDailySummary, type FarmMateDailySummary as FarmMateDailySummaryData } from "@/lib/farmmate/daily-summary";

export function FarmMateDailySummary({ weatherNote }: { weatherNote?: string }) {
  const [summary, setSummary] = useState<FarmMateDailySummaryData>(() => getFarmMateDailySummary());

  useEffect(() => {
    setSummary(getFarmMateDailySummary(new Date()));
  }, []);

  return (
    <div className="mt-5 rounded-md bg-leaf-600 p-5 text-white">
      <p className="text-xl font-black sm:text-2xl">{summary.mainRecommendation}</p>
      <p className="mt-3 text-base font-bold text-white/82">{weatherNote || summary.rainOutlookNote}</p>
      {summary.warning ? <p className="mt-3 text-sm font-bold text-earth-100">{summary.warning}</p> : null}
      <div className="mt-4 rounded-md bg-white/12 p-3">
        <p className="gg-eyebrow text-earth-500">Today&apos;s Tip</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/86">{summary.todaysTip}</p>
      </div>
    </div>
  );
}
