import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

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

test("Homepage maps to the four approved responsive authorities", () => {
  const page = file("src/components/homepage/Stage1Homepage.tsx");
  const styles = file("src/components/homepage/Stage1Homepage.module.css");
  for (const section of ["hero", "gateways", "directory", "mama", "registration", "categorySection", "howItWorks"]) {
    assert.match(page, new RegExp(`styles\\.${section}`));
  }
  assert.match(styles, /@media\(max-width:980px\)/);
  assert.match(styles, /@media\(max-width:700px\)/);
  assert.match(styles, /@media\(max-width:360px\)/);
  assert.match(styles, /scroll-snap-type/);
});

test("Homepage restores the approved Mama G composition", () => {
  const page = file("src/components/homepage/Stage1Homepage.tsx");
  const styles = file("src/components/homepage/Stage1Homepage.module.css");
  const phone = file("src/components/homepage/FounderApprovedMamaGPhone.tsx");

  assert.doesNotMatch(page, /START HERE|What would you like to do\?/);
  assert.match(page, /styles\.mamaHeading/);
  assert.match(page, /styles\.mamaShowcase/);
  for (const title of ["Ask Mama G", "Check a crop problem", "Plan your crop", "Harvest & Storage", "Farm with the weather"]) {
    assert.ok(page.includes(title), title);
  }
  assert.match(page, /FounderApprovedMamaGPhone/);
  assert.match(phone, /homepage-mama-g-approved-layered\.png/);
  assert.match(styles, /\.rc1-approved-mama-g-phone/);
  assert.match(styles, /width:400px/);
  assert.match(styles, /width:270px/);
  assert.match(styles, /width:247px/);
  assert.match(styles, /width:224px/);
});

test("Homepage keeps the three founder-approved closed-state entry choices", () => {
  const page = file("src/components/homepage/Stage1Homepage.tsx");
  assert.match(page, /href="\/join"[^>]*>Register Your Farm or Shop/);
  assert.match(page, /href="\/submit-listing"[^>]*>List a Product/);
  assert.match(page, /href="\/submit-buyer-request"[^>]*>Are you a buyer\? Request Product/);
  assert.match(page, /styles\.directoryTabs/);
  assert.match(page, /styles\.railCue/);
});
