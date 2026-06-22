import { BadgeCheck, Building2, MessageCircle, Phone, ShieldCheck, UserCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Verification Requirements",
  description:
    "Learn how Ghana Growers uses phone, WhatsApp, identity, and optional business verification to build trust across farmers, buyers, and suppliers.",
  path: "/verification-requirements"
});

const requirements = [
  {
    title: "Phone Verification",
    description:
      "Confirms that a listed farmer, buyer, or supplier can be reached through a working Ghanaian phone contact.",
    icon: Phone
  },
  {
    title: "WhatsApp Verification",
    description:
      "Checks that the contact can respond through WhatsApp, since many farm inquiries and buyer follow-ups happen there.",
    icon: MessageCircle
  },
  {
    title: "Identity Verification",
    description:
      "Allows Ghana Growers to record basic identity information for safer directory listings and buyer request follow-up.",
    icon: UserCheck
  },
  {
    title: "Business Verification",
    description:
      "Optional for farmer groups, buyers, and suppliers that want to submit business registration or organization details.",
    icon: Building2
  }
];

const badges = [
  "Verified Farmer",
  "Verified Buyer",
  "Verified Supplier",
  "Premium Member"
];

export default function VerificationRequirementsPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust & Verification"
        title="Clear verification signals for safer agricultural trade"
        description="Ghana Growers uses simple verification steps to help farmers, buyers, and suppliers understand who they are contacting before arranging supply, payment, logistics, or services."
      />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Requirements"
            title="How profile verification works"
            description="Verification does not replace due diligence, but it gives the Ghana Growers community clearer contact and profile signals."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {requirements.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-ink">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-md bg-ink p-6 text-white sm:p-8">
            <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
              <ShieldCheck size={18} aria-hidden="true" />
              Badge meanings
            </p>
            <h2 className="mt-3 text-3xl font-black">Trust badges shown across the platform</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-700">
                  <BadgeCheck size={17} aria-hidden="true" />
                  {badge}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/70">
              Members should still confirm current supply, pricing, product quality, delivery terms, and payment expectations before committing to any transaction.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
