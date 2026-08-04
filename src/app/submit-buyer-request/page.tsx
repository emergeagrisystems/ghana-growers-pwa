import { SubmitBuyerRequestForm } from "@/components/SubmitBuyerRequestForm";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Request Produce",
  description:
    "Tell Ghana Growers what produce, livestock, or agricultural supply you need and our team will review it for sourcing support.",
  path: "/submit-buyer-request"
});

const sourcingSteps = [
  {
    number: "01",
    title: "Submit your request",
    description: "Tell us what you need, the quantity and the location."
  },
  {
    number: "02",
    title: "We check the details",
    description: "Ghana Growers reviews the request and may contact you for more information."
  },
  {
    number: "03",
    title: "We look for a suitable option",
    description: "Where possible, we compare the request with available farmers, sellers or suppliers."
  },
  {
    number: "04",
    title: "You decide whether to continue",
    description: "Availability, price, quantity, pickup and delivery are confirmed during follow-up."
  }
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
                Tell Ghana Growers what produce or agricultural supply you need. We will review your request and follow up where a suitable option may be available.
              </p>

              <div className="mt-6 min-w-0 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-lg font-black text-ink">How sourcing works</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {sourcingSteps.map((step) => (
                    <div key={step.number} className="rounded-md bg-leaf-50 p-4">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                        {step.number}
                      </span>
                      <p className="mt-3 text-sm font-black leading-5 text-ink">{step.title}</p>
                      <p className="mt-2 text-sm leading-6 text-ink/65">{step.description}</p>
                    </div>
                  ))}
                </div>
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
