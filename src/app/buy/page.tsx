import Link from "next/link";
import { ArrowRight, Handshake, MapPinned, ShieldCheck, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Buy",
  description: "Buy fresh produce and farm inputs through Ghana Growers.",
  path: "/buy"
});

const stats = [
  ["Verified Farmers", "120+"],
  ["Regions Covered", "10"],
  ["Fresh Harvests", "40+"],
  ["Trusted Suppliers", "25+"]
];

const mainCards = [
  {
    title: "Buy Fresh Produce",
    description: "Buy directly from trusted farmers across Ghana.",
    href: "/marketplace",
    cta: "Browse Produce",
    image: "/images/marketplace/fresh-tomatoes.jpg",
    alt: "Fresh tomatoes ready for buyers"
  },
  {
    title: "Buy Farm Inputs",
    description: "Find seeds, fertilizer, tools and agricultural supplies.",
    href: "/supplier-directory",
    cta: "Find Suppliers",
    image: "/images/marketplace/farm-inputs.jpg",
    alt: "Farm inputs and agricultural supplies"
  }
];

const categories = [
  ["Vegetables", "/images/products/vegetables.jpg"],
  ["Fruits", "/images/products/fruits.jpg"],
  ["Grains", "/images/products/cereals.jpg"],
  ["Legumes", "/images/products/legumes.jpg"],
  ["Spices", "/images/products/pepper.jpg"],
  ["Roots & Tubers", "/images/products/tubers.jpg"]
];

const trustCards = [
  ["Verified Network", "Connect with farmers and suppliers reviewed for Ghana Growers visibility.", ShieldCheck],
  ["Reliable Sourcing", "Find produce and inputs through a focused agricultural network.", Truck],
  ["Across Ghana", "Discover farmers, suppliers and opportunities across multiple regions.", MapPinned],
  ["Personal Support", "Get help when you need a product, supplier or connection.", Handshake]
];

export default function BuyPage() {
  return (
    <>
      <section className="overflow-hidden bg-earth-50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-20">
          <div className="buy-sell-fade animate-[buySellFadeUp_640ms_ease-out_both]">
            <p className="gg-eyebrow text-earth-700/80">Buy Through Ghana Growers</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
              Buy Fresh From Trusted Farmers
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg sm:leading-8">
              Source fresh produce and farm inputs through Ghana Growers, with access to farmer profiles, trusted suppliers and practical support for finding what your business needs.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/marketplace">Browse Produce</ButtonLink>
              <ButtonLink href="/supplier-directory" variant="secondary">Find Suppliers</ButtonLink>
            </div>
          </div>

          <div className="buy-sell-fade animate-[buySellFadeUp_720ms_ease-out_120ms_both] overflow-hidden rounded-md border border-white/80 bg-white p-1 shadow-soft">
            <SafeImage
              src="/images/marketplace/ghana-market-1.jpg"
              alt="Fresh produce displayed at a Ghanaian agricultural market"
              width={1100}
              height={820}
              fallbackKind="crop"
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="aspect-[4/3] w-full rounded-md object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map(([label, value], index) => (
            <div
              key={label}
              className="buy-sell-fade animate-[buySellFadeUp_560ms_ease-out_both] rounded-md border border-leaf-900/10 bg-white px-5 py-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="text-3xl font-black text-leaf-700">{value}</p>
              <p className="mt-1 text-sm font-bold text-ink/62">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-leaf-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            {mainCards.map((card, index) => (
              <article
                key={card.title}
                className="group buy-sell-fade animate-[buySellFadeUp_640ms_ease-out_both] overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(20,58,31,0.14)]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SafeImage
                  src={card.image}
                  alt={card.alt}
                  width={900}
                  height={560}
                  fallbackKind="crop"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-64"
                />
                <div className="p-6 sm:p-7">
                  <h2 className="text-2xl font-black text-ink">{card.title}</h2>
                  <p className="mt-3 text-base leading-7 text-ink/68">{card.description}</p>
                  <div className="mt-6">
                    <ButtonLink href={card.href}>{card.cta}</ButtonLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="gg-eyebrow text-earth-700/75">Popular Categories</p>
            <h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">Find the products buyers request most.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(([category, image], index) => (
              <Link
                key={category}
                href="/marketplace"
                className="group buy-sell-fade animate-[buySellFadeUp_560ms_ease-out_both] overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <SafeImage
                  src={image}
                  alt={`${category} category`}
                  width={620}
                  height={420}
                  fallbackKind="crop"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="flex items-center justify-between gap-3 p-5">
                  <h3 className="text-lg font-black text-ink">{category}</h3>
                  <ArrowRight size={18} className="text-leaf-700 transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="gg-eyebrow text-earth-700/75">Why Ghana Growers</p>
            <h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">Built for trusted agricultural sourcing.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map(([title, description, Icon], index) => (
              <article
                key={title as string}
                className="buy-sell-fade animate-[buySellFadeUp_560ms_ease-out_both] rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-soft"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="gg-icon bg-leaf-600 text-white ring-leaf-700/10">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-black text-ink">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/66">{description as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-md bg-[#143A1F] px-6 py-10 text-center text-white shadow-soft sm:px-10 sm:py-14">
          <p className="gg-eyebrow text-earth-500">Need something specific?</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Tell Ghana Growers what you need to source.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/72">
            If you cannot find the right produce, input or supplier, our team can help point you toward the best next step.
          </p>
          <div className="mt-7 flex justify-center">
            <ButtonLink href="/contact" variant="light">Contact Ghana Growers</ButtonLink>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes buySellFadeUp {
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
          * {
            animation: none !important;
            transition: none !important;
          }
        }

        @supports (animation-timeline: view()) {
          .buy-sell-fade {
            animation: buySellFadeUp both;
            animation-timeline: view();
            animation-range: entry 8% cover 28%;
          }
        }
      `}</style>
    </>
  );
}
