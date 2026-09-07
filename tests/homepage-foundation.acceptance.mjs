import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Deliberately restricted to local synthetic verification. Never point at Production.
const base = new URL(process.env.FOUNDATION_TEST_URL || "http://localhost:3221");
assert(["localhost", "127.0.0.1"].includes(base.hostname), "Local test URL required");
const secret = process.env.PREVIEW_ACCESS_SECRET;
assert(secret?.length >= 32, "Provide the isolated local server's preview secret");
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.FOUNDATION_PLAYWRIGHT || "playwright");
const out = process.env.FOUNDATION_EVIDENCE_DIR;
assert(out, "Provide an evidence directory outside tracked source");
await mkdir(out, { recursive: true });
const cookieName = "ghana_growers_dev_preview";
const route = "/dev-preview/homepage-foundation";
function token(expires = Math.floor(Date.now()/1000)+1200) {
  return "v1."+expires+"."+createHmac("sha256",secret).update("ghana-growers-preview:v1:"+expires).digest("hex");
}
const valid = token();
const results = { mode:process.env.SITE_PRELAUNCH, http:[], widths:[], font:{}, contrast:[], errors:[] };
for(const suffix of ["", "?check=1", "/"]) {
  for(const [kind,value] of [["missing",""],["invalid","invalid"],["expired",token(1)]]) {
    const r=await fetch(new URL(route+suffix,base),{headers:value?{cookie:cookieName+"="+value}:{},redirect:"follow"});
    assert(!(await r.text()).includes("data-foundation"),"Clean/invalid request exposed foundation");
    assert.match(r.headers.get("cache-control")||"",/no-store/);
    results.http.push(kind+suffix+":denied");
  }
}
for(const headers of [{rsc:"1","next-router-prefetch":"1"},{}]) {
  const denied=await fetch(new URL(route,base),{headers});
  assert(!(await denied.text()).includes("data-foundation"));
  const allowed=await fetch(new URL(route,base),{headers:{...headers,cookie:cookieName+"="+valid}});
  assert.equal(allowed.status,200);
  assert.match(allowed.headers.get("cache-control")||"",/no-store/);
  assert.match(allowed.headers.get("x-robots-tag")||"",/noindex/);
  results.http.push(headers.rsc?"rsc:protected":"html:protected");
}
const browser=await chromium.launch({headless:true,...(process.env.FOUNDATION_BROWSER?{executablePath:process.env.FOUNDATION_BROWSER}:{})});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  await context.addCookies([{name:cookieName,value:valid,url:base.origin,httpOnly:true,sameSite:"Lax"}]);
  const page=await context.newPage();
  page.on("pageerror",e=>results.errors.push(e.message));
  const mutations=[];
  page.on("request",r=>{if(r.method()!=="GET"&&r.method()!=="HEAD")mutations.push(r.method()+" "+new URL(r.url()).pathname);});
  await page.goto(new URL(route,base).href);
  const root=page.locator("[data-foundation]");
  await root.waitFor();
  await page.evaluate(()=>document.fonts.ready);
  results.palette = await root.evaluate(el => Object.fromEntries(
    [...el.querySelectorAll("[data-palette], [data-palette-role]")].map(n => [n.getAttribute("data-palette") || n.getAttribute("data-palette-role"), getComputedStyle(n).backgroundColor])
  ));
  assert.deepEqual(results.palette, {
    cream: "rgb(245, 240, 221)", sage: "rgb(232, 238, 224)", "soft-green": "rgb(238, 245, 232)",
    forest: "rgb(27, 58, 36)", maize: "rgb(242, 183, 5)", charcoal: "rgb(26, 26, 26)",
    main: "rgb(245, 240, 221)", secondary: "rgb(232, 238, 224)", tint: "rgb(238, 245, 232)"
  }, "Rendered palette and section roles must match the amended founder handoff");
  assert.match(await root.locator("[data-review-boundary]").innerText(), /Legacy shell, header and footer wording outside it is not approved/);
  assert(await root.getByText("This revised specimen awaits founder approval.", {exact:false}).isVisible());
  assert.equal(await page.locator("main main").count(),0);
  assert.equal(await root.getByRole("link").count(),0);
  for(const label of ["Buy Produce","List Your Farm"])assert(await root.getByRole("button",{name:label,exact:true}).isDisabled());
  assert.equal(await root.locator("input,form,textarea").count(),0);
  const demo=root.getByRole("button",{name:"Show example feedback"});
  let reached = false;
  for (let i=0;i<80;i++) { await page.keyboard.press("Tab"); if (await demo.evaluate(el=>el===document.activeElement)) { reached=true; break; } }
  assert(reached, "Demonstration must be reachable by keyboard");
  assert(await demo.evaluate(el=>getComputedStyle(el).outlineStyle!=="none"), "Missing visible focus");
  await writeFile(path.join(out,"reading-order-"+results.mode+".txt"),await root.ariaSnapshot());
  await page.keyboard.press("Enter");
  await root.getByRole("status").getByText("Example feedback is visible. Nothing was sent or saved.",{exact:true}).waitFor();
  assert.equal(mutations.length,0);
  for(const width of [320,390,768,1024,1440]){
    await page.setViewportSize({width,height:1000});
    const metrics=await root.evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,overflow:[...el.querySelectorAll("*")].filter(n=>n.getBoundingClientRect().right>el.getBoundingClientRect().right+1).length}));
    assert(metrics.scroll<=metrics.client+1,"Foundation overflow at "+width);
    assert.equal(metrics.overflow,0,"Child overflow at "+width);
    results.widths.push({width,...metrics});
    await root.screenshot({path:path.join(out,"foundation-"+results.mode+"-"+width+".png")});
  }
  results.font.loaded=await root.evaluate(el=>({family:getComputedStyle(el).fontFamily,status:document.fonts.status,faces:[...document.fonts].map(f=>({family:f.family,status:f.status})),resources:performance.getEntriesByType("resource").filter(r=>r.name.includes(".woff2")).map(r=>({bytes:r.encodedBodySize,duration:r.duration}))}));
  assert(results.font.loaded.faces.some(f=>f.status==="loaded"),"No loaded font");
  results.contrast=await root.evaluate(el=>{
    function lum(rgb){const a=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722}
    return [...el.querySelectorAll("[data-tone],button")].map(n=>{const c=getComputedStyle(n),a=lum(c.color),b=lum(c.backgroundColor);return{label:n.textContent.trim().slice(0,45),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}});
  });
  assert(results.contrast.every(x=>x.ratio>=4.5),"Text contrast failure");
  await page.setViewportSize({width:1280,height:1000});
  for(const zoom of [2,4]){
    await page.evaluate(z=>{document.documentElement.style.zoom=String(z)},zoom);
    assert(await root.evaluate(el=>el.scrollWidth<=el.clientWidth+1),"Zoom reflow failure");
    await root.screenshot({path:path.join(out,"foundation-"+results.mode+"-zoom-"+zoom+".png")});
  }
  await page.evaluate(()=>{document.documentElement.style.zoom=""});
  await page.reload(); await root.waitFor();
  await page.goto(new URL("/dev-preview?exit=1",base).href);
  await page.goto(new URL(route,base).href);
  assert.equal(await page.locator("[data-foundation]").count(),0,"Exit failed");
  const fallback=await browser.newContext({viewport:{width:390,height:900}});
  await fallback.addCookies([{name:cookieName,value:valid,url:base.origin,httpOnly:true,sameSite:"Lax"}]);
  await fallback.route("**/*.woff2",r=>r.abort());
  const fp=await fallback.newPage();await fp.goto(new URL(route,base).href);
  await fp.locator("[data-foundation]").waitFor();
  results.font.blocked=await fp.locator("[data-foundation]").evaluate(el=>({readable:!!el.textContent.includes("Find produce."),overflow:el.scrollWidth>el.clientWidth+1}));
  assert(results.font.blocked.readable&&!results.font.blocked.overflow);
  await fp.locator("[data-foundation]").screenshot({path:path.join(out,"foundation-"+results.mode+"-font-fallback.png")});
  await fallback.close();
  const slow=await browser.newContext({viewport:{width:390,height:900}});
  await slow.addCookies([{name:cookieName,value:valid,url:base.origin,httpOnly:true,sameSite:"Lax"}]);
  await slow.addInitScript(()=>{window.foundationShift=0;new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.foundationShift+=entry.value;}).observe({type:"layout-shift",buffered:true});});
  await slow.route("**/*.woff2",async r=>{await new Promise(resolve=>setTimeout(resolve,1200));await r.continue();});
  const sp=await slow.newPage();await sp.goto(new URL(route,base).href);
  await sp.evaluate(()=>document.fonts.ready);
  results.font.slow=await sp.locator("[data-foundation]").evaluate(el=>({layoutShift:window.foundationShift,overflow:el.scrollWidth>el.clientWidth+1}));
  assert(!results.font.slow.overflow);assert(results.font.slow.layoutShift<=.1,"Excessive layout shift in slow-font test");
  await slow.close();
  for(const target of ["/join/supplier","/supplier-registration"]){const response=await fetch(new URL(target,base),{redirect:"manual"});assert([307,308].includes(response.status));assert(new URL(response.headers.get("location"),base).pathname==="/become-a-supplier");}
  for(const target of ["/launching-soon","/farmer-hub","/farmer-hub/feedback","/admin/login"]){
    await page.goto(new URL(target,base).href);
    assert((await page.locator("body").innerText()).trim().length>30);
  }
  assert.equal(results.errors.length,0,"Browser runtime error");
  await context.close();
} finally { await browser.close(); await writeFile(path.join(out,"acceptance-"+results.mode+".json"),JSON.stringify(results,null,2)); }
console.log("PASS foundation HTTP, browser, responsive, reflow, contrast, feedback, font fallback, exit and smoke checks ("+results.mode+")");
