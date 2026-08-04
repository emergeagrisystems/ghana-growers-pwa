import { ArrowRight, CheckCircle2, ShoppingBasket, Sprout, Truck } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Join Ghana Growers",
  description: "Choose the buyer, farmer, supplier or agricultural service pathway that fits how you want to connect with Ghana Growers.",
  path: "/join"
});

const joinOptions = [
  {
    title: "Looking for farm produce?",
    description: "Browse current listings or tell Ghana Growers what produce or agricultural supply you need.",
    status: "Available now",
    primaryLabel: "Browse Marketplace",
    primaryHref: "/marketplace",
    secondaryLabel: "Request sourcing support",
    secondaryHref: "/submit-buyer-request",
    detail: "Buyers can browse without registering for a public profile.",
    icon: ShoppingBasket
  },
  {
    title: "Are you a farmer?",
    description: "Register your farm to join Ghana Growers, or submit produce when you have a harvest to sell.",
    status: "Farmer registration open",
    primaryLabel: "Register as a Farmer",
    primaryHref: "/join/farmer",
    secondaryLabel: "Submit Produce",
    secondaryHref: "/submit-listing",
    detail: "Registration creates a private application for review. Submit Produce is a separate marketplace-listing pathway.",
    icon: Sprout
  },
  {
    title: "Supply farm inputs, tools or services?",
    description: "Apply to offer agricultural products, equipment, logistics, packaging or related agricultural support.",
    status: "Applications open",
    primaryLabel: "Apply as a Supplier",
    primaryHref: "/become-a-supplier",
    secondaryLabel: "Submit Farm Inputs",
    secondaryHref: "/submit-listing",
    detail: "Agricultural service providers use the supplier-application pathway. Applications are reviewed before public visibility.",
    icon: Truck
  }
] as const;

const expectations = [
  "Listings, applications and sourcing requests are reviewed.",
  "Public profiles and listings do not appear automatically.",
  "Ghana Growers may contact you for more information.",
  "Private contact details are not shown publicly.",
  "Applying or submitting does not guarantee approval, a buyer, a sale or a connection."
];

export default function JoinPage() {
  return (
    <>
      <PrelaunchHeader />
      <PageHero
        eyebrow="JOIN GHANA GROWERS"
        title="Choose how you want to connect."
        description="Buyers can explore the Marketplace or request sourcing support. Farmers can register to join Ghana Growers and submit produce for review. Suppliers and agricultural service providers can apply to join the network."
      />

      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {joinOptions.map((option) => {
            const Icon = option.icon;
            return (
              <article key={option.title} className="flex min-w-0 flex-col rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-soft sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-700 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10">
                    {option.status}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-black text-ink">{option.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink/68">{option.description}</p>
                <p className="mt-4 text-xs leading-5 text-ink/58">{option.detail}</p>
                <div className="mt-auto grid gap-3 pt-6">
                  <Link href={option.primaryHref} className="gg-button-primary min-h-11 w-full justify-between">
                    {option.primaryLabel} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                  <Link href={option.secondaryHref} className="gg-button-secondary min-h-11 w-full justify-between">
                    {option.secondaryLabel} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-leaf-900/10 bg-mist py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="gg-eyebrow">Before you continue</p>
            <h2 className="mt-3 text-3xl font-black text-ink">What to expect from Ghana Growers</h2>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {expectations.map((item) => (
              <div key={item} className="flex min-h-24 items-start gap-3 rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-leaf-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-ink/68">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PrelaunchFooter />
    </>
  );
}
