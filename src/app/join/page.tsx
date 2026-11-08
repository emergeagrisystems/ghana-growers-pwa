import { ArrowRight, LockKeyhole, Megaphone, Package, Sprout, Store } from "lucide-react";
import Link from "next/link";
import { getPublicWorkflowState, type PublicSubmissionWorkflow } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";
import styles from "./join.module.css";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({ title: "Join Ghana Growers", description: "Register a farm or business, list a product or send a private buyer request.", path: "/join" });

const entries = [
  { title: "Register my farm", description: "Show buyers what you grow and where you farm.", workflow: "farmer-registration", href: "/join/farmer", icon: Sprout },
  { title: "Register my business", description: "List your agri-shop, farm supplies or agricultural services.", workflow: "supplier-registration", href: "/become-a-supplier", icon: Store },
  { title: "List a product", description: "Send details of what you sell for private review.", workflow: "listing-submissions", href: "/submit-listing", icon: Package },
  { title: "Send a buyer request", description: "Tell our team privately what you need, how much and where.", workflow: "buyer-request-submissions", href: "/submit-buyer-request", icon: Megaphone }
] as const;

function Entry({ title, description, workflow, href, icon: Icon }: {title: string; description: string; workflow: PublicSubmissionWorkflow; href: string; icon: typeof Sprout}) {
  const state = getPublicWorkflowState(workflow);
  return <Link href={href} className={styles.choice} data-buyer={workflow === "buyer-request-submissions"}>
    <span className={styles.icon}><Icon aria-hidden="true" size={22}/></span>
    <span className={styles.words}><strong>{title}</strong><span>{description}</span>
      {!state.available && <small><LockKeyhole aria-hidden="true" size={14} /> Currently closed</small>}
    </span>
    <ArrowRight className={styles.arrow} aria-hidden="true" size={20} />
  </Link>;
}

export default function JoinPage() {
  return <main className={styles.page}>
    <header className={styles.head}><div><h1>Join Ghana Growers</h1><p>Help buyers find your farm or business. You can also list a product or tell us what you need.</p></div></header>
    <div className={styles.body}>
      <section><h2>Create a free profile</h2><p>We review each profile before it appears in the directory.</p>
        <div className={styles.cards}>{entries.slice(0, 2).map(entry => <Entry key={entry.workflow} {...entry}/>)}</div></section>
      <section><h2>Products &amp; buyer requests</h2><div className={styles.rows}>{entries.slice(2).map(entry => <Entry key={entry.workflow} {...entry}/>)}</div></section>
    </div>
  </main>;
}
