/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { foundationFont } from "@/components/homepage-foundation/font";
import { LaunchCountdown } from "@/components/prelaunch/LaunchCountdown";
import { Acquisition } from "@/components/prelaunch/Acquisition";
import { MamaGTeaser } from "@/components/prelaunch/MamaGTeaser";
import { ComingBenefits } from "@/components/prelaunch/ComingBenefits";
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
    <section className={styles.hero} aria-labelledby="campaign-title">
      <div><p className={styles.eyebrow}>GHANA GROWERS · LAUNCHING 4 DECEMBER</p>
        <h1 id="campaign-title">Ghana&apos;s agricultural network is almost here.</h1>
        <p className={styles.heroSupport}>Find farms and agri-suppliers, tell farmers what you need, and get practical farming support from Mama G — all in one place.</p>
        <p className={styles.launchLine}><time dateTime="2026-12-04T05:00:00Z">4 December 2026 · 5:00 AM Ghana time</time></p>
        <p className={styles.earlyLine}>The farming day starts early. So will we.</p>
        <LaunchCountdown />
      </div>
      <figure className={styles.heroArt}>
        <img src="/stage1-media/hero-clay-map-1088.webp" srcSet="/stage1-media/hero-clay-map-640.webp 640w, /stage1-media/hero-clay-map-1088.webp 1088w, /stage1-media/hero-clay-map-1600.webp 1600w"
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1280px) 44vw, 550px"
          alt="Illustration of Ghana connecting a grower, agricultural shop and basket of produce." width="1088" height="812" fetchPriority="high" />
        <figcaption>Buy. Sell. Grow.</figcaption>
      </figure>
    </section>
    <Acquisition /><MamaGTeaser /><ComingBenefits />
  </div>;
}
