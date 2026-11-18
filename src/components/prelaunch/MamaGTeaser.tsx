/* eslint-disable @next/next/no-img-element */
import { Mic } from "lucide-react";
import styles from "./Campaign.module.css";

// Static illustration only: no product import, controls, handlers or requests.
export function MamaGTeaser() {
  return <aside className={styles.teaser} aria-labelledby="teaser-title" data-mama-teaser>
    <p className={styles.teaserLabel}>COMING WITH GHANA GROWERS</p>
    <div className={styles.teaserBody}>
      <div className={styles.teaserIdentity}>
        <h2 id="teaser-title"><img src="/hm1/nov07/mama-g-dark.png" width="495" height="141" alt="Mama G" /></h2>
        <p className={styles.teaserLead}>Ask. Check. Plan.</p>
        <p className={styles.teaserStatus}>Available at launch</p>
      </div>
      <div className={styles.sampleQuestion}>
        <p className={styles.sampleLabel}>A sample question</p>
        <p>My tomato leaves are turning yellow. What should I check first?</p>
      </div>
    </div>
    <div className={styles.illustrativeField} aria-hidden="true"><span>Ask a farming question…</span><Mic size={18} /></div>
    <p className={styles.illustrationNote}>Illustration only</p>
  </aside>;
}
