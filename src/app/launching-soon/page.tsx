/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { foundationFont } from "@/components/homepage-foundation/font";
import { LaunchCountdown } from "@/components/prelaunch/LaunchCountdown";
import { Acquisition } from "@/components/prelaunch/Acquisition";
import { MamaGTeaser } from "@/components/prelaunch/MamaGTeaser";
import styles from "@/components/prelaunch/Campaign.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Launching 4 December at 5:00 AM Ghana time",
  description: "Ghana Growers launches on 4 December 2026 at 05:00 GMT. Register your farm or agricultural business and tell farmers what you need.",
  robots: { index: false, follow: false }
};

export default function LaunchingSoonPage() {
  if (process.env.SITE_PRELAUNCH === "false") redirect("/");
  return <div className={`${styles.campaign} ${foundationFont.className}`} data-prelaunch-campaign>
    <div className={styles.atmosphere} aria-hidden="true"><img src="/stage1-media/hero-clay-map-1088.webp" alt="" width="1088" height="812" /></div>
    <section className={styles.hero} aria-labelledby="campaign-title">
      <div className={styles.launchContent}><p className={styles.eyebrow}>LAUNCHING 4 DECEMBER</p>
        <h1 id="campaign-title">Ghana Growers launches in</h1>
        <LaunchCountdown />
        <p className={styles.heroSupport}>Ghana’s agricultural network is almost here — farms, suppliers, buyer requests and Mama G in one place.</p>
        <p className={styles.launchLine}><time dateTime="2026-12-04T05:00:00Z">4 December 2026 · 5:00 AM Ghana time</time></p>
        <Acquisition />
      </div>
      <MamaGTeaser />
    </section>
  </div>;
}
