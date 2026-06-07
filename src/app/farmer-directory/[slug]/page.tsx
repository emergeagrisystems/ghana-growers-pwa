import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  ImageIcon,
  MapPin,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Sprout,
  Warehouse
} from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { normalizeTrust, TrustScoreCard, TrustSummary, VerificationRequirementsList } from "@/components/TrustIndicators";
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

function buildHarvestCalendar(farmer: NonNullable<ReturnType<typeof getFarmerBySlug>>) {
  return farmer.products.map((product, index) => ({
    product,
    season:
      index === 0
        ? farmer.harvestSeason
        : "Availability depends on the farm block, rainfall, irrigation access, and buyer order schedule.",
    capacity:
      index === 0
        ? farmer.capacityVolume
        : "Capacity can be confirmed by WhatsApp before collection or delivery is arranged."
  }));
}

export default function FarmerProfilePage({ params }: FarmerProfilePageProps) {
  const farmer = getFarmerBySlug(params.slug);

  if (!farmer) {
    notFound();
  }

  const trust = normalizeTrust(farmer.trust);
  const harvestCalendar = buildHarvestCalendar(farmer);
  const galleryPhotos = farmer.photos.length > 0 ? farmer.photos : ["/images/category-vegetables.svg"];

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-earth-700">
                <MapPin size={16} aria-hidden="true" />
                Region
              </p>
              <p className="mt-3 text-lg font-black text-ink">{farmer.region}</p>
              <p className="mt-1 text-sm font-bold text-leaf-700">{farmer.district}</p>
            </div>
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-earth-700">
                <Sprout size={16} aria-hidden="true" />
                Farm type
              </p>
              <p className="mt-3 text-lg font-black text-ink">{farmer.farmType}</p>
              <p className="mt-1 text-sm text-ink/65">{farmer.farmSize}</p>
            </div>
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-earth-700">
                <Clock size={16} aria-hidden="true" />
                Availability
              </p>
              <p className="mt-3 text-lg font-black text-ink">{farmer.availabilityStatus}</p>
              <p className="mt-1 text-sm text-ink/65">Confirm volumes before purchase.</p>
            </div>
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-earth-700">
                <ShieldCheck size={16} aria-hidden="true" />
                Verification
              </p>
              <div className="mt-3">
                <TrustSummary kind="farmer" trust={trust} />
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="grid gap-8">
              <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-black uppercase text-earth-700">
                      <ImageIcon size={16} aria-hidden="true" />
                      Farm photos
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Gallery</h2>
                  </div>
                  <span className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-bold text-leaf-700">
                    {galleryPhotos.length} photos
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-[1.5fr_0.85fr]">
                  <Image
                    src={galleryPhotos[0]}
                    alt={`${farmer.farmName} farm view`}
                    width={760}
                    height={520}
                    className="h-72 w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover sm:h-96"
                    priority
                  />
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                    {galleryPhotos.slice(1, 3).map((photo, index) => (
                      <Image
                        key={photo}
                        src={photo}
                        alt={`${farmer.farmName} farm photo ${index + 2}`}
                        width={360}
                        height={240}
                        className="h-36 w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover sm:h-44"
                      />
                    ))}
                    {galleryPhotos.length < 3 ? (
                      <div className="flex h-36 flex-col items-center justify-center rounded-md border border-dashed border-leaf-900/20 bg-leaf-50 text-center sm:h-44">
                        <ImageIcon size={24} className="text-leaf-600" aria-hidden="true" />
                        <p className="mt-2 px-4 text-xs font-bold text-leaf-700">More farm photos can be added here.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                  <p className="text-sm font-black uppercase text-earth-700">Farm story</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">About {farmer.farmName}</h2>
                  <p className="mt-4 text-sm leading-7 text-ink/70">{farmer.description}</p>
                  <p className="mt-4 text-sm leading-7 text-ink/70">
                    Buyers can use this profile to review supply focus, location, capacity, and verification signals before starting a WhatsApp inquiry with Ghana Growers.
                  </p>
                </div>

                <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6">
                  <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                    <Sprout size={17} aria-hidden="true" />
                    Main crops/livestock
                  </p>
                  <div className="mt-4 grid gap-3">
                    {farmer.products.map((product) => (
                      <div key={product} className="flex items-center justify-between gap-3 rounded-md bg-white px-4 py-3 shadow-soft">
                        <span className="font-bold text-ink">{product}</span>
                        <CheckCircle2 size={18} className="text-leaf-600" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                      <CalendarDays size={17} aria-hidden="true" />
                      Harvest calendar
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Seasonal supply windows</h2>
                  </div>
                  <span className="rounded-md bg-earth-50 px-3 py-2 text-xs font-bold text-earth-700">
                    Buyer confirmation required
                  </span>
                </div>
                <div className="mt-5 overflow-x-auto rounded-md border border-leaf-900/10">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[0.8fr_1.4fr_1.2fr] bg-leaf-600 px-4 py-3 text-xs font-black uppercase text-white">
                      <span>Product</span>
                      <span>Season</span>
                      <span>Capacity estimate</span>
                    </div>
                    {harvestCalendar.map((item) => (
                      <div key={item.product} className="grid grid-cols-[0.8fr_1.4fr_1.2fr] gap-3 border-t border-leaf-900/10 px-4 py-4 text-sm text-ink/70">
                        <span className="font-black text-ink">{item.product}</span>
                        <span>{item.season}</span>
                        <span>{item.capacity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                  <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                    <PackageCheck size={17} aria-hidden="true" />
                    Capacity estimates
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-ink">{farmer.capacityVolume}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    Capacity estimates are provided for discovery and should be confirmed before payment, transport booking, or buyer collection.
                  </p>
                </div>
                <div className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
                  <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                    <Warehouse size={17} aria-hidden="true" />
                    Farm details
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-leaf-900/10 pb-3">
                      <dt className="font-bold text-ink/65">Farm size</dt>
                      <dd className="font-black text-ink">{farmer.farmSize}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-bold text-ink/65">Availability</dt>
                      <dd className="text-right font-black text-ink">{farmer.availabilityStatus}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-md bg-earth-50 p-6">
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

            <aside className="grid content-start gap-5">
              <div className="rounded-md border border-leaf-900/10 bg-leaf-600 p-6 text-white">
                <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
                  <PhoneCall size={17} aria-hidden="true" />
                  WhatsApp contact
                </p>
                <h2 className="mt-3 text-2xl font-black">Start a farm inquiry</h2>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Contact Ghana Growers to confirm price, volume, quality, delivery timing, and buyer requirements before committing to trade.
                </p>
                <WhatsAppButton message={farmer.whatsappMessage} label="Contact on WhatsApp" className="mt-5 bg-white text-leaf-700 hover:bg-leaf-50" />
              </div>

              <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
                <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                  <ShieldCheck size={17} aria-hidden="true" />
                  Verification status
                </p>
                <div className="mt-3">
                  <TrustSummary kind="farmer" trust={trust} />
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/65">
                  This placeholder can later show field verification, document checks, buyer feedback, or Ghana Growers approval status.
                </p>
              </div>

              <VerificationRequirementsList requirements={trust.requirements} />
              <TrustScoreCard score={trust.score} />

              <div className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-soft">
                <div className="relative flex h-64 items-center justify-center bg-leaf-50">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,65,0.08)_1px,transparent_1px),linear-gradient(rgba(37,99,65,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  <div className="relative mx-6 rounded-md border border-leaf-900/10 bg-white/90 p-5 text-center shadow-soft backdrop-blur">
                    <MapPin size={28} className="mx-auto text-leaf-600" aria-hidden="true" />
                    <p className="mt-3 text-lg font-black text-ink">{farmer.region}</p>
                    <p className="mt-1 text-sm font-bold text-leaf-700">{farmer.district}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-black uppercase text-earth-700">Region map placeholder</p>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    A verified map or farm cluster location can be connected here once Ghana Growers enables location review.
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
                <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                  <BadgeCheck size={17} aria-hidden="true" />
                  Buyer checklist
                </p>
                <ul className="mt-4 grid gap-3 text-sm text-ink/70">
                  <li>Confirm current supply and price before travelling.</li>
                  <li>Agree on grading, packaging, and loading terms.</li>
                  <li>Use verified contact channels for transaction follow-up.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
