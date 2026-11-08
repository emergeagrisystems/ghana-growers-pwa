import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cleanFarmerLocation, dedupePublicLocationParts, farmerCardProducts } from "@/lib/farmerDirectory";
import { directoryFilters, directoryQuery, type DirectorySearchParams, type DirectoryScope } from "@/lib/directoryNavigation";
import { publicSupplierBadge } from "@/lib/publicDirectoryBadge";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData, getSuppliersData } from "@/lib/supabase/publicData";
import styles from "./directory.module.css";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({ title: "Farms & Suppliers", description: "Search published farms, agricultural suppliers and services in Ghana by product or location.", path: "/directory" });

const filters: Array<[DirectoryScope, string]> = [["all", "All profiles"], ["farms", "Farms"], ["suppliers", "Suppliers & Services"]];

export default async function DirectoryPage({ searchParams }: { searchParams?: DirectorySearchParams }) {
  const { q, scope } = directoryFilters(searchParams);
  const [farms, suppliers] = await Promise.all([
    scope === "suppliers" ? null : getFarmersData(),
    scope === "farms" ? null : getSuppliersData()
  ]);
  const profiles = [
    ...(farms?.data ?? []).map(farm => ({
      name: farm.farmName, type: "Farm", offers: farmerCardProducts(farm), location: cleanFarmerLocation(farm),
      keywords: [farm.farmType, ...farm.products].join(" "), path: "/farmer-directory/" + encodeURIComponent(farm.slug)
    })),
    ...(suppliers?.data ?? []).map(supplier => ({
      name: supplier.companyName, type: publicSupplierBadge(supplier.supplierCategory), offers: supplier.productsServices,
      location: dedupePublicLocationParts(supplier.district, supplier.region).join(", "),
      keywords: [supplier.supplierCategory, supplier.serviceCoverageArea].join(" "), path: "/supplier-directory/" + encodeURIComponent(supplier.slug)
    }))
  ];
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = profiles.filter(p => {
    const haystack = [p.name, p.type, ...p.offers, p.location, p.keywords].join(" ").toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
  const failed = farms?.status === "unavailable" || suppliers?.status === "unavailable";
  return <main className={styles.page}><div className={styles.inner}>
    <h1>Farms &amp; Suppliers</h1>
    <form role="search" action="/directory" method="get">
      <label htmlFor="directory-query" className="sr-only">Search by crop, product, service or location</label>
      <div className={styles.search}>
        <input key={q} id="directory-query" name="q" type="search" maxLength={180} defaultValue={q} placeholder="Crop, product, service or location" />
        <button type="submit" name="scope" value={scope}>Search</button>
      </div>
      <div className={styles.filters} role="group" aria-label="Profile type">
        {filters.map(([value, label]) => <button key={value} type="submit" name="scope" value={value} aria-pressed={scope === value}>
          {scope === value && <Check size={16} aria-hidden="true" />}{label}
        </button>)}
      </div>
    </form>
    {farms?.status === "unavailable" && <p role="status">Farm profiles are temporarily unavailable. Please try again.</p>}
    {suppliers?.status === "unavailable" && <p role="status">Supplier and service profiles are temporarily unavailable. Please try again.</p>}
    <ul className={styles.results} aria-label="Published profiles">{results.map(p => <li key={p.path}>
      <Link href={p.path + directoryQuery(scope, q, true)} className={styles.card}>
        <span><small>{p.type}</small><strong>{p.name}</strong><span>{p.offers.join(" · ")}</span><span>{p.location}</span></span>
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
    </li>)}</ul>
    {!results.length && (profiles.length ? <p role="status">{failed ? "No matches in the available profiles." : "No profiles match your search."} <Link href={"/directory" + directoryQuery(scope, "")}>Clear search</Link></p>
      : !failed && <p role="status">{scope === "farms" ? "No farms are published yet." : scope === "suppliers" ? "No supplier or service profiles are published yet." : "No profiles are published yet."}</p>)}
  </div></main>;
}
