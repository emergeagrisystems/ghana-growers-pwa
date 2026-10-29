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
    assert.match(route, /publicSubmissionAvailable/);
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
  const form = source("src/components/SupplierOnboardingForm.tsx");
  assert.match(form, /data\.reference/);
  assert.match(form, /Application reference:/);
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
  const form = source("src/components/SubmitBuyerRequestForm.tsx");
  assert.match(form, /const form = event\.currentTarget;/);
  assert.match(form, /form\.reset\(\);/);
});

test("admin password recovery uses PKCE across the protected Preview boundary", () => {
  const loginPage = source("src/app/admin/login/page.tsx");
  const loginForm = source("src/components/AdminLoginForm.tsx");
  const resetPage = source("src/app/admin/reset-password/page.tsx");
  const resetForm = source("src/components/AdminResetPasswordForm.tsx");
  const recovery = source("src/lib/adminPasswordRecovery.ts");

  assert.match(loginPage, /\/admin\/reset-password/);
  assert.match(loginPage, /VERCEL_BRANCH_URL/);
  assert.match(loginPage, /hostname\.endsWith\("\.vercel\.app"\)/);
  assert.match(loginForm, /requestAdminPasswordRecovery/);
  assert.match(recovery, /flowType: "pkce"/);
  assert.match(recovery, /resetPasswordForEmail\(email, \{ redirectTo \}\)/);
  assert.match(recovery, /exchangeCodeForSession\(code\)/);
  assert.match(resetPage, /robots: \{ index: false, follow: false \}/);
  assert.match(resetPage, /referrer: "no-referrer"/);
  assert.match(resetForm, /window\.history\.replaceState/);
  assert.match(resetForm, /autoComplete="new-password"/);
  assert.match(recovery, /app_metadata\?\.role !== "admin"/);
  assert.match(recovery, /supabase\.auth\.updateUser\(\{ password \}\)/);
  assert.match(recovery, /supabase\.auth\.signOut\(\{ scope: "local" \}\)/);
  assert.doesNotMatch(recovery, /access_token|refresh_token/);
  assert.doesNotMatch(resetForm + recovery, /console\.(log|info|warn|error)/);
});

test("optional product availability dates are stored as null rather than invalid empty dates", () => {
  const service = source("src/lib/publicSubmissions.ts");
  assert.match(service, /available_from_date: clean\(formData\.get\("availableFromDate"\)\) \|\| null/);
});
