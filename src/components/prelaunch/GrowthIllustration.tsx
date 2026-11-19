import styles from "./Campaign.module.css";

export function GrowthIllustration() {
  return <svg viewBox="0 0 36 36" className={styles.sproutIcon} aria-hidden="true" focusable="false" data-headline-sprout>
    <ellipse cx="17" cy="24" rx="4" ry="2.7" fill="#b98741" transform="rotate(-22 17 24)" />
    <path className={styles.root} d="M17 25q2 3-1 7m2-4 3 2" fill="none" stroke="#94632b" strokeWidth="1.6" strokeLinecap="round" />
    <g className={styles.shoot}>
      <path d="M17 23q2-6-1-11m2 7 5-7" fill="none" stroke="#30593c" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 15C10 16 6 10 5 5c7 0 13 3 12 10Z" fill="#50734c"/>
      <path d="M20 16C19 9 24 4 32 4c-1 7-5 12-12 12Z" fill="#70864e"/>
    </g>
  </svg>;
}
