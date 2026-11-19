import { redirect } from "next/navigation";
import { foundationFont } from "@/components/homepage-foundation/font";
import { LaunchCountdown } from "@/components/prelaunch/LaunchCountdown";
import { Acquisition } from "@/components/prelaunch/Acquisition";
import { GrowthIllustration } from "@/components/prelaunch/GrowthIllustration";
import { MamaGTeaser } from "@/components/prelaunch/MamaGTeaser";
import styles from "@/components/prelaunch/Campaign.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Something fresh is growing | Launching 4 December",
  description: "Ghana Growers launches on 4 December 2026 at 05:00 GMT. Get ready to find farms, source produce and reach growers.",
  robots: { index: false, follow: false }
};

export default function LaunchingSoonPage() {
  if (process.env.SITE_PRELAUNCH === "false") redirect("/");
  return <div className={`${styles.campaign} ${foundationFont.className}`} data-prelaunch-campaign>
    <div className={styles.inner}>
      <section className={styles.hero} aria-labelledby="campaign-title">
        <div className={styles.launchContent}>
          <h1 id="campaign-title">Something fresh is <span className={styles.finalWord}>growing<GrowthIllustration /></span></h1>
          <LaunchCountdown />
          <p className={styles.launchLine}>Ghana Growers opens <time dateTime="2026-12-04T05:00:00Z">4 December 2026 · 5:00 AM Ghana time</time></p>
        </div>
        <MamaGTeaser />
      </section>
      <Acquisition />
    </div>
  </div>;
}
