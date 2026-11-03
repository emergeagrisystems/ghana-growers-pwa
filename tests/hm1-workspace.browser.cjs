// Run against a loopback production build. Provider and usage responses are locally controlled.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

(async () => {
  const base = new URL(process.env.HM1_LOCAL_URL || "http://127.0.0.1:3049");
  assert.ok(["127.0.0.1", "localhost"].includes(base.hostname));
  const output = process.env.HM1_EVIDENCE_DIR;
  if (output) await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HM1_CHROME });
  const evidence = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const height = width < 700 ? 844 : 960;
      const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" });
      const page = await context.newPage();
      const question = "How should I water young maize in dry soil?";
      const logs = [], requests = [], routes = [];
      let longAnswerCheck = false;
      page.on("console", event => logs.push(event.text()));
      page.on("pageerror", error => { throw error; });
      page.on("request", request => routes.push(request.url()));
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base.origin) return route.abort();
        if (!url.pathname.startsWith("/api/")) return route.continue();
        const body = route.request().headers()["content-type"]?.includes("application/json") ? route.request().postDataJSON() || {} : {};
        requests.push({ path: url.pathname, action: body.action });
        if (longAnswerCheck && url.pathname === "/api/farmmate/ask") return route.fulfill({
          json: { ok: true, kind: "final", answer: Array.from({length: 40}, (_, i) => "Layout verification paragraph " + (i + 1) + ".").join("\n\n") }
        });
        if (body.action === "status") return route.fulfill({ json: { credits: {
          tool: "crop_doctor", creditState: "available", remaining: 2, limit: 2,
          windowHours: 12, isExhausted: false
        } } });
        return route.fulfill({ status: 503, json: { ok: false, reason: "usage_tracking_unavailable" } });
      });
      const snap = async label => {
        if (output) await page.screenshot({ path: path.join(output, label + "-" + width + ".png") });
      };
      await page.goto(base.href);
      const hero = page.locator("section[aria-labelledby=homepage-hero-title]");
      assert.equal(await hero.getByRole("link", {name:"Browse Farms & Suppliers"}).getAttribute("href"), "/directory");
      assert.equal(await hero.getByRole("link", {name:"Registration information"}).getAttribute("href"), "/join");
      const start = page.locator("#home-adviser-question");
      await start.waitFor();
      await page.evaluate(() => document.fonts.ready);
      await snap("homepage");
      await start.fill(question);
      await page.getByRole("button", {name:"Continue with my draft"}).click();
      const field = page.locator("#ask-farmmate-question");
      await page.waitForFunction(value => document.querySelector("#ask-farmmate-question")?.value === value, question);
      await page.waitForFunction(() => location.pathname === "/farmer-hub" && !location.hash && !location.search);
      assert.equal(requests.length, 0, "handoff must produce no API request");
      await field.fill(question + " After planting.");
      const send = page.getByRole("button", {name:"Send question"});
      assert.ok(await send.isEnabled());
      const checkWidth = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      assert.ok(await checkWidth());
      await snap("ask");
      await field.focus();
      await page.setViewportSize({width, height: 365});
      await page.waitForFunction(() => {
        const target = document.querySelector('[aria-label="Send question"]');
        const rect = target.getBoundingClientRect();
        return rect.bottom <= visualViewport.height + visualViewport.offsetTop + 1 && rect.top >= visualViewport.offsetTop;
      });
      assert.ok(await field.evaluate(el => document.activeElement === el));
      if (width === 390) await snap("reduced-viewport-focused");
      await page.setViewportSize({width,height});
      assert.ok(await field.evaluate(el => document.activeElement === el));
      const before = requests.length;
      await Promise.all([page.waitForResponse(r => r.url().includes("/api/farmmate/") && r.status() === 503), send.click()]);
      assert.equal(requests.length - before, 1, "one explicit Send issues one operation");
      assert.ok(routes.every(url => !decodeURI(url).includes(question)));
      assert.ok(logs.every(message => !message.includes(question)));
      await page.getByRole("navigation", { name:"Adviser navigation" }).getByRole("button", {name:"Crop Doctor"}).click();
      assert.ok(await page.locator("#crop-doctor-disclosure").isVisible());
      const photo = page.getByLabel("Choose Photo", {exact:true});
      await photo.setInputFiles({ name:"hm1-control.png", mimeType:"image/png",
        buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZCkAAAAASUVORK5CYII=","base64") });
      assert.equal(requests.filter(r => r.path.endsWith("crop-doctor")).length, 0, "selecting a photo never sends it");
      await snap("crop-doctor");
      await Promise.all([page.waitForResponse(r => r.url().endsWith("/api/farmmate/crop-doctor") && r.status() === 503),
        page.getByRole("button",{name:"Analyse Crop"}).click()]);
      assert.equal(requests.filter(r => r.path.endsWith("crop-doctor")).length, 1);
      await page.getByText(/Mama G could not confirm the photo check/).waitFor();
      await page.getByRole("button", {name:"Tools",exact:true}).click();
      for (const name of ["Crop Calendar","Planting Advisor","Can I Farm Today?"]) {
        await page.getByRole("button",{name:new RegExp(name.replace("?","\\?"))}).first().click();
        await page.getByRole("button",{name:"All tools"}).click();
      }
      await snap("tools");
      await page.getByRole("navigation",{name:"Adviser navigation"}).getByRole("button",{name:"Ask",exact:true}).click();
      assert.equal(await field.inputValue(), "", "fresh Ask cannot inherit the previous tool draft");
      await page.reload();
      await field.waitFor();
      assert.equal(await field.inputValue(), "", "reload cannot replay a draft");
      assert.ok(await checkWidth());
      longAnswerCheck = true;
      await field.fill("How do I stake tomatoes?");
      await Promise.all([page.waitForResponse(r => r.url().endsWith("/api/farmmate/ask") && r.status() === 200), send.click()]);
      await page.getByText(/Layout verification paragraph 1\./).first().waitFor({state:"attached"});
      const panel = page.getByLabel("Consultation",{exact:true});
      const scrolls = await panel.evaluate(el => { el.scrollTop = el.scrollHeight; return el.scrollHeight > el.clientHeight && el.scrollTop > 0; });
      assert.ok(scrolls, "long answers scroll within the consultation");
      assert.ok(await send.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight));
      evidence.push({width, homepage:true, handoff:true, preSendApi:0, sendOperations:1, privateNavigation:true, reducedViewport:true,
        physicalKeyboard:"not exercised", longResponseControls:true, cropDisclosureAndFileSelection:true, controlledPhotoFailures:1, tools:true, freshAskEmpty:true, reloadEmpty:true});
      await context.close();
    }
    if (output) await fs.writeFile(path.join(output,"local-browser-results.json"),JSON.stringify(evidence,null,2));
    console.log("PASS", JSON.stringify(evidence));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
