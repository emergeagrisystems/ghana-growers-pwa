import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SupplierDirectory } from "@/components/SupplierDirectory";
import { createPageMetadata } from "@/lib/seo";
import { getSuppliersData } from "@/lib/supabase/publicData";
import { orderSupplierDirectoryProfiles } from "@/lib/supplierDirectory";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Supplier Directory",
  description:
    "Find approved suppliers of seeds, fertiliser, irrigation, farm tools, equipment and other agricultural inputs across Ghana.",
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
  const suppliers = orderSupplierDirectoryProfiles(await getSuppliersData());
  const initialSearch = searchQuery(searchParams?.q);

  return (
    <>
      <PageHero
        eyebrow="Supplier Directory"
        title="Find Farm Suppliers Across Ghana"
        variant="compact"
        description="Find approved suppliers of seeds, fertiliser, irrigation, farm tools, equipment and other agricultural inputs."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/become-a-supplier">Become a Supplier</ButtonLink>
          <ButtonLink href="/marketplace?category=farm-inputs" variant="secondary">Browse Farm Inputs</ButtonLink>
          <ButtonLink href="/farmer-directory" variant="light">Browse Farmer Directory</ButtonLink>
        </div>
      </PageHero>
      <SupplierDirectory suppliers={suppliers} initialSearch={initialSearch} />
    </>
  );
}
