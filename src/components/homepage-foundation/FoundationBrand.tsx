import { foundation } from "@/content/homepage/foundation";
import styles from "@/styles/homepage-foundation.module.css";

// F06: one replaceable text-only consumer. No artwork or clearance claim.
export function FoundationBrand() {
  return <p className={styles.brand}>{foundation.brand}</p>;
}
