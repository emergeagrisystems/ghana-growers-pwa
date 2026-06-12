import { BadgeCheck, Eye, Handshake, Store, Users } from "lucide-react";
import { SupplierRegistrationForm } from "@/components/SupplierRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";

export const metadata = {
  title: "Supplier Registration",
  description:
    "Register as a Ghana Growers supplier to reach farmers, buyers, and agricultural businesses across Ghana."
};

export default function JoinSupplierPage() {
  const benefits = [
    {
      title: "Supplier Directory profile",
      description: "Create a public supplier profile farmers and buyers can discover.",
      icon: Store
    },
    {
      title: "Visibility to farmers",
      description: "Promote inputs, equipment, logistics, finance, and advisory services to Ghanaian farmers.",
      icon: Users
    },
    {
      title: "Visibility to buyers",
      description: "Show buyers and aggregators where your services can support agricultural trade.",
      icon: Eye
    },
    {
      title: "Verification opportunity",
      description: "Apply for Ghana Growers review so trusted suppliers can stand out.",
      icon: BadgeCheck
    },
    {
      title: "Marketplace exposure",
      description: "Prepare your products and services for future marketplace listing opportunities.",
      icon: Handshake
    }
  ];

  return (
    <>
      <PrelaunchHeader />
      <PageHero
        eyebrow="Supplier Registration"
        title="Join Ghana Growers as a Supplier"
        description="Join Ghana Growers to become visible to farmers, buyers, and agricultural partners looking for trusted products and services across Ghana."
        variant="compact"
      />
      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:px-8">
          <div className="grid gap-4 self-start rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Supplier benefits</p>
              <h2 className="mt-2 text-xl font-black text-ink">Reach farmers, buyers, and agribusiness partners</h2>
            </div>
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-ink">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{benefit.description}</p>
                </div>
              );
            })}
          </div>
          <SupplierRegistrationForm />
        </div>
      </section>
      <PrelaunchFooter />
    </>
  );
}
