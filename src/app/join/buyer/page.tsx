import { Building2, ShoppingBasket, Truck } from "lucide-react";
import { BuyerRegistrationForm } from "@/components/BuyerRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { buyerTypes } from "@/data/buyerTypes";

export const metadata = {
  title: "Join as a Buyer",
  description:
    "Register as a buyer with Ghana Growers to source fresh produce from farmers and agricultural suppliers in Ghana."
};

export default function JoinBuyerPage() {
  return (
    <>
      <PrelaunchHeader />
      <PageHero
        eyebrow="Join as a Buyer"
        title="Register your produce buying needs"
        description="Tell Ghana Growers what you buy, how often you buy, and where you operate so we can help connect you with trusted farmers and supply support."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div className="grid gap-4 self-start">
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
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
                <div key={item.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
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
