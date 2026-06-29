import { ButtonLink } from "@/components/ButtonLink";
import { FeaturedListings } from "@/components/FeaturedListings";
import { PageHero } from "@/components/PageHero";
import { SupplierDirectory } from "@/components/SupplierDirectory";
import { isFeaturedActive } from "@/lib/featured";
import { createPageMetadata } from "@/lib/seo";
import { getSuppliersData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Supplier Directory",
  description:
    "Discover agricultural suppliers and service providers across Ghana by region, district, category, and service coverage area.",
  path: "/supplier-directory"
});

export default async function SupplierDirectoryPage() {
  const suppliers = await getSuppliersData();
  const featuredSuppliers = suppliers.filter((supplier) => isFeaturedActive(supplier) || supplier.verificationStatus === "Verified").slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="Supplier Directory"
        title="Discover trusted agricultural suppliers across Ghana"
        description="Search suppliers and service providers for seeds, fertilizers, agrochemicals, equipment, irrigation, packaging, logistics, storage, finance, and agricultural consulting."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/become-a-supplier">Become a Supplier</ButtonLink>
          <ButtonLink href="/farmer-directory" variant="secondary">Browse Farmer Directory</ButtonLink>
          <ButtonLink href="/marketplace" variant="light">Browse Marketplace</ButtonLink>
        </div>
      </PageHero>
      <FeaturedListings
        kinds={["suppliers"]}
        title="Featured suppliers"
        description="Priority agricultural suppliers selected from the editable featured listings configuration."
        background="leaf"
        suppliers={featuredSuppliers}
      />
      <SupplierDirectory suppliers={suppliers} />
    </>
  );
}
