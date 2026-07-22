import { ArrowRight, BadgeCheck, BarChart3, Leaf, Sprout, Tractor, Wheat, CloudSun, ShoppingBasket } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Join Ghana Growers as a Farmer",
  description:
    "Join Ghana Growers as a farmer to sell your harvest, use GG FarmMate, and become part of Ghana's trusted agricultural network.",
  path: "/join/farmer"
});

const benefits = [
  {
    title: "Sell Your Harvest",
    description: "List your produce and connect with buyers looking for farm-fresh supply.",
    icon: ShoppingBasket
  },
  {
    title: "Farm Smarter",
    description: "Use GG FarmMate for weather, Crop Doctor and practical farming support.",
    icon: CloudSun
  },
  {
    title: "Build Trust",
    description: "Create a professional farmer profile and grow with the Ghana Growers network.",
    icon: BadgeCheck
  }
];

const produceCategories = [
  "Vegetables",
  "Fruits",
  "Roots & Tubers",
  "Grains",
  "Legumes",
  "Livestock",
  "Herbs",
  "Other Farm Produce"
];

const processSteps = [
  "Submit Application",
  "Ghana Growers Reviews",
  "Profile Prepared",
  "Listings Added",
  "Start Receiving Opportunities"
];

export default function JoinFarmerPage() {
  return (
    <main className="w-full max-w-[100vw] overflow-x-hidden bg-white">
      <section className="w-full max-w-[100vw] overflow-hidden bg-ivory py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-earth-700 ring-1 ring-earth-500/25">
              <Sprout size={15} aria-hidden="true" />
              Farmer Onboarding
            </p>
            <h1 className="gg-hero-title mt-6 max-w-[21rem] !text-[2.85rem] sm:max-w-3xl sm:!text-6xl lg:!text-7xl">
              Join Ghana Growers as a Farmer
            </h1>
            <p className="mt-6 max-w-[23rem] text-lg leading-8 text-ink/70 sm:max-w-2xl">
              Sell your harvest, access practical farming tools, and become part of Ghana&apos;s trusted agricultural network.
            </p>
            <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row">
              <a href="#farmer-application" className="gg-button-primary w-full sm:w-auto">
                Application Update
              </a>
              <div className="w-full sm:w-auto [&>a]:w-full sm:[&>a]:w-auto">
                <ButtonLink href="/farmer-hub" variant="secondary">
                  Open GG FarmMate
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-mist p-6">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-leaf-700 text-white">
                <Tractor size={28} aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-ink">A practical network for farmers</h2>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                Ghana Growers reviews farmer applications before public visibility so buyers can discover serious farms with confidence.
              </p>
              <div className="mt-6 grid gap-3">
                {["Produce profiles", "Buyer opportunities", "GG FarmMate tools", "Marketplace support", "Quality guidelines"].map((item) => (
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
          <div className="max-w-[23rem] sm:max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Why join</p>
            <h2 className="mt-3 break-words text-3xl font-black text-ink sm:text-4xl">Sell, learn and grow inside Ghana&apos;s agricultural network.</h2>
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
          <div className="max-w-[23rem] sm:max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">What farmers can list</p>
            <h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">What do you grow?</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">Ghana Growers organizes farmer profiles around clear categories buyers can understand quickly.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {produceCategories.map((category, index) => (
              <div key={category} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-leaf-900/10">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${index % 3 === 0 ? "bg-leaf-50 text-leaf-700" : index % 3 === 1 ? "bg-earth-500/20 text-earth-700" : "bg-ivory text-ink"}`}>
                  {index % 3 === 0 ? <Sprout size={18} aria-hidden="true" /> : index % 3 === 1 ? <Wheat size={18} aria-hidden="true" /> : <Leaf size={18} aria-hidden="true" />}
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
            <h2 className="mt-3 text-2xl font-black text-ink">Ghana Growers reviews every farmer before public visibility.</h2>
            <div className="mt-6 grid gap-3">
              {processSteps.map((step) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink/75">
                  <BadgeCheck size={17} className="shrink-0 text-leaf-700" aria-hidden="true" />
                  {step}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-leaf-900/10">
              <div className="flex items-start gap-3">
                <BarChart3 size={20} className="mt-0.5 shrink-0 text-earth-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-ink/68">
                  You can use GG FarmMate while your application is being reviewed.
                </p>
              </div>
            </div>
          </div>
          <section id="farmer-application" className="rounded-xl border border-leaf-900/10 bg-white p-6 shadow-soft sm:p-8" aria-live="polite">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Farmer application</p>
            <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Applications are temporarily unavailable</h2>
            <p className="mt-4 text-base leading-7 text-ink/68">
              Farmer applications are temporarily unavailable while we improve the application process.
            </p>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              You can still contact Ghana Growers or review the other ways to join the network.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/contact">Contact Ghana Growers</ButtonLink>
              <ButtonLink href="/join" variant="secondary">Join the Network</ButtonLink>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
