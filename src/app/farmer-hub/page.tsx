import { ShieldCheck, Sprout } from "lucide-react";
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

export default function FarmerHubPage() {
  return (
    <main className="bg-gradient-to-b from-white via-earth-50 to-leaf-50/70 text-ink">
      <section>
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.46fr)] lg:items-start lg:px-8 lg:py-12">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-leaf-700 shadow-sm">
              <Sprout size={16} aria-hidden="true" />
              BY GHANA GROWERS
            </p>
            <FarmMateGreeting />
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              GG FarmMate
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
              Ask FarmMate for farming advice, or upload a crop photo when something looks wrong.
            </p>
            <FarmMateHeroActions />
            <FarmTools />
          </div>

          <aside className="grid gap-4 lg:pt-10" aria-label="FarmMate daily support">
            <FarmMateWeatherFoundation />

            <div className="flex flex-col gap-3 rounded-md border border-leaf-900/10 bg-white/80 p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
              <p className="font-bold text-ink/62">Testing GG FarmMate?</p>
              <Link href="/farmer-hub/feedback" className="inline-flex font-black text-leaf-700 transition hover:text-leaf-900">
                Share feedback
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 rounded-md border border-leaf-900/10 bg-white/80 p-4 text-sm font-semibold leading-6 text-ink/62 shadow-sm">
          <ShieldCheck className="mt-0.5 shrink-0 text-leaf-700" size={18} aria-hidden="true" />
          <p>FarmMate gives practical decision support. It does not replace an agricultural extension officer for serious outbreaks.</p>
        </div>
      </section>
    </main>
  );
}
