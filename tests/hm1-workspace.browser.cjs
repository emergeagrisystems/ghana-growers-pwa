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
      page.setDefaultTimeout(10000);
      const question = "How should I water young maize in dry soil?";
      const logs = [], requests = [], routes = [];
      let longAnswerCheck = false;
      let weatherOutcome = "failure";
      let completeWeather;

      page.on("console", event => logs.push(event.text()));
      page.on("pageerror", error => { throw error; });
      page.on("request", request => routes.push(request.url()));
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base.origin) return route.abort();
        if (!url.pathname.startsWith("/api/")) return route.continue();
        const body = route.request().headers()["content-type"]?.includes("application/json") ? route.request().postDataJSON() || {} : {};
        requests.push({ path: url.pathname, action: body.action });
        if (url.pathname === "/api/farmmate/weather") {
          if (weatherOutcome === "missing") return route.fulfill({json:{ok:true, forecast:{location:{name:"Kumasi"},days:[]}}});
          if (weatherOutcome === "stale") {
            const observedAt = new Date(Date.now() - 36 * 3600000).toISOString();
            const days = ["Today","Tomorrow","Day after tomorrow"].map((label,i) => ({date:"2026-11-0"+(3+i),label,temperatureMaxC:32,rainChancePercent:95}));
            return route.fulfill({json:{ok:true,forecast:{location:{name:"Accra",key:"accra"},days,observedAt,lastUpdatedAt:observedAt,currentTemperatureC:28,currentWeatherCode:0,decisionSummary:{liveWeatherAvailable:true}}}});
          }
          if (weatherOutcome === "success") {
            await new Promise(resolve => {completeWeather = resolve;});
            const days = ["Today","Tomorrow","Day after tomorrow"].map((label,i) => ({
              date: "2026-11-0" + (3+i),label,temperatureMaxC:29,temperatureMinC:21,rainChancePercent:20
            }));
            return route.fulfill({json:{ok:true,forecast:{location:{name:"Kumasi",key:"kumasi"},days,currentTemperatureC:29,currentWeatherCode:3,observedAt:new Date().toISOString(),
              lastUpdatedAt:new Date().toISOString(),decisionSummary:{locationName:"Kumasi",liveWeatherAvailable:true}}}});
          }
        }
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
      assert.equal(await hero.getByRole("link", {name:"Search Farms & Suppliers"}).getAttribute("href"), "/directory");
      assert.equal(await hero.getByRole("link", {name:"Get Listed Free"}).getAttribute("href"), "/join");
      const start = page.locator("#home-adviser-question");
      await start.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const mark = hero.locator("mark");
      const dock = page.getByRole("navigation",{name:"Homepage quick access",includeHidden:true});
      assert.equal(await dock.isVisible(), width <= 700);
      const openingHeight = width === 320 ? 568 : width === 1440 ? 900 : height;
      await page.setViewportSize({width, height: openingHeight});
      const visibleBottom = await dock.isVisible() ? (await dock.boundingBox()).y : openingHeight;
      const offer = page.getByRole("heading",{name:"Tell Farmers What You Need"});
      const card = offer.locator("../..");
      assert.equal(await page.evaluate(() => scrollY), 0);
      assert.ok((await card.boundingBox()).y >= visibleBottom - 9);
      assert.ok((await offer.boundingBox()).y >= visibleBottom);
      assert.ok((await card.locator("p").boundingBox()).y >= visibleBottom);
      assert.equal(await start.getAttribute("aria-describedby"), null);
      assert.ok(await hero.getByRole("textbox",{name:"Ask Mama G",exact:true}).isVisible());
      assert.equal(await hero.getByText("Review and edit your question before sending.").count(), 0);
      const draftButton = await hero.getByRole("button",{name:"Ask Mama G",exact:true}).boundingBox();
      await snap("unscrolled-homepage");
      assert.ok(draftButton.y + draftButton.height <= visibleBottom,
        `At ${width}×${openingHeight}, draft button ends at ${draftButton.y + draftButton.height} and visible content ends at ${visibleBottom}`);
      if (width === 320) {
        const gutter = await page.addStyleTag({content:"html { scrollbar-gutter: stable; }"});
        const narrowButton = await hero.getByRole("button",{name:"Ask Mama G",exact:true}).boundingBox();
        assert.ok(narrowButton.y + narrowButton.height <= visibleBottom);
        const normalHeight = (await hero.boundingBox()).height;
        const largeText = await page.addStyleTag({content:"main form p { font-size: 200% !important; }"});
        assert.ok((await hero.boundingBox()).height > normalHeight);
        await start.focus();
        await page.waitForFunction(() => {
          const el = document.activeElement;
          const r = el.getBoundingClientRect();
          return el.id === "home-adviser-question" && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
        });
        await largeText.evaluate(el => el.remove());
        await gutter.evaluate(el => el.remove());
        await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
      }
      await page.setViewportSize({width,height});
      const bounds = await hero.boundingBox();
      assert.equal(bounds.x,0);
      assert.equal(bounds.width,await page.evaluate(() => document.documentElement.clientWidth));
      if (width <= 700) {
        assert.deepEqual(await dock.locator(":scope > *").allTextContents(),["Farms","Suppliers","Mama G","Request","WhatsAppUnavailable"]);
        assert.equal(await dock.locator("[aria-disabled=true]").getAttribute("href"),null);
        const footer = page.locator("footer").last();
        assert.ok(await footer.evaluate(el => parseFloat(getComputedStyle(el).paddingBottom)) >= (await dock.boundingBox()).height);
      }
      const heightBefore = (await hero.boundingBox()).height;
      await page.waitForFunction(() => document.querySelector("h1 mark")?.textContent !== "Farms.");
      await hero.getByRole("button",{name:"Pause changing headline"}).click();
      assert.equal((await hero.boundingBox()).height, heightBefore);
      await page.emulateMedia({reducedMotion:"reduce"});
      await page.waitForFunction(() => document.querySelector("h1 mark")?.textContent === "Farms.");
      assert.equal(await mark.evaluate(el => getComputedStyle(el).animationName), "none");
      assert.ok(await hero.getByRole("link",{name:"Search Farms & Suppliers"}).evaluate(el => getComputedStyle(el).transitionDuration === "0s"));
      await snap("homepage");
      if (width <= 768) {
        const menu = page.getByRole("button",{name:"Open navigation"});
        await menu.focus();
        await menu.press("Enter");
        const nav = page.getByRole("navigation",{name:"Mobile navigation"});
        assert.deepEqual(await nav.getByRole("link").allTextContents(), ["Ask Mama G","Farms & Suppliers","Join"]);
        assert.equal(await nav.locator("p").count(), 0);
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("href")), "/farmer-hub");
        await snap("menu");
        await page.keyboard.press("Escape");
        assert.ok(await menu.evaluate(el => document.activeElement === el));
      }
      await start.fill(question);
      await page.getByRole("button", {name:"Ask Mama G",exact:true}).click();
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
      const adviserNav = page.getByRole("navigation",{name:"Adviser navigation"});
      for (const target of await adviserNav.getByRole("button").all()) {
        const rect = await target.boundingBox();
        assert.ok(rect.width >= 44 && rect.height >= 44);
      }
      assert.deepEqual(await adviserNav.getByRole("button").allTextContents(),["Today","Ask Mama G","Crop Doctor","Farm Tools"]);
      await adviserNav.getByRole("button",{name:"Today",exact:true}).click();
      await adviserNav.getByRole("button",{name:"Ask Mama G",exact:true}).click();
      assert.equal(await field.inputValue(),question + " After planting.");
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
      assert.match(await page.locator("#crop-doctor-disclosure").innerText(), /AI provider processes your photo/);
      const privacy = page.locator("#crop-doctor details").filter({has:page.getByText("About AI & privacy",{exact:true})});
      assert.equal(await privacy.getAttribute("open"), null);
      assert.ok(await privacy.evaluate(el => !!(document.querySelector('#crop-doctor-disclosure').compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)));
      await privacy.locator("summary").click();
      assert.match(await privacy.innerText(), /personal documents/);
      await snap("crop-privacy");
      await privacy.locator("summary").click();
      const analyse = page.getByRole("button",{name:"Analyse photo",exact:true});
      const fixture = { name:"hm1-control.png", mimeType:"image/png", buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZCkAAAAASUVORK5CYII=","base64") };
      const camera = page.getByRole("button",{name:"Take a photo",exact:true});
      const gallery = page.getByRole("button",{name:"Choose from gallery",exact:true});
      const [cameraChooser] = await Promise.all([page.waitForEvent("filechooser"),camera.click()]);
      assert.equal(await cameraChooser.element().getAttribute("capture"),"environment");
      await cameraChooser.setFiles([]);
      assert.equal(await page.getByAltText("Selected crop preview").count(),0);
      const [galleryChooser] = await Promise.all([page.waitForEvent("filechooser"),gallery.click()]);
      assert.equal(await galleryChooser.element().getAttribute("capture"),null);
      await galleryChooser.setFiles(fixture);
      const consent = page.getByRole("checkbox",{name:/agree to send/});
      assert.ok(!await analyse.isEnabled());
      await consent.check();
      await page.getByRole("button",{name:"Change photo"}).click();
      await page.getByLabel("Take Photo",{exact:true}).setInputFiles({...fixture,name:"replacement.png"});
      assert.ok(!await consent.isChecked());
      assert.ok(!await analyse.isEnabled());
      assert.equal(requests.filter(r=>r.path.endsWith("crop-doctor")).length,0);
      await consent.check();
      await snap("crop-doctor");
      await Promise.all([page.waitForResponse(r=>r.url().endsWith("/api/farmmate/crop-doctor") && r.status()===503),analyse.click()]);
      assert.equal(requests.filter(r=>r.path.endsWith("crop-doctor")).length,1);
      await page.getByText(/Mama G could not confirm the photo check/).waitFor();
      await adviserNav.getByRole("button", {name:"Farm Tools",exact:true}).click();
      const menu = page.locator("button").filter({hasText:"Check whether your field is ready to plant."});
      assert.ok(await menu.isVisible());
      await page.getByRole("button",{name:/^Crop Calendar/}).click();
      assert.equal(await adviserNav.getByRole("button",{name:"Farm Tools"}).getAttribute("aria-current"),"page");
      assert.equal(await page.getByText("Crop not selected",{exact:true}).count(),0);
      await page.getByLabel("Select crop").selectOption({label:"Maize"});
      await page.getByRole("radio",{name:"I’m unsure of the date"}).check();
      const observedChoices=page.getByRole("group",{name:"What growth stage can you see?"});
      assert.equal(await observedChoices.getByRole("radio",{name:"Weed and feed"}).count(),0);
      await observedChoices.getByRole("radio",{name:"Seedlings are emerging"}).check();
      await page.getByRole("heading",{name:"What to do now"}).waitFor();
      await page.getByRole("radio",{name:"I know the planting date"}).check();
      await page.getByLabel("Planting date, if known").fill(new Date(Date.now()-21*86400000).toISOString().slice(0,10));
      await page.getByRole("heading",{name:"What to do now"}).waitFor();
      await page.getByRole("radio",{name:"Not planted yet"}).check();
      await page.getByText(/Current stage.*Before planting/).waitFor();
      await page.locator("header").getByRole("button",{name:"Farm Tools"}).click();
      await snap("tools");
      await page.getByRole("button",{name:/^Storage tips/}).click();
      await page.getByRole("heading",{name:"Storage tips",exact:true}).waitFor();
      await page.getByLabel("Have you harvested yet?").selectOption("harvested");
      await page.getByRole("combobox",{name:/^Crop\b/}).selectOption({label:"Maize"});
      await page.getByLabel("Known condition").selectOption("wet");
      await page.getByLabel("Intended holding time").selectOption("longer");
      await page.getByLabel("Available storage").selectOption("ventilated");
      const preStorage = requests.length;
      await page.getByRole("button",{name:"Ask Mama G about this harvest"}).click();
      await page.waitForFunction(() => document.querySelector("#ask-farmmate-question")?.value.includes("harvested Maize"));
      assert.match(await field.inputValue(),/damp.*longer storage.*ventilated/);
      assert.equal(requests.length,preStorage);
      await adviserNav.getByRole("button",{name:"Farm Tools",exact:true}).click();
      await page.getByRole("navigation",{name:"Adviser navigation"}).getByRole("button",{name:"Ask Mama G",exact:true}).click();
      assert.match(await field.inputValue(), /harvested Maize/, "tab navigation preserves the active draft");
      await page.reload();
      await field.waitFor();
      assert.equal(await field.inputValue(), "", "reload cannot replay a draft");
      assert.ok(await checkWidth());
      if(width < 700) await page.getByRole("button",{name:/Choose your area.*Farm weather/}).click();
      else await adviserNav.getByRole("button",{name:"Today",exact:true}).click();
      const area = page.locator("#farmmate-weather-location");
      const today = page.locator('[aria-label="Mama G workspace"] [class*="toolPane"]').filter({has:area});
      await today.getByRole("button",{name:"Choose your area",exact:true}).click();
      await area.selectOption("accra");
      await today.getByText(/Live weather is unavailable/).waitFor();
      await today.getByRole("button",{name:"Change area"}).click();
      weatherOutcome = "missing";
      await Promise.all([page.waitForResponse(r=>r.url().includes("/api/farmmate/weather")),area.selectOption("tamale")]);
      await today.getByText(/Live weather is unavailable/).waitFor();
      await today.getByRole("button",{name:"Change area"}).click();
      weatherOutcome = "success";
      await Promise.all([page.waitForRequest(r=>r.url().includes("locationKey=kumasi")),area.selectOption("kumasi")]);
      await today.getByText("Loading live weather...").waitFor();
      completeWeather();
      await today.getByText("Tomorrow",{exact:true}).filter({visible:true}).waitFor();
      const tasks = page.locator("#can-i-farm-today");
      assert.deepEqual(await tasks.getByRole("button").allTextContents(),["Plant","Spray","Water","Harvest","Apply fertiliser","Dry produce"]);
      await tasks.getByRole("button",{name:"Spray",exact:true}).click();
      await tasks.getByLabel("Wind at the field?").selectOption("strong");
      await tasks.getByRole("button",{name:"Change task"}).click();
      await tasks.getByRole("button",{name:"Plant",exact:true}).click();
      await tasks.getByLabel("Soil at the field?").selectOption("moist");
      await tasks.getByLabel("Does the field drain?").selectOption("good");
      await tasks.getByRole("button",{name:"Check planting readiness"}).click();
      const advisor = page.locator("#planting-advisor");
      assert.equal(await advisor.getByRole("combobox",{name:/^Region\b/}).inputValue(),"Ashanti");
      await advisor.getByRole("combobox",{name:/^Crop\b/}).selectOption({label:"Maize"});
      assert.ok(await page.getByRole("radio",{name:"Moist",exact:true}).isChecked());
      assert.ok(await page.getByRole("radio",{name:"Drains well",exact:true}).isChecked());
      await page.getByRole("button",{name:"Continue to preparation"}).click();
      await page.getByRole("button",{name:"See planting readiness"}).click();
      await page.getByText("Next step",{exact:true}).waitFor();
      await adviserNav.getByRole("button",{name:"Ask Mama G",exact:true}).click();
      if(width < 700) {
        const strip=page.getByRole("button",{name:/Kumasi.*29°C.*Overcast/});
        await strip.waitFor();
        assert.ok(!(await strip.innerText()).includes("%"));
      }
      await adviserNav.getByRole("button",{name:"Today",exact:true}).click();
      await today.getByRole("button",{name:"Change area"}).click();
      weatherOutcome = "stale";
      await area.selectOption("accra");
      await today.getByText("Weather out of date",{exact:true}).waitFor();
      await adviserNav.getByRole("button",{name:"Ask Mama G",exact:true}).click();
      if(width < 700) assert.ok(await page.getByRole("button",{name:/Accra.*Weather out of date/}).isVisible());
      longAnswerCheck = true;
      await field.fill("How do I stake tomatoes?");
      await Promise.all([page.waitForResponse(r => r.url().endsWith("/api/farmmate/ask") && r.status() === 200), send.click()]);
      await page.getByText(/Layout verification paragraph 1\./).first().waitFor({state:"attached"});
      const panel = page.getByLabel("Consultation",{exact:true});
      const scrolls = await panel.evaluate(el => { el.scrollTop = el.scrollHeight; return el.scrollHeight > el.clientHeight && el.scrollTop > 0; });
      assert.ok(scrolls, "long answers scroll within the consultation");
      assert.ok(await send.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight));
      const keyboardCycles = [];
      if (width < 700) {
        // Reproduce the failed deployed case: inner reading position AND outer
        // scroll retained. The earlier test had covered only a clean viewport.
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setSafeAreaInsetsOverride", {insets:{bottom:20}});
        await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('nav[aria-label="Adviser navigation"]')).paddingBottom) >= 25);
        const reading = await panel.evaluate(el => { el.scrollTop = Math.floor(el.scrollHeight / 3); return el.scrollTop; });
        await page.evaluate(() => window.scrollTo(0,343));
        await page.waitForFunction(() => scrollY >= 200);
        await field.evaluate(el => el.focus({preventScroll:true}));
        for (const shortHeight of [365,320,390]) {
          await page.setViewportSize({width,height:shortHeight});
          await page.waitForFunction(() => {
            const v = window.visualViewport;
            return ["#ask-farmmate-question",'[aria-label="Send question"]'].every(selector => {
              const el = document.querySelector(selector), r = el.getBoundingClientRect();
              const hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
              return r.top >= v.offsetTop - 1 && r.bottom <= v.offsetTop + v.height + 1 && el.contains(hit);
            });
          });
          assert.ok(await field.evaluate(el => document.activeElement === el));
          assert.ok(await checkWidth());
          keyboardCycles.push(await send.evaluate(el => ({
            pageScroll: scrollY, readScroll: document.querySelector('[aria-label="Consultation"]').scrollTop,
            visualHeight: visualViewport.height, visualTop: visualViewport.offsetTop,
            sendTop: el.getBoundingClientRect().top, sendBottom: el.getBoundingClientRect().bottom,
            navBottomPadding: getComputedStyle(document.querySelector('nav[aria-label="Adviser navigation"]')).paddingBottom,
            fieldFocused: document.activeElement.id === "ask-farmmate-question", hitTest: "passed"
          })));
          if (shortHeight === 365) {
            // Model a keyboard that pans the visual viewport independently of
            // the document. Only this test installs the temporary geometry.
            await page.evaluate(() => {
              Object.defineProperty(visualViewport,"offsetTop",{configurable:true,value:36});
              Object.defineProperty(visualViewport,"height",{configurable:true,value:innerHeight-74});
              visualViewport.dispatchEvent(new Event("scroll"));
            });
            await page.waitForFunction(() => {
              const v = visualViewport;
              const app = document.querySelector('[aria-label="Mama G workspace"]').getBoundingClientRect();
              if (Math.abs(app.bottom - (v.height + v.offsetTop)) > 1) return false;
              return ["#ask-farmmate-question",'[aria-label="Send question"]'].every(selector => {
                const r = document.querySelector(selector).getBoundingClientRect();
                return r.top >= v.offsetTop && r.bottom <= v.offsetTop + v.height;
              });
            });
            await page.evaluate(() => {
              delete visualViewport.offsetTop;
              delete visualViewport.height;
              visualViewport.dispatchEvent(new Event("resize"));
            });
          }
          if (shortHeight === 365) await snap("retained-scroll-keyboard");
          await page.setViewportSize({width,height});
          await page.waitForFunction(() => innerHeight === 844);
          assert.ok(Math.abs(await panel.evaluate(el => el.scrollTop) - reading) < 3, "preserve the reading position");
        }
        await cdp.detach();
      }
      evidence.push({width, homepage:true, handoff:true, preSendApi:0, sendOperations:1, privateNavigation:true, reducedViewport:true, keyboardCycles,
        physicalKeyboard:"not exercised", longResponseControls:true, cropDisclosureAndFileSelection:true, controlledPhotoFailures:1, cameraCancellation:true, gallerySelection:true, replacementClearsConsent:true, navigationPreservesDraft:true, currentConditionsAndStaleWeather:true, tools:true, reloadEmpty:true});
      await context.close();
    }
    if (output) await fs.writeFile(path.join(output,"local-browser-results.json"),JSON.stringify(evidence,null,2));
    console.log("PASS", JSON.stringify(evidence));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
