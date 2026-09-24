import Link from "next/link";

export function PublicDataUnavailable({ kind }: { kind: "farmer" | "supplier" }) {
  const label = kind === "farmer" ? "farmer profiles" : "supplier profiles";

  return (
    <section className="bg-earth-50 py-12 sm:py-16" aria-live="polite">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-ink">Profiles are temporarily unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            We could not load {label} right now. Please try again shortly or contact Ghana Growers for help.
          </p>
          <Link href="/contact" className="gg-button-secondary mt-5">Contact Ghana Growers</Link>
        </div>
      </div>
    </section>
  );
}
