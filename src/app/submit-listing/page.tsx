import { SubmitProduceListingForm } from "@/components/SubmitProduceListingForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Submit a Listing",
  description:
    "Tell Ghana Growers what you are selling so the team can review it before it appears publicly.",
  path: "/submit-listing"
});

export default function SubmitListingPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-leaf-900/10 bg-earth-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <div>
            <p className="gg-eyebrow">Public Submission</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Submit a Listing</h1>
            <p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Tell us what you are selling. Ghana Growers will review the information before your listing appears publicly.
            </p>
            <div className="mt-6 rounded-md border border-leaf-900/10 bg-white p-4 text-sm leading-6 text-ink/65 shadow-sm">
              This form supports fresh produce, livestock, farm inputs, tools and equipment. Agricultural services are reviewed through the supplier profile process.
            </div>
          </div>
          <SubmitProduceListingForm />
        </div>
      </section>
    </main>
  );
}
