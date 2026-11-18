/* eslint-disable @next/next/no-img-element */
import { ArrowUp, Mic, MessageCircle } from "lucide-react";
import styles from "./Campaign.module.css";

// Server-rendered illustration only: no product import, controls, handlers or requests.
export function MamaGTeaser() {
  return <section className={styles.teaser} aria-labelledby="teaser-title" data-mama-teaser>
    <div className={styles.teaserInner}>
      <div className={styles.teaserCopy}><p className={styles.eyebrow}>A little help goes a long way</p>
        <h2 id="teaser-title">Meet Mama G</h2>
        <p className={styles.teaserLead}>Practical farming support, built into Ghana Growers.</p>
        <p>Ask farming questions, check crop problems, plan planting and get practical next steps — all in one place.</p>
        <div className={styles.availability}><span>Available when Ghana Growers launches</span><strong>4 December · 5:00 AM Ghana time</strong></div>
      </div>
      <figure className={styles.askIllustration}>
        <div className={styles.askTop}><img src="/hm1/nov07/mama-g-dark.png" width="495" height="141" alt="Mama G" /><span>Digital FarmMate</span></div>
        <p className={styles.askGreeting}>Every good harvest<br />starts with a question.</p>
        <p className={styles.sampleLabel}>Sample farmer questions</p>
        <ul className={styles.questions}>
          <li><MessageCircle size={18} aria-hidden="true" /><span>My tomato leaves are turning yellow. What should I check first?</span></li>
          <li><MessageCircle size={18} aria-hidden="true" /><span>Is this a good week to plant maize in Kumasi?</span></li>
        </ul>
        <div className={styles.illustrativeField} aria-hidden="true"><span>Ask your farming question…</span><Mic size={20} /><span className={styles.illustrativeSend}><ArrowUp size={20} /></span></div>
        <figcaption>Illustration only. Ask Mama G opens at launch.</figcaption>
      </figure>
    </div>
  </section>;
}
