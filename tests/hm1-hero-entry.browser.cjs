// Homepage-only checks. Live Preview tests never press Send or submit an intake.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const origin = new URL(process.env.HM1_REVIEW_URL || 'http://127.0.0.1:3096').origin;
  const local = ['127.0.0.1', 'localhost'].includes(new URL(origin).hostname);
  assert.ok(local || (origin.endsWith('-emergeagrisystems-projects.vercel.app') && process.env.VERCEL_OIDC_TOKEN), 'Authenticated Protected Preview or localhost only');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HM1_CHROME, ignoreDefaultArgs: ['--hide-scrollbars'] });
  const results = [];
  try {
    for (const [width, height] of [[320,568], [390,844], [768,960], [1440,900]]) {
      const context = await browser.newContext({ viewport: {width,height}, serviceWorkers: 'block', reducedMotion: 'no-preference' });
      const api = [];
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname.startsWith('/api/')) api.push({path:url.pathname, method:request.method()});
        // Observe unintended requests without spending a credit or submitting records.
        if (request.method() !== 'GET' && request.method() !== 'HEAD') return route.abort();
        return local ? route.continue() : route.continue({ headers: {...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN} });
      });
      const page = await context.newPage();
      await page.goto(origin);
      const pause = page.getByRole('button',{name:'Pause changing headline'});
      await pause.waitFor();
      const initial = await page.evaluate(() => {
        const dock = document.querySelector('[aria-label="Homepage quick access"]');
        const edge = getComputedStyle(dock).display === 'none' ? innerHeight : dock.getBoundingClientRect().top;
        return { edge, pauseBottom: document.querySelector('[aria-label="Pause changing headline"]').getBoundingClientRect().bottom,
          tryBottom: document.querySelector('[class*=draftRow] button').getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      assert.ok(initial.pauseBottom <= initial.edge && initial.tryBottom <= initial.edge, 'Both Hero actions must clear the initial dock');
      assert.equal(initial.overflow,false);
      await pause.click();
      const mark = page.locator('#homepage-hero-title mark');
      const word = await mark.textContent();
      await page.waitForTimeout(3750);
      assert.equal(await mark.textContent(),word,'Pause must stop the interval');
      const resume = page.getByRole('button',{name:'Resume changing headline'});
      await resume.press('Enter');
      await page.waitForFunction(old => document.querySelector('#homepage-hero-title mark').textContent !== old,word);
      await pause.click();
      assert.equal(await page.locator('[aria-label$="changing headline"]').count(),1);
      const controlBox = await page.getByRole('button',{name:'Resume changing headline'}).boundingBox();
      const cardBox = await page.locator('form[class*=homeAsk]').boundingBox();
      assert.ok(Math.abs(controlBox.y-cardBox.y-cardBox.height-11)<1);
      assert.ok(Math.abs(controlBox.x+controlBox.width-cardBox.x-cardBox.width)<1);
      assert.ok(controlBox.width>=44 && controlBox.height>=44);
      // At short height, keyboard focus and ordinary scrolling must reveal the control above the dock.
      await page.getByRole('button',{name:'Resume changing headline'}).scrollIntoViewIfNeeded();
      await page.getByRole('button',{name:'Resume changing headline'}).focus();
      const reachable = await page.getByRole('button',{name:'Resume changing headline'}).evaluate(el => {
        const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
      });
      assert.ok(reachable,'Headline control must be reachable');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.querySelector('#homepage-hero-title mark').textContent==='Farms.');
      assert.equal(await mark.evaluate(el=>getComputedStyle(el).animationName),'none');
      assert.equal(await page.locator('[aria-label$="changing headline"]').count(),0);
      const dock = page.getByRole('navigation',{name:'Homepage quick access',includeHidden:true});
      assert.equal(await dock.getByRole('link',{name:'WhatsApp',includeHidden:true}).getAttribute('href'),'https://wa.me/233208508868');
      assert.equal(await dock.getByText('Unavailable',{exact:true}).count(),0);
      const buyer = page.getByRole('region',{name:'Tell Farmers What You Need'});
      assert.equal(await buyer.getByRole('button',{name:'Submit Buyer Request'}).isDisabled(),true);
      assert.equal(await buyer.getByText('Example request',{exact:true}).count(),1);
      assert.equal(await buyer.getByText('20 crates of tomatoes · Kumasi · Next week',{exact:true}).count(),1);
      assert.equal(await buyer.getByText('Requests currently closed',{exact:true}).count(),1);
      for (const value of ['', '   ', 'How can I store harvested maize?']) {
        await page.goto(origin);
        const input = page.locator('#home-adviser-question');
        await input.fill(value);
        const button = page.getByRole('button',{name:'Try for free',exact:true});
        await button.click();
        await page.waitForURL(url=>url.pathname==='/farmer-hub' && !url.hash && !url.search);
        const draft = page.locator('#ask-farmmate-question');
        await page.waitForFunction(expected => document.querySelector('#ask-farmmate-question')?.value===expected,value.trim());
        assert.equal(await draft.inputValue(),value.trim());
        assert.equal(api.length,0,'Entry alone must not call AI, usage or any other API');
        if(value.trim()) {
          await draft.fill(value+' Keep this editable.');
          assert.ok(await page.getByRole('button',{name:'Send question'}).isEnabled());
          await page.reload();
          assert.equal(await draft.inputValue(),'','Draft receipt must be single-use');
        }
      }
      results.push({width,height,blankAndWhitespace:'PASS',editableSingleUseDraft:'PASS',preSendApiRequests:api.length,pauseResume:'PASS',reducedMotion:'PASS',pauseReachable:'PASS',buyerClosed:'PASS',whatsAppHref:'PASS'});
      await context.close();
    }
    console.log('PASS '+JSON.stringify(results));
    if(process.env.HM1_EVIDENCE_DIR) await fs.writeFile(path.join(process.env.HM1_EVIDENCE_DIR,'hero-entry-results.json'),JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.message);process.exit(1)});

