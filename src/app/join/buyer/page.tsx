import { Building2, ShoppingBasket, Truck } from "lucide-react";
import { BuyerRegistrationForm } from "@/components/BuyerRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { buyerTypes } from "@/data/buyerTypes";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Join as a Buyer",
  description:
    "Register as a buyer with Ghana Growers to source fresh produce from farmers and agricultural suppliers in Ghana.",
  path: "/join/buyer"
});

export default function JoinBuyerPage() {
  return (
    <>
      <PrelaunchHeader />
      <PageHero
        eyebrow="Join as a Buyer"
        title="Join the Network as a Buyer"
        description="Tell Ghana Growers what you buy, how often you buy, and where you operate so we can help connect you with trusted farmers and supply support."
        variant="compact"
      />
      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:px-8">
          <div className="grid gap-4 self-start rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Buyer benefits</p>
              <h2 className="mt-2 text-xl font-black text-ink">Source produce with clearer demand</h2>
            </div>
            <div className="rounded-md border border-earth-500/25 bg-earth-50 p-4">
              <h2 className="text-lg font-black text-ink">What happens after you register?</h2>
              <ol className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-ink/68">
                <li>1. Ghana Growers reviews your buying needs and contact details.</li>
                <li>2. The team can match serious demand with suitable farmers, suppliers, or listings.</li>
                <li>3. You can also request sourcing support when you need a product by a deadline.</li>
              </ol>
            </div>
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
                <ShoppingBasket size={22} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-black text-ink">Who can join?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {buyerTypes.map((type) => (
                  <span key={type} className="rounded-md bg-white px-3 py-1 text-xs font-bold text-leaf-700">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            {[
              {
                title: "Fresh produce sourcing",
                description: "Share crop needs, purchase volume, and frequency so Ghana Growers can understand demand.",
                icon: Building2
              },
              {
                title: "Bulk and recurring supply",
                description: "Support market women, restaurants, hotels, caterers, shops, exporters, and processors with clearer sourcing requests.",
                icon: Truck
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{item.description}</p>
                </div>
              );
            })}
          </div>
          <BuyerRegistrationForm />
        </div>
      </section>
      <PrelaunchFooter />
    </>
  );
}
