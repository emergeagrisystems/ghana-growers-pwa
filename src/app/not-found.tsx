import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-earth-50 px-4 py-20 text-leaf-900 sm:px-6 sm:py-28">
      <section className="mx-auto max-w-3xl border-l-4 border-earth-500 bg-white p-7 shadow-soft sm:p-12">
        <p className="text-sm font-black uppercase text-leaf-800">Ghana Growers</p>
        <p className="mt-8 text-sm font-black text-earth-700">404</p>
        <h1 className="gg-editorial-heading mt-2 text-4xl leading-tight sm:text-6xl">This page could not be found.</h1>
        <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-ink/65">
          The address may have changed, or the page may no longer be available.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="gg-button-primary min-h-11 px-5 py-3">
            Return home <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link href="/farmer-directory" className="gg-button-secondary min-h-11 px-5 py-3">
            Browse Farmer Directory
          </Link>
        </div>
      </section>
    </main>
  );
}
