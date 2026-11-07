import { ArrowRight, LockKeyhole, Package, Search, Sprout, Store } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPublicWorkflowState, type PublicSubmissionWorkflow } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Join Ghana Growers",
  description: "Find farmer and supplier registration, product listing and private buyer requests.",
  path: "/join"
});

const entries = [
  { title: "Farmer registration", workflow: "farmer-registration", href: "/join/farmer", icon: Sprout },
  { title: "Supplier and service registration", workflow: "supplier-registration", href: "/become-a-supplier", icon: Store },
  { title: "Product listing", workflow: "listing-submissions", href: "/submit-listing", icon: Package },
  { title: "Managed buyer requests", workflow: "buyer-request-submissions", href: "/submit-buyer-request", icon: Search }
] as const satisfies ReadonlyArray<{ title: string; workflow: PublicSubmissionWorkflow; href: string; icon: typeof Sprout }>;

export default function JoinPage() {
  return (
    <main>
      <PageHero eyebrow="GHANA GROWERS" title="Join the network" description="Register your farm or business, list a product, or send a private buyer request." />
      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-2">
        {entries.map(({ title, workflow, href, icon: Icon }) => {
          const state = getPublicWorkflowState(workflow);
          return <article key={href} className="rounded-xl border border-[#40504a]/20 bg-[#fefbf7] p-6">
            <Icon aria-hidden="true" className="text-[#064f43]" />
            <h2 className="mt-3 text-xl font-bold">{title}</h2>
            <p className="mt-2">{state.publicMessage}</p>
            <Link href={href} className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-[#064f43]">
              {state.available ? <ArrowRight size={18} aria-hidden="true"/> : <LockKeyhole size={16} aria-hidden="true"/>}{state.publicLabel}
            </Link>
          </article>;
        })}
      </div>
    </main>
  );
}
