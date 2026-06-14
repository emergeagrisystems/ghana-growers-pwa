import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CloudSun,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { ChooseYourPath } from "@/components/ChooseYourPath";
import { FeaturedListings } from "@/components/FeaturedListings";
import { MarketplaceCategoryShowcase } from "@/components/MarketplaceCategoryShowcase";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SafeImage } from "@/components/SafeImage";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata = {
  title: "Trusted Agriculture Platform for Ghana",
  description:
    "Ghana Growers connects Ghanaian farmers, buyers, suppliers, market women, processors, and agribusiness partners through directories, buyer requests, smart tools, and trusted WhatsApp follow-up.",
  openGraph: {
    title: "Ghana Growers | Trusted Agriculture Platform for Ghana",
    description:
      "Discover farmers, suppliers, buyer requests, market intelligence, and smart agricultural tools built for Ghana.",
    images: ["/images/hero/ghana-growers-hero.jpg"]
  }
};

const heroHighlights = [
  { title: "115+ Farmers", icon: UsersRound },
  { title: "Digital Farm Tools", icon: CloudSun },
  { title: "Verified Members", icon: ShieldCheck },
  { title: "Fair Market Access", icon: BarChart3 }
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-white via-leaf-50/70 to-earth-50/40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16 xl:gap-14">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-xs font-black uppercase text-earth-700 shadow-soft">
              <ShieldCheck size={17} aria-hidden="true" />
              Trusted Agriculture Platform
            </p>
            <h1 className="mt-5 max-w-[18rem] break-words text-[1.55rem] font-black leading-tight text-ink sm:max-w-3xl sm:text-5xl lg:text-[3.15rem] xl:text-[3.5rem]">
              Ghana&apos;s Network for Farmers, Buyers &amp; Suppliers
            </h1>
            <p className="mt-5 max-w-[18rem] text-base leading-7 text-ink/70 sm:max-w-2xl sm:text-lg sm:leading-8">
              Connect with farmers, buyers, suppliers, market prices, buyer requests, and digital farm tools across Ghana.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/farmer-directory">Browse Directory</ButtonLink>
              <ButtonLink href="/join" variant="secondary">Join Ghana Growers</ButtonLink>
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-md border border-white/70 bg-white p-2 shadow-soft">
              <SafeImage
                src="/images/hero/ghana-growers-hero.jpg"
                alt="Ghanaian farmer, buyer, and supplier exchanging fresh produce at a farm marketplace"
                width={1778}
                height={885}
                fallbackSrc="/images/marketplace/ghana-market-1.jpg"
                fallbackKind="default"
                priority
                sizes="(min-width: 1024px) 54vw, 100vw"
                className="aspect-[4/3] w-full rounded-md object-cover sm:aspect-[16/10] lg:min-h-[500px]"
              />
              <div className="absolute inset-2 rounded-md bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 grid gap-2 rounded-md bg-white/94 p-3 shadow-soft backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
                {heroHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex items-center gap-2 text-xs font-black text-ink">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span>{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceCategoryShowcase />

      <ChooseYourPath />

      <FeaturedListings
        kinds={["farmers"]}
        title="Featured farmers"
        description="A small selection of farmers across the Ghana Growers network."
        background="leaf"
        limit={3}
        compact
      />

      <FeaturedListings
        kinds={["buyerRequests"]}
        title="Featured buyer requests"
        description="Active demand examples from buyers looking for produce by product, volume, location, and date posted."
        background="earth"
        limit={3}
      />

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
              <UsersRound size={18} aria-hidden="true" />
              Join the network
            </p>
            <h2 className="mt-4 text-2xl font-black sm:text-4xl">Grow trusted agricultural connections across Ghana</h2>
            <p className="mt-4 leading-7 text-white/70">
              Register interest, browse marketplace opportunities, and use Digital Farm tools to make better decisions before buying, selling, supplying, or transporting agricultural products.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/verification-requirements" className="inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
                Understand verification <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/join" className="inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
                Join Ghana Growers <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/market-intelligence" className="inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
                View market intelligence <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8">
              <WhatsAppButton message="Hello Ghana Growers, I want help joining the platform or finding agricultural opportunities." className="bg-earth-500 text-ink hover:bg-white" />
            </div>
          </div>
          <RegistrationForm title="Register your interest" audience="farmer" />
        </div>
      </section>

      <section className="border-y border-leaf-900/10 bg-earth-50 py-6" aria-label="End of homepage content">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px bg-leaf-900/10" />
        </div>
      </section>
    </>
  );
}
