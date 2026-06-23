import { LockKeyhole, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "How Ghana Growers collects and uses farmer, buyer, supplier, marketplace, contact, and lead information.",
  path: "/privacy-policy"
});

const sections = [
  {
    title: "Information Ghana Growers collects",
    body: [
      "Ghana Growers collects information people submit through registration forms, buyer request forms, listing submissions, lead forms, contact forms, and admin review workflows.",
      "This may include names, farm or business names, phone numbers, WhatsApp numbers, email addresses, regions, districts, products, services, farm details, buyer demand, photos, and messages."
    ]
  },
  {
    title: "How the information is used",
    body: [
      "The information helps Ghana Growers review profiles, prepare public listings, manage buyer demand, match requests, follow up on leads, verify records, and improve platform readiness before launch.",
      "Ghana Growers may use contact details to follow up about a registration, buyer request, supplier enquiry, verification issue, or partnership message."
    ]
  },
  {
    title: "Farmer profiles",
    body: [
      "Farmer profiles may show public information such as farmer or farm name, region, district, products, farm type, public photo, verification status, and marketplace listings.",
      "Detailed review notes, import records, and admin-only fields are meant for internal Ghana Growers review and should not be shown publicly."
    ]
  },
  {
    title: "Supplier profiles",
    body: [
      "Supplier profiles may show public information such as company or contact name, category, region, district, products or services, service coverage, website, image, and verification status.",
      "Suppliers should only submit information they are comfortable Ghana Growers reviewing and, where approved, publishing."
    ]
  },
  {
    title: "Buyer requests and leads",
    body: [
      "Buyer requests may include product needed, quantity, region, district, buyer type, deadline, and notes. Ghana Growers reviews requests before publishing or matching them.",
      "Lead requests help Ghana Growers understand who wants to contact a farmer, supplier, or listing owner. Ghana Growers may use these details to support follow-up."
    ]
  },
  {
    title: "Contact information",
    body: [
      "Phone, WhatsApp, and email details are used for review and follow-up. Ghana Growers may choose not to expose direct contact details publicly during pre-launch or early launch.",
      "Users should not submit another person's contact details unless they have permission to do so."
    ]
  },
  {
    title: "Data protection and corrections",
    body: [
      "Ghana Growers aims to keep records accurate and useful. If a profile, request, or listing is wrong, contact Ghana Growers so the record can be reviewed, corrected, archived, or removed from public display.",
      "As the platform grows, Ghana Growers may add stronger account controls, permissions, and data management tools."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy Policy"
        title="How Ghana Growers handles submitted information"
        description="Ghana Growers collects information so farmers can be reviewed, buyers can submit demand, suppliers can be listed, and the team can follow up on real agricultural enquiries."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact">Ask a Privacy Question</ButtonLink>
          <ButtonLink href="/terms-of-use" variant="light">Read Terms of Use</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.28fr_0.72fr] lg:px-8">
          <aside className="h-fit rounded-md border border-leaf-900/10 bg-[#ECE7D1] p-5 shadow-sm">
            <LockKeyhole className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-ink">Plain-language privacy note</h2>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              This page explains the current Ghana Growers privacy approach in simple terms. It is written for farmers, buyers, suppliers, and partners using the platform during pre-launch and early launch.
            </p>
          </aside>

          <div className="grid gap-5">
            {sections.map((section) => (
              <article key={section.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 shrink-0 text-leaf-700" size={20} aria-hidden="true" />
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
