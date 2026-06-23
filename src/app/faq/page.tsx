import { HelpCircle, ShieldCheck, Sprout, Store, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { FaqExplorer } from "@/components/FaqExplorer";
import { PageHero } from "@/components/PageHero";
import { faqItems } from "@/data/trustCenter";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "FAQ & Trust Center",
  description:
    "Answers for farmers, buyers, suppliers, and partners about joining Ghana Growers, verification, buyer requests, lead handling, and trust and safety.",
  path: "/faq"
});

const sections = [
  {
    title: "Farmers",
    description: "Joining, verification, buyer contact, listings, and marketplace visibility.",
    icon: Sprout
  },
  {
    title: "Buyers",
    description: "Finding farmers, submitting buyer requests, lead follow-up, and verified records.",
    icon: UsersRound
  },
  {
    title: "Suppliers",
    description: "Registration, featured placement enquiries, and visibility opportunities.",
    icon: Store
  },
  {
    title: "Trust & Safety",
    description: "Verification, privacy, contact methods, and reporting issues.",
    icon: ShieldCheck
  }
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ & Trust Center"
        title="Clear answers for Ghana Growers members"
        description="Learn how Ghana Growers handles registration, verification, buyer demand, lead requests, supplier visibility, and safer agricultural connections."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/verification-process">View Verification Process</ButtonLink>
          <ButtonLink href="/join" variant="light">Join Ghana Growers</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-earth-50 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                  <Icon size={21} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-xl font-black text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/64">{section.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <FaqExplorer items={faqItems} />

      <section className="bg-leaf-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <HelpCircle className="mx-auto text-leaf-700" size={34} aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black text-ink sm:text-3xl">Still have a question?</h2>
          <p className="mt-3 text-sm leading-7 text-ink/65">
            If your question is not answered here, contact Ghana Growers with your role, product or service, region, and the support you need.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact">Contact Ghana Growers</ButtonLink>
            <ButtonLink href="/join" variant="secondary">Join the Network</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
