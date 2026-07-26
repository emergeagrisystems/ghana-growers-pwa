import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  collectHqApprovalCounts,
  createHqIntegrationSignature,
  hqApprovalCountsPath,
  verifyHqIntegrationRequest,
  type HqApprovalCountSources
} from "../src/lib/hqApprovalCounts";

const secret = "hq-integration-test-secret-that-is-at-least-thirty-two-characters";
const nowMs = Date.UTC(2026, 6, 26, 16, 0, 0);
const timestamp = String(Math.floor(nowMs / 1000));

function validSignature() {
  return createHqIntegrationSignature({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    secret
  });
}

function sources(overrides: Partial<HqApprovalCountSources> = {}): HqApprovalCountSources {
  return {
    farmerProfileApplicationsPending: async () => 4,
    importedFarmersPendingReview: async () => 7,
    supplierApplicationsPending: async () => 3,
    ...overrides
  };
}

test("accepts a valid HMAC signature", () => {
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    signature: validSignature(),
    secret,
    nowMs
  }), true);
});

test("rejects a missing signature", () => {
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    signature: null,
    secret,
    nowMs
  }), false);
});

test("rejects an incorrect signature", () => {
  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp,
    signature: "0".repeat(64),
    secret,
    nowMs
  }), false);
});

test("rejects an expired timestamp", () => {
  const expiredTimestamp = String(Math.floor((nowMs - (5 * 60 * 1000) - 1_000) / 1000));
  const expiredSignature = createHqIntegrationSignature({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp: expiredTimestamp,
    secret
  });

  assert.equal(verifyHqIntegrationRequest({
    method: "GET",
    requestPath: hqApprovalCountsPath,
    timestamp: expiredTimestamp,
    signature: expiredSignature,
    secret,
    nowMs
  }), false);
});

test("returns all successful counts with independent availability", async () => {
  const generatedAt = new Date("2026-07-26T16:00:00.000Z");
  const result = await collectHqApprovalCounts(sources(), { now: () => generatedAt });

  assert.equal(result.completeFailure, false);
  assert.deepEqual(result.response, {
    farmerProfileApplicationsPending: 4,
    importedFarmersPendingReview: 7,
    supplierApplicationsPending: 3,
    generatedAt: generatedAt.toISOString(),
    availability: {
      farmerProfileApplicationsPending: "available",
      importedFarmersPendingReview: "available",
      supplierApplicationsPending: "available"
    }
  });
});

test("marks one failed source unavailable without zeroing it or hiding successful counts", async () => {
  const result = await collectHqApprovalCounts(sources({
    importedFarmersPendingReview: async () => { throw new Error("source failed"); }
  }));

  assert.equal(result.completeFailure, false);
  assert.equal(result.response.farmerProfileApplicationsPending, 4);
  assert.equal(result.response.importedFarmersPendingReview, null);
  assert.equal(result.response.supplierApplicationsPending, 3);
  assert.equal(result.response.availability.importedFarmersPendingReview, "unavailable");
});

test("marks a complete source failure unavailable and suitable for HTTP 503", async () => {
  const unavailable = async () => { throw new Error("source failed"); };
  const result = await collectHqApprovalCounts({
    farmerProfileApplicationsPending: unavailable,
    importedFarmersPendingReview: unavailable,
    supplierApplicationsPending: unavailable
  });

  assert.equal(result.completeFailure, true);
  assert.equal(result.response.farmerProfileApplicationsPending, null);
  assert.equal(result.response.importedFarmersPendingReview, null);
  assert.equal(result.response.supplierApplicationsPending, null);
  assert.deepEqual(Object.values(result.response.availability), ["unavailable", "unavailable", "unavailable"]);
});

test("response contract contains no private applicant fields", async () => {
  const result = await collectHqApprovalCounts(sources());
  const topLevelKeys = Object.keys(result.response).sort();
  const serialized = JSON.stringify(result.response);

  assert.deepEqual(topLevelKeys, [
    "availability",
    "farmerProfileApplicationsPending",
    "generatedAt",
    "importedFarmersPendingReview",
    "supplierApplicationsPending"
  ]);
  assert.doesNotMatch(serialized, /"(?:id|name|applicant_name|email|phone|telephone|notes|media|media_path|private_profile_image_path)"\s*:/i);
});

test("route remains GET-only, no-store, signed, rate-limited, and without permissive CORS", () => {
  const route = readFileSync(join(process.cwd(), "src/app/api/integrations/hq/approval-counts/route.ts"), "utf8");
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260726183000_hq_integration_rate_limit.sql"), "utf8");

  assert.match(route, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE|OPTIONS)/);
  assert.match(route, /process\.env\.HQ_INTEGRATION_SECRET/);
  assert.match(route, /x-hq-timestamp/);
  assert.match(route, /x-hq-signature/);
  assert.match(route, /"Cache-Control": "no-store, max-age=0"/);
  assert.doesNotMatch(route, /Access-Control-Allow-Origin/i);
  assert.match(route, /consume_hq_integration_rate_limit/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all .* from public, anon, authenticated/i);
  assert.match(migration, /grant execute .* to service_role/i);
});
