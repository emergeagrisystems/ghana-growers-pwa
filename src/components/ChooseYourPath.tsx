import Link from "next/link";
import { ArrowRight, ShoppingBasket, Sprout, Tractor, type LucideIcon } from "lucide-react";

type PathCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  tone: "leaf" | "earth" | "cream";
};

const pathCards: PathCard[] = [
  {
    title: "🌱 Grow & Sell",
    description:
      "Create your farmer profile, showcase your produce, connect with buyers, and access digital farm tools designed for Ghanaian farmers.",
    icon: Sprout,
    primaryLabel: "Join as Farmer",
    primaryHref: "/join/farmer",
    secondaryLabel: "View Buyer Requests",
    secondaryHref: "/buyer-requests",
    tone: "leaf"
  },
  {
    title: "🛒 Buy Produce",
    description: "Find farmers, browse available produce, post buying requests, and connect directly through WhatsApp.",
    icon: ShoppingBasket,
    primaryLabel: "Find Produce",
    primaryHref: "/marketplace",
    secondaryLabel: "Post Buyer Request",
    secondaryHref: "/submit-buyer-request",
    tone: "earth"
  },
  {
    title: "🚜 Supply Farmers",
    description: "Promote seeds, fertilizer, equipment, transport, and agricultural services to farmers across Ghana.",
    icon: Tractor,
    primaryLabel: "Join as Supplier",
    primaryHref: "/join/supplier",
    secondaryLabel: "Browse Suppliers",
    secondaryHref: "/supplier-directory",
    tone: "cream"
  }
];

const trustItems = ["115+ Farmers", "Buyer Demand Board", "Verified Profiles", "Digital Farm Tools"];

const toneClasses = {
  leaf: {
    shell: "from-leaf-50 via-white to-white",
    icon: "bg-leaf-600 text-white",
    ring: "group-hover:border-leaf-600/35 group-hover:shadow-[0_22px_60px_rgba(53,96,27,0.14)]"
  },
  earth: {
    shell: "from-earth-50 via-white to-white",
    icon: "bg-earth-500 text-ink",
    ring: "group-hover:border-earth-500/45 group-hover:shadow-[0_22px_60px_rgba(216,153,50,0.16)]"
  },
  cream: {
    shell: "from-white via-leaf-50/50 to-earth-50",
    icon: "bg-ink text-white",
    ring: "group-hover:border-leaf-900/20 group-hover:shadow-[0_22px_60px_rgba(19,32,19,0.12)]"
  }
};

export function ChooseYourPath() {
  return (
    <section className="bg-white py-14 sm:py-16" aria-labelledby="choose-your-path-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Start here</p>
          <h2 id="choose-your-path-title" className="mt-3 text-3xl font-black tracking-normal text-ink sm:text-4xl">
            Choose Your Path
          </h2>
          <p className="mt-4 text-base leading-7 text-ink/68 sm:text-lg sm:leading-8">
            Whether you grow, buy, or supply, Ghana Growers helps you connect with the right people across Ghana&apos;s agricultural network.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pathCards.map((card, index) => {
            const Icon = card.icon;
            const tone = toneClasses[card.tone];

            return (
              <article
                key={card.title}
                className={`choose-path-card group flex h-full flex-col rounded-lg border border-leaf-900/10 bg-gradient-to-br ${tone.shell} p-5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 ${tone.ring} sm:p-6`}
                style={{ animation: `choosePathFadeUp 560ms ease-out ${index * 90}ms both` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${tone.icon}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-ink/45 ring-1 ring-leaf-900/10">
                    Path {index + 1}
                  </span>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <h3 className="text-2xl font-black text-ink">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-ink/65">{card.description}</p>

                  <div className="mt-6 grid gap-3">
                    <Link
                      href={card.primaryHref}
                      className="focus-ring inline-flex items-center justify-center rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-leaf-700"
                    >
                      {card.primaryLabel}
                    </Link>
                    <Link
                      href={card.secondaryHref}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                    >
                      {card.secondaryLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border border-leaf-900/10 bg-leaf-50/75 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center justify-center gap-2 rounded-md bg-white px-3 py-3 text-sm font-black text-ink/75 ring-1 ring-leaf-900/10">
                <span className="h-2 w-2 rounded-full bg-leaf-600" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes choosePathFadeUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .choose-path-card {
              animation: none !important;
            }
          }
        `}
      </style>
    </section>
  );
}
