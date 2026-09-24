import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  MessageSquareText,
  PackageCheck,
  Send,
  Sprout,
  Tractor,
  type LucideIcon
} from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sell",
  description: "Sell harvests, agricultural products, and farm services through Ghana Growers.",
  path: "/sell"
});

const sellerActions = [
  {
    title: "Sell Farm Produce",
    description: "Submit fruits, vegetables, grains, roots, tubers, livestock or other farm produce.",
    href: "/submit-listing",
    cta: "Submit Produce",
    icon: Sprout,
    image: "/images/marketplace/fresh-tomatoes.jpg",
    imageAlt: "Fresh farm produce arranged at a Ghanaian market"
  },
  {
    title: "List Farm Inputs & Tools",
    description: "Submit seeds, fertilizer, equipment, packaging and other farm supplies.",
    href: "/submit-listing",
    cta: "Submit Farm Inputs",
    icon: PackageCheck,
    image: "/images/products/farm-inputs.jpg",
    imageAlt: "Farm inputs displayed on shelves"
  },
  {
    title: "Offer Agricultural Services",
    description:
      "Apply to offer transport, ploughing, spraying, equipment rental, storage, packaging or other agricultural support.",
    href: "/become-a-supplier",
    cta: "Apply to Offer Services",
    icon: Tractor,
    image: "/images/marketplace/logistics-truck.jpg",
    imageAlt: "Agricultural transport carrying packaged goods"
  }
];

const sellingSteps: Array<[string, string, LucideIcon]> = [
  ["Submit your details", "Tell us what you sell or offer.", Send],
  ["We check the information", "Ghana Growers reviews the details and may ask for more information.", ClipboardCheck],
  ["Approved submissions go public", "If approved, your listing or supplier profile can appear on Ghana Growers.", Globe2],
  [
    "Buyers send enquiries",
    "Buyers can submit requests through Ghana Growers. Prices, quantities and delivery are confirmed during follow-up.",
    MessageSquareText
  ]
];

const submissionExpectations = [
  "Submitting does not guarantee approval, publication or a sale.",
  "Ghana Growers may contact you for more information.",
  "Availability, quantities, prices, pickup and delivery are confirmed during follow-up.",
  "Private contact details are not shown publicly."
];

export default function SellPage() {
  return (
    <>
      <section className="bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="gg-eyebrow text-earth-700/80">SELL ON GHANA GROWERS</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
            What do you want to sell?
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-ink/68 sm:text-lg sm:leading-8">
            Farmers can submit produce and harvests. Suppliers can submit farm inputs, tools and equipment or apply to
            offer agricultural services. Every submission is reviewed before it appears publicly.
          </p>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            {sellerActions.map((action) => {
              const Icon = action.icon;

              return (
                <article
                  key={action.title}
                  className="group flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft"
                >
                  <SafeImage
                    src={action.image}
                    alt={action.imageAlt}
                    width={620}
                    height={380}
                    fallbackKind="crop"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="h-32 w-full shrink-0 object-cover transition duration-500 group-hover:scale-[1.03] sm:h-36"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-leaf-600 text-white">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-xl font-black text-ink">{action.title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-6 text-ink/66">{action.description}</p>
                    <Link
                      href={action.href}
                      className="focus-ring mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900"
                    >
                      {action.cta}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="brand-surface-dark mx-auto max-w-7xl rounded-md border border-earth-100/15 p-5 shadow-soft sm:p-6">
          <h2 className="text-2xl font-black sm:text-3xl">What happens next?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sellingSteps.map(([title, description, Icon], index) => (
              <article key={title} className="border-t border-white/20 pt-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-earth-500 text-leaf-900">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-earth-100">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="brand-body mt-2 text-sm font-semibold leading-6">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-ink sm:text-3xl">Before you submit</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {submissionExpectations.map((expectation) => (
              <div
                key={expectation}
                className="flex min-h-16 items-start gap-3 rounded-md border border-leaf-900/10 bg-white px-4 py-4 shadow-card"
              >
                <CheckCircle2 className="mt-0.5 shrink-0 text-leaf-700" size={20} aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-ink/72">{expectation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-2xl font-black text-ink">Not sure which pathway to choose?</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/68">
              Tell Ghana Growers what you want to offer and we will point you to the right submission process.
            </p>
          </div>
          <ButtonLink href="/contact">Contact Ghana Growers</ButtonLink>
        </div>
      </section>
    </>
  );
}
