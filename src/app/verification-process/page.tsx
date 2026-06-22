import { AlertTriangle, BadgeCheck, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { verificationSteps } from "@/data/trustCenter";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Verification Process",
  description:
    "How Ghana Growers reviews farmers, buyers, suppliers, listings, and buyer requests before showing public verification signals.",
  path: "/verification-process"
});

const statuses = [
  {
    title: "Pending",
    description: "The submission has been received. It is not yet publicly verified and may still need contact, location, product, or business details."
  },
  {
    title: "Under Review",
    description: "Ghana Growers is checking profile completeness, phone or WhatsApp contact, location, products or services, and supporting information where available."
  },
  {
    title: "Verified",
    description: "The record has been reviewed and may show Verified by Ghana Growers publicly. Users should still confirm availability, quality, price, delivery, and payment terms."
  },
  {
    title: "Rejected",
    description: "The record does not meet current publication or trust requirements. It will not show a public verification badge and may remain hidden from public pages."
  }
];

export default function VerificationProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Verification Process"
        title="How Ghana Growers reviews profiles and requests"
        description="Verification helps farmers, buyers, and suppliers understand which records have been reviewed before public visibility, buyer matching, or lead follow-up."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/faq">Read FAQ</ButtonLink>
          <ButtonLink href="/join" variant="light">Start Registration</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Review workflow</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">From submission to public trust signal</h2>
              <div className="mt-8 grid gap-4">
                {verificationSteps.map((step, index) => (
                  <article key={step.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                    <div className="flex gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-700 text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-xl font-black text-ink">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-ink/66">{step.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-md border border-leaf-900/10 bg-ink p-5 text-white shadow-soft">
              <ShieldCheck className="text-earth-400" size={30} aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-black">What verification means</h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Verified by Ghana Growers means the profile or request has been reviewed by the platform. It does not replace buyer due diligence, product inspection, quality checks, or agreement on payment and delivery terms.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Verification statuses</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Pending, under review, verified, and rejected</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statuses.map((status) => (
              <article key={status.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
                  {status.title === "Verified" ? <BadgeCheck size={21} aria-hidden="true" /> : status.title === "Under Review" ? <Clock3 size={21} aria-hidden="true" /> : status.title === "Rejected" ? <AlertTriangle size={21} aria-hidden="true" /> : <CheckCircle2 size={21} aria-hidden="true" />}
                </div>
                <h3 className="mt-4 text-xl font-black text-ink">{status.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/64">{status.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black text-ink">Verification supports trust, but users should still confirm details.</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              Before any transaction, confirm availability, quantity, product quality, packaging, pickup or delivery, payment method, and timing directly through the connection process.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/faq">Open FAQ</ButtonLink>
              <ButtonLink href="/submit-buyer-request" variant="secondary">Submit Buyer Request</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
