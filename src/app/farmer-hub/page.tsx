import {
  CloudRain,
  CloudSun,
  GraduationCap,
  ShieldCheck,
  Sprout,
  Sun
} from "lucide-react";
import { FarmMateGreeting } from "@/components/FarmMateGreeting";
import { FarmMateHeroActions } from "@/components/FarmMateHeroActions";
import { FarmTools } from "@/components/FarmTools";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "GG FarmMate",
  description:
    "Your AI-powered farming companion by Ghana Growers, with daily demo farming recommendations, weather outlook, crop planning tools, and learning tips for Ghanaian farmers.",
  path: "/farmer-hub"
});

const weatherForecast = [
  { day: "Today", condition: "Warm, cloudy", temp: "29°C", rain: "35% chance of rain", icon: CloudSun },
  { day: "Tomorrow", condition: "Light rain", temp: "27°C", rain: "65% chance of rain", icon: CloudRain },
  { day: "Day After Tomorrow", condition: "Sunny breaks", temp: "30°C", rain: "20% chance of rain", icon: Sun }
];

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
                <p className="mt-2 text-sm font-bold text-ink/58">Sample farm summary</p>
              </div>
              <span className="gg-icon bg-earth-50 text-earth-700 ring-earth-500/20">
                <Sun size={24} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 rounded-md bg-leaf-600 p-5 text-white">
              <p className="text-xl font-black sm:text-2xl">Plant before noon.</p>
              <p className="mt-3 text-base font-bold text-white/82">Rain expected after 3 PM.</p>
              <div className="mt-4 rounded-md bg-white/12 p-3">
                <p className="gg-eyebrow text-earth-500">Today&apos;s Tip</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/86">Mulch young tomato plants to keep soil moist.</p>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-leaf-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun className="text-leaf-700" size={18} aria-hidden="true" />
                  <h3 className="gg-eyebrow text-leaf-700">3-day forecast</h3>
                </div>
                <p className="text-xs font-bold text-ink/55">Set your location for live weather guidance.</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {weatherForecast.map((day) => {
                  const WeatherIcon = day.icon;

                  return (
                  <div key={day.day} className="flex min-h-36 flex-col items-center justify-center rounded-md bg-white px-2 py-4 text-center shadow-sm ring-1 ring-leaf-900/5 sm:min-h-40 sm:px-3">
                    <div className="flex items-center justify-center gap-1.5 text-ink/70">
                      <WeatherIcon size={15} strokeWidth={2.2} className="shrink-0 text-leaf-700" aria-hidden="true" />
                      <p className="text-[0.72rem] font-bold leading-tight sm:text-xs">{day.day}</p>
                    </div>
                    <p className="mt-5 text-[2.125rem] font-bold leading-none text-leaf-900 sm:text-4xl">{day.temp}</p>
                    <p className="mt-5 text-[0.7rem] font-bold leading-4 text-ink/58 sm:text-xs">{day.rain}</p>
                  </div>
                  );
                })}
              </div>
            </div>
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
              <a href="/learn/backyard-vegetable-garden-ghana" className="mt-4 inline-flex text-sm font-black text-leaf-700">
                Read guide
              </a>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
