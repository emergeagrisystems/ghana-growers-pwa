import Link from "next/link";
import { ArrowRight, BadgeCheck, ChartNoAxesCombined, Eye, PackageCheck, Sprout, Tractor, Truck, Users } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sell",
  description: "Sell harvests, agricultural products, and farm services through Ghana Growers.",
  path: "/sell"
});

const sellerActions = [
  {
    title: "Sell Your Harvest",
    description: "Sell fruits, vegetables, grains and other farm produce.",
    href: "/join/farmer",
    cta: "Start Selling",
    icon: Sprout,
    image: "/images/marketplace/fresh-tomatoes.jpg"
  },
  {
    title: "Sell Products & Tools",
    description: "Sell seeds, fertilizer, tools and agricultural supplies.",
    href: "/become-a-supplier",
    cta: "Become a Supplier",
    icon: PackageCheck,
    image: "/images/products/farm-inputs.jpg"
  },
  {
    title: "List Agricultural Services",
    description: "Offer spraying, ploughing, transport, equipment rental or farm support.",
    href: "/become-a-supplier",
    cta: "List Service",
    icon: Tractor,
    image: "/images/marketplace/logistics-truck.jpg"
  }
];

const benefits = [
  ["More Buyers", "Reach people looking for supply.", Users],
  ["Verified Profile", "Build trust before contact.", BadgeCheck],
  ["Business Growth", "Open more routes to market.", ChartNoAxesCombined],
  ["Digital Visibility", "Be easier to discover online.", Eye]
];

export default function SellPage() {
  return (
    <>
      <section className="bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="gg-eyebrow text-earth-700/80">Seller Marketplace</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-ink sm:text-5xl">
                Sell Through Ghana Growers
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
                List your harvest, farm products, or agricultural services and reach buyers across Ghana.
              </p>
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-earth-700">What would you like to sell?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {sellerActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link key={action.title} href={action.href} className="group rounded-md bg-leaf-50 p-3 transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-card">
                      <Icon size={22} className="text-leaf-700" aria-hidden="true" />
                      <p className="mt-2 text-sm font-black text-ink group-hover:text-leaf-700">{action.title}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            {sellerActions.map((action) => {
              const Icon = action.icon;

              return (
                <article key={action.title} className="group flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                  <SafeImage
                    src={action.image}
                    alt={`${action.title} category`}
                    width={620}
                    height={380}
                    fallbackKind="crop"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="h-36 w-full shrink-0 object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-leaf-600 text-white">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-xl font-black text-ink">{action.title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-6 text-ink/66">{action.description}</p>
                    <Link href={action.href} className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900">
                      {action.cta}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-md border border-leaf-900/10 bg-[#143A1F] p-5 text-[#F7F3E8] shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-2xl font-black">Ready to reach more buyers?</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#ECF2D1]/85">
              Join the Ghana Growers Network and create your seller profile.
            </p>
          </div>
          <Link
            href="/join"
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-[#F7F3E8] px-6 py-3 text-sm font-black text-[#143A1F] shadow-sm transition duration-200 ease-out hover:bg-[#D6A84A]"
          >
            Join Network
          </Link>
        </div>
      </section>

      <section className="bg-earth-50 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(([title, description, Icon]) => (
              <article key={title as string} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-black text-ink">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/64">{description as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          <Link href="/join/farmer" className="group rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
            <Sprout className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-ink">Farmer profile</h2>
            <p className="mt-2 text-sm leading-6 text-ink/66">Create visibility for produce, harvest timing and buyer interest.</p>
          </Link>
          <Link href="/become-a-supplier" className="group rounded-md border border-leaf-900/10 bg-earth-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
            <Truck className="text-leaf-700" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-ink">Supplier or service profile</h2>
            <p className="mt-2 text-sm leading-6 text-ink/66">List farm inputs, equipment, logistics or professional services.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
