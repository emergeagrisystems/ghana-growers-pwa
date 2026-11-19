// Screenshots and real built-route tests. All data is fictional; no hosted writes/AI.
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const http = require('node:http'), { once } = require('node:events'), { spawn } = require('node:child_process');
const { createPreviewAccessToken, previewAccessCookie } = require('../.farmmate-test-dist/src/lib/previewAccess.js');
const secret = 'fictional-campaign-browser-preview-secret-32';
const privateCanary = 'PRIVATE_LOCAL_CAMPAIGN_FIXTURE_DO_NOT_SERIALIZE';
const flags = ['PUBLIC_INTAKE_FARMER_REGISTRATION_ENABLED', 'PUBLIC_INTAKE_SUPPLIER_REGISTRATION_ENABLED', 'PUBLIC_INTAKE_PRODUCT_LISTING_ENABLED', 'PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED'];
const pages = ['/join/farmer', '/become-a-supplier', '/submit-listing', '/submit-buyer-request'];
const apis = ['/api/farmer-registration', '/api/supplier-registration', '/api/listing-submissions', '/api/buyer-request-submissions'];
const evidence = { source: 'LOCAL built Next application; fictional data only; server external fetch blocked', viewports: {}, timezone: [], closedWorkflows: [], requests: [], findings: [] };
const output = path.resolve(process.env.CAMPAIGN_EVIDENCE || '../outputs/prelaunch-colour-release');
fs.mkdirSync(output, { recursive: true });
async function port() { const s=http.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p; }
async function app(mode, off = []) {
  const p = await port();
  const child = spawn(process.execPath, ['--require', path.resolve('tests/prelaunch-network-guard.cjs'), 'node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(p)], {
    env: { ...process.env, SITE_PRELAUNCH: mode, VERCEL_ENV: 'development', NEXT_PUBLIC_RC1_PREVIEW: 'false',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fictional-anon',
      SUPABASE_SERVICE_ROLE_KEY: privateCanary, OPENAI_API_KEY: '', PREVIEW_ACCESS_SECRET: secret,
      NEXT_TELEMETRY_DISABLED: '1', ...Object.fromEntries(flags.map((key,i)=>[key,off.includes(i)?'false':'true'])) },
    stdio: ['ignore','pipe','pipe']
  });
  let log='';child.stdout.on('data',b=>{log+=b});child.stderr.on('data',b=>{log+=b});
  // NextURL canonicalises loopback hostnames to localhost; use that same local origin.
  const origin='http://localhost:'+p;
  for(let i=0;i<80;i++) {try {await fetch(origin+'/favicon.svg');return {origin, child, log:()=>log};} catch {await new Promise(r=>setTimeout(r,150));}}
  child.kill();throw Error('Local Next server did not start');
}
async function stop(server) { if(server.child.exitCode===null){server.child.kill();await once(server.child,'exit');} }
function checkBody(body) { assert.ok(!body.includes(privateCanary));assert.ok(!body.includes('bfasogvmesswweribsji'));assert.ok(!body.includes('PRIVATE-GG-STAGING')); }
async function context(browser, origin, options={}) {
  const ctx = await browser.newContext({ serviceWorkers:'block', ...options });
  await ctx.route('**/*', route=>{
    const u=new URL(route.request().url());
    if(u.origin!==origin){evidence.findings.push('External request '+u.hostname);return route.abort();}
    evidence.requests.push({path:u.pathname,method:route.request().method()});return route.continue();
  });return ctx;
}
async function measure(page) {
  return page.evaluate(()=>{
    const root=document.querySelector('[data-prelaunch-campaign]');
    const heading=root.querySelector('h1'), range=document.createRange();
    range.selectNodeContents(heading.firstChild);
    const lineRects=[...range.getClientRects(),heading.querySelector('span').getBoundingClientRect()];
    const lines=[];
    for(const rect of lineRects){
      const midY=(rect.top+rect.bottom)/2;
      let line=lines.find(row=>Math.abs(row.midY-midY)<rect.height/2);
      if(!line){line={midY,left:rect.left,right:rect.right};lines.push(line);}
      line.left=Math.min(line.left,rect.left);line.right=Math.max(line.right,rect.right);
    }
    const headingOffsets=lines.map(line=>(line.left+line.right-innerWidth)/2);
    const campaignSurfaces=[document.documentElement,document.body,document.querySelector('header'),root,document.querySelector('footer')].map(el=>getComputedStyle(el).backgroundColor);
    const anchors=[...root.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),height:a.getBoundingClientRect().height,width:a.getBoundingClientRect().width}));
    const badOverflow=[...document.querySelectorAll('body *')].filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.position!=='absolute'&&s.visibility!=='hidden'&&r.width>0&&(r.right>innerWidth+1||r.left < -1)}).map(el=>el.tagName+'.'+el.className);
    function rgb(value){return (value.match(/[\d.]+/g)||[]).map(Number);}
    function background(el){const lineage=[];for(let n=el;n;n=n.parentElement)lineage.push(n);let color=[255,255,255];for(const n of lineage.reverse()){const c=rgb(getComputedStyle(n).backgroundColor),alpha=c[3]??1;color=color.map((v,i)=>(c[i]??v)*alpha+v*(1-alpha));}return color;}
    const lum=c=>c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
    const tree=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),contrast=[];let node;
    while((node=tree.nextNode())){
      const el=node.parentElement;if(!node.textContent.trim()||!el||['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName)||!el.getClientRects().length)continue;
      const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none'||el.closest('[aria-hidden=true]'))continue;
      const rect=el.getBoundingClientRect();if(rect.width<=1||rect.height<=1)continue;
      const bg=background(el),fg=rgb(s.color),alpha=fg[3]??1,actual=fg.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha));
      const a=lum(actual),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);
      contrast.push({text:node.textContent.trim().slice(0,65),ratio:Math.round(ratio*100)/100,required:large?3:4.5});
    }
    const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width};};
    // Replaced IMG elements have UA overflow:clip; assess their aspect ratio separately.
    const clipping=[root,...root.querySelectorAll('*')].filter(el=>el instanceof HTMLElement&&el.tagName!=='IMG'&&!el.closest('[aria-hidden=true]')&&el.getBoundingClientRect().width>1&&['hidden','clip'].includes(getComputedStyle(el).overflowY)).map(el=>({tag:el.tagName,html:el.outerHTML.slice(0,400),overflow:getComputedStyle(el).overflowY}));
    return {headingOffsets,campaignSurfaces,teaserBackground:getComputedStyle(root.querySelector('[data-mama-teaser]')).backgroundColor,viewport:innerWidth,viewportHeight:innerHeight,pageHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,badOverflow,anchors,contrast,clipping,
      primary:box('a[href="/join/farmer"]'),teaser:box('[data-mama-teaser]'),countdown:box('[data-launch-countdown]'),
      numeralSize:parseFloat(getComputedStyle(document.querySelector('dd')).fontSize),headingSize:parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
      h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,
      controlsInTeaser:root.querySelectorAll('[data-mama-teaser] input,[data-mama-teaser] button,[data-mama-teaser] a,[data-mama-teaser] [tabindex]').length,
      images:[...root.querySelectorAll('img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,alt:i.alt,decorative:!!i.closest('[aria-hidden=true]'),ratioError:Math.abs(i.getBoundingClientRect().width/i.getBoundingClientRect().height-i.naturalWidth/i.naturalHeight)}))};
  });
}
(async()=>{
  let server=await app('true'),browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
    for(const width of [320,390,768,1440]) {
      const height=width===320?568:width===390?844:900;
      const ctx=await context(browser,server.origin,{viewport:{width,height},reducedMotion:'reduce'});
      const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
      const response=await page.goto(server.origin+'/launching-soon',{waitUntil:'networkidle'});assert.equal(response.status(),200);checkBody(await response.text());
      await page.locator('[data-launch-countdown] dd').first().filter({hasText:/\d/}).waitFor();
      const result=await measure(page);evidence.viewports[width]=result;
      assert.ok(result.campaignSurfaces.every(color=>color==='rgb(241, 246, 251)'));
      assert.equal(result.teaserBackground,'rgb(36, 71, 71)');
      assert.ok(result.headingOffsets.every(offset=>Math.abs(offset)<=1.5),JSON.stringify(result.headingOffsets));
      await page.screenshot({path:path.join(output,'candidate-'+width+'.png'),fullPage:true});
      assert.equal(result.scrollWidth,width);assert.deepEqual(result.badOverflow,[]);assert.equal(result.h1,1);assert.equal(result.main,1);assert.equal(result.controlsInTeaser,0);
      assert.deepEqual(result.clipping,[]);
      const expectedDigitSize={320:54,390:62.4,768:61.44,1440:112}[width];
      assert.ok(Math.abs(result.numeralSize-expectedDigitSize)<.02);
      assert.deepEqual(await page.locator('dl dt span[aria-hidden]').allTextContents(), ['DAYS','HOURS','MIN','SEC']);
      assert.deepEqual(await page.locator('dl dd').evaluateAll(items=>items.map(el=>getComputedStyle(el).color)), ['rgb(11, 59, 43)','rgb(11, 59, 43)','rgb(11, 59, 43)','rgb(184, 71, 42)']);
      assert.ok(await page.locator('dl > div').evaluateAll(items=>items.every(el=>getComputedStyle(el,'::after').content==='none')));
      assert.ok(result.numeralSize>1.7*result.headingSize,'Countdown leads the hero');
      assert.equal(await page.locator('h1').innerText(),'Something fresh is growing');
      const links = page.getByRole('navigation', {name:'Join before launch'}).getByRole('link');
      assert.deepEqual(await links.evaluateAll(items => items.map(a => a.getAttribute('href'))),[pages[0],pages[3],pages[1]]);
      assert.deepEqual(await links.locator('strong').allTextContents(),['+ Add my farm','Pre-Order','Add Supplier Shop']);
      assert.equal(await page.locator('a[href="/submit-listing"]').count(),0);
      assert.deepEqual(await links.locator('strong + span').allTextContents(),['Help buyers discover what you grow.','For wholesale buyers planning ahead.','Help farmers discover your products.']);
      await page.locator('[data-mama-teaser]').getByText('Coming soon',{exact:true}).waitFor();
      const art = await page.locator('h1 [data-headline-sprout]').boundingBox();
      assert.ok(art.width >=28 && art.width<=36 && art.height===art.width);
      assert.ok(result.teaser.top >= (await links.last().boundingBox()).y + (await links.last().boundingBox()).height - 1);
      assert.deepEqual(await links.evaluateAll(items=>items.map(el=>getComputedStyle(el).backgroundColor)), ['rgb(47, 125, 79)','rgb(242, 184, 75)','rgb(184, 71, 42)']);
      assert.equal(await page.getByText('Your farm’s next helping hand.').count(),1);
      assert.equal(await links.locator('svg').count(),3);
      for(const a of result.anchors){assert.ok(a.height>=44,a.text);assert.ok(a.width>=44,a.text);}
      for(const c of result.contrast)assert.ok(c.ratio>=c.required,c.text+' contrast '+c.ratio);
      for(const img of result.images){assert.ok(img.loaded);assert.ok(img.alt||img.decorative);if(!img.decorative)assert.ok(img.ratioError<.01);}
      assert.deepEqual(errors,[]);assert.equal(await page.locator('[data-launch-countdown] [aria-live="off"]').count(),1);
      const motion=await page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,animations:document.getAnimations().length,scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior}));
      assert.equal(motion.reduced,true);assert.equal(motion.animations,0);assert.equal(motion.scrollBehavior,'auto');
      await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,style:getComputedStyle(document.activeElement).outlineStyle,width:getComputedStyle(document.activeElement).outlineWidth}));assert.equal(focus.tag,'A');assert.notEqual(focus.style,'none');assert.ok(parseFloat(focus.width)>=3);
      await page.locator('h1').click(); // Remove keyboard focus ring for review capture, without action.
      await page.screenshot({path:path.join(output,'campaign-'+width+'.png'),fullPage:true});
      await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,'initial-'+width+'.png')});
      const box=await page.locator('[data-launch-countdown]').boundingBox(),before=await page.locator('[data-launch-countdown] dd').allTextContents();
      await page.clock.setFixedTime(new Date('2026-11-18T12:00:02Z'));await page.waitForFunction(old=>[...document.querySelectorAll('[data-launch-countdown] dd')].map(e=>e.textContent).join()!==old,before.join());
      const after=await page.locator('[data-launch-countdown]').boundingBox();assert.equal(after.height,box.height);assert.equal(after.width,box.width);
      evidence.viewports[width]={...result,errors,focus,motion,countdownSizeStable:true};await ctx.close();
    }
    evidence.reflow=[];
    for(const fixture of [{name:'text-200-percent',width:390,height:844,text:32},{name:'short-text-200-percent',width:320,height:568,text:32},{name:'tablet-text-200-percent',width:768,height:900,text:32},{name:'desktop-text-200-percent',width:1440,height:900,text:32},{name:'desktop-400-percent-equivalent-reflow',width:360,height:225,text:16}]){
      const ctx=await context(browser,server.origin,{viewport:{width:fixture.width,height:fixture.height}}),p=await ctx.newPage();
      await p.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));await p.goto(server.origin+'/launching-soon',{waitUntil:'networkidle'});
      await p.evaluate(size=>{document.documentElement.style.fontSize=size+'px'},fixture.text);
      const result=await measure(p);assert.equal(result.scrollWidth,fixture.width,fixture.name);assert.deepEqual(result.badOverflow,[]);assert.deepEqual(result.clipping,[]);
      assert.ok(result.headingOffsets.every(offset=>Math.abs(offset)<=1.5),JSON.stringify({fixture,lines:result.headingOffsets}));
      const focusOrder=[];evidence.reflow.push({fixture,...result,focusOrder});
      for(let i=0;i<6;i++){
        await p.keyboard.press('Tab');
        // Wait for the site's existing non-reduced smooth scrolling to settle.
        await p.waitForFunction(()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=-.5&&r.bottom<=innerHeight+.5});
        const item=await p.evaluate(()=>{const a=document.activeElement,r=a.getBoundingClientRect(),s=getComputedStyle(a);return {href:a.getAttribute('href'),top:r.top,bottom:r.bottom,visible:r.top>=-.5&&r.bottom<=innerHeight+.5,outline:s.outlineStyle,width:parseFloat(s.outlineWidth)}});
        assert.ok(item.href);assert.ok(item.visible,JSON.stringify({fixture,item}));assert.notEqual(item.outline,'none');assert.ok(item.width>=3);focusOrder.push(item.href);
      }
      assert.deepEqual(focusOrder,['/launching-soon',pages[0],pages[3],pages[1],'/privacy-policy','/terms-of-use']);
      await p.screenshot({path:path.join(output,fixture.name+'.png'),fullPage:true});await ctx.close();
    }
    const motionCtx=await context(browser,server.origin,{viewport:{width:390,height:844},reducedMotion:'no-preference'});
    const motionPage=await motionCtx.newPage();
    await motionPage.goto(server.origin+'/launching-soon',{waitUntil:'domcontentloaded'});
    const growth = motionPage.locator('h1 [data-headline-sprout]');
    const playbackPromise = growth.evaluate(async svg => {
      const parts = svg.getAnimations({subtree:true});
      const samples = parts.map(animation => ({
        iterations: animation.effect.getTiming().iterations,
        endTime: animation.effect.getComputedTiming().endTime,
        frames: animation.effect.getKeyframes().map(frame => frame.transform)
      }));
      await Promise.all(parts.map(animation => animation.finished));
      return { samples, settled: parts.every(animation => animation.playState === 'finished') };
    });
    // Record the running browser at native phone scale, including the heading and clock.
    const timestamps=[];
    const start=Date.now();
    do {
      timestamps.push(Date.now()-start);
      await motionPage.screenshot({clip:{x:0,y:0,width:390,height:350},path:path.join(output,'motion-'+String(timestamps.length).padStart(3,'0')+'.png')});
      await motionPage.waitForTimeout(45);
    } while(Date.now()-start<3300);
    fs.writeFileSync(path.join(output,'motion-times.json'),JSON.stringify(timestamps));
    const playback=await playbackPromise;
    assert.equal(playback.samples.length,2);assert.ok(playback.settled);
    for(const part of playback.samples){assert.equal(part.iterations,1);assert.ok(part.endTime<=4000);assert.notEqual(part.frames[0],part.frames.at(-1));}
    evidence.botanicalMotion=playback;await motionCtx.close();
    for(const timezoneId of ['Pacific/Honolulu','Asia/Tokyo']) {
      const ctx=await context(browser,server.origin,{timezoneId}),page=await ctx.newPage();await page.clock.setFixedTime(new Date('2026-12-03T05:00:00Z'));
      await page.goto(server.origin+'/launching-soon');await page.waitForFunction(()=>document.querySelector('[data-launch-countdown] dd')?.textContent==='01');
      evidence.timezone.push(await page.locator('[data-launch-countdown] dd').allTextContents());await ctx.close();
    }
    assert.deepEqual(evidence.timezone,[['01','00','00','00'],['01','00','00','00']]);
    const nojs=await context(browser,server.origin,{javaScriptEnabled:false});const n=await nojs.newPage();await n.goto(server.origin+'/launching-soon');await n.getByText('Launching 4 December 2026 · 5:00 AM Ghana time',{exact:true}).first().waitFor();assert.equal(await n.locator('[data-launch-countdown] dl').getAttribute('aria-hidden'),'true');await nojs.close();evidence.nonJavaScript='PASS';
    const zero=await context(browser,server.origin),z=await zero.newPage();await z.clock.setFixedTime(new Date('2026-12-04T05:00:00Z'));await z.goto(server.origin+'/launching-soon');await z.getByText("We're opening Ghana Growers now.",{exact:true}).waitFor();assert.equal(new URL(z.url()).pathname,'/launching-soon');await z.screenshot({path:path.join(output,'zero-state.png'),fullPage:true});await zero.close();evidence.zero='PASS text only; gate remains active';
    for(const route of ['/','/farmer-hub','/farmer-hub/feedback','/directory','/marketplace','/learn','/account','/join/buyer']) {const r=await fetch(server.origin+route);assert.equal(r.status,200);const text=await r.text();checkBody(text);assert.ok(text.includes('data-prelaunch-campaign'));}
    for(const route of ['/api/farmmate/ask','/api/farmmate/crop-doctor','/api/farmmate/usage']){const r=await fetch(server.origin+route,{method:'POST',body:'{}'});assert.equal(r.status,503);assert.equal((await r.json()).code,'PRELAUNCH_UNAVAILABLE');}
    const rsc=await fetch(server.origin+'/launching-soon?_rsc=campaign-check',{headers:{RSC:'1'}});assert.match(rsc.headers.get('content-type'),/text\/x-component/);checkBody(await rsc.text());evidence.htmlRscPrivacy='PASS';
    const token=await createPreviewAccessToken(secret);const internal=await fetch(server.origin+'/farmer-hub',{headers:{cookie:previewAccessCookie+'='+token}});assert.equal(internal.status,200);assert.ok(!(await internal.text()).includes('data-prelaunch-campaign'));evidence.internalAccess='PASS existing signed cookie, local fixture only';
    for(let i=0;i<pages.length;i++){const r=await fetch(server.origin+pages[i]);assert.equal(r.status,200);assert.match(await r.text(),/<form\b/);}
    assert.equal(evidence.requests.filter(r=>r.path.startsWith('/api/farmmate')||r.method!=='GET').length,0);evidence.teaserApiCalls=0;
    await stop(server);
    for(let i=0;i<flags.length;i++){
      server=await app('true',[i]);const page=await fetch(server.origin+pages[i]),body=await page.text();assert.equal(page.status,200);assert.match(body,/not open yet/i);assert.doesNotMatch(body,/<form\b/);
      const r=await fetch(server.origin+apis[i],{method:'POST',body:'{}',headers:{'content-type':'application/json'}});assert.equal(r.status,503);assert.equal((await r.json()).code,'PUBLIC_SUBMISSION_UNAVAILABLE');
      const closedContext=await context(browser,server.origin),closedPage=await closedContext.newPage();
      await closedPage.goto(server.origin+'/launching-soon');
      // Count rendered links, not the duplicate HTML + RSC serialization of their text.
      const closedCards=closedPage.locator('[data-prelaunch-campaign] a').filter({hasText:'Currently closed'});
      assert.equal(await closedCards.count(),i===2 ? 0 : 1);
      if(i!==2) assert.equal(await closedCards.getAttribute('href'),pages[i]);
      await closedContext.close();
      evidence.closedWorkflows.push({page:pages[i],api:apis[i],closed:true,otherFlags:true});await stop(server);
    }
    server=await app('false');const old=await fetch(server.origin+'/launching-soon',{redirect:'manual'});assert.equal(old.status,307);assert.equal(old.headers.get('location'),server.origin+'/');assert.match(old.headers.get('cache-control'),/no-store/);
    const home=await fetch(server.origin+'/');assert.ok(!(await home.text()).includes('data-prelaunch-campaign'));const hub=await fetch(server.origin+'/farmer-hub');assert.equal(hub.status,200);assert.ok(!(await hub.text()).includes('data-prelaunch-campaign'));evidence.postLaunch='PASS 307 no-store, normal Homepage and Mama G restored';
    assert.deepEqual(evidence.findings,[]);evidence.result='PASS';
  } finally {if(browser)await browser.close();await stop(server);}
})().catch(e=>{evidence.result='FAIL';evidence.error=e.stack;process.exitCode=1}).finally(()=>{
  fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(evidence,null,2));
  console.log(JSON.stringify({result:evidence.result,error:evidence.error,viewports:Object.keys(evidence.viewports),zero:evidence.zero,timezone:evidence.timezone,closedWorkflows:evidence.closedWorkflows,teaserApiCalls:evidence.teaserApiCalls,postLaunch:evidence.postLaunch}));
});
