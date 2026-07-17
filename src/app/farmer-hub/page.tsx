import { GraduationCap, ShieldCheck, Sprout, Sun } from "lucide-react";
import Link from "next/link";
import { FarmMateGreeting } from "@/components/FarmMateGreeting";
import { FarmMateHeroActions } from "@/components/FarmMateHeroActions";
import { FarmMateWeatherFoundation } from "@/components/FarmMateWeatherFoundation";
import { FarmTools } from "@/components/FarmTools";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "GG FarmMate",
  description:
    "Your AI-powered farming companion by Ghana Growers, with daily farming recommendations, weather outlook, crop planning tools, and learning tips for Ghanaian farmers.",
  path: "/farmer-hub"
});

const featuredLearningTip = "Mulch young tomato plants to keep soil moist and reduce weeds during dry spells.";

export default function FarmerHubPage() {
  return (
    <main className="bg-gradient-to-b from-white via-earth-50 to-leaf-50/70 text-ink">
      <section>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.82fr_1.08fr] lg:items-start lg:px-8 lg:py-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-leaf-700 shadow-sm">
              <Sprout size={16} aria-hidden="true" />
              BY GHANA GROWERS
            </p>
            <FarmMateGreeting />
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              GG FarmMate
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
              Your daily farming companion for crop questions, farm planning, weather-aware decisions, and practical learning.
            </p>
            <FarmMateHeroActions />
          </div>

          <article className="rounded-md border border-leaf-900/10 bg-white/95 p-5 shadow-soft sm:p-6 lg:max-w-[690px] lg:justify-self-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="gg-section-title">Today&apos;s Farm Summary</h2>
                <p className="mt-2 text-sm font-bold text-ink/58">Daily farming guidance</p>
              </div>
              <span className="gg-icon bg-earth-50 text-earth-700 ring-earth-500/20">
                <Sun size={24} aria-hidden="true" />
              </span>
            </div>

            <FarmMateWeatherFoundation />
          </article>
        </div>
      </section>

      <FarmTools />

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 rounded-md border border-leaf-900/10 bg-white/80 p-4 text-sm font-semibold leading-6 text-ink/62 shadow-sm">
          <ShieldCheck className="mt-0.5 shrink-0 text-leaf-700" size={18} aria-hidden="true" />
          <p>FarmMate gives practical decision support. It does not replace an agricultural extension officer for serious outbreaks.</p>
        </div>
      </section>

      <section id="learn" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
              <GraduationCap size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="gg-card-title">Learn Something Today</h2>
              <p className="mt-3 text-base font-bold leading-7 text-ink/72">{featuredLearningTip}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-md border border-leaf-900/10 bg-white/80 p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-ink/62">Testing GG FarmMate?</p>
          <Link href="/farmer-hub/feedback" className="inline-flex font-black text-leaf-700 transition hover:text-leaf-900">
            Share feedback
          </Link>
        </div>
      </section>
    </main>
  );
}
