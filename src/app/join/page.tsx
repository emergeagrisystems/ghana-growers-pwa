import { LockKeyhole, Search, Sprout, Store } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Join Ghana Growers",
  description: "Farmer, supplier and managed buyer workflows are prepared but not public yet.",
  path: "/join"
});

export default function JoinPage() {
  const farmer = getPublicWorkflowState("farmer-registration");
  const supplier = getPublicWorkflowState("supplier-registration");
  const buyer = getPublicWorkflowState("lead-requests");
  const workflows = [
    { title: "Farmer registration", state: farmer, icon: Sprout },
    { title: "Supplier and service registration", state: supplier, icon: Store },
    { title: "Managed buyer enquiries", state: buyer, icon: Search }
  ];

  return (
    <main>
      <PageHero eyebrow="JOIN GHANA GROWERS" title="Registration is not open yet." description="The Stage 1 directory is available to browse. Farmer, supplier and managed buyer workflows remain independently closed until a later founder release decision." />
      <section className="bg-white px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {workflows.map(({ title, state, icon: Icon }) => (
            <article key={title} className="rounded-xl border border-[#40504a]/15 bg-[#fefbf7] p-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f6f1e7] text-[#40504a]"><Icon aria-hidden="true" /></span>
              <h2 className="mt-5 text-xl font-black text-[#1e2522]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#59645f]">{state.publicMessage}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#40504a]"><LockKeyhole size={16} aria-hidden="true" />{state.publicLabel}</span>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-5xl text-center">
          <Link href="/directory" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#40504a] px-5 font-extrabold text-white">Browse Farms &amp; Suppliers</Link>
        </div>
      </section>
    </main>
  );
}
