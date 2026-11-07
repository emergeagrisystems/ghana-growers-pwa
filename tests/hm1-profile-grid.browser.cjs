// Run against next start on loopback with three eligible synthetic farms and one supplier.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

(async () => {
  const base = new URL(process.env.HM1_LOCAL_URL);
  assert.ok(["127.0.0.1", "localhost"].includes(base.hostname));
  const output = process.env.HM1_EVIDENCE_DIR;
  if (output) await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HM1_CHROME,
    ignoreDefaultArgs: ["--hide-scrollbars"] });
  const measurements = [];
  try {
    for (const width of [1440, 390, 320]) {
      const mobile = width < 701;
      const page = await browser.newPage({ viewport: { width, height: mobile ? (width === 320 ? 568 : 844) : 900 },
        hasTouch: mobile, reducedMotion: "reduce", serviceWorkers: "block" });
      await page.route("**/*", route => {
        const request = route.request();
        return new URL(request.url()).origin === base.origin && request.method() === "GET" ? route.continue() : route.abort();
      });
      await page.goto(base.href);
      const farms = page.getByRole("region", { name: "Farm Showcase" });
      const suppliers = page.getByRole("region", { name: "Agro-Supplier Showcase" });
      const grid = farms.locator('[aria-label="Published farms"]');
      await grid.waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await grid.locator("article").count(), 3);
      const supplierCards = suppliers.locator("article");
      assert.equal(await supplierCards.count(), 1);
      assert.equal(await supplierCards.getByRole("link").getAttribute("href"), "/supplier-directory/qa-supplier");
      const data = await grid.evaluate(el => {
        const box = el.getBoundingClientRect(), section = el.closest("section");
        const sectionBox = section.getBoundingClientRect(), css = getComputedStyle(section);
        return {
          gridLeft: box.left, gridRight: box.right, columns: getComputedStyle(el).gridTemplateColumns,
          contentLeft: sectionBox.left + parseFloat(css.paddingLeft),
          contentRight: sectionBox.right - parseFloat(css.paddingRight),
          cards: Array.from(el.children, card => {
            const rect = card.getBoundingClientRect();
            return { width: rect.width, left: rect.left, right: rect.right, top: rect.top };
          }),
          pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });
      assert.equal(data.pageOverflow, false);
      if (!mobile) {
        const [first, middle, last] = data.cards;
        assert.equal(data.columns.trim().split(/\s+/).length, 3, "Three occupied desktop tracks");
        assert.ok(data.cards.every(card => Math.abs(card.width - first.width) < 1 && card.top === first.top));
        assert.ok(Math.abs(first.left - data.contentLeft) < 1, "First card reaches the left content edge");
        assert.ok(Math.abs(last.right - data.contentRight) < 1, "Third card reaches the right content edge");
        assert.ok(Math.abs((middle.left - first.right) - (last.left - middle.right)) < 1);
      } else {
        await grid.scrollIntoViewIfNeeded();
        const {x,y,width:railWidth} = await grid.boundingBox();
        const screenHeight = page.viewportSize().height;
        const touchY = Math.min(screenHeight - 95, Math.max(55, y + 110));
        const client = await page.context().newCDPSession(page);
        const startX = x + railWidth * .85;
        await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x:startX, y:touchY }] });
        for (let step=1; step<=4; step++) {
          await client.send("Input.dispatchTouchEvent", { type:"touchMove", touchPoints:[{x:startX-step*railWidth*.15,y:touchY}] });
        }
        await client.send("Input.dispatchTouchEvent", { type:"touchEnd",touchPoints:[] });
        await page.waitForFunction(() => document.querySelector('[aria-label="Published farms"]').scrollLeft > 50);
        data.afterSwipe = await grid.evaluate(el => el.scrollLeft);
      }
      if (output) {
        await farms.screenshot({ path: path.join(output, `three-farms-${width}.png`), animations:"disabled" });
        await suppliers.screenshot({ path: path.join(output, `one-supplier-${width}.png`), animations:"disabled" });
      }
      measurements.push({ viewport:width,...data });
      await page.close();
    }
  } finally { await browser.close(); }
  if (output) await fs.writeFile(path.join(output,"grid.json"),JSON.stringify(measurements,null,2));
  console.log(JSON.stringify(measurements));
})().catch(error => { console.error(error); process.exitCode=1; });
