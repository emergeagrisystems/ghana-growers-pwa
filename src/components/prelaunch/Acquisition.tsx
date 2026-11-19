import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import styles from "./Campaign.module.css";

const entries = [
  { workflow: "farmer-registration", href: "/join/farmer", title: "+ Add my farm", benefit: "Help buyers discover what you grow." },
  { workflow: "buyer-request-submissions", href: "/submit-buyer-request", title: "Pre-Order", benefit: "For wholesale buyers planning ahead." },
  { workflow: "supplier-registration", href: "/become-a-supplier", title: "Add Supplier Shop", benefit: "Help farmers discover your products." }
] as const;

export function Acquisition() {
  return <section className={styles.acquisitionSection}>
    <h2>Get ready for launch.</h2>
    <nav className={styles.acquisition} aria-label="Join before launch">
    {entries.map(({ workflow, href, title, benefit }) => (
      <Link key={workflow} href={href} prefetch={false} className={styles.card}>
        <span><strong>{title}</strong><span className={styles.benefit}>{benefit}</span>
          {!getPublicWorkflowState(workflow).available && <span className={styles.closedLabel}>Currently closed</span>}
        </span>
        <span className={styles.arrow} aria-hidden="true"><ArrowRight size={18} /></span>
      </Link>
    ))}
    </nav>
  </section>;
}
