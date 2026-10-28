import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("Stage 1 intake uses four independent server-only controls that default closed", () => {
  const authority = source("src/lib/publicSubmissionAvailability.ts");
  for (const name of [
    "PUBLIC_INTAKE_FARMER_REGISTRATION_ENABLED",
    "PUBLIC_INTAKE_SUPPLIER_REGISTRATION_ENABLED",
    "PUBLIC_INTAKE_PRODUCT_LISTING_ENABLED",
    "PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED"
  ]) {
    assert.match(authority, new RegExp(name));
    assert.doesNotMatch(name, /^NEXT_PUBLIC_/);
  }
  assert.match(authority, /process\.env\[control\][\s\S]*=== "true"/);
  assert.match(authority, /: false/);
  assert.match(authority, /"lead-requests": "PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED"/);

  for (const [page, form, workflow] of [
    ["src/app/join/farmer/page.tsx", "FarmerRegistrationForm", "farmer-registration"],
    ["src/app/become-a-supplier/page.tsx", "SupplierOnboardingForm", "supplier-registration"],
    ["src/app/submit-listing/page.tsx", "SubmitProduceListingForm", "listing-submissions"],
    ["src/app/submit-buyer-request/page.tsx", "SubmitBuyerRequestForm", "buyer-request-submissions"]
  ]) {
    const route = source(page);
    assert.match(route, new RegExp(`getPublicWorkflowState\\(\"${workflow}\"\\)`));
    assert.match(route, new RegExp(form));
    assert.match(route, /if \(!state\.available\)[\s\S]*PublicWorkflowClosed/);
  }
});

test("supplier intake matches the farmer security baseline without Sheets or email side effects", () => {
  const route = source("src/app/api/supplier-registration/route.ts");
  const security = source("src/lib/supplierApplicationSubmissions.ts");
  const validation = source("src/lib/supplierRegistration.ts");
  for (const marker of ["companyWebsite", "supplierApplicationSecurity", "findExistingSupplierApplication", "consumeSupplierApplicationRateLimit", "payload_fingerprint", "dedupe_key"]) {
    assert.match(route + security, new RegExp(marker));
  }
  assert.match(security, /consume_lead_request_rate_limit/);
  assert.doesNotMatch(route + validation, /appendSupplierRegistrationToSheet|sendSupplierRegistrationEmail|RESEND_API_KEY|GOOGLE_SHEETS/);
});

test("application review supports Needs Information and bounded correction without replacing identity", () => {
  const applications = source("src/lib/applications.ts");
  const route = source("src/app/api/admin/applications/route.ts");
  assert.match(applications, /"Needs Information"/);
  assert.match(applications, /correctionFields/);
  assert.match(applications, /verification_decision/);
  const correctionAllowlist = applications.slice(applications.indexOf("const correctionFields"), applications.indexOf("export async function updateApplicationReview"));
  assert.doesNotMatch(correctionAllowlist, /["']id["']/);
  assert.match(route, /action === "review"/);
});

test("product submissions remain private and only associate with active launch-ready profiles", () => {
  const service = source("src/lib/publicSubmissions.ts");
  const route = source("src/app/api/admin/submissions/route.ts");
  const workspace = source("src/components/AdminListingSubmissionsWorkspace.tsx");
  assert.match(service, /updateListingSellerAssociation/);
  assert.match(service, /seller\.status !== "Active" \|\| seller\.launch_ready !== true/);
  assert.match(route, /Stage 1 intake review cannot publish or convert submissions into Stage 2 records/);
  assert.doesNotMatch(route, /convertListingSubmission\(/);
  assert.doesNotMatch(workspace, /Approve and Publish/);
});

test("buyer intake writes to the protected lead_requests queue", () => {
  const route = source("src/app/api/buyer-request-submissions/route.ts");
  const service = source("src/lib/publicSubmissions.ts");
  const leads = source("src/lib/leadRequests.ts");
  assert.match(route, /createBuyerRequestSubmission/);
  assert.match(service, /createGenericSourcingLeadRequest/);
  assert.match(leads, /insertSupabaseRecord\("lead_requests"/);
  assert.match(leads, /consume_lead_request_rate_limit/);
});
