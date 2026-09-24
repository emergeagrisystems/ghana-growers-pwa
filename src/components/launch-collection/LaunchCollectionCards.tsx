import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake, MapPin, ShieldCheck, Sprout } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { FarmerProfile, Product, SuccessStory, SupplierProfile } from "@/types";

const cardBase =
  "group block h-full overflow-hidden rounded-xl border border-leaf-900/10 bg-white shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:shadow-soft focus-ring";

const imageClass = "h-64 w-full bg-leaf-50 object-cover transition duration-200 ease-out group-hover:scale-[1.03]";
const bodyClass = "p-5 sm:p-6";

function textList(items: string[], limit = 3) {
  return items.filter(Boolean).slice(0, limit).join(" / ");
}

function twoLine(value: string) {
  return value.length > 150 ? `${value.slice(0, 147).trim()}...` : value;
}

function storyPreview(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length > 80 ? `${words.slice(0, 80).join(" ")}...` : value;
}

function TrustRow({ verified, ggStandard }: { verified?: boolean; ggStandard?: boolean }) {
  if (!verified && !ggStandard) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-ink/70">
      {verified ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-leaf-700 ring-1 ring-leaf-700/10">
          <BadgeCheck size={14} aria-hidden="true" />
          Verified
        </span>
      ) : null}
      {ggStandard ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-earth-50 px-3 py-1.5 text-earth-700 ring-1 ring-earth-500/20">
          <ShieldCheck size={14} aria-hidden="true" />
          GG Standard
        </span>
      ) : null}
    </div>
  );
}

export function FoundingFarmerCard({ farmer }: { farmer: FarmerProfile }) {
  const href = `/farmer-directory/${farmer.slug}`;
  const verified = farmer.verificationStatus === "Verified";
  const ggStandard = farmer.ggStandardStatus === "Member";
  const story = twoLine(farmer.description || `${farmer.farmName} supplies ${textList(farmer.products)} through Ghana Growers.`);

  return (
    <Link href={href} className={cardBase} aria-label={`View ${farmer.farmName}`}>
      <div className="overflow-hidden">
        <SafeImage
          src={farmer.photos[0] ?? "/images/farmers/farmer-1.jpg"}
          alt={`${farmer.farmName} farmer profile`}
          width={720}
          height={520}
          className={imageClass}
          fallbackKind="farmer"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>
      <div className={bodyClass}>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-xs font-black text-leaf-700">
          <Sprout size={14} aria-hidden="true" />
          Founding Farmer / 2026
        </p>
        <h3 className="mt-4 text-2xl font-black leading-tight text-ink">{farmer.farmName}</h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-ink/58">
          <MapPin size={15} aria-hidden="true" />
          {farmer.region}
        </p>
        <p className="mt-4 text-sm font-black leading-6 text-ink">{textList(farmer.products)}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/64">{story}</p>
        <TrustRow verified={verified} ggStandard={ggStandard} />
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-leaf-700 transition group-hover:text-leaf-900">
          View Profile
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function SupplierLaunchCard({ supplier }: { supplier: SupplierProfile }) {
  const href = `/supplier-directory/${supplier.slug}`;
  const verified = supplier.verificationStatus === "Verified";

  return (
    <Link href={href} className={cardBase} aria-label={`View ${supplier.companyName}`}>
      <div className="relative overflow-hidden">
        <SafeImage
          src={supplier.photos[0] ?? "/images/suppliers/supplier-1.jpg"}
          alt={`${supplier.companyName} supplier profile`}
          width={720}
          height={520}
          className={imageClass}
          fallbackKind="supplier"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
        <div className="absolute bottom-4 left-5 grid h-16 w-16 place-items-center rounded-xl bg-white text-leaf-700 shadow-soft ring-1 ring-leaf-900/10">
          <Handshake size={27} aria-hidden="true" />
        </div>
      </div>
      <div className={`${bodyClass} pt-7`}>
        <h3 className="text-2xl font-black leading-tight text-ink">{supplier.companyName}</h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-ink/58">
          <MapPin size={15} aria-hidden="true" />
          {supplier.region}
        </p>
        <p className="mt-4 text-sm font-black leading-6 text-ink">{textList(supplier.productsServices)}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/64">{twoLine(supplier.shortDescription || supplier.companyOverview)}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
          {verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-leaf-700 ring-1 ring-leaf-700/10">
              <BadgeCheck size={14} aria-hidden="true" />
              Verified Business
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-earth-50 px-3 py-1.5 text-earth-700 ring-1 ring-earth-500/20">
            <Handshake size={14} aria-hidden="true" />
            Founding Supplier / 2026
          </span>
        </div>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-leaf-700 transition group-hover:text-leaf-900">
          View Business
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function MarketplaceLaunchListingCard({ listing, farmer }: { listing: Product; farmer?: FarmerProfile }) {
  const href = `/marketplace?product=${encodeURIComponent(listing.name)}`;
  const verified = Boolean(listing.verified || farmer?.verificationStatus === "Verified");
  const ggStandard = farmer?.ggStandardStatus === "Member";

  return (
    <Link href={href} className={cardBase} aria-label={`Request supply for ${listing.name}`}>
      <div className="overflow-hidden">
        <SafeImage
          src={listing.image}
          alt={`${listing.name} marketplace listing`}
          width={720}
          height={520}
          className={imageClass}
          fallbackKind="marketplace"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>
      <div className={bodyClass}>
        <h3 className="text-2xl font-black leading-tight text-ink">{listing.name}</h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-ink/58">
          <MapPin size={15} aria-hidden="true" />
          {listing.region}
        </p>
        <p className="mt-4 text-sm font-black text-leaf-800">{listing.available}</p>
        <p className="mt-2 text-sm font-bold text-ink/62">By {farmer?.farmName ?? listing.seller}</p>
        <TrustRow verified={verified} ggStandard={ggStandard} />
        <span className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition group-hover:bg-leaf-900">
          Request Supply
        </span>
      </div>
    </Link>
  );
}

export function SuccessStoryLaunchCard({ story }: { story: SuccessStory }) {
  return (
    <Link href="/success-stories" className={cardBase} aria-label={`Read ${story.title}`}>
      <div className="overflow-hidden">
        <SafeImage
          src={story.image ?? "/images/marketplace/ghana-market-2.jpg"}
          alt={`${story.title} story`}
          width={720}
          height={520}
          className={imageClass}
          fallbackKind="default"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>
      <div className={bodyClass}>
        <h3 className="text-2xl font-black leading-tight text-ink">{story.title}</h3>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink/64">{storyPreview(story.summary)}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-leaf-700 transition group-hover:text-leaf-900">
          Read Story
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
