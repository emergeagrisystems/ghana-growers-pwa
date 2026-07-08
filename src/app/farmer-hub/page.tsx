import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  CloudSun,
  Droplets,
  GraduationCap,
  Sprout,
  Sun
} from "lucide-react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "GG FarmMate",
  description:
    "Your AI-powered farming companion by Ghana Growers, with daily demo farming recommendations, weather outlook, crop planning tools, and learning tips for Ghanaian farmers.",
  path: "/farmer-hub"
});

const weatherForecast = [
  { day: "Today", condition: "Warm, cloudy", temp: "29 C", rain: "35%" },
  { day: "Tomorrow", condition: "Light rain", temp: "27 C", rain: "65%" },
  { day: "Day after tomorrow", condition: "Sunny breaks", temp: "30 C", rain: "20%" }
];

const cropCalendar = [
  { crop: "Maize", window: "Major season planting", timing: "Mar-Jun", action: "Check rainfall before sowing." },
  { crop: "Tomato", window: "Nursery and transplanting", timing: "Dry season", action: "Use mulch and steady irrigation." },
  { crop: "Yam", window: "Mound preparation", timing: "Nov-Mar", action: "Prepare seed yam and staking material." }
];

const learningTips = [
  "Keep harvest records by crop, date, volume, buyer, and price.",
  "Sort produce before transport to reduce losses and improve buyer trust.",
  "Use WhatsApp photos with clear quantity and location details when selling."
];

export default function FarmerHubPage() {
  return (
    <main className="bg-[#FBFFE8] text-ink">
      <section className="border-b border-[#2E7D32]/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#2E7D32] shadow-sm">
              <Sprout size={16} aria-hidden="true" />
              by Ghana Growers
            </p>
            <p className="mt-8 text-lg font-black text-[#2E7D32] sm:text-xl">Good morning &#128075;</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              GG FarmMate
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
              Your AI-powered farming companion
            </p>
          </div>

          <article className="rounded-lg border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2E7D32]">Today&apos;s Farm Summary</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">What should I do on my farm today?</h2>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ink/62">
                  Start important field work before noon, watch for afternoon rain, and check tomato leaves for early signs of disease.
                </p>
              </div>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[#FFC107]/20 text-[#765700]">
                <Sun size={30} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-md bg-[#2E7D32] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Current farming recommendation</p>
                <h3 className="mt-3 text-2xl font-black">Farm early, pause spraying later</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/78">
                  Use the morning for spraying, harvesting, and field checks. Keep produce covered if clouds build after midday.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Rain outlook", value: "35%", detail: "Possible afternoon showers", icon: Droplets },
                  { label: "Disease risk", value: "Medium", detail: "Check lower tomato leaves", icon: AlertTriangle },
                  { label: "Most important action", value: "Inspect first", detail: "Walk the field before spraying", icon: CheckCircle2 },
                  { label: "Short learning tip", value: "Keep notes", detail: "Record weather, crop issue, and action", icon: GraduationCap }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-md bg-[#FBFFE8] p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="text-[#2E7D32]" size={18} aria-hidden="true" />
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-ink/45">{item.label}</p>
                      </div>
                      <p className="mt-3 text-xl font-black text-ink">{item.value}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-ink/58">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2E7D32]">Rain Outlook</p>
                  <h3 className="mt-2 text-xl font-black text-ink">Three-day forecast</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {weatherForecast.map((day) => (
                  <div key={day.day} className="rounded-md border border-[#2E7D32]/10 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <CloudSun className="text-[#2E7D32]" size={18} aria-hidden="true" />
                      <p className="text-sm font-black text-ink">{day.day}</p>
                    </div>
                    <p className="mt-3 text-sm font-bold text-ink/70">{day.condition}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#2E7D32]">{day.temp}</p>
                      <p className="text-xs font-black text-ink/50">Rain {day.rain}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <AskFarmMate />

        <article id="crop-doctor" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <Camera className="text-[#2E7D32]" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Crop Doctor preview</h2>
          <p className="mt-3 text-sm leading-6 text-ink/66">
            Upload a crop photo later to receive possible issue categories and next-step advice.
          </p>
          <div className="mt-4 grid min-h-32 place-items-center rounded-md border-2 border-dashed border-[#2E7D32]/20 bg-[#FBFFE8] p-5 text-center">
            <div>
              <Camera className="mx-auto text-[#2E7D32]" size={30} aria-hidden="true" />
              <p className="mt-2 text-sm font-black text-ink">Demo upload area</p>
              <p className="mt-1 text-xs font-semibold text-ink/55">No real diagnosis yet</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article id="crop-calendar" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <CalendarDays className="text-[#2E7D32]" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Crop Calendar</h2>
          <div className="mt-4 grid gap-3">
            {cropCalendar.map((item) => (
              <div key={item.crop} className="rounded-md bg-[#FBFFE8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{item.crop}</p>
                  <p className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-[#2E7D32]">{item.timing}</p>
                </div>
                <p className="mt-2 text-sm font-bold text-ink/72">{item.window}</p>
                <p className="mt-1 text-sm leading-5 text-ink/58">{item.action}</p>
              </div>
            ))}
          </div>
        </article>

        <article id="planting-advisor" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <Sprout className="text-[#2E7D32]" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Planting Advisor</h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-black text-ink">
              Crop
              <select className="gg-field min-h-12">
                <option>Maize</option>
                <option>Tomato</option>
                <option>Yam</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black text-ink">
              Region
              <select className="gg-field min-h-12">
                <option>Ashanti</option>
                <option>Greater Accra</option>
                <option>Northern</option>
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-md bg-[#2E7D32]/10 p-4">
            <p className="text-sm font-black text-[#2E7D32]">Demo advice</p>
            <p className="mt-1 text-sm leading-6 text-ink/68">Plant after two steady rains and avoid waterlogged soil.</p>
          </div>
        </article>
      </section>

      <section id="learn" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <article className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-[#2E7D32]" size={30} aria-hidden="true" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">Learning Tips</p>
              <h2 className="text-2xl font-black">Practical tips for this week</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {learningTips.map((tip) => (
              <div key={tip} className="rounded-md bg-[#FBFFE8] p-4">
                <CheckCircle2 className="text-[#2E7D32]" size={21} aria-hidden="true" />
                <p className="mt-3 text-sm font-bold leading-6 text-ink/72">{tip}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
