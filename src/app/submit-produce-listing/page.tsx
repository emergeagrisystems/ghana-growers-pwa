import { SubmitProduceListingForm } from "@/components/SubmitProduceListingForm";

export const metadata = {
  title: "Submit Produce Listing | Ghana Growers",
  description:
    "Submit farm produce, livestock, or agricultural supply listings for Ghana Growers admin review."
};

export default function SubmitProduceListingPage() {
  return (
    <main className="bg-gradient-to-b from-leaf-50/60 via-white to-white">
      <section className="border-b border-leaf-900/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Public Submission</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink sm:text-5xl">Submit Produce Listing</h1>
            <p className="mt-4 text-lg leading-8 text-ink/70">
              Share produce, livestock, or farm supplies for Ghana Growers review. Approved listings can appear in the public marketplace.
            </p>
            <div className="mt-6 rounded-md border border-leaf-900/10 bg-white p-4 text-sm leading-6 text-ink/65 shadow-sm">
              Listings are reviewed before publication to help buyers discover reliable opportunities across Ghana.
            </div>
          </div>
          <SubmitProduceListingForm />
        </div>
      </section>
    </main>
  );
}
