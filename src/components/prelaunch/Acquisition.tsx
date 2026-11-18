import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublicWorkflowState, type PublicSubmissionWorkflow } from "@/lib/publicSubmissionAvailability";
import styles from "./Campaign.module.css";

function IntakeLink({ workflow, href, children, treatment = "primary" }: {
  workflow: PublicSubmissionWorkflow; href: string; children: React.ReactNode; treatment?: "primary" | "secondary" | "quiet";
}) {
  const open = getPublicWorkflowState(workflow).available;
  const className = treatment === "quiet" ? styles.quietAction : treatment === "secondary" ? styles.secondaryAction : styles.action;
  return <Link href={href} prefetch={false} className={className}>
    <span>{children}{!open && <span className={styles.closedLabel}> · Currently closed</span>}</span>
    {treatment === "quiet" && <ArrowUpRight size={14} aria-hidden="true" />}
  </Link>;
}

export function Acquisition() {
  return <nav className={styles.acquisition} aria-label="Join before launch">
    <div className={styles.actions}>
      <IntakeLink workflow="farmer-registration" href="/join/farmer">Get Listed Free</IntakeLink>
      <IntakeLink workflow="buyer-request-submissions" href="/submit-buyer-request" treatment="secondary">Pre-Order</IntakeLink>
    </div>
    <div className={styles.quietActions}>
      <IntakeLink workflow="supplier-registration" href="/become-a-supplier" treatment="quiet">Register Business</IntakeLink>
      <IntakeLink workflow="listing-submissions" href="/submit-listing" treatment="quiet">List a Product</IntakeLink>
    </div>
  </nav>;
}
