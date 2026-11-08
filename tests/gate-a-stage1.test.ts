import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { directoryFilters, directoryQuery, directoryReturn } from "../src/lib/directoryNavigation";
import { publicSupplierBadge } from "../src/lib/publicDirectoryBadge";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("Directory keeps filters in same-origin return links and uses only recorded supplier categories", () => {
  assert.deepEqual(directoryFilters({scope: "//elsewhere.test", q: [" maize "]}), {scope:"all", q:"maize"});
  assert.equal(directoryReturn({from:"directory", scope:"suppliers", q:"Seeds & tools"}), "/directory?scope=suppliers&q=Seeds+%26+tools");
  assert.equal(directoryReturn({from:"https://elsewhere.test"}), undefined);
  assert.equal(directoryQuery("all", "", true), "?from=directory");
  assert.equal(publicSupplierBadge("Seeds"), "Supplier");
  assert.equal(publicSupplierBadge("Logistics & Transport"), "Service provider");
  for (const value of [null, "Other", "Seeds, Logistics", "services for farms"]) assert.equal(publicSupplierBadge(value), "Supplier / service");
});

test("Gate A public navigation omits Stage 2 Market and deferred Learn", () => {
  const shell = file("src/components/homepage/Stage1PublicShell.tsx");
  assert.match(shell, /Ask Mama G/);
  assert.match(shell, /Farms & Suppliers/);
  assert.doesNotMatch(shell, /href: "\/marketplace"|label: "Market"/);
  assert.doesNotMatch(shell, /href: "\/learn"|label: "Learn"/);
});

test("legacy Marketplace routes render containment without fetching public listings", () => {
  for (const path of ["src/app/marketplace/page.tsx", "src/app/marketplace/[id]/page.tsx", "src/app/sell/page.tsx", "src/app/buyer-requests/page.tsx"]) {
    const source = file(path);
    assert.match(source, /MarketplaceStage2Notice/, path);
    assert.doesNotMatch(source, /getMarketplaceListings|BuyerRequestsBoard/, path);
  }
});

test("public supplier and Marketplace DTOs strip protected contact fields at the server boundary", () => {
  const types = file("src/types.ts");
  const supplierType = types.slice(types.indexOf("export type PublicSupplierProfile"));
  const mapper = file("src/lib/supabase/publicData.ts").slice(file("src/lib/supabase/publicData.ts").indexOf("export function mapSupplierPublicProfile"), file("src/lib/supabase/publicData.ts").indexOf("function mapListing"));
  const listings = file("src/lib/marketplace/publicListings.ts");
  assert.doesNotMatch(supplierType, /website\?:/);
  assert.doesNotMatch(mapper, /website:/);
  assert.match(listings, /whatsappNumber: _privateWhatsapp/);
  assert.match(listings, /internalOperationsNotes: _privateNotes/);
});

test("all public workflows are independently and server-side closed", () => {
  const authority = file("src/lib/publicSubmissionAvailability.ts");
  for (const workflow of ["farmer-registration", "supplier-registration", "lead-requests"]) {
    assert.match(authority, new RegExp(`"${workflow}"`));
  }
  assert.match(authority, /available: false/);
  for (const path of ["src/app/api/farmer-registration/route.ts", "src/app/api/supplier-registration/route.ts", "src/app/api/lead-requests/route.ts"]) {
    assert.match(file(path), /publicSubmissionGate/, path);
  }
});

test("only optimized Stage 1 derivatives are in the public media directory", () => {
  const root = join(process.cwd(), "public", "stage1-media");
  const assets = readdirSync(root);
  assert.equal(assets.some((asset) => asset.endsWith(".png")), false);
  assert.equal(assets.filter((asset) => asset.endsWith(".webp")).length, 16);
  assert.equal(assets.includes("how-it-works-stage1.mp4"), true);
  assert.equal(assets.some((asset) => /1b817c13|136938d9|2e6e4a6b|b8402ce7|c52bb514|68d7c86e|5c8632a9/.test(asset)), false);
  for (const asset of assets) assert.ok(statSync(join(root, asset)).size > 0, asset);
  assert.ok(existsSync(join(process.cwd(), "docs", "p09", "gate-a-media-provenance.json")));
});

test("Homepage places the category strip and independent showcases in the founder-approved order", () => {
  const page = file("src/components/homepage/Stage1Homepage.tsx");
  const ordered = ["homepage-hero-title", "Tell Farmers What You Need", "<CategoryStrip", "Farm Showcase", "Agro-Supplier Showcase", "<MamaGShowcase", "JOIN THE NETWORK", "HOW IT WORKS"];
  const positions = ordered.map(label => page.indexOf(label));
  assert.ok(positions.every((position, i) => position >= 0 && (i === 0 || position > positions[i-1])));
  assert.match(page, /farmerResult\.status === "unavailable"/);
  assert.match(page, /supplierResult\.status === "unavailable"/);
  assert.doesNotMatch(page, /styles\.directoryTabs|Top Farms &amp; Agro-Suppliers|categoryIntro/);
});

test("Homepage keeps one approved illustration across five independently selectable features", () => {
  const exhibit = file("src/components/homepage/MamaGShowcase.tsx");
  const handset = "/rc1/homepage-mama-g-approved-layered.png";
  assert.ok(existsSync(join(process.cwd(), "public", handset)));
  assert.ok(exhibit.includes(`href="${handset}"`));
  assert.deepEqual(Array.from(exhibit.matchAll(/tab: "([^"]+)"/g), match => match[1]),
    ["Crop Doctor", "Ask Mama G", "Planting", "Storage", "Weather"]);
  assert.match(exhibit, /<Handset \/>/);
  assert.match(exhibit, /Sample weather/);
  assert.doesNotMatch(exhibit, /fetch\(|\/api\/|<iframe|demo-\$\{/);
  assert.match(exhibit, /href="\/farmer-hub"/);
});

test("Homepage keeps independent founder-approved entry destinations", () => {
  const page = file("src/components/homepage/Stage1Homepage.tsx");
  for (const href of ["/join", "/join/farmer", "/become-a-supplier", "/submit-listing", "/submit-buyer-request", "/directory?scope=farms", "/directory?scope=suppliers"]) {
    assert.ok(page.includes(`href="${href}"`), href);
  }
  assert.match(page, /disabled aria-describedby="buyer-availability">Submit Buyer Request/);
  assert.match(page, /Requests currently closed/);
  assert.doesNotMatch(page, /HowItWorksVideo|<video|Show What You Offer/);
});
