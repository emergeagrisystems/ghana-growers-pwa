import Link from "next/link";
import { foundationFont } from "@/components/homepage-foundation/font";
import styles from "@/components/prelaunch/Campaign.module.css";

// Rendered only by the root layout when the public prelaunch gate is active.
// Text-only brand follows the released Stage 1 shell; no new identity symbol.
export function PrelaunchHeader() {
  return <header className={`${styles.shell} ${styles.header} ${foundationFont.className}`}>
    <div className={styles.headerInner}>
      <Link href="/launching-soon" prefetch={false} className={styles.brand}>GHANA GROWERS</Link>
      <span className={styles.launchBadge}>Launching 4 December</span>
    </div>
  </header>;
}

export function PrelaunchFooter() {
  return <footer className={`${styles.shell} ${styles.footer} ${foundationFont.className}`}>
    <div className={styles.footerInner}>
      <div><p className={styles.footerBrand}>Ghana Growers</p>
        <p className={styles.footerMeta}>Launching 4 December 2026 · 5:00 AM Ghana time</p>
        <p className={styles.footerMeta}>&copy; {new Date().getFullYear()} Ghana Growers.</p></div>
      <nav aria-label="Legal"><Link href="/privacy-policy" prefetch={false}>Privacy</Link><Link href="/terms-of-use" prefetch={false}>Terms of use</Link></nav>
    </div>
  </footer>;
}
