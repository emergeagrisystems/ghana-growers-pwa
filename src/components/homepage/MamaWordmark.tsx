/* eslint-disable @next/next/no-img-element */
import styles from "./Refinements.module.css";

export function MamaWordmark({ treatment }: { treatment: "dark" | "light" }) {
  return <img className={styles.wordmark} src={`/hm1/nov07/mama-g-${treatment}.png`} alt="Mama G" width="180" height="54" />;
}
