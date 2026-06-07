import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, MapPin, PackageCheck, ShieldCheck, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { farmerDirectory, getFarmerBySlug } from "@/data/farmers";

type FarmerProfilePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return farmerDirectory.map((farmer) => ({ slug: farmer.slug }));
}

export function generateMetadata({ params }: FarmerProfilePageProps) {
  const farmer = getFarmerBySlug(params.slug);

  if (!farmer) {
    return {
      title: "Farmer Profile"
    };
  }

  return {
    title: farmer.farmName,
    description: `${farmer.farmName} in ${farmer.district}, ${farmer.region} supplies ${farmer.products.join(", ")}.`
  };
}

export default function FarmerProfilePage({ params }: FarmerProfilePageProps) {
  const farmer = getFarmerBySlug(params.slug);

  if (!farmer) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="Farmer Profile"
        title={farmer.farmName}
        description={farmer.description}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <WhatsAppButton message={farmer.whatsappMessage} label="Contact About This Farm" />
          <ButtonLink href="/farmer-directory" variant="light">Back to Directory</ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="grid gap-4">
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                <MapPin size={17} aria-hidden="true" />
                Location
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink">{farmer.district}</h2>
              <p className="mt-1 text-sm font-bold text-leaf-700">{farmer.region}</p>
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                <ShieldCheck size={17} aria-hidden="true" />
                Verification status
              </p>
              <p className="mt-3 inline-flex rounded-md bg-earth-50 px-3 py-2 text-sm font-black text-ink">
                {farmer.verificationStatus}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                This placeholder can later show field verification, document checks, buyer feedback, or Ghana Growers approval status.
              </p>
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-leaf-600 p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
                <BadgeCheck size={17} aria-hidden="true" />
                Contact options
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Contact Ghana Growers on WhatsApp to confirm price, volume, quality, delivery timing, and buyer requirements before committing to trade.
              </p>
              <WhatsAppButton message={farmer.whatsappMessage} label="Start WhatsApp Inquiry" className="mt-5 bg-white text-leaf-700 hover:bg-leaf-50" />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {farmer.photos.map((photo, index) => (
                <Image
                  key={photo}
                  src={photo}
                  alt={`${farmer.farmName} placeholder ${index + 1}`}
                  width={520}
                  height={320}
                  className="h-56 w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover shadow-soft"
                />
              ))}
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <h2 className="text-2xl font-black text-ink">Farm details</h2>
              <dl className="mt-5 grid gap-4 text-sm text-ink/70 md:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-2 font-black text-ink">
                    <Sprout size={17} className="text-leaf-600" aria-hidden="true" />
                    Products grown/raised
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {farmer.products.map((product) => (
                      <span key={product} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {product}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Farm Type</dt>
                  <dd className="mt-2">{farmer.farmType}</dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Farm Size</dt>
                  <dd className="mt-2">{farmer.farmSize}</dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Availability Status</dt>
                  <dd className="mt-2">{farmer.availabilityStatus}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 font-black text-ink">
                    <CalendarDays size={17} className="text-leaf-600" aria-hidden="true" />
                    Harvest season
                  </dt>
                  <dd className="mt-2">{farmer.harvestSeason}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 font-black text-ink">
                    <PackageCheck size={17} className="text-leaf-600" aria-hidden="true" />
                    Capacity/volume
                  </dt>
                  <dd className="mt-2">{farmer.capacityVolume}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md bg-earth-50 p-5">
              <h2 className="text-xl font-black text-ink">Need a different crop or location?</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Browse the full directory or post buyer demand so Ghana Growers can match your request with available farmers.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/farmer-directory">Browse Farmer Directory</ButtonLink>
                <ButtonLink href="/join/buyer" variant="secondary">Register as Buyer</ButtonLink>
                <Link href="/buyer-requests" className="focus-ring inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-bold text-leaf-700 shadow-soft transition hover:bg-leaf-50">
                  View Buyer Requests
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
