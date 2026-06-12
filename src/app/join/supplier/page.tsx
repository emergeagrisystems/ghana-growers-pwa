import { BadgeCheck, Boxes, Eye, Handshake, Store, Truck, Users } from "lucide-react";
import { SupplierRegistrationForm } from "@/components/SupplierRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { supplierCategories } from "@/data/supplierCategories";

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
      <PageHero
        eyebrow="Supplier Registration"
        title="Register your agricultural supply business"
        description="Join Ghana Growers to become visible to farmers, buyers, and agricultural partners looking for trusted products and services across Ghana."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div className="grid gap-4 self-start">
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Why register</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Supplier benefits</h2>
              <div className="mt-5 grid gap-3">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex gap-3 rounded-md bg-leaf-50 p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-ink">{benefit.title}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-ink/58">{benefit.description}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                <Boxes size={22} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-black text-ink">Supplier categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {supplierCategories.map((category) => (
                  <span key={category} className="rounded-md bg-white px-3 py-1 text-xs font-bold text-leaf-700">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            {[
              {
                title: "Reach the farm network",
                description: "Promote useful inputs, services, logistics, and support to farmers and buyers across Ghana.",
                icon: Handshake
              },
              {
                title: "Support stronger supply chains",
                description: "Help Ghana Growers map packaging, transport, storage, equipment, finance, and advisory capacity.",
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
          <SupplierRegistrationForm />
        </div>
      </section>
    </>
  );
}
