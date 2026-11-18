import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { LAUNCH_FALLBACK, LAUNCH_INSTANT, LAUNCH_TIMESTAMP, launchCountdown } from "../src/lib/launchCountdown";
import { isPrelaunchIntakeRoute, isPrelaunchLegalRoute, prelaunchIntakeRoutes } from "../src/lib/prelaunchAccess";
import { getPublicWorkflowState, publicSubmissionGate, type PublicSubmissionWorkflow } from "../src/lib/publicSubmissionAvailability";

test("one UTC instant and stable non-JavaScript launch fallback", () => {
  assert.equal(LAUNCH_INSTANT, "2026-12-04T05:00:00Z");
  assert.equal(LAUNCH_TIMESTAMP, Date.UTC(2026, 11, 4, 5));
  assert.equal(LAUNCH_FALLBACK, "Launching 4 December 2026 · 5:00 AM Ghana time");
});
test("countdown before, last fraction, exactly at and after launch", () => {
  assert.deepEqual(launchCountdown(LAUNCH_TIMESTAMP - 90061000), { days: 1, hours: 1, minutes: 1, seconds: 1, reached: false });
  assert.equal(launchCountdown(LAUNCH_TIMESTAMP - 1).seconds, 1);
  for (const time of [LAUNCH_TIMESTAMP, LAUNCH_TIMESTAMP + 86400000]) {
    assert.deepEqual(launchCountdown(time), { days: 0, hours: 0, minutes: 0, seconds: 0, reached: true });
  }
});
test("equivalent timezone timestamps have identical remaining time", () => {
  const timestamps = ["2026-12-03T05:00:00Z", "2026-12-02T21:00:00-08:00", "2026-12-03T14:00:00+09:00"];
  assert.deepEqual(timestamps.map(value => launchCountdown(Date.parse(value))), timestamps.map(() => ({ days: 1, hours: 0, minutes: 0, seconds: 0, reached: false })));
});
test("only the eight exact acquisition paths are allowlisted", () => {
  assert.equal(prelaunchIntakeRoutes.length, 8);
  for (const route of prelaunchIntakeRoutes) {
    assert.equal(isPrelaunchIntakeRoute(route), true);
    assert.equal(isPrelaunchIntakeRoute(route + "/private"), false);
    assert.equal(isPrelaunchIntakeRoute(route + "-other"), false);
  }
  for (const path of ["/join/buyer", "/api/buyer-registration", "/marketplace", "/directory", "/learn", "/account", "/api/lead-requests"]) assert.equal(isPrelaunchIntakeRoute(path), false);
  for (const path of ["/privacy-policy", "/terms-of-use", "/privacy", "/terms"]) assert.equal(isPrelaunchLegalRoute(path), true);
  assert.equal(isPrelaunchLegalRoute("/privacy-policy/private"), false);
});
test("four workflow flags remain independent, default closed and authoritative", async () => {
  const pairs: [PublicSubmissionWorkflow, string][] = [
    ["farmer-registration", "PUBLIC_INTAKE_FARMER_REGISTRATION_ENABLED"],
    ["supplier-registration", "PUBLIC_INTAKE_SUPPLIER_REGISTRATION_ENABLED"],
    ["listing-submissions", "PUBLIC_INTAKE_PRODUCT_LISTING_ENABLED"],
    ["buyer-request-submissions", "PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED"]
  ];
  const previous = pairs.map(([, key]) => process.env[key]);
  try {
    for (const [, key] of pairs) delete process.env[key];
    for (const [workflow] of pairs) assert.equal(publicSubmissionGate(workflow)?.status, 503);
    for (const [, key] of pairs) process.env[key] = "true";
    for (const [workflow, key] of pairs) {
      process.env[key] = "false";
      assert.equal(getPublicWorkflowState(workflow).available, false);
      const denied = publicSubmissionGate(workflow)!;
      assert.equal(denied.status, 503);
      assert.equal((await denied.json()).code, "PUBLIC_SUBMISSION_UNAVAILABLE");
      for (const [other] of pairs.filter(([w]) => w !== workflow)) assert.equal(publicSubmissionGate(other), null);
      process.env[key] = "true";
    }
    assert.equal(publicSubmissionGate("buyer-registration")?.status, 503);
  } finally { pairs.forEach(([, key], i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i]; }); }
});
test("teaser is static, countdown has no release effects and does not announce every second", () => {
  const teaser = readFileSync("src/components/prelaunch/MamaGTeaser.tsx", "utf8");
  const clock = readFileSync("src/components/prelaunch/LaunchCountdown.tsx", "utf8");
  assert.doesNotMatch(teaser, /<input|<button|<Link|<a\s|onClick|onSubmit|fetch\(|useEffect|MamaGShowcase|FarmMateHub|tabIndex/);
  assert.doesNotMatch(clock, /fetch\(|router\.|location\.|process\.env|window\.open/);
  assert.match(clock, /aria-live="off"/);
  assert.match(clock, /useState<ReturnType<typeof launchCountdown> \| null>\(null\)/);
  assert.match(teaser, /aria-hidden="true"/);
  assert.match(readFileSync("src/components/prelaunch/Campaign.module.css", "utf8"), /prefers-reduced-motion:reduce/);
});
