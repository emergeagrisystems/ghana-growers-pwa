import { ShieldCheck, Sprout, UsersRound } from "lucide-react";
import { FarmerRegistrationForm } from "@/components/FarmerRegistrationForm";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "Join as a Farmer",
  description:
    "Register your farm with Ghana Growers to access buyers, supplier support, learning resources, and digital agricultural tools."
};

export default function JoinFarmerPage() {
  return (
    <>
      <PageHero
        eyebrow="Join as a Farmer"
        title="Register your farm with Ghana Growers"
        description="Tell us what you grow or raise, where your farm is located, and when you expect harvest so we can help connect you with buyers and useful support."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div className="grid gap-4 self-start">
            {[
              {
                title: "Buyer access",
                description: "Help Ghana Growers understand your supply so buyer inquiries can be matched more clearly.",
                icon: UsersRound
              },
              {
                title: "Farm support",
                description: "Share your farm type, products, and support needs so suppliers and services are easier to connect.",
                icon: Sprout
              },
              {
                title: "Privacy notice",
                description: "Your information is used for onboarding, communication, and relevant trade support. You can request updates or deletion.",
                icon: ShieldCheck
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
          <FarmerRegistrationForm />
        </div>
      </section>
    </>
  );
}
