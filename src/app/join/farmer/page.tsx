import { ArrowLeft, CheckCircle2, ShoppingBasket, Sprout } from "lucide-react";
import Link from "next/link";
import { FarmerRegistrationForm } from "@/components/FarmerRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Register Your Farm",
  description: "Submit a private farmer application for Ghana Growers to review. Registration does not publish a public profile automatically.",
  path: "/join/farmer"
});

const expectations = [
  "Your application will be reviewed.",
  "Registration does not publish a profile automatically.",
  "Ghana Growers may contact you for more details.",
  "Private contact details and application documents are not shown publicly.",
  "Applying does not guarantee approval, buyers, sales or publication."
];

export default function JoinFarmerPage() {
  return (
    <>
      <PrelaunchHeader />
      <PageHero
        eyebrow="JOIN AS A FARMER"
        title="Register your farm with Ghana Growers."
        description="Tell us about your farm and what you grow or produce. Ghana Growers will review your application and may contact you for more information."
        variant="compact"
      >
        <Link href="/join" className="gg-text-link inline-flex min-h-11 items-center gap-2 rounded-md px-1">
          <ArrowLeft size={17} aria-hidden="true" /> Back to Join the Network
        </Link>
      </PageHero>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-start lg:px-8">
          <aside className="grid gap-5 lg:sticky lg:top-24">
            <section className="rounded-md border border-earth-500/20 bg-ivory p-5 sm:p-6">
              <p className="gg-eyebrow">Before you submit</p>
              <div className="mt-5 grid gap-3">
                {expectations.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-leaf-700" aria-hidden="true" />
                    <p className="text-sm leading-6 text-ink/68">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md bg-leaf-800 p-5 text-white sm:p-6">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-earth-500 text-leaf-900">
                <Sprout size={21} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-black">Registration and selling are separate</h2>
              <p className="mt-3 text-sm leading-6 text-white/76">
                This form applies to join Ghana Growers. When you have produce to sell, use the separate marketplace listing form.
              </p>
              <Link href="/submit-listing" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-black text-earth-300 underline decoration-earth-400/60 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-earth-300">
                <ShoppingBasket size={17} aria-hidden="true" /> Submit Produce
              </Link>
            </section>
          </aside>

          <FarmerRegistrationForm />
        </div>
      </section>
      <PrelaunchFooter />
    </>
  );
}
