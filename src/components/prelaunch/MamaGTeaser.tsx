import styles from "./Campaign.module.css";

export function MamaGTeaser() {
  return <aside className={styles.teaser} aria-labelledby="teaser-title" data-mama-teaser>
    <h2 id="teaser-title" className={styles.identity}>
      <span className={styles.srOnly}>Mama G</span>
      <span aria-hidden="true" className={styles.wordmark} />
    </h2>
    <div className={styles.teaserCopy}>
      <p>Your farm’s next helping hand.</p>
      <span className={styles.comingBadge}>Coming soon</span>
    </div>
  </aside>;
}
