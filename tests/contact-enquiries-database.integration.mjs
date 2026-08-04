import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const appUrl = process.env.APP_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!appUrl || !supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Disposable app and Supabase environment variables are required.");
}

const adminEmail = "contact-review-admin@example.test";
const adminPassword = `Review-${randomUUID()}-Aa1!`;

function contactPayload(overrides = {}) {
  return {
    enquiryType: "Contact",
    name: "Disposable Contact",
    email: "contact-flow@example.test",
    phone: "0240000000",
    organisation: "",
    subject: "Marketplace process",
    website: "",
    message: "Please explain how reviewed enquiries work.",
    submissionToken: randomUUID(),
    companyWebsite: "",
    ...overrides
  };
}

function partnershipPayload(overrides = {}) {
  return contactPayload({
    enquiryType: "Partnership",
    name: "Disposable Partner",
    email: "partnership-flow@example.test",
    organisation: "Disposable Review Organisation",
    subject: "Farmer training support",
    website: "https://example.test",
    message: "We would like to discuss practical farmer training support.",
    ...overrides
  });
}

async function submit(payload, client = "192.0.2.10") {
  const response = await fetch(`${appUrl}/api/contact-enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": client },
    body: JSON.stringify(payload)
  });
  return { response, body: await response.json() };
}

async function serviceRows(query = "select=public_reference,enquiry_type,name,email,message,status&order=created_at.asc") {
  const response = await fetch(`${supabaseUrl}/rest/v1/contact_enquiries?${query}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  });
  assert.equal(response.ok, true, `Service-role read failed with ${response.status}`);
  return response.json();
}

async function createAdminSession() {
  const create = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: adminEmail, password: adminPassword, email_confirm: true })
  });
  assert.equal(create.ok, true, `Admin fixture creation failed with ${create.status}`);

  const login = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  const session = await login.json();
  assert.equal(login.ok, true, `Admin fixture sign-in failed with ${login.status}`);
  assert.equal(typeof session.access_token, "string");
  return session.access_token;
}

const contact = contactPayload();
const first = await submit(contact);
assert.equal(first.response.status, 201);
assert.equal(first.body.ok, true);
assert.match(first.body.reference, /^GGC-\d{8}-[A-F0-9]{8}$/);

const exactRetry = await submit(contact);
assert.equal(exactRetry.response.status, 200);
assert.equal(exactRetry.body.duplicate, true);
assert.equal(exactRetry.body.reference, first.body.reference);
assert.equal((await serviceRows()).length, 1);

const divergentRetry = await submit({ ...contact, message: "This revision must conflict." });
assert.equal(divergentRetry.response.status, 409);
assert.match(divergentRetry.body.message, /already submitted with different information/i);
const afterConflict = await serviceRows();
assert.equal(afterConflict.length, 1);
assert.equal(afterConflict[0].message, contact.message);

const partnership = await submit(partnershipPayload());
assert.equal(partnership.response.status, 201);
assert.match(partnership.body.reference, /^GGP-\d{8}-[A-F0-9]{8}$/);

const concurrentPayload = contactPayload({
  email: "concurrent@example.test",
  submissionToken: randomUUID(),
  message: "One row must survive simultaneous exact retries."
});
const concurrent = await Promise.all([submit(concurrentPayload), submit(concurrentPayload)]);
assert.deepEqual(concurrent.map(({ response }) => response.status).sort(), [200, 201]);
assert.equal(concurrent[0].body.reference, concurrent[1].body.reference);
assert.equal((await serviceRows("select=public_reference&email=eq.concurrent%40example.test")).length, 1);

const invalid = await submit(contactPayload({ name: "", email: "not-an-email", message: "" }), "192.0.2.20");
assert.equal(invalid.response.status, 400);
assert.equal(typeof invalid.body.errors.name, "string");

const beforeHoneypot = (await serviceRows()).length;
const honeypot = await submit(contactPayload({ companyWebsite: "bot-value" }), "192.0.2.30");
assert.equal(honeypot.response.status, 400);
assert.equal((await serviceRows()).length, beforeHoneypot);

const rateLimitedStatuses = [];
for (let index = 0; index < 6; index += 1) {
  const attempt = await submit(contactPayload({
    email: "rate-limit@example.test",
    submissionToken: randomUUID(),
    message: `Rate-limit attempt ${index + 1}`
  }), "192.0.2.40");
  rateLimitedStatuses.push(attempt.response.status);
}
assert.deepEqual(rateLimitedStatuses, [201, 201, 201, 201, 201, 429]);

const anonymousRest = await fetch(`${supabaseUrl}/rest/v1/contact_enquiries?select=public_reference`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
});
assert.equal(anonymousRest.ok, false);

const unauthenticatedAdmin = await fetch(`${appUrl}/api/admin/contact-enquiries`);
assert.equal(unauthenticatedAdmin.status, 401);

const accessToken = await createAdminSession();
const authenticatedAdmin = await fetch(`${appUrl}/api/admin/contact-enquiries`, {
  headers: { Cookie: `ghana_growers_admin_access_token=${encodeURIComponent(accessToken)}` }
});
const adminBody = await authenticatedAdmin.json();
assert.equal(authenticatedAdmin.status, 200);
assert.equal(Array.isArray(adminBody.enquiries), true);
assert.equal(adminBody.enquiries.some((item) => item.enquiryType === "Contact"), true);
assert.equal(adminBody.enquiries.some((item) => item.enquiryType === "Partnership"), true);
const serializedAdmin = JSON.stringify(adminBody);
assert.doesNotMatch(serializedAdmin, /submission_key|payload_fingerprint|submissionToken/);
assert.equal(Object.hasOwn(adminBody.enquiries[0], "id"), false);

console.log("Disposable contact-enquiries integration passed: valid submissions, exact retry, conflict, concurrency, rate limit, RLS and protected Admin detail.");
