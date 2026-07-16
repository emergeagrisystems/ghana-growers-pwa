import { AlertTriangle, BadgeCheck, CheckCircle2, Clock3, FileSearch, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { verificationSteps } from "@/data/trustCenter";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Verification Process",
  description: "How Ghana Growers reviews farmers, suppliers, buyer requests, and public trust signals before showing Verified by Ghana Growers.",
  path: "/verification-process"
});

const statuses = [
  {
    title: "Pending",
    description: "The submission has been received. It may still need phone, WhatsApp, location, product, photo, or business details before public use.",
    icon: CheckCircle2
  },
  {
    title: "Under Review",
    description: "Ghana Growers is checking the record. The team may review contact details, location, products, services, submitted photos, or business information.",
    icon: Clock3
  },
  {
    title: "Verified",
    description: "The record has been reviewed and can show Verified by Ghana Growers. Buyers and sellers should still confirm stock, quality, price, delivery, and payment.",
    icon: BadgeCheck
  },
  {
    title: "Rejected",
    description: "The record does not meet current publication or trust requirements. It will not show a verified badge and may remain hidden from public pages.",
    icon: AlertTriangle
  }
];

const reviewGroups = [
  {
    title: "How farmers are reviewed",
    points: [
      "Farmer name, farm name, phone number, and WhatsApp number are checked for completeness.",
      "Region, district, products, farm size, supply frequency, delivery preference, and submitted photos are reviewed where available.",
      "Farmers are not published publicly unless their status allows public visibility."
    ]
  },
  {
    title: "How suppliers are reviewed",
    points: [
      "Supplier category, contact person, phone, WhatsApp, region, district, products or services, and service coverage are checked.",
      "Business registration may be reviewed when available, but it is not required for every early-stage supplier profile.",
      "Verified supplier profiles can show that Ghana Growers has reviewed the submitted business information."
    ]
  },
  {
    title: "How buyer requests are reviewed",
    points: [
      "Ghana Growers checks product needed, quantity, buyer type, location, deadline, and contact details.",
      "Requests that look incomplete or unclear may stay under review until the buyer provides more information.",
      "Published requests help farmers understand real demand before contacting or preparing supply."
    ]
  }
];

export default function VerificationProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Verification Process"
        title="How Ghana Growers reviews profiles and requests"
        description="Verification means Ghana Growers has reviewed a profile or request before showing a public trust signal. It helps people start with better information, but every transaction still needs careful confirmation."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/faq">Read FAQ</ButtonLink>
          <ButtonLink href="/join" variant="light">Start Registration</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:items-start lg:px-8">
          <div>
            <p className="gg-eyebrow">Review workflow</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">From submission to public trust signal</h2>
            <div className="mt-8 grid gap-4">
              {verificationSteps.map((step, index) => (
                <article key={step.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                  <div className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf-600 text-sm font-black text-white">
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
            <ShieldCheck className="text-earth-500" size={30} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black">What Verified means</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Verified by Ghana Growers means the record has been reviewed by the platform. It does not mean Ghana Growers guarantees stock, price, product grade, delivery, payment, or the final transaction.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-earth-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="gg-eyebrow">Verification statuses</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Pending, under review, verified, and rejected</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statuses.map((status) => {
              const Icon = status.icon;
              return (
                <article key={status.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-ink">{status.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/64">{status.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="gg-eyebrow">What Ghana Growers checks</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Different records need different review steps.</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {reviewGroups.map((group) => (
              <article key={group.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <FileSearch className="text-leaf-700" size={24} aria-hidden="true" />
                <h3 className="mt-4 text-xl font-black text-ink">{group.title}</h3>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/66">
                  {group.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-earth-500" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black text-ink">What Verified does not guarantee</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              Ghana Growers does not guarantee product quality, exact stock levels, final price, delivery performance, payment, or legal compliance between users. Before any deal, confirm quantity, grade, packaging, pickup or delivery, payment method, and timing.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/faq">Open FAQ</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">Report a Trust Issue</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
