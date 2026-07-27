"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[70vh] bg-earth-50 px-4 py-20 text-leaf-900 sm:px-6 sm:py-28">
      <section className="mx-auto max-w-3xl border-l-4 border-earth-500 bg-white p-7 shadow-soft sm:p-12">
        <p className="text-sm font-black uppercase text-leaf-800">Ghana Growers</p>
        <h1 className="gg-editorial-heading mt-8 text-4xl leading-tight sm:text-6xl">We could not load this page.</h1>
        <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-ink/65">
          Please try again. Your information has not been submitted from this page.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="gg-button-primary min-h-11 px-5 py-3">
            <RefreshCw size={17} aria-hidden="true" /> Try again
          </button>
          <Link href="/" className="gg-button-secondary min-h-11 px-5 py-3">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
