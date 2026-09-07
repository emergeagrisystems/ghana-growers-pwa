import styles from "@/styles/amended-homepage.module.css";

// Central replacement point for a temporary approved asset. Source/approval is
// unresolved (P09-0 D13); existing repository symbols must not be substituted.
// This component is used only by the protected Preview shell.
export function PreviewBrand() {
  return <a className={styles.previewBrand} href="/dev-preview/amended-homepage" aria-label="Ghana Growers home">Ghana Growers</a>;
}
