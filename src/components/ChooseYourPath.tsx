import Link from "next/link";
import { ShoppingBasket, Sprout, Tractor, type LucideIcon } from "lucide-react";

type PathCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryLabel: string;
  primaryHref: string;
  tone: "leaf" | "earth" | "cream";
};

const pathCards: PathCard[] = [
  {
    title: "Grow & Sell",
    description: "Sell produce and connect with buyers.",
    icon: Sprout,
    primaryLabel: "Join as a Farmer",
    primaryHref: "/join/farmer",
    tone: "leaf"
  },
  {
    title: "Buy Produce",
    description: "Find trusted farmers and available produce.",
    icon: ShoppingBasket,
    primaryLabel: "Find Produce",
    primaryHref: "/marketplace",
    tone: "earth"
  },
  {
    title: "Supply Farmers",
    description: "Promote agricultural products and services.",
    icon: Tractor,
    primaryLabel: "Become a Supplier",
    primaryHref: "/become-a-supplier",
    tone: "cream"
  }
];

const toneClasses = {
  leaf: {
    icon: "bg-leaf-600 text-white",
    ring: "group-hover:border-leaf-600/35 group-hover:shadow-[0_22px_60px_rgba(53,96,27,0.14)]"
  },
  earth: {
    icon: "bg-earth-500 text-ink",
    ring: "group-hover:border-earth-500/45 group-hover:shadow-[0_22px_60px_rgba(223,174,74,0.18)]"
  },
  cream: {
    icon: "bg-ink text-white",
    ring: "group-hover:border-leaf-900/20 group-hover:shadow-[0_22px_60px_rgba(20,58,31,0.12)]"
  }
};

export function ChooseYourPath() {
  return (
    <section className="bg-[#143A1F] py-12 text-white sm:py-14" aria-labelledby="choose-your-path-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[18rem] text-center sm:max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-earth-500">Start here</p>
          <h2 id="choose-your-path-title" className="mt-3 break-words text-2xl font-black tracking-normal text-white sm:text-4xl">
            Choose Your Path
          </h2>
          <p className="mt-4 text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
            Whether you grow, buy, or supply, Ghana Growers helps you connect with the right people across Ghana&apos;s agricultural network.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pathCards.map((card, index) => {
            const Icon = card.icon;
            const tone = toneClasses[card.tone];

            return (
              <article
                key={card.title}
                className={`choose-path-card group flex h-full flex-col rounded-md border border-white/70 bg-white p-5 text-ink shadow-soft transition duration-300 ease-out hover:-translate-y-1 ${tone.ring} sm:p-6`}
                style={{ animation: `choosePathFadeUp 560ms ease-out ${index * 90}ms both` }}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${tone.icon}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <div className="mt-6 flex flex-1 flex-col">
                  <h3 className="text-xl font-black text-ink">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-ink/65">{card.description}</p>

                  <div className="mt-6">
                    <Link
                      href={card.primaryHref}
                      className="gg-button-primary"
                    >
                      {card.primaryLabel}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
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
