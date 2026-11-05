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
    const height = ({320:568, 390:844, 768:960, 1440:900})[width];
    await page.setViewportSize({ width, height });
    const response = await page.goto(`${base}/`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(300, innerHeight * 0.75)) {
        scrollTo({top:y, behavior:"instant"});
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      scrollTo({top:0, behavior:"instant"});
    });
    const buyer = page.getByRole("region", {name:"Tell Farmers What You Need"});
    const disabled = buyer.getByRole("button", {name:"Submit Buyer Request"});
    const banner = await buyer.locator(":scope > div").boundingBox();
    const mobileDock = page.getByRole("navigation", {name:"Homepage quick access"});
    const edge = await mobileDock.isVisible() ? (await mobileDock.boundingBox()).y : height;
    if (width === 320) {
      assert.ok(banner.y > edge, JSON.stringify({width,height,edge,banner,scroll:await page.evaluate(()=>scrollY)}));
      const draft = await page.locator("#home-adviser-question").boundingBox();
      assert.ok(edge - draft.y - draft.height >= 9.5, "Draft controls must clear the dock; exact reference geometry is checked on Protected Preview.");
    } else if (width !== 768) {
      assert.equal(edge - banner.y, 8);
    }
    assert.equal(await disabled.getAttribute("aria-describedby"),"buyer-availability");
    assert.ok(await buyer.getByText("Requests currently closed").isVisible());
    const audience = await buyer.getByText(/^For wholesale buyers/).innerText();
    assert.equal(audience, "For wholesale buyers, restaurants, market traders, farmers, agribusinesses and households.");
    const rail = page.getByRole("region", {name:"Agricultural categories", exact:true}).last();
    if (width <= 390) {
      await rail.focus();
      await rail.press("ArrowRight");
      await page.waitForFunction(() => document.activeElement.scrollLeft > 30);
      await page.waitForFunction(() => {
        const rail = document.activeElement;
        return [...rail.children].some(item => Math.abs(item.getBoundingClientRect().left-rail.getBoundingClientRect().left)<2);
      });
    }
    const featureList = page.getByRole("list").filter({has:page.getByRole("heading",{name:"Storage tips",exact:true})});
    assert.equal(await featureList.getAttribute("data-highlight"),"once");
    assert.equal(await featureList.getByRole("listitem").count(),5);
    assert.equal(await page.getByRole("link",{name:"View all",exact:true}).isVisible(),true);
    await page.getByRole("link",{name:"Open Mama G",exact:true}).focus();
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(()=>document.activeElement?.matches(":focus-visible")));
    const images = page.locator("img");
    for (let index = 0; index < await images.count(); index += 1) {
      await images.nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => scrollTo({top:0, behavior:"instant"}));
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      phoneCount: document.querySelectorAll('img[src="/rc1/homepage-mama-g-approved-layered.png"]').length,
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
      ["Open Mama G", "/farmer-hub"]
    ]) {
      const link = page.getByRole("link", { name: label, exact: true }).first();
      assert.equal(await link.getAttribute("href"), href);
    }

    assert.ok(await page.getByRole("button", { name: "Submit Buyer Request" }).isDisabled());
    assert.equal(await page.locator("video").count(), 0);

    if (await page.getByRole("button", {name:"Open navigation"}).isVisible()) {
      const menu = page.getByRole("button", { name: "Open navigation" });
      await menu.click();
      assert.equal(await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible(), true);
      await page.keyboard.press("Escape");
      assert.equal(await menu.evaluate((node) => node === document.activeElement), true);
    }

    await page.screenshot({ path: path.join(output, `homepage-local-${width}.png`), fullPage: true });
    results.push({ width, status: "PASS", ...metrics });
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const sign = page.getByRole("heading", {name:"Storage tips", exact:true});
  await sign.scrollIntoViewIfNeeded();
  assert.equal(await sign.locator("xpath=ancestor::ul").getAttribute("data-highlight"), null);
  assert.equal(await sign.locator("xpath=ancestor::li/span").evaluate(el => getComputedStyle(el).animationName), "none");
  fs.writeFileSync(path.join(output, "results.json"), `${JSON.stringify({ base, results }, null, 2)}\n`);
  await browser.close();
  console.log(JSON.stringify({ output, results }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
