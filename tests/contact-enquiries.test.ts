import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { validateContactEnquiry } from "../src/lib/contactEnquiryContracts";
import {
  contactEnquiryId,
  contactEnquiryPayloadFingerprint,
  contactEnquiryRateLimitKey,
  contactEnquirySubmissionKey,
  createContactEnquiryReference
} from "../src/lib/contactEnquirySignatures";

const repoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const secret = "contact-enquiry-test-secret-with-at-least-thirty-two-characters";
const token = "123e4567-e89b-42d3-a456-426614174000";

const validContact = {
  enquiryType: "Contact",
  name: "Launch Review Contact",
  email: "contact@example.test",
  phone: "024 000 0000",
  organisation: "",
  subject: "Marketplace question",
  website: "",
  message: "Please explain the current enquiry process.",
  submissionToken: token
};

test("contact and partnership validation enforce their distinct required fields", () => {
  const contact = validateContactEnquiry(validContact);
  const partnership = validateContactEnquiry({
    ...validContact,
    enquiryType: "Partnership",
    organisation: "Review Organisation",
    subject: "Farmer training support",
    website: "https://example.test"
  });
  const incompletePartnership = validateContactEnquiry({ ...validContact, enquiryType: "Partnership", organisation: "", subject: "" });

  assert.equal(contact.ok, true);
  assert.equal(partnership.ok, true);
  assert.equal(incompletePartnership.ok, false);
  assert.equal(incompletePartnership.errors.organisation, "Enter your organisation name.");
  assert.equal(incompletePartnership.errors.subject, "Tell us your partnership interest.");
  assert.equal(validateContactEnquiry({ ...validContact, enquiryType: "Buyer" }).ok, false);
});

test("contact enquiry security values are purpose separated and exact-retry stable", () => {
  const validated = validateContactEnquiry(validContact).data!;
  const submissionKey = contactEnquirySubmissionKey(token, secret);
  const sameKey = contactEnquirySubmissionKey(token, secret);
  const fingerprint = contactEnquiryPayloadFingerprint(validated, secret);
  const changedFingerprint = contactEnquiryPayloadFingerprint({ ...validated, message: "Revised message" }, secret);
  const rateLimitKey = contactEnquiryRateLimitKey({
    enquiryType: "Contact",
    email: validContact.email,
    clientKey: "192.0.2.1",
    secret
  });

  assert.match(submissionKey, /^[a-f0-9]{64}$/);
  assert.equal(submissionKey, sameKey);
  assert.notEqual(fingerprint, changedFingerprint);
  assert.notEqual(submissionKey, fingerprint);
  assert.notEqual(rateLimitKey, submissionKey);
  assert.equal(contactEnquirySubmissionKey(token, "too-short"), "");
});

test("concurrent exact retries target one deterministic row and use safe references", () => {
  const submissionKey = contactEnquirySubmissionKey(token, secret);
  const id = contactEnquiryId(submissionKey);
  const sameId = contactEnquiryId(contactEnquirySubmissionKey(token, secret));
  const contactReference = createContactEnquiryReference("Contact", new Date("2026-08-04T12:00:00Z"), Buffer.from([0x12, 0x34, 0xab, 0xcd]));
  const partnershipReference = createContactEnquiryReference("Partnership", new Date("2026-08-04T12:00:00Z"), Buffer.from([0xde, 0xad, 0xbe, 0xef]));

  assert.equal(id, sameId);
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(contactReference, "GGC-20260804-1234ABCD");
  assert.equal(partnershipReference, "GGP-20260804-DEADBEEF");
  assert.doesNotMatch(contactReference, /^[0-9a-f-]{36}$/i);
});

test("public endpoint stores through service-role foundations and exposes only safe receipt fields", () => {
  const route = repoFile("src/app/api/contact-enquiries/route.ts");
  const service = repoFile("src/lib/contactEnquirySecurity.ts");

  assert.match(route, /validateContactEnquiry/);
  assert.match(route, /companyWebsite/);
  assert.match(route, /consumeContactEnquiryRateLimit/);
  assert.match(route, /findExistingContactEnquiry/);
  assert.match(route, /insertContactEnquiry/);
  assert.match(route, /conflictMessage, 409/);
  assert.match(service, /consume_lead_request_rate_limit/);
  assert.match(service, /submission_key=eq/);
  assert.doesNotMatch(route, /submissionKey|payloadFingerprint|enquiryId/);
  assert.doesNotMatch(route, /farmer_applications|supplier_applications|farmers|suppliers|listing_submissions/);
  assert.doesNotMatch(service, /console\.log|console\.error/);
});

test("forms preserve values on failure and replace themselves only on confirmed success", () => {
  const form = repoFile("src/components/ContactEnquiryForm.tsx");
  const contactPage = repoFile("src/app/contact/page.tsx");
  const partnershipPage = repoFile("src/app/about/partner-with-us/page.tsx");

  assert.match(form, /if \(submitted\)/);
  assert.match(form, /Message received/);
  assert.match(form, /Partnership enquiry received/);
  assert.match(form, /Your message and contact details are kept private\./);
  assert.match(form, /Start a new enquiry/);
  assert.match(form, /setSubmissionToken\(createSubmissionToken\(\)\)/);
  assert.match(form, /formError && !isConflict \? "Retry"/);
  assert.doesNotMatch(form, /\.reset\(\)/);
  assert.doesNotMatch(contactPage, /1-2 business days|normally respond/i);
  assert.match(partnershipPage, /<ContactEnquiryForm enquiryType="Partnership" \/>/);
  assert.doesNotMatch(partnershipPage, /<RegistrationForm/);
});

test("private Admin queue is authenticated, no-store, isolated and excludes internal identifiers", () => {
  const route = repoFile("src/app/api/admin/contact-enquiries/route.ts");
  const service = repoFile("src/lib/contactEnquiriesAdmin.ts");
  const workspace = repoFile("src/components/AdminContactEnquiriesWorkspace.tsx");
  const dashboard = repoFile("src/components/AdminDashboard.tsx");

  assert.match(route, /requireAdminUser/);
  assert.match(route, /private, no-store/);
  assert.match(service, /public_reference,enquiry_type,name,email,phone_whatsapp,organisation,subject_interest,website,message,status,source_path,created_at,updated_at/);
  assert.doesNotMatch(service, /select=id|submission_key|payload_fingerprint/);
  assert.match(workspace, /No contact or partnership enquiries yet\./);
  assert.match(workspace, /Filter by type/);
  assert.match(workspace, /Opening an enquiry is read-only and creates no workflow action\./);
  assert.match(dashboard, /Contact & Partnership Enquiries/);
  assert.doesNotMatch(route, /farmer_applications|supplier_applications|buyer_applications/);
});

test("migration grants service role only and creates no public policies", () => {
  const migration = repoFile("supabase/migrations/20260804123000_contact_and_partnership_enquiries.sql");
  const precheck = repoFile("supabase/review/precheck_contact_and_partnership_enquiries.sql");
  const verify = repoFile("supabase/review/verify_contact_and_partnership_enquiries.sql");

  assert.match(migration, /create table public\.contact_enquiries/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /revoke all on table public\.contact_enquiries from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.contact_enquiries to service_role/);
  assert.doesNotMatch(migration, /create policy/);
  assert.match(precheck, /to_regclass\('public\.contact_enquiries'\)/);
  assert.match(precheck, /to_jsonb\(sm\)->>'inserted_at'/);
  assert.match(verify, /public_direct_grant_count/);
  assert.match(verify, /public_policy_count/);
});

test("contact enquiry privilege hardening keeps only service-role CRUD access", () => {
  const migration = repoFile("supabase/migrations/20260804140000_harden_contact_enquiry_privileges.sql");
  const precheck = repoFile("supabase/review/precheck_harden_contact_enquiry_privileges.sql");
  const verify = repoFile("supabase/review/verify_harden_contact_enquiry_privileges.sql");

  assert.match(migration, /revoke all privileges on table public\.contact_enquiries from service_role/);
  assert.match(migration, /grant select, insert, update, delete on table public\.contact_enquiries to service_role/);
  assert.match(migration, /revoke all privileges on table public\.contact_enquiries from public, anon, authenticated/);
  assert.match(migration, /service_role owns public\.contact_enquiries/);
  assert.doesNotMatch(migration, /drop table|create table|alter table|insert into|update public\.|delete from|create policy/i);

  assert.match(precheck, /pg_get_userbyid\(c\.relowner\)/);
  assert.match(precheck, /aclexplode\(c\.relacl\)/);
  assert.match(precheck, /has_table_privilege/);
  assert.match(precheck, /pg_auth_members/);
  assert.match(precheck, /pg_default_acl/);
  assert.match(precheck, /contact_enquiry_count/);

  assert.match(verify, /migration 20260804140000 is not recorded/);
  assert.match(verify, /service_role must have exactly four direct CRUD grants/);
  assert.match(verify, /TRUNCATE/);
  assert.match(verify, /REFERENCES/);
  assert.match(verify, /TRIGGER/);
  assert.match(verify, /MAINTAIN/);
  assert.match(verify, /anon or authenticated retains effective table access/);
  assert.match(verify, /contact_enquiries updated_at trigger changed/);
  assert.match(verify, /unrelated aggregate row counts changed/);
});

test("unrelated public and security boundaries remain untouched", () => {
  const middleware = repoFile("src/middleware.ts");
  const homepage = repoFile("src/app/page.tsx");

  assert.match(middleware, /SITE_PRELAUNCH/);
  assert.doesNotMatch(homepage, /contact_enquiries|ContactEnquiryForm/);
});
