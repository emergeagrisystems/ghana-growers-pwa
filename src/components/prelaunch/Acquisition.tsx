import Link from "next/link";
import { ArrowUpRight, Sprout, Store, ShoppingBasket } from "lucide-react";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import styles from "./Campaign.module.css";

const entries = [
  { workflow: "farmer-registration", href: "/join/farmer", title: "+ Add my farm", benefit: "Help buyers find your farm at launch.", icon: Sprout },
  { workflow: "buyer-request-submissions", href: "/submit-buyer-request", title: "Pre-Order", benefit: "Share your wholesale needs before matching begins.", icon: ShoppingBasket },
  { workflow: "supplier-registration", href: "/become-a-supplier", title: "Register my Agro-supply Shop", benefit: "Put your shop in reach of farmers and buyers.", icon: Store }
] as const;

export function Acquisition() {
  return <nav className={styles.acquisition} aria-label="Join before launch">
    {entries.map(({ workflow, href, title, benefit, icon: Icon }) => (
      <Link key={workflow} href={href} prefetch={false} className={styles.card}>
        <span className={styles.cardIcon}><Icon aria-hidden="true" size={22} strokeWidth={1.6} /></span>
        <span><strong>{title}</strong><span className={styles.benefit}>{benefit}</span>
          {!getPublicWorkflowState(workflow).available && <span className={styles.closedLabel}>Currently closed</span>}
        </span>
        <ArrowUpRight size={16} aria-hidden="true" className={styles.arrow} />
      </Link>
    ))}
  </nav>;
}
