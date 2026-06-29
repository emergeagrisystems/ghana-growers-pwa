import { ArrowRight, BadgeCheck, Handshake, Leaf, ShieldCheck, Sprout, Store, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SupplierOnboardingForm } from "@/components/SupplierOnboardingForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Become a Ghana Growers Supplier",
  description:
    "Apply to become a Ghana Growers supplier and reach farmers, buyers, and agribusinesses looking for trusted agricultural products and services across Ghana.",
  path: "/become-a-supplier"
});

const benefits = [
  {
    title: "Reach Serious Customers",
    description: "Connect with farmers, buyers and agribusinesses looking for trusted suppliers.",
    icon: Store
  },
  {
    title: "Build Trust",
    description: "Verified profiles and the Ghana Growers Quality Standard help your business stand out.",
    icon: ShieldCheck
  },
  {
    title: "Grow With the Network",
    description: "Become part of Ghana's trusted agricultural ecosystem.",
    icon: Handshake
  }
];

const supplierCategories = [
  "Seeds",
  "Fertilizer",
  "Agrochemicals",
  "Machinery",
  "Irrigation",
  "Packaging",
  "Logistics & Transport",
  "Storage & Cold Chain",
  "Veterinary",
  "Finance",
  "Insurance",
  "Agricultural Services",
  "Other"
];

export default function BecomeSupplierPage() {
  return (
    <main className="w-full max-w-[100vw] overflow-x-hidden bg-white">
      <section className="w-full max-w-[100vw] overflow-hidden bg-ivory py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-earth-700 ring-1 ring-earth-500/25">
              <BadgeCheck size={15} aria-hidden="true" />
              Supplier Onboarding
            </p>
            <h1 className="gg-hero-title mt-6 max-w-[22rem] sm:max-w-3xl">
              Become a Ghana Growers Supplier
            </h1>
            <p className="mt-6 max-w-[22rem] text-lg leading-8 text-ink/70 sm:max-w-2xl">
              Reach farmers, buyers and agribusinesses looking for trusted agricultural products and services across Ghana.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#supplier-application" className="gg-button-primary w-[calc(100vw-2rem)] max-w-full sm:w-auto">
                Start Supplier Application
              </a>
              <div className="w-[calc(100vw-2rem)] max-w-full sm:w-auto [&>a]:w-full sm:[&>a]:w-auto">
                <ButtonLink href="/marketplace" variant="secondary">
                  Explore Marketplace
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="w-[calc(100vw-2rem)] min-w-0 max-w-full overflow-hidden rounded-2xl border border-leaf-900/10 bg-white p-5 shadow-soft sm:w-full sm:max-w-none sm:p-6">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-mist p-6">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-leaf-700 text-white">
                <Truck size={28} aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-ink">A trusted place for agricultural suppliers</h2>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                Ghana Growers reviews supplier applications before public visibility so farmers and buyers can discover serious businesses with confidence.
              </p>
              <div className="mt-6 grid gap-3">
                {["Inputs", "Equipment", "Logistics", "Packaging", "Services"].map((item) => (
                  <div key={item} className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink ring-1 ring-leaf-900/10">
                    <span className="min-w-0 truncate">{item}</span>
                    <ArrowRight size={15} className="text-earth-700" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-[100vw] overflow-hidden bg-white py-16 sm:py-20 lg:py-[120px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-[22rem] sm:max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Why join</p>
            <h2 className="mt-3 break-words text-3xl font-black text-ink sm:text-4xl">Build visibility inside Ghana&apos;s agricultural network.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className="rounded-2xl border border-leaf-900/10 bg-white p-6 shadow-soft">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-ink">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full max-w-[100vw] overflow-hidden bg-mist py-16 sm:py-20 lg:py-[120px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-[22rem] sm:max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Supplier categories</p>
            <h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">What can your business supply?</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">Choose the areas that match your products, services, and support capacity.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {supplierCategories.map((category, index) => (
              <div key={category} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-leaf-900/10">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${index % 3 === 0 ? "bg-leaf-50 text-leaf-700" : index % 3 === 1 ? "bg-earth-500/20 text-earth-700" : "bg-ivory text-ink"}`}>
                  {index % 3 === 0 ? <Sprout size={18} aria-hidden="true" /> : index % 3 === 1 ? <Truck size={18} aria-hidden="true" /> : <Leaf size={18} aria-hidden="true" />}
                </span>
                <span className="truncate text-sm font-black text-ink">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full max-w-[100vw] overflow-hidden bg-white py-16 sm:py-20 lg:py-[120px]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:px-8">
          <div className="min-w-0 rounded-2xl bg-ivory p-6 ring-1 ring-earth-500/25">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">What happens next</p>
            <h2 className="mt-3 text-2xl font-black text-ink">Ghana Growers reviews every supplier before visibility.</h2>
            <div className="mt-6 grid gap-3">
              {[
                "We review your application",
                "We verify your business details",
                "We prepare your supplier profile",
                "We contact you within one business day"
              ].map((step) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink/75">
                  <BadgeCheck size={17} className="shrink-0 text-leaf-700" aria-hidden="true" />
                  {step}
                </div>
              ))}
            </div>
          </div>
          <SupplierOnboardingForm />
        </div>
      </section>
    </main>
  );
}
