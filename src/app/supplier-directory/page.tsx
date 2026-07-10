import Link from "next/link";
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
          <Link href="/marketplace?category=farm-inputs" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-earth-500 px-6 py-3 text-sm font-black text-ink shadow-sm transition duration-200 ease-out hover:bg-earth-700 hover:text-white">
            Browse Farm Inputs
          </Link>
          <ButtonLink href="/farmer-directory" variant="secondary">Browse Farmer Directory</ButtonLink>
        </div>
      </PageHero>
      <SupplierDirectory suppliers={suppliers} initialSearch={initialSearch} />
    </>
  );
}
