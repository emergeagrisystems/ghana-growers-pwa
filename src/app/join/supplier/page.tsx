import { Boxes, Handshake, Truck } from "lucide-react";
import { SupplierRegistrationForm } from "@/components/SupplierRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { supplierCategories } from "@/data/supplierCategories";

export const metadata = {
  title: "Become a Supplier",
  description:
    "Register as a Ghana Growers supplier for seeds, fertilizer, agrochemicals, equipment, irrigation, packaging, logistics, storage, finance, or consulting."
};

export default function JoinSupplierPage() {
  return (
    <>
      <PageHero
        eyebrow="Become a Supplier"
        title="List your agricultural products and services"
        description="Register your company so Ghana Growers can understand what you supply, where you operate, and how you can support farmers and buyers."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div className="grid gap-4 self-start">
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
