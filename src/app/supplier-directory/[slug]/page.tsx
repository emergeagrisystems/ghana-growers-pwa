import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, ExternalLink, MapPin, PackageCheck, Phone, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { normalizeTrust, TrustScoreCard, TrustSummary, VerificationRequirementsList } from "@/components/TrustIndicators";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getSupplierBySlug, supplierDirectory } from "@/data/suppliers";

type SupplierProfilePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return supplierDirectory.map((supplier) => ({ slug: supplier.slug }));
}

export function generateMetadata({ params }: SupplierProfilePageProps) {
  const supplier = getSupplierBySlug(params.slug);

  if (!supplier) {
    return {
      title: "Supplier Profile"
    };
  }

  return {
    title: supplier.companyName,
    description: `${supplier.companyName} provides ${supplier.productsServices.join(", ")} in ${supplier.district}, ${supplier.region}.`
  };
}

export default function SupplierProfilePage({ params }: SupplierProfilePageProps) {
  const supplier = getSupplierBySlug(params.slug);

  if (!supplier) {
    notFound();
  }

  const trust = normalizeTrust(supplier.trust);

  return (
    <>
      <PageHero
        eyebrow={supplier.supplierCategory}
        title={supplier.companyName}
        description={supplier.companyOverview}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <WhatsAppButton message={supplier.whatsappMessage} label="Contact on WhatsApp" />
          <a
            href={`tel:${supplier.phone.replace(/\s/g, "")}`}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-earth-500 px-5 py-3 text-sm font-bold text-ink shadow-soft transition hover:bg-earth-700 hover:text-white"
          >
            <Phone size={17} aria-hidden="true" />
            Call Supplier
          </a>
          <ButtonLink href="/supplier-directory" variant="light">Back to Directory</ButtonLink>
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
              <h2 className="mt-2 text-2xl font-black text-ink">{supplier.district}</h2>
              <p className="mt-1 text-sm font-bold text-leaf-700">{supplier.region}</p>
              <p className="mt-4 text-sm leading-6 text-ink/65">
                Service coverage: {supplier.serviceCoverageArea}
              </p>
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                <Building2 size={17} aria-hidden="true" />
                Contact person
              </p>
              <h2 className="mt-2 text-xl font-black text-ink">{supplier.contactPerson}</h2>
              <p className="mt-2 text-sm font-bold text-leaf-700">{supplier.phone}</p>
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-700">
                <ShieldCheck size={17} aria-hidden="true" />
                Verification status
              </p>
              <div className="mt-3">
                <TrustSummary kind="supplier" trust={trust} />
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                This placeholder can later show business checks, document review, customer feedback, and Ghana Growers approval status.
              </p>
            </div>

            <VerificationRequirementsList requirements={trust.requirements} />
            <TrustScoreCard score={trust.score} />

            <div className="rounded-md border border-leaf-900/10 bg-leaf-600 p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-earth-500">
                <BadgeCheck size={17} aria-hidden="true" />
                Website and social links
              </p>
              <div className="mt-4 grid gap-3">
                {supplier.website ? (
                  <a className="inline-flex items-center gap-2 font-bold text-white hover:text-earth-500" href={supplier.website} target="_blank" rel="noreferrer">
                    Website <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
                {supplier.socialLink ? (
                  <a className="inline-flex items-center gap-2 font-bold text-white hover:text-earth-500" href={supplier.socialLink} target="_blank" rel="noreferrer">
                    Social Link <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {supplier.photos.map((photo, index) => (
                <SafeImage
                  key={photo}
                  src={photo}
                  alt={`${supplier.companyName} placeholder ${index + 1}`}
                  width={520}
                  height={320}
                  className="h-56 w-full rounded-md border border-leaf-900/10 bg-leaf-50 object-cover shadow-soft"
                  fallbackSrc="/images/suppliers/supplier-1.jpg"
                />
              ))}
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              <h2 className="text-2xl font-black text-ink">Supplier details</h2>
              <dl className="mt-5 grid gap-4 text-sm text-ink/70 md:grid-cols-2">
                <div>
                  <dt className="font-black text-ink">Supplier Category</dt>
                  <dd className="mt-2">{supplier.supplierCategory}</dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Service Coverage Area</dt>
                  <dd className="mt-2">{supplier.serviceCoverageArea}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="flex items-center gap-2 font-black text-ink">
                    <PackageCheck size={17} className="text-leaf-600" aria-hidden="true" />
                    Products/services
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {supplier.productsServices.map((item) => (
                      <span key={item} className="rounded-md bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-black text-ink">Company overview</dt>
                  <dd className="mt-2 leading-6">{supplier.companyOverview}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md bg-earth-50 p-5">
              <h2 className="text-xl font-black text-ink">Looking for another supplier category?</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Browse the full supplier directory or register as a supplier so Ghana Growers can connect you with farmers and buyers.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/supplier-directory">Browse Supplier Directory</ButtonLink>
                <ButtonLink href="/join/supplier" variant="secondary">Become a Supplier</ButtonLink>
                <Link href="/marketplace" className="focus-ring inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-bold text-leaf-700 shadow-soft transition hover:bg-leaf-50">
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
