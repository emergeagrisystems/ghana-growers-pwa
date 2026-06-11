import { Facebook, Instagram, Linkedin, LockKeyhole, MessageCircle, ShoppingBasket, Sprout, Store, UsersRound } from "lucide-react";
import { PrelaunchWaitlistForm } from "@/components/PrelaunchWaitlistForm";
import { SafeImage } from "@/components/SafeImage";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata = {
  title: "Launching Soon",
  description:
    "Ghana Growers is preparing to connect farmers, buyers, and suppliers across Ghana through a trusted agricultural network.",
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "Ghana's Agricultural Network is Growing",
    description: "Ghana Growers is preparing to connect farmers, buyers, and suppliers across Ghana.",
    images: ["/images/marketplace/ghana-market-1.jpg"]
  }
};

const benefits = [
  {
    title: "Benefits for Farmers",
    description: "Prepare to showcase farm profiles, products, harvest seasons, availability, and WhatsApp contact options to serious buyers.",
    icon: Sprout
  },
  {
    title: "Benefits for Buyers",
    description: "Discover farmer directories, buyer request tools, market intelligence, and trusted ways to confirm supply before trade.",
    icon: ShoppingBasket
  },
  {
    title: "Benefits for Suppliers",
    description: "List agricultural inputs, equipment, packaging, logistics, finance, storage, and consulting services for Ghana's farm economy.",
    icon: Store
  }
];

const socials = [
  { label: "Facebook", icon: Facebook },
  { label: "Instagram", icon: Instagram },
  { label: "LinkedIn", icon: Linkedin }
];

export default function LaunchingSoonPage() {
  return (
    <div className="min-h-screen bg-leaf-50">
      <section className="ghana-grid">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black uppercase text-earth-700 shadow-soft">
              <LockKeyhole size={16} aria-hidden="true" />
              Launching Soon
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
              Ghana&apos;s Agricultural Network is Growing
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              Ghana Growers is preparing to connect farmers, buyers, and suppliers across Ghana.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <WhatsAppButton
                message="Hello Ghana Growers, I want to know when the platform launches."
                label="Contact on WhatsApp"
              />
              <span className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-black text-leaf-700 shadow-soft">
                Launching Soon
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            <SafeImage
              src="/images/marketplace/ghana-market-1.jpg"
              alt="Ghana market scene with fresh produce"
              width={720}
              height={480}
              className="h-auto w-full rounded-md border border-leaf-900/10 bg-white object-cover shadow-soft"
              priority
              fallbackKind="default"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {["Farmers", "Buyers", "Suppliers"].map((label) => (
                <div key={label} className="rounded-md bg-white p-4 text-center shadow-soft">
                  <p className="text-sm font-black uppercase text-earth-700">{label}</p>
                  <p className="mt-1 text-xs font-bold text-ink/55">Preparing for launch</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-md bg-ink p-6 text-white sm:p-8">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
                <UsersRound size={18} aria-hidden="true" />
                What Ghana Growers is
              </p>
              <h2 className="mt-4 text-3xl font-black">A trusted agricultural connection platform for Ghana</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                Ghana Growers is building a digital network where farmers can be discovered, buyers can find supply, and suppliers can support agricultural trade with inputs, services, market information, and practical tools.
              </p>
              <div className="mt-6 flex gap-3">
                {socials.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span key={item.label} className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white/80" title={`${item.label} channel`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                    <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                      <Icon size={23} aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-ink">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink/65">{benefit.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
              <MessageCircle size={18} aria-hidden="true" />
              Stay connected
            </p>
            <h2 className="mt-3 text-3xl font-black text-ink">Join the waiting list while we prepare the network</h2>
            <p className="mt-4 text-sm leading-7 text-ink/65">
              Public pages are temporarily hidden while Ghana Growers continues development. Farmers, buyers, and suppliers can still register interest before launch.
            </p>
          </div>
          <PrelaunchWaitlistForm />
        </div>
      </section>
    </div>
  );
}
