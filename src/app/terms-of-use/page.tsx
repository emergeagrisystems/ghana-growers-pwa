import { AlertTriangle, FileText } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Terms of Use",
  description: "Simple terms for using Ghana Growers profiles, marketplace listings, buyer requests, supplier pages, GG FarmMate tools, and lead forms.",
  path: "/terms-of-use"
});

const sections = [
  {
    title: "Using Ghana Growers",
    body: [
      "Ghana Growers is a platform for agricultural information, profiles, listings, requests, tools, and connection support in Ghana.",
      "Users should submit accurate information and should not use the platform to post false records, misleading product claims, or contact details they do not have permission to use."
    ]
  },
  {
    title: "Verification limitations",
    body: [
      "Verified by Ghana Growers means a profile or request has been reviewed by the platform. It is a trust signal, not a legal guarantee, product certification, or promise that a transaction will succeed.",
      "Users must still confirm identity, product availability, quality, price, delivery, payment, timing, and any other deal terms before moving forward."
    ]
  },
  {
    title: "Marketplace usage",
    body: [
      "Marketplace listings are used to show available or submitted products and services. Quantities, availability, and prices can change and should be confirmed before any agreement.",
      "Ghana Growers may review, edit, hide, archive, or remove listings that are incomplete, inaccurate, duplicate, suspicious, or not suitable for public display."
    ]
  },
  {
    title: "Buyer and supplier responsibilities",
    body: [
      "Buyers should provide clear product needs, quantity, region, deadline, and contact details. Suppliers should provide clear service categories, coverage area, products, and contact details.",
      "Farmers, buyers, and suppliers are responsible for their own communication, agreements, payments, delivery arrangements, quality checks, and compliance with applicable requirements."
    ]
  },
  {
    title: "GG FarmMate tools",
    body: [
      "GG FarmMate tools provide general agricultural guidance, weather information, market information, Crop Doctor support, and Ask FarmMate support where available.",
      "The tools do not replace an agricultural extension officer, veterinary officer, qualified agronomist, crop protection expert, or other professional advice where serious decisions are involved."
    ]
  },
  {
    title: "Transactions and payments",
    body: [
      "Ghana Growers does not currently process payments, hold money, guarantee payment, guarantee delivery, or act as the buyer or seller in transactions.",
      "Any transaction is between the buyer, farmer, supplier, or other parties involved. Ghana Growers may help create a connection, but users must agree terms directly."
    ]
  },
  {
    title: "Platform changes",
    body: [
      "Ghana Growers may update pages, forms, listings, verification rules, public visibility, features, or these terms as the platform grows.",
      "If a record is inaccurate or should no longer be public, contact Ghana Growers so it can be reviewed."
    ]
  }
];

export default function TermsOfUsePage() {
  return (
    <>
      <PageHero
        eyebrow="Terms of Use"
        title="Using Ghana Growers responsibly"
        description="These terms explain how Ghana Growers should be used by farmers, buyers, suppliers, partners, and visitors."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact">Contact Ghana Growers</ButtonLink>
          <ButtonLink href="/privacy-policy" variant="light">Read Privacy Policy</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.28fr_0.72fr] lg:px-8">
          <aside className="h-fit rounded-md border border-leaf-900/10 bg-[#ECE7D1] p-5 shadow-sm">
            <AlertTriangle className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-ink">Important transaction note</h2>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              Ghana Growers helps people find and request agricultural connections. It does not guarantee a deal, product quality, payment, delivery, or final transaction outcome.
            </p>
          </aside>

          <div className="grid gap-5">
            {sections.map((section) => (
              <article key={section.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 shrink-0 text-leaf-700" size={20} aria-hidden="true" />
                  <div>
                    <h2 className="text-xl font-black text-ink">{section.title}</h2>
                    <div className="mt-3 grid gap-3">
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-7 text-ink/68">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
