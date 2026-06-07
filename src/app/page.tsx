import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { productCategories } from "@/data/products";
import { farmerDirectory } from "@/data/farmers";
import { howItWorks } from "@/data/services";

export default function HomePage() {
  return (
    <>
      <section className="ghana-grid bg-leaf-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-black uppercase text-earth-700">Trusted agriculture platform</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
              Connecting Ghana&apos;s farmers, buyers, and suppliers
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              Ghana Growers helps farmers sell produce, buyers find reliable supply, and agricultural suppliers reach the
              people who need their products and services.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/join/farmer">Join as Farmer</ButtonLink>
              <ButtonLink href="/join/buyer" variant="secondary">
                Join as Buyer
              </ButtonLink>
              <ButtonLink href="/join/supplier" variant="light">
                Become a Supplier
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/images/hero-market.svg"
              alt="Illustration of fresh produce and Ghana Growers market connections"
              width={720}
              height={560}
              priority
              className="h-auto w-full rounded-md border border-leaf-900/10 bg-white shadow-soft"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Featured produce categories"
            title="Fresh food, farm inputs, packaging, and logistics in one place"
            description="Start with the categories Ghanaian farmers, buyers, and suppliers need most. Each category is powered by local data files today and can connect to a database later."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productCategories.slice(0, 8).map((category) => (
              <Link
                href="/marketplace"
                key={category.slug}
                className="focus-ring rounded-md border border-leaf-900/10 bg-earth-50 p-4 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <Image src={category.image} alt="" width={220} height={140} className="h-28 w-full rounded-md object-cover" />
                <h3 className="mt-4 font-black text-ink">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/65">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leaf-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="How it works" title="A simple path from farm to buyer" align="center" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {howItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <SectionHeader
              eyebrow="Farmer directory"
              title="Built for local supply discovery"
              description="This directory structure gives Ghana Growers a clean starting point for verified farmer profiles later."
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/join/farmer">Register Your Farm</ButtonLink>
              <WhatsAppButton message="Hello Ghana Growers, I want help finding farmers or produce suppliers." />
            </div>
          </div>
          <div className="grid gap-4">
            {farmerDirectory.map((farmer) => (
              <div key={farmer.name} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black text-ink">{farmer.name}</h3>
                    <p className="mt-1 text-sm text-ink/65">{farmer.region}</p>
                  </div>
                  <BadgeCheck className="shrink-0 text-leaf-600" size={22} aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink/75">{farmer.supplyType}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {farmer.crops.map((crop) => (
                    <span key={crop} className="rounded-md bg-white px-3 py-1 text-xs font-bold text-leaf-700">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
              <UsersRound size={18} aria-hidden="true" />
              Trust and community
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Growing stronger trade relationships across Ghana</h2>
            <p className="mt-4 leading-7 text-white/70">
              Ghana Growers is designed around direct communication, practical learning, and partnerships that reduce friction
              between production, buying, supply, and support.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-2 font-black text-earth-500 hover:text-white">
              Learn about the mission <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <RegistrationForm title="Register your interest" audience="farmer" />
        </div>
      </section>
    </>
  );
}
