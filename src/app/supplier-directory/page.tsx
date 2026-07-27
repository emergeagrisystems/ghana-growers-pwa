import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { PublicDataUnavailable } from "@/components/PublicDataUnavailable";
import { SupplierDirectory } from "@/components/SupplierDirectory";
import { createPageMetadata } from "@/lib/seo";
import { getSuppliersData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Supplier Directory",
  description:
    "Connect with agricultural suppliers as approved Ghana Growers profiles become available.",
  path: "/supplier-directory"
});

type SupplierDirectoryPageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

function searchQuery(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SupplierDirectoryPage({ searchParams }: SupplierDirectoryPageProps) {
  const result = await getSuppliersData();
  const suppliers = result.status === "ready" ? result.data : [];
  const initialSearch = searchQuery(searchParams?.q);
  const hasPublicSuppliers = suppliers.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Supplier Directory"
        title={hasPublicSuppliers ? "Find Farm Suppliers Across Ghana" : "Supplier Profiles Are Coming Soon"}
        variant="compact"
        description={hasPublicSuppliers
          ? "Browse approved public supplier profiles and find agricultural products and services."
          : "Connect with suppliers as approved profiles become available. Supplier applications remain open while the directory is prepared."}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/become-a-supplier">Become a Supplier</ButtonLink>
          <ButtonLink href="/marketplace?category=farm-inputs" variant="secondary">Browse Farm Inputs</ButtonLink>
          <ButtonLink href="/farmer-directory" variant="light">Browse Farmer Directory</ButtonLink>
        </div>
      </PageHero>
      {result.status === "unavailable" ? (
        <PublicDataUnavailable kind="supplier" />
      ) : (
        <SupplierDirectory suppliers={suppliers} initialSearch={initialSearch} />
      )}
    </>
  );
}
