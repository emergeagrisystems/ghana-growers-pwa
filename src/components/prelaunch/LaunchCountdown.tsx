"use client";

import { useEffect, useState } from "react";
import { LAUNCH_FALLBACK, launchCountdown } from "@/lib/launchCountdown";
import styles from "./Campaign.module.css";

export function LaunchCountdown() {
  // Identical SSR and first browser render; the clock is read only after hydration.
  const [remaining, setRemaining] = useState<ReturnType<typeof launchCountdown> | null>(null);
  useEffect(() => {
    const current = launchCountdown(Date.now());
    setRemaining(current);
    if (current.reached) return;
    const timer = window.setInterval(() => {
      const next = launchCountdown(Date.now());
      setRemaining(next);
      if (next.reached) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <div className={styles.countdown} data-launch-countdown>
    {remaining?.reached ? <div className={styles.opening} role="status">
      <p>We&apos;re opening Ghana Growers now.</p>
      <span>The farming day has started — and so have we.</span>
    </div> : <>
      <p className={remaining ? styles.srOnly : styles.fallback}>{LAUNCH_FALLBACK}</p>
      <dl className={styles.clock} aria-label="Time until Ghana Growers launches" aria-live="off" aria-hidden={!remaining || undefined}>
        {(["days", "hours", "minutes", "seconds"] as const).map(unit => <div key={unit}>
          <dt><span aria-hidden="true">{{ days: "DAYS", hours: "HOURS", minutes: "MIN", seconds: "SEC" }[unit]}</span><span className={styles.srOnly}>{unit}</span></dt>
          <dd>{remaining ? String(remaining[unit]).padStart(2, "0") : "—"}</dd>
        </div>)}
      </dl>
    </>}
  </div>;
}
