import { ArrowRight, LockKeyhole, Search } from "lucide-react";
import Link from "next/link";

export function MarketplaceStage2Notice() {
  return (
    <main className="bg-[#fefbf7] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#40504a]/15 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f6f1e7] text-[#40504a]"><LockKeyhole aria-hidden="true" /></span>
        <p className="mt-6 text-xs font-extrabold tracking-[.12em] text-[#40504a]">STAGE 2</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1e2522] sm:text-4xl">The Marketplace is not public yet.</h1>
        <p className="mt-4 leading-7 text-[#59645f]">The underlying Marketplace is preserved for later work. No listings, seller contacts or buyer-enquiry forms are exposed on this Stage 1 route.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/directory" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#40504a] px-5 font-extrabold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]"><Search size={18} aria-hidden="true" />Browse Farms &amp; Suppliers</Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#40504a] px-5 font-extrabold text-[#40504a] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]">Return home <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </main>
  );
}
