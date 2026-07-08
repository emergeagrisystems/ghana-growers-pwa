import {
  CalendarDays,
  CloudSun,
  GraduationCap,
  Sprout,
  Sun
} from "lucide-react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { CropDoctor } from "@/components/CropDoctor";
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
  { day: "Day After Tomorrow", condition: "Sunny breaks", temp: "30 C", rain: "20%" }
];

const cropCalendar = [
  { crop: "Maize", window: "Major season planting", timing: "Mar-Jun", action: "Check rainfall before sowing." },
  { crop: "Tomato", window: "Nursery and transplanting", timing: "Dry season", action: "Use mulch and steady irrigation." },
  { crop: "Yam", window: "Mound preparation", timing: "Nov-Mar", action: "Prepare seed yam and staking material." }
];

const featuredLearningTip = "Mulch young tomato plants to keep soil moist and reduce weeds during dry spells.";

export default function FarmerHubPage() {
  return (
    <main className="bg-[#FBFFE8] text-ink">
      <section>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start lg:px-8 lg:py-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#2E7D32] shadow-sm">
              <Sprout size={16} aria-hidden="true" />
              by Ghana Growers
            </p>
            <p className="mt-6 text-lg font-black text-[#2E7D32] sm:text-xl">Good morning &#128075;</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              GG FarmMate
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
              Your AI-powered farming companion
            </p>
          </div>

          <article className="rounded-lg border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black leading-tight text-ink sm:text-3xl">{"\uD83C\uDF24 Today's Farm Summary"}</h2>
              </div>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[#FFC107]/20 text-[#765700]">
                <Sun size={30} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 rounded-md bg-[#2E7D32] p-5 text-white">
              <p className="text-2xl font-black">Plant before noon.</p>
              <p className="mt-3 text-base font-bold text-white/82">Rain expected after 3 PM.</p>
              <div className="mt-4 rounded-md bg-white/12 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFC107]">Today&apos;s Tip</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/86">Mulch young tomato plants to keep soil moist.</p>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-[#FBFFE8] p-3">
              <div className="flex items-center gap-2">
                <CloudSun className="text-[#2E7D32]" size={18} aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">3-day forecast</h3>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {weatherForecast.map((day) => (
                  <div key={day.day} className="rounded-md bg-white p-2">
                    <p className="text-xs font-black text-ink">{day.day}</p>
                    <p className="mt-1 text-xs font-bold text-ink/62">{day.temp}</p>
                    <p className="mt-1 text-xs font-black text-[#2E7D32]">{day.rain}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-ink">{"\uD83C\uDF31 Farm Tools"}</h2>
            <p className="mt-2 text-sm font-semibold text-ink/58">Swipe to open the tool you need.</p>
          </div>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="min-w-[min(20rem,calc(100vw-2rem))] snap-start sm:min-w-[20rem] lg:min-w-[20rem]">
            <AskFarmMate />
          </div>

          <div className="min-w-[min(20rem,calc(100vw-2rem))] snap-start sm:min-w-[20rem] lg:min-w-[20rem]">
            <CropDoctor />
          </div>

          <article id="crop-calendar" className="min-w-[min(20rem,calc(100vw-2rem))] snap-start rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:min-w-[20rem] sm:p-7 lg:min-w-[20rem]">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-[#2E7D32]/10 text-[#2E7D32]">
              <CalendarDays size={30} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-2xl font-black text-ink">{"\uD83D\uDCC5 Crop Calendar"}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/66">Plan your season.</p>
            <div className="mt-5 grid gap-3">
              {cropCalendar.map((item) => (
                <div key={item.crop} className="rounded-md bg-[#FBFFE8] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ink">{item.crop}</p>
                    <p className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-[#2E7D32]">{item.timing}</p>
                  </div>
                  <p className="mt-2 text-sm font-bold text-ink/72">{item.window}</p>
                  <p className="mt-1 text-sm leading-5 text-ink/58">{item.action}</p>
                </div>
              ))}
            </div>
            <a
              href="#crop-calendar"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#2E7D32] px-5 py-3 text-sm font-black text-white transition hover:bg-[#246428] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
            >
              View Calendar
            </a>
          </article>

          <article id="planting-advisor" className="min-w-[min(20rem,calc(100vw-2rem))] snap-start rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:min-w-[20rem] sm:p-7 lg:min-w-[20rem]">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-[#2E7D32]/10 text-[#2E7D32]">
              <Sprout size={30} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-2xl font-black text-ink">{"\uD83C\uDF31 Planting Advisor"}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/66">Find the best time to plant.</p>
            <div className="mt-5 grid gap-3">
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
            <button
              type="button"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#2E7D32] px-5 py-3 text-sm font-black text-white transition hover:bg-[#246428] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
            >
              Start
            </button>
          </article>
        </div>
      </section>

      <section id="learn" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <article className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 text-[#2E7D32]" size={30} aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-black text-ink">{"\uD83D\uDCDA Learn Something Today"}</h2>
              <p className="mt-3 text-base font-bold leading-7 text-ink/72">{featuredLearningTip}</p>
              <a href="#learn" className="mt-4 inline-flex text-sm font-black text-[#2E7D32]">
                Read &rarr;
              </a>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
