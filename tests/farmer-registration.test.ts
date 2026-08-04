import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  createFarmerApplicationReference,
  farmerApplicationId,
  farmerApplicationDedupeKey,
  farmerApplicationPayloadFingerprint,
  farmerApplicationRateLimitKey,
  farmerApplicationSubmissionKey,
  validateFarmerRegistration
} from "../src/lib/farmerRegistration";

const repoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const secret = "farmer-registration-test-secret-with-at-least-thirty-two-characters";
const validInput = {
  applicantName: "Ama Farmer",
  phoneNumber: "024 000 0000",
  region: "Eastern Region",
  district: "Yilo Krobo Municipality",
  farmType: "Mixed",
  cropsProducts: "Maize, Cassava",
  agreementAccepted: true,
  submissionToken: "123e4567-e89b-42d3-a456-426614174000"
};

test("minimal farmer application accepts omitted optional editorial fields", () => {
  const result = validateFarmerRegistration(validInput);

  assert.equal(result.ok, true);
  assert.deepEqual(result.data?.cropsProducts, ["Maize", "Cassava"]);
  assert.equal(result.data?.farmName, "");
  assert.equal(result.data?.email, "");
  assert.equal(result.data?.productionDetails, "");
  assert.equal(result.data?.applicationMessage, "");
});

test("farmer application requires identity, contact, location, production and consent", () => {
  const result = validateFarmerRegistration({ submissionToken: validInput.submissionToken });

  assert.equal(result.ok, false);
  assert.equal(result.errors.applicantName, "Enter your name.");
  assert.equal(result.errors.contact, "Enter a phone or WhatsApp number.");
  assert.equal(result.errors.region, "Select your region.");
  assert.equal(result.errors.district, "Enter your district.");
  assert.equal(result.errors.farmType, "Select a farm type.");
  assert.equal(result.errors.cropsProducts, "Tell us what you grow or produce.");
  assert.equal(result.errors.agreementAccepted, "Confirm the application terms before submitting.");
});

test("farmer submission security keys are secret-derived and purpose-separated", () => {
  const token = validInput.submissionToken;
  const submissionKey = farmerApplicationSubmissionKey(token, secret);
  const rateLimitKey = farmerApplicationRateLimitKey({ contact: "0240000000", clientKey: "192.0.2.1", secret });
  const dedupeKey = farmerApplicationDedupeKey({
    applicantName: "Ama Farmer",
    farmName: "Ama Farm",
    contact: "0240000000",
    region: "Eastern Region",
    secret
  });

  assert.match(submissionKey, /^[a-f0-9]{64}$/);
  assert.match(rateLimitKey, /^[a-f0-9]{64}$/);
  assert.match(dedupeKey, /^[a-f0-9]{64}$/);
  assert.notEqual(submissionKey, rateLimitKey);
  assert.notEqual(rateLimitKey, dedupeKey);
  assert.equal(farmerApplicationSubmissionKey(token, "too-short"), "");
});

test("normalized farmer payload fingerprints distinguish material changes and media", () => {
  const validated = validateFarmerRegistration(validInput);
  assert.equal(validated.ok, true);
  const payload = validated.data!;
  const media = [{ group: "profile", kind: "image" as const, contentType: "image/png", size: 68, digest: "a".repeat(64) }];
  const fingerprint = farmerApplicationPayloadFingerprint(payload, media, secret);
  const reorderedCrops = farmerApplicationPayloadFingerprint({ ...payload, cropsProducts: [...payload.cropsProducts].reverse() }, media, secret);
  const changedDistrict = farmerApplicationPayloadFingerprint({ ...payload, district: "A different district" }, media, secret);
  const changedMedia = farmerApplicationPayloadFingerprint(payload, [{ ...media[0], digest: "b".repeat(64) }], secret);

  assert.match(fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(reorderedCrops, fingerprint);
  assert.notEqual(changedDistrict, fingerprint);
  assert.notEqual(changedMedia, fingerprint);
});

test("submission keys produce one deterministic database-safe application ID", () => {
  const submissionKey = farmerApplicationSubmissionKey(validInput.submissionToken, secret);
  const applicationId = farmerApplicationId(submissionKey);

  assert.match(applicationId, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(farmerApplicationId(submissionKey), applicationId);
  assert.equal(farmerApplicationId("invalid"), "");
});

test("farmer application reference is safe and does not expose the internal UUID", () => {
  const reference = createFarmerApplicationReference(
    new Date("2026-08-04T10:00:00.000Z"),
    Buffer.from([0x12, 0x34, 0xab, 0xcd])
  );

  assert.equal(reference, "GGF-20260804-1234ABCD");
  assert.doesNotMatch(reference, /^[0-9a-f-]{36}$/i);
});

test("public farmer route uses private service foundations and no publication side effects", () => {
  const route = repoFile("src/app/api/farmer-registration/route.ts");
  const service = repoFile("src/lib/farmerApplicationSubmissions.ts");
  const contract = repoFile("src/lib/farmerRegistration.ts");
  const profileService = repoFile("src/lib/profileApplications.ts");

  assert.match(route, /createFarmerApplication/);
  assert.match(route, /uploadPrivateApplicationMedia/);
  assert.match(route, /cleanupPrivateApplicationMedia/);
  assert.match(route, /companyWebsite/);
  assert.match(route, /findExistingFarmerApplication/);
  assert.match(route, /payload_fingerprint: security\.payloadFingerprint/);
  assert.match(route, /submissionConflictMessage, 409/);
  assert.doesNotMatch(route, /inFlightSubmissionKeys/);
  assert.match(route, /consumeFarmerApplicationRateLimit/);
  assert.match(route, /source: "public_farmer_application"/);
  assert.match(route, /private_document_paths: privateDocumentPaths/);
  assert.doesNotMatch(route, /convertFarmerApplicationToProfile|insertSupabaseRecord\("farmers"|createListingSubmission|verification_decision: "Verified"|launch_ready: true|is_featured/);
  assert.match(service, /consume_lead_request_rate_limit/);
  assert.match(service, /farmerApplicationRateLimitKey/);
  assert.match(contract, /farmer-application-rate-limit/);
  assert.match(profileService, /status: "New"/);
  assert.match(profileService, /review_state: "Pending Review"/);
  assert.match(profileService, /verification_decision: "Not Reviewed"/);
  assert.match(profileService, /launch_ready: false/);
});

test("farmer application UI preserves failure values and replaces the form on success", () => {
  const form = repoFile("src/components/FarmerRegistrationForm.tsx");
  const page = repoFile("src/app/join/farmer/page.tsx");

  assert.match(page, /Register your farm with Ghana Growers\./);
  assert.match(page, /<FarmerRegistrationForm \/>/);
  assert.match(form, /if \(submitted\)/);
  assert.match(form, /Application received/);
  assert.match(form, /Your entries are still here/);
  assert.match(form, /Start a new application/);
  assert.match(form, /setSubmissionToken\(createSubmissionToken\(\)\)/);
  assert.match(form, /if \(isSubmitting \|\| submitted \|\| !submissionToken\) return/);
  assert.doesNotMatch(form, /form\.reset\(\)/);
  assert.match(form, /Optional photos and documents/);
  assert.match(form, /farmer-application-media|Files stay private/);
});

test("Join pathways separate buyers, farmer registration, listings and supplier applications", () => {
  const joinPage = repoFile("src/app/join/page.tsx");
  const buyerPage = repoFile("src/app/join/buyer/page.tsx");
  const supplierPage = repoFile("src/app/become-a-supplier/page.tsx");
  const supplierRoute = repoFile("src/app/api/supplier-registration/route.ts");

  assert.match(joinPage, /Browse Marketplace/);
  assert.match(joinPage, /Request sourcing support/);
  assert.match(joinPage, /Register as a Farmer/);
  assert.match(joinPage, /Submit Produce/);
  assert.match(joinPage, /Apply as a Supplier/);
  assert.match(joinPage, /Submit Farm Inputs/);
  assert.match(joinPage, /registration creates a private application/i);
  assert.doesNotMatch(joinPage, /partner/i);
  assert.match(buyerPage, /permanentRedirect\("\/marketplace"\)/);
  assert.doesNotMatch(buyerPage, /buyer_applications|BuyerRegistrationForm/);
  assert.match(supplierPage, /Apply to join as a supplier/);
  assert.doesNotMatch(supplierPage, /trusted supplier|across Ghana|one business day/i);
  assert.match(supplierRoute, /createSupplierApplication/);
});

test("schema and Admin queue keep farmer applications private and isolated", () => {
  const migration = repoFile("supabase/migrations/20260723035406_profile_applications_and_private_media.sql");
  const applications = repoFile("src/lib/applications.ts");
  const adminRoute = repoFile("src/app/api/admin/applications/route.ts");

  assert.match(migration, /alter table public\.farmer_applications enable row level security/);
  assert.match(migration, /revoke all on table public\.farmer_applications from public, anon, authenticated/);
  assert.match(migration, /'farmer-application-media',[\s\S]*?false/);
  assert.match(migration, /Service role manages private profile application media/);
  assert.match(applications, /farmer: "farmer_applications"/);
  assert.match(adminRoute, /requireAdminUser/);
  assert.doesNotMatch(adminRoute, /buyer_applications/);
});

test("Launching Soon and Admin authorization boundaries remain unchanged", () => {
  const middleware = repoFile("src/middleware.ts");
  const adminRoute = repoFile("src/app/api/admin/applications/route.ts");

  assert.match(middleware, /SITE_PRELAUNCH/);
  assert.match(adminRoute, /requireAdminUser/);
});
