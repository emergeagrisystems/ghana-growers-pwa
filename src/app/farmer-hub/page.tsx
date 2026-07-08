import {
  AlertTriangle,
  Bot,
  CalendarDays,
  Camera,
  CheckCircle2,
  CloudSun,
  Droplets,
  GraduationCap,
  Leaf,
  LineChart,
  Sprout,
  Sun,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "GG FarmMate",
  description:
    "Your AI-powered farming companion by Ghana Growers, with demo weather, market prices, crop alerts, crop planning tools, and learning tips for Ghanaian farmers.",
  path: "/farmer-hub"
});

const weatherForecast = [
  { day: "Today", condition: "Warm, cloudy", temp: "29 C", rain: "35%" },
  { day: "Thu", condition: "Light rain", temp: "27 C", rain: "65%" },
  { day: "Fri", condition: "Sunny breaks", temp: "30 C", rain: "20%" },
  { day: "Sat", condition: "Humid", temp: "31 C", rain: "40%" },
  { day: "Sun", condition: "Thunder likely", temp: "28 C", rain: "70%" },
  { day: "Mon", condition: "Cloudy", temp: "29 C", rain: "45%" },
  { day: "Tue", condition: "Dry morning", temp: "30 C", rain: "25%" }
];

const marketPrices = [
  { crop: "Tomatoes", market: "Agbogbloshie", price: "GHS 520 / crate", trend: "Up" },
  { crop: "Yam", market: "Techiman", price: "GHS 38 / tuber", trend: "Stable" },
  { crop: "Maize", market: "Tamale", price: "GHS 410 / bag", trend: "Up" },
  { crop: "Onion", market: "Kumasi Central", price: "GHS 680 / sack", trend: "Down" }
];

const cropAlerts = [
  "Watch tomato fields for early blight after humid mornings.",
  "Delay fertilizer application where heavy rain is expected within 24 hours.",
  "Inspect maize for fall armyworm, especially young plants under three weeks."
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

const quickActions = [
  { label: "Ask FarmMate", href: "#assistant", icon: Bot },
  { label: "Crop Doctor", href: "#crop-doctor", icon: Camera },
  { label: "Weather", href: "#weather", icon: CloudSun },
  { label: "Market Prices", href: "#market-prices", icon: LineChart },
  { label: "Crop Calendar", href: "#crop-calendar", icon: CalendarDays },
  { label: "Learn", href: "#learn", icon: GraduationCap }
];

export default function FarmerHubPage() {
  return (
    <main className="bg-[#FBFFE8] text-ink">
      <section className="border-b border-[#2E7D32]/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-8 lg:py-16">
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

          <div>
            <article className="rounded-lg border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2E7D32]">Today&apos;s Farm Summary</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-ink sm:text-3xl">Good field window before noon</h2>
                  <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-ink/60">
                    Placeholder guidance for Kumasi, Ashanti. Check your local field before spraying or harvesting.
                  </p>
                </div>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[#FFC107]/20 text-[#765700]">
                  <Sun size={30} aria-hidden="true" />
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: "Current weather", value: "29 C", detail: "Warm and cloudy", icon: CloudSun },
                  { label: "Rain forecast", value: "35%", detail: "Possible afternoon showers", icon: Droplets },
                  { label: "Recommendation", value: "Start early", detail: "Avoid late spraying", icon: CheckCircle2 },
                  { label: "Disease risk", value: "Medium", detail: "Watch tomato leaves", icon: AlertTriangle },
                  { label: "Market highlight", value: "Tomatoes up", detail: "Agbogbloshie demand rising", icon: TrendingUp }
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
            </article>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-[#2E7D32] shadow-sm ring-1 ring-[#2E7D32]/15 transition hover:bg-[#2E7D32] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
                  >
                    <Icon size={19} aria-hidden="true" />
                    {action.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">Field Work Plan</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Good conditions before noon</h2>
              </div>
              <Sun className="text-[#FFC107]" size={34} aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Spraying", "Morning only", "Wind is calmer before 10am."],
                ["Irrigation", "Light watering", "Soil moisture is fair."],
                ["Harvest", "Suitable", "Move produce before late rain."]
              ].map(([title, value, detail]) => (
                <div key={title} className="rounded-md bg-[#FBFFE8] p-4">
                  <p className="text-sm font-black text-ink">{title}</p>
                  <p className="mt-1 text-lg font-black text-[#2E7D32]">{value}</p>
                  <p className="mt-1 text-sm leading-5 text-ink/62">{detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-md border border-[#2E7D32]/10 bg-[#2E7D32] p-5 text-white shadow-card sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-white/70">Can I Farm Today?</p>
            <h2 className="mt-2 text-2xl font-black">Yes, with timing</h2>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Start field work early, pause spraying if wind increases, and keep harvested produce covered from afternoon showers.
            </p>
            <div className="mt-5 grid gap-2">
              {["Best work window: 6:00am-10:30am", "Avoid open-air drying after 2:00pm", "Check drainage in low-lying beds"].map((item) => (
                <p key={item} className="flex gap-2 text-sm font-bold text-white">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#FFC107]" size={17} aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <article id="weather" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-[#2E7D32]/10 text-[#2E7D32]">
              <CloudSun size={25} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">Weather</p>
              <h2 className="text-2xl font-black">7-day forecast</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {weatherForecast.map((day) => (
              <div key={day.day} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-md bg-[#FBFFE8] p-3">
                <p className="font-black text-ink">{day.day}</p>
                <div>
                  <p className="text-sm font-bold text-ink">{day.condition}</p>
                  <p className="text-xs font-semibold text-ink/55">Rain chance {day.rain}</p>
                </div>
                <p className="text-sm font-black text-[#2E7D32]">{day.temp}</p>
              </div>
            ))}
          </div>
        </article>

        <article id="market-prices" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-[#FFC107]/20 text-[#765700]">
              <LineChart size={25} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">Market Prices</p>
              <h2 className="text-2xl font-black">Demo price board</h2>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-md border border-[#2E7D32]/10">
            {marketPrices.map((item) => (
              <div key={`${item.crop}-${item.market}`} className="grid gap-2 border-b border-[#2E7D32]/10 p-4 last:border-b-0 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-black text-ink">{item.crop}</p>
                  <p className="text-sm text-ink/58">{item.market}</p>
                </div>
                <p className="text-sm font-black text-[#2E7D32]">{item.price}</p>
                <span className="inline-flex w-fit items-center gap-1 rounded-md bg-[#FBFFE8] px-2.5 py-1 text-xs font-black text-ink/70">
                  <TrendingUp size={14} aria-hidden="true" />
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <article className="rounded-md border border-[#E53935]/15 bg-white p-5 shadow-card sm:p-6">
          <AlertTriangle className="text-[#E53935]" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Crop alerts</h2>
          <div className="mt-4 grid gap-3">
            {cropAlerts.map((alert) => (
              <p key={alert} className="rounded-md bg-[#E53935]/8 p-3 text-sm font-bold leading-6 text-ink/76">
                {alert}
              </p>
            ))}
          </div>
        </article>

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

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-3 lg:px-8">
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

        <article className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <WalletCards className="text-[#2E7D32]" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Profit Estimator</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["Expected sales", "GHS 4,800"],
              ["Estimated costs", "GHS 2,950"],
              ["Demo profit", "GHS 1,850"]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-[#FBFFE8] p-3">
                <p className="text-sm font-bold text-ink/68">{label}</p>
                <p className="font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold leading-5 text-ink/50">Figures are placeholders for planning only.</p>
        </article>
      </section>

      <section id="learn" className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <article className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-3">
            <Droplets className="text-[#2E7D32]" size={28} aria-hidden="true" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">Water and soil</p>
              <h2 className="text-2xl font-black">Field reminders</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {["Clear drains before heavy rain.", "Mulch vegetable beds in dry spells.", "Do not spray during strong wind."].map((item) => (
              <p key={item} className="flex gap-2 rounded-md bg-[#FBFFE8] p-3 text-sm font-bold text-ink/72">
                <Leaf className="mt-0.5 shrink-0 text-[#2E7D32]" size={17} aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </article>

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
