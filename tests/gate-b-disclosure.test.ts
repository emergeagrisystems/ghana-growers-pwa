import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("Gate B generated-media disclosure is exact, visible and programmatically associated", () => {
  const page = read("src/components/homepage/Stage1Homepage.tsx");
  const styles = read("src/components/homepage/Stage1Homepage.module.css");
  const wording = "Illustrative AI-generated imagery. It does not depict actual Ghana Growers members, farms or transactions.";

  assert.ok(page.includes(wording));
  assert.ok(page.includes('aria-describedby="hero-generated-media-disclosure"'));
  assert.ok(page.includes('aria-describedby="registration-generated-media-disclosure"'));
  assert.ok(page.includes('aria-describedby="category-generated-media-disclosure"'));
  assert.ok(page.includes('id="hero-generated-media-disclosure"'));
  assert.ok(page.includes('id="registration-generated-media-disclosure"'));
  assert.ok(page.includes('id="category-generated-media-disclosure"'));
  assert.ok(styles.includes(".imageDisclosure"));
  assert.ok(styles.includes(".categoryDisclosure"));
});
