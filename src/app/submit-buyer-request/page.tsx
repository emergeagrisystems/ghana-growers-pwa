import { SubmitBuyerRequestForm } from "@/components/SubmitBuyerRequestForm";

export const metadata = {
  title: "Submit Buyer Request | Ghana Growers",
  description:
    "Submit buyer demand for produce, livestock, and agricultural supplies for Ghana Growers admin review."
};

export default function SubmitBuyerRequestPage() {
  return (
    <main className="bg-gradient-to-b from-leaf-50/60 via-white to-white">
      <section className="border-b border-leaf-900/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Public Submission</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Submit Buyer Request</h1>
            <p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Tell Ghana Growers what produce, livestock, or farm supply you need. Reviewed requests can appear on the Buyer Demand Board.
            </p>
            <div className="mt-6 rounded-md border border-leaf-900/10 bg-white p-4 text-sm leading-6 text-ink/65 shadow-sm">
              Buyer requests are reviewed to help farmers respond to clear and useful demand opportunities.
            </div>
          </div>
          <SubmitBuyerRequestForm />
        </div>
      </section>
    </main>
  );
}
