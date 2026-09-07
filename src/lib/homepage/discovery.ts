// Pure display contracts. No database, operational route or publication policy is activated here.
export type DirectoryKind = "farmer" | "supplier";
export type DirectoryEntry = Readonly<{id: string; kind: DirectoryKind; name: string; region: string; products: readonly string[]}>;
export type ListingEntry = Readonly<{id: string; title: string; category: string; seller: string; location: string}>;
export type ResourceEntry = Readonly<{id: string; title: string; format: "Guide" | "Visual Explainer" | "Video" | "Animation"}>;
export type Collection<T> = Readonly<{status: "ready"; items: readonly T[]}> | Readonly<{status: "unavailable"; items: readonly []}>;
export type HomepageData = Readonly<{provenance: "preview-fixture"; directory: Collection<DirectoryEntry>; listings: Collection<ListingEntry>; resources: Collection<ResourceEntry>}>;

// This package accepts only explicitly marked synthetic Preview fixtures.
// Connecting actual public data requires a separate eligibility/consent adapter and review.
const normalise = (value: string) => value.normalize("NFKC").toLocaleLowerCase("en-GH").trim();
export function discover(entries: readonly DirectoryEntry[], query: string, kind?: DirectoryKind) {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  return entries.filter(entry => (!kind || entry.kind === kind) && words.every(word => normalise([entry.name, entry.region, ...entry.products].join(" ")).includes(word)));
}
export function categoryListings(entries: readonly ListingEntry[], category: string) {
  return entries.filter(entry => category === "All" || normalise(entry.category) === normalise(category));
}
