import Link from "next/link";

export function MarketplaceUnavailable({ listing = false }: { listing?: boolean }) {
  return (
    <section id="marketplace-listings" className="bg-white py-10 sm:py-12" aria-labelledby="marketplace-unavailable-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 sm:p-6">
          {listing ? <h1 id="marketplace-unavailable-heading" className="text-2xl font-bold text-ink">Listing temporarily unavailable</h1>
            : <h2 id="marketplace-unavailable-heading" className="text-2xl font-bold text-ink">Marketplace temporarily unavailable</h2>}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">We could not load the current listing information. Please try again later.</p>
          <Link href="/marketplace" className="gg-button-secondary mt-5 min-h-11">{listing ? "Back to Marketplace" : "Try again"}</Link>
        </div>
      </div>
    </section>
  );
}
