import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("Gate B removes rejected visible generated-media process text", () => {
  const page = read("src/components/homepage/Stage1Homepage.tsx");
  const video = read("src/components/homepage/HowItWorksVideo.tsx");

  assert.doesNotMatch(page, /Illustrative AI-generated imagery|generated-media-disclosure|imageDisclosure|categoryDisclosure/);
  assert.doesNotMatch(video, /generated-media-disclosure/);
});

test("Gate B preserves internal source provenance and claim boundaries", () => {
  const media = JSON.parse(read("docs/p09/gate-a-media-provenance.json"));
  const phone = JSON.parse(read("docs/p09/gate-b-homepage-figma-provenance.json"));

  assert.equal(media.package_sha256, "885CEE95300D506AE164F7A55F1CF6752C05F5016515B638B16602759A049864");
  assert.ok(media.derivatives.every((item: { source_sha256: string; generation_id: string; claim_boundary: string }) => item.source_sha256 && item.generation_id && item.claim_boundary));
  assert.equal(phone.asset.sha256, "4831B968261A1D17746AF205D141D3739C37585010A0998E2F2ED44DDC3074DC");
  assert.match(phone.asset.claim_boundary, /illustrative/i);
});
