import { SubmitBuyerRequestForm } from "@/components/SubmitBuyerRequestForm";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { createPageMetadata } from "@/lib/seo";
import { CheckCircle2 } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Request Produce",
  description:
    "Tell Ghana Growers what produce, livestock, or agricultural supply you need and our team will review it for sourcing support.",
  path: "/submit-buyer-request"
});

const sourcingSteps = [
  "Submit Request",
  "We Review",
  "We Match",
  "We Contact You",
  "Supply Begins"
];

const trustPoints = [
  "Reviewed by the Ghana Growers team",
  "Matched with suitable farmers and suppliers",
  "GG Quality Standard members highlighted where applicable",
  "Expected review within one business day"
];

export default function SubmitBuyerRequestPage() {
  return (
    <div className="overflow-x-hidden bg-white">
      <PrelaunchHeader />
      <main>
        <section className="border-b border-leaf-900/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:px-8 lg:py-12">
            <div className="min-w-0">
              <p className="gg-eyebrow">Produce Sourcing</p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Need Produce?</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
                Tell us what you&apos;re looking for. Our Ghana Growers team will review your request, identify suitable farmers and suppliers, and help connect you with the right people.
              </p>
              <div className="mt-6 rounded-md border border-earth-500/25 bg-earth-50 p-4 text-sm font-black text-ink shadow-sm">
                Expected review: within one business day.
              </div>

              <div className="mt-6 min-w-0 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-lg font-black text-ink">How sourcing works</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-5">
                  {sourcingSteps.map((step, index) => (
                    <div key={step} className="rounded-md bg-leaf-50 p-3">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                        {index + 1}
                      </span>
                      <p className="mt-3 text-sm font-black leading-5 text-ink">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {trustPoints.map((point) => (
                  <p key={point} className="flex items-start gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-semibold leading-6 text-ink/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                    {point}
                  </p>
                ))}
              </div>
            </div>
            <SubmitBuyerRequestForm />
          </div>
        </section>
      </main>
      <PrelaunchFooter />
    </div>
  );
}
