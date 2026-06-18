import Link from "next/link";
import { LockKeyhole, ShoppingBasket, Sprout, Store, UsersRound } from "lucide-react";
import { PrelaunchFooter, PrelaunchHeader } from "@/components/PrelaunchShell";
import { SafeImage } from "@/components/SafeImage";

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
    images: ["/images/hero/ghana-growers-hero.jpg"]
  }
};

const registrationCards = [
  {
    title: "Register as Farmer",
    description: "Share your farm, products, location, and harvest information before the platform opens.",
    href: "/join/farmer",
    icon: Sprout
  },
  {
    title: "Register as Buyer",
    description: "Tell Ghana Growers what you buy, where you operate, and the produce you need.",
    href: "/join/buyer",
    icon: ShoppingBasket
  },
  {
    title: "Register as Supplier",
    description: "List farm inputs, equipment, logistics, packaging, finance, or agricultural services.",
    href: "/supplier-registration",
    icon: Store
  },
  {
    title: "Submit Buyer Request",
    description: "Tell Ghana Growers what produce you need so demand can be reviewed before launch.",
    href: "/submit-buyer-request",
    icon: ShoppingBasket
  }
];

const benefitCards = [
  {
    title: "What Ghana Growers is",
    description:
      "A trusted agricultural connection platform being prepared for Ghana's farmers, buyers, suppliers, and agribusiness partners.",
    icon: UsersRound
  }
];

export default function LaunchingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-leaf-50/70 to-earth-50/70">
      <PrelaunchHeader />
      <main>
        <section>
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:px-8 lg:py-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black uppercase text-earth-700 shadow-sm ring-1 ring-leaf-900/10">
                <LockKeyhole size={16} aria-hidden="true" />
                Launching Soon
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
                Ghana&apos;s Agricultural Network is Growing
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">
                Ghana Growers is preparing to connect farmers, buyers, and suppliers across Ghana.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/62">
                We are currently onboarding farmers, buyers, and agricultural suppliers before opening the full platform to the public.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {registrationCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link
                      key={card.href}
                      href={card.href}
                      className="focus-ring group rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white transition group-hover:bg-leaf-700">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <span className="mt-4 block text-base font-black text-ink">{card.title}</span>
                      <span className="mt-2 block text-sm font-semibold leading-6 text-ink/58">{card.description}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rounded-md bg-leaf-600/10" aria-hidden="true" />
              <SafeImage
                src="/images/hero/ghana-growers-hero.jpg"
                alt="Ghanaian agriculture network with farmers and fresh produce"
                width={820}
                height={620}
                className="relative aspect-[4/3] w-full rounded-md border border-white bg-white object-cover shadow-soft"
                priority
                fallbackKind="default"
                sizes="(min-width: 1024px) 48vw, 100vw"
              />
            </div>
          </div>
        </section>

        <section className="bg-white/78 py-12">
          <div className="mx-auto grid max-w-3xl gap-5 px-4 sm:px-6 lg:px-8">
            {benefitCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-xl font-black text-ink">{card.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-ink/64">{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <PrelaunchFooter />
    </div>
  );
}
