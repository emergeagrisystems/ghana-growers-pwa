import { CheckCircle2, Leaf, PackageCheck, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Ghana Growers Standard",
  description:
    "The Ghana Growers Standard is a practical member commitment framework built around sustainable farming, reliable supply, and quality produce.",
  path: "/gg-standard"
});

const pillars = [
  {
    title: "Sustainable Farming",
    icon: Leaf,
    description:
      "Members commit to farming and supply practices that protect soil, water, workers, and future production where possible."
  },
  {
    title: "Reliable Supply",
    icon: PackageCheck,
    description:
      "Members are expected to communicate clearly about availability, quantity, harvest timing, delivery or pickup, and any changes that affect buyers."
  },
  {
    title: "Quality Produce",
    icon: CheckCircle2,
    description:
      "Members should present produce, livestock, inputs, and services honestly so buyers understand grade, condition, packaging, and handling needs before trade."
  }
];

export default function GGStandardPage() {
  return (
    <>
      <PageHero
        eyebrow="GG Standard"
        title="A practical trust framework for Ghana Growers members"
        description="The Ghana Growers Standard is not a certificate. It is a clear commitment framework for farmers and suppliers who want to show that they take sustainable farming, reliable supply, and quality seriously."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/join">Join the Network</ButtonLink>
          <ButtonLink href="/verification-process" variant="light">View Verification Process</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <article key={pillar.title} className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-ink">{pillar.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-ink/66">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.68fr_0.32fr] lg:items-start lg:px-8">
          <div>
            <p className="gg-eyebrow">How it works</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">GG Standard is separate from verification.</h2>
            <div className="mt-6 grid gap-4">
              {[
                "Verification checks whether a profile or request has been reviewed by Ghana Growers.",
                "GG Standard membership shows that a farmer or supplier has accepted the platform commitment around farming practice, supply communication, and product quality.",
                "A member can be verified without being a GG Standard Member. A GG Standard Member can also be suspended if the commitment is not followed."
              ].map((point) => (
                <div key={point} className="flex gap-3 rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/68 shadow-sm">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-leaf-700" aria-hidden="true" />
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-md border border-leaf-900/10 bg-ink p-6 text-white shadow-soft">
            <p className="text-sm font-black uppercase tracking-wide text-earth-500">What the badge means</p>
            <h2 className="mt-3 text-2xl font-black">GG Standard Member</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              The badge means the profile is part of the Ghana Growers commitment framework. It does not guarantee every transaction. Buyers should still confirm quantity, grade, packaging, timing, delivery, and payment before trade.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="gg-eyebrow">For members</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">A stronger way to build trust before trade.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink/66">
            Ghana Growers will keep improving the standard over time. Future versions may include scoring, training records, product handling checks, and buyer feedback, but this first version stays simple and practical.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/farmer-directory">Find Farmers</ButtonLink>
            <ButtonLink href="/supplier-directory" variant="secondary">Find Suppliers</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
