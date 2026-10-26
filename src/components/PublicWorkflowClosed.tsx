import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import type { PublicWorkflowState } from "@/lib/publicSubmissionAvailability";

export function PublicWorkflowClosed({ eyebrow, title, state }: { eyebrow: string; title: string; state: PublicWorkflowState }) {
  return (
    <main className="bg-[#fefbf7] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#40504a]/15 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f6f1e7] text-[#40504a]"><LockKeyhole aria-hidden="true" /></span>
        <p className="mt-6 text-xs font-extrabold tracking-[.12em] text-[#40504a]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1e2522] sm:text-4xl">{title}</h1>
        <p className="mt-4 leading-7 text-[#59645f]">{state.publicMessage} No information can be submitted on this page.</p>
        <Link href="/directory" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#40504a] px-5 font-extrabold text-white">Browse Farms &amp; Suppliers</Link>
      </div>
    </main>
  );
}
