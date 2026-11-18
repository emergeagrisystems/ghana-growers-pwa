import Link from "next/link";
import { ArrowUpRight, Sprout, Store, ShoppingBasket } from "lucide-react";
import { getPublicWorkflowState, type PublicSubmissionWorkflow } from "@/lib/publicSubmissionAvailability";
import styles from "./Campaign.module.css";

function IntakeLink({ workflow, href, children, secondary = false }: {
  workflow: PublicSubmissionWorkflow; href: string; children: React.ReactNode; secondary?: boolean;
}) {
  const open = getPublicWorkflowState(workflow).available;
  return <Link href={href} prefetch={false} className={secondary ? styles.secondaryAction : styles.action}>
    <span>{children}{!open && <span className={styles.closedLabel}> · Currently closed</span>}</span>
    <ArrowUpRight size={18} aria-hidden="true" />
  </Link>;
}

export function Acquisition() {
  return <section className={styles.acquisition} aria-labelledby="acquisition-title">
    <div className={styles.sectionHeading}><p className={styles.eyebrow}>A head start for your business</p>
      <h2 id="acquisition-title">You don&apos;t have to wait</h2></div>
    <div className={styles.audiences}>
      <article><div className={styles.audienceLabel}><Sprout aria-hidden="true" size={22} />Farmers</div>
        <h3>Get your farm listed before launch</h3><p>Create your farmer profile and tell buyers what you grow.</p>
        <div className={styles.actions}><IntakeLink workflow="farmer-registration" href="/join/farmer">Get Listed Free</IntakeLink>
          <IntakeLink workflow="listing-submissions" href="/submit-listing" secondary>List a Product</IntakeLink></div></article>
      <article><div className={styles.audienceLabel}><ShoppingBasket aria-hidden="true" size={22} />Buyers</div>
        <h3>Tell farmers what you need</h3><p>Submit a free Buyer Request and tell Ghana Growers what produce you&apos;re looking for.</p>
        <div className={styles.actions}><IntakeLink workflow="buyer-request-submissions" href="/submit-buyer-request">Pre-Order</IntakeLink></div></article>
      <article><div className={styles.audienceLabel}><Store aria-hidden="true" size={22} />Agri-Suppliers</div>
        <h3>Put your business on the network</h3><p>Register your agricultural inputs, equipment or services before launch.</p>
        <div className={styles.actions}><IntakeLink workflow="supplier-registration" href="/become-a-supplier">Register Your Business</IntakeLink></div></article>
    </div>
  </section>;
}
