/* eslint-disable @next/next/no-img-element */
import { MessageCircle } from "lucide-react";
import styles from "./Campaign.module.css";

export function MamaGTeaser() {
  return <aside className={styles.teaser} aria-labelledby="teaser-title" data-mama-teaser>
    <div className={styles.identity}>
      <h2 id="teaser-title"><img src="/hm1/nov07/mama-g-light.png" width="495" height="141" alt="Mama G" /></h2>
      <p>Coming soon</p>
    </div>
    <div className={styles.sampleQuestion}>
      <MessageCircle aria-hidden="true" size={19} />
      <div><span>Sample question</span><p>“My tomato leaves are turning yellow. What should I check first?”</p></div>
    </div>
  </aside>;
}
