import { SubmitProduceListingForm } from "@/components/SubmitProduceListingForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Submit Produce Listing",
  description:
    "Submit farm produce, livestock, or agricultural supply listings for Ghana Growers admin review.",
  path: "/submit-produce-listing"
});

export default function SubmitProduceListingPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-leaf-900/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="gg-eyebrow">Public Submission</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Submit Produce Listing</h1>
            <p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
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
