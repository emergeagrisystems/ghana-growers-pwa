import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { FarmMateGreeting } from "@/components/FarmMateGreeting";
import { FarmMateHeroActions } from "@/components/FarmMateHeroActions";
import { FarmMateWeatherFoundation } from "@/components/FarmMateWeatherFoundation";
import { FarmTools } from "@/components/FarmTools";
import { createPageMetadata } from "@/lib/seo";
import { getPreviewMamaPalette } from "@/lib/previewMamaPalette";
import paletteStyles from "./FarmerHubPalette.module.css";

export const metadata = createPageMetadata({
  title: "Ask Mama G",
  description:
    "Your AI-powered farming companion by Ghana Growers, with daily farming recommendations, weather outlook, crop planning tools, and learning tips for Ghanaian farmers.",
  path: "/farmer-hub"
});

export default function FarmerHubPage({searchParams}: {searchParams: {mamaPalette?: string | string[]}}) {
  const mamaPalette = getPreviewMamaPalette(searchParams.mamaPalette);
  return (
    <main className={`${paletteStyles.paletteRoot} bg-gradient-to-b from-white via-earth-50 to-leaf-50/70 text-ink`} data-mama-palette={mamaPalette ?? undefined}>
      <section>
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.46fr)] lg:items-start lg:px-8 lg:py-12">
          <div className="min-w-0">
            <FarmMateGreeting />
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              Ask Mama G
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">What do you need help with today?</p>
            <FarmMateHeroActions />
            <Suspense fallback={null}>
              <FarmTools />
            </Suspense>
          </div>

          <aside className="grid gap-4 lg:pt-10" aria-label="Mama G daily support">
            <FarmMateWeatherFoundation />

          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-ink/62">
          <ShieldCheck className="mt-0.5 shrink-0 text-leaf-700" size={18} aria-hidden="true" />
          <div>
            <p>Mama G can make mistakes. For serious or spreading crop problems, seek a local extension officer.</p>
            <details className="mt-1"><summary className="cursor-pointer font-bold text-leaf-700">More about safe use</summary><p className="pt-2">Check local conditions and product labels before acting. AI guidance is not a confirmed diagnosis.</p></details>
          </div>
        </div>
      </section>
    </main>
  );
}
