const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("C:/Users/lynne/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const base = process.env.GATE_B_BASE_URL || "http://127.0.0.1:3012";
const output = process.env.GATE_B_OUTPUT || path.join(process.cwd(), "artifacts", "gate-b-homepage");
const widths = [320, 390, 768, 1440];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.GATE_B_BROWSER || "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });
  const page = await browser.newPage();
  const results = [];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(`${base}/`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(300, innerHeight * 0.75)) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      scrollTo(0, 0);
    });
    const images = page.locator("img");
    for (let index = 0; index < await images.count(); index += 1) {
      await images.nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      phoneCount: document.querySelectorAll('img[src="/rc1/homepage-mama-g-phone.png"]').length,
      unloadedImages: [...document.images].filter((image) => image.naturalWidth === 0).map((image) => image.getAttribute("src")),
      visibleDisclosureCount: [...document.querySelectorAll("body *")].filter((node) => node.textContent?.includes("Illustrative AI-generated imagery")).length
    }));
    assert.equal(metrics.scrollWidth, metrics.clientWidth, `${width}px has horizontal overflow`);
    assert.equal(metrics.phoneCount, 1, `${width}px must render exactly one approved phone artwork`);
    assert.deepEqual(metrics.unloadedImages, [], `${width}px contains an unloaded image`);
    assert.equal(metrics.visibleDisclosureCount, 0, `${width}px shows rejected process disclosure`);

    for (const [label, href] of [
      ["Register Your Farm or Shop", "/join"],
      ["List a Product", "/submit-listing"],
      ["Are you a buyer? Request Product", "/submit-buyer-request"]
    ]) {
      const link = page.getByRole("link", { name: label, exact: true }).first();
      assert.equal(await link.getAttribute("href"), href);
    }

    if (width <= 768) {
      const menu = page.getByRole("button", { name: "Open navigation" });
      await menu.click();
      assert.equal(await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible(), true);
      await page.keyboard.press("Escape");
      assert.equal(await menu.evaluate((node) => node === document.activeElement), true);
    }

    await page.screenshot({ path: path.join(output, `homepage-local-${width}.png`), fullPage: true });
    results.push({ width, status: "PASS", ...metrics });
  }

  fs.writeFileSync(path.join(output, "results.json"), `${JSON.stringify({ base, results }, null, 2)}\n`);
  await browser.close();
  console.log(JSON.stringify({ output, results }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
