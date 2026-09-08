import {verifyHeroShortlist} from './hero-shortlist.verify.mjs';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const exports={};
const source=await readFile('src/lib/homepage/discovery.ts','utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports});
const records=[
  {id:'test-f',kind:'farmer',name:'Synthetic farmer',region:'Test North',products:['Tomatoes','Vegetables']},
  {id:'test-s',kind:'supplier',name:'Synthetic supplier',region:'Test South',products:['Seeds','Fertilizers']}
];
assert.equal(exports.discover(records,'  TOMATOES north ')[0]?.id,'test-f');
assert.equal(exports.discover(records,'ＳＥＥＤＳ')[0]?.id,'test-s');
assert.equal(exports.discover(records,'synthetic','farmer').length,1);
assert.equal(exports.discover(records,'missing').length,0);
assert.equal(exports.discover(records,'north','supplier').length,0);
assert.equal(exports.discover(records,'').length,2);
assert.equal(exports.discover([],'anything').length,0);
assert.equal(exports.categoryListings([{id:'test',category:'Vegetables'}],'vegetables').length,1);
assert.equal(exports.categoryListings([{id:'test',category:'Fruits'}],'Vegetables').length,0);
assert.equal(records[0].name,'Synthetic farmer');

const fixtureExports={};
const fixtureEnvironment={env:{VERCEL_ENV:'preview'}};
const fixtureSource=await readFile('src/app/dev-preview/amended-homepage/fixtures.ts','utf8');
vm.runInNewContext(ts.transpileModule(fixtureSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:fixtureExports,process:fixtureEnvironment,require:name=>{assert.equal(name,'server-only');return {};}});
const fixtures=fixtureExports.getHomepagePreviewFixtures();
assert.equal(fixtures.directory.items.length,8);assert.equal(fixtures.listings.items.length,16);
assert.equal(new Set([...fixtures.directory.items,...fixtures.listings.items].map(item=>item.id)).size,24);
assert(fixtures.directory.items.every(item=>item.name.startsWith('Preview ')&&item.id.startsWith('p09-preview-')));
assert(fixtures.directory.items.every(item=>Object.keys(item).sort().join(',')==='id,kind,name,products,region'));
assert(fixtures.listings.items.every(item=>Object.keys(item).sort().join(',')==='category,id,location,seller,title'));
assert.equal(fixtures.resources.status,'ready');assert.equal(fixtures.resources.items.length,3);
assert.equal(fixtureExports.getHomepagePreviewFixtures('empty').directory.items.length,0);
assert.equal(fixtureExports.getHomepagePreviewFixtures('unavailable').directory.status,'unavailable');
fixtureEnvironment.env.VERCEL_ENV='production';
assert.throws(()=>fixtureExports.getHomepagePreviewFixtures(),/unavailable in Production/);

const base=new URL(process.env.FOUNDATION_TEST_URL||'http://localhost:3221');
assert(['localhost','127.0.0.1'].includes(base.hostname));
const secret=process.env.PREVIEW_ACCESS_SECRET;assert(secret?.length>=32);
const out=process.env.FOUNDATION_EVIDENCE_DIR;assert(out);await mkdir(out,{recursive:true});
const mode=process.env.SITE_PRELAUNCH;
const route='/dev-preview/amended-homepage';
const name='ghana_growers_dev_preview';
const sign=expires=>'v1.'+expires+'.'+createHmac('sha256',secret).update('ghana-growers-preview:v1:'+expires).digest('hex');
const valid=sign(Math.floor(Date.now()/1000)+1200);
const results={mode,discoveryAssertions:10,denials:[],widths:[],errors:[],limitations:['Synthetic fixtures only; no operational dataset','Neutral imagery/resource placeholders; no approved editorial or operational claims']};
for(const suffix of ['', '?check=1','/'])for(const [kind,token] of [['missing',''],['invalid','invalid'],['expired',sign(1)]]){
  const response=await fetch(new URL(route+suffix,base),{headers:token?{cookie:name+'='+token}:{}});
  assert.doesNotMatch(await response.text(),/data-amended-homepage|Preview Farmer 01|p09-preview-farmer/);assert.match(response.headers.get('cache-control')||'',/no-store/);results.denials.push(kind+suffix);
}
for(const extra of [{},{rsc:'1','next-router-prefetch':'1'}]){
  const allowed=await fetch(new URL(route,base),{headers:{...extra,cookie:name+'='+valid}});
  assert.equal(allowed.status,200);assert.match(allowed.headers.get('cache-control')||'',/no-store/);assert.match(allowed.headers.get('x-robots-tag')||'',/noindex/);
  const body = await allowed.text(); if (!extra.rsc) assert(body.includes('data-amended-homepage')); else { assert.match(allowed.headers.get('content-type') || '', /text\/x-component/); await writeFile(path.join(out, 'rsc-authorised-' + mode + '.txt'), body); }
  const denied=await fetch(new URL(route,base),{headers:extra});assert.doesNotMatch(await denied.text(),/data-amended-homepage|Preview Farmer 01|p09-preview-farmer/);
}
const {chromium}=require(process.env.FOUNDATION_PLAYWRIGHT||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.FOUNDATION_BROWSER});
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await ctx.addCookies([{name,value:valid,url:base.origin,httpOnly:true,sameSite:'Lax'}]);
 const page=await ctx.newPage();page.on('pageerror',e=>results.errors.push(e.message));
 const writes=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method());});
 await page.goto(new URL(route,base).href);const root=page.locator('[data-amended-homepage]');await root.waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('main main').count(),0);assert.equal(await root.getByRole('link').count(),2);
 assert(await root.getByRole('searchbox').isEnabled());
 assert.match(await root.locator('[data-fixture-notice]').innerText(),/not real farmers, suppliers or offers/);
 assert.equal(await root.locator('#directory-panel article').count(),4);
 for(const [query, expected] of [['tomatoes ashanti',1],['Preview Supplier 02',1],['Volta',2],['nothing-matches',0],['',8]]){
   await root.getByRole('searchbox').fill(query);await root.getByRole('button',{name:'Search',exact:true}).click();
   await root.getByRole('status').getByText(new RegExp('^'+expected+' profile')).waitFor();
   assert.equal(await root.getByRole('region',{name:'Search results',exact:true}).locator('li').count(),expected);
 }
 for(const label of ['Vegetables','Seeds','Livestock','Fertilizers','Fruits']){await root.getByRole('button',{name:label,exact:true}).click();assert(await root.getByRole('region',{name:'Search results',exact:true}).locator('li').count()>0);}
 await page.reload();await root.waitFor();
 for(const label of ['Buy Produce','List Your Farm','Farmland'])assert(await root.getByRole('button',{name:label,exact:true}).isDisabled());
 const supplier=root.getByRole('tab',{name:'Suppliers & Services',exact:true});
 await supplier.click();assert.equal(await root.locator('#directory-panel article').count(),4);assert.match(await root.locator('#directory-panel').innerText(),/Preview Supplier 01/);assert.equal(await supplier.getAttribute('aria-selected'),'true');await root.getByRole('button',{name:'View All Suppliers & Services',exact:true}).waitFor();
 await supplier.press('ArrowLeft');const farmer=root.getByRole('tab',{name:'Farmers',exact:true});assert.equal(await farmer.getAttribute('aria-selected'),'true');assert(await farmer.evaluate(el=>el===document.activeElement));
 assert(await farmer.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
 const category=root.getByRole('tab',{name:'Vegetables',exact:true});await category.click();assert.equal(await category.getAttribute('aria-selected'),'true');await category.press('End');assert.equal(await root.getByRole('tab',{name:'Farm inputs',exact:true}).getAttribute('aria-selected'),'true');
 assert.doesNotMatch(await root.innerText(),/GG FarmMate|Join the Network|E\.A\.Sy|Emerge Agri Systems/);
 assert.equal(await page.locator('[data-legacy-shell]:visible').count(),0);
 assert.equal(await root.locator('[data-preview-header]').count(),1);
 assert.equal(await root.locator('[data-preview-footer]').count(),1);
 for(const label of ['All','Vegetables','Fruits','Livestock','Farm inputs']){await root.getByRole('tab',{name:label,exact:true}).click();assert.equal(await root.locator('#marketplace-panel article').count(),4);}
 assert.equal(await root.locator('[data-device-cue]').count(),1);
 assert.equal(await root.locator('[data-hero-placeholder]').count(),1);
 assert.equal(await root.getByRole('region',{name:'Learn',exact:true}).locator('article').count(),3);
 await root.getByRole('tab',{name:'All',exact:true}).click();
 assert.equal(await root.locator('img').count(),6);assert.equal(await root.locator('figure img[alt*="Illustrative"]').count(),4);
 assert.equal(await root.locator('article').filter({hasText:'Synthetic fixture · not a real record'}).count(),8);
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});
  assert(await root.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Overflow at '+width);
  assert(await root.evaluate(el=>[...el.querySelectorAll('*')].filter(n=>!n.closest('[aria-hidden="true"]')&&!n.closest('[data-card-track]')).every(n=>n.getBoundingClientRect().right<=el.getBoundingClientRect().right+1)),'Child overflow');
  if(width===1440)assert(await root.locator('h1').evaluate(el=>el.getBoundingClientRect().height<parseFloat(getComputedStyle(el).lineHeight)*1.2),'Wide heading should be one statement');
  if(width===1440) for(const panel of ['#directory-panel','#marketplace-panel']){
    assert(await root.locator(panel+' article').evaluateAll(nodes=>new Set(nodes.map(n=>Math.round(n.getBoundingClientRect().top))).size===1),'Four cards should share one desktop row');
  }
  if(width===1440) assert(await root.getByRole('region',{name:'Learn',exact:true}).locator('article').evaluateAll(nodes=>new Set(nodes.map(n=>Math.round(n.getBoundingClientRect().top))).size===1));
  if([390,768,1440].includes(width)){await root.locator('[data-homepage-hero]').screenshot({path:path.join(out,'hero-'+mode+'-'+width+'.png')});await root.locator('[data-tool-interface]').last().screenshot({path:path.join(out,'tools-'+mode+'-'+width+'.png')});}
  if(width===320||width===390){
    const measures={width,cards:[],targets:[]};
    for(const label of ['farmer','supplier','listing','Learn']){
      if(label==='supplier')await root.getByRole('tab',{name:'Suppliers & Services',exact:true}).click();
      const browser=root.locator('[data-card-browser="'+label+'"]');const track=browser.locator('[data-card-track]');const cards=track.locator('article');const total=await cards.count();
      const metric=await track.evaluate(el=>({width:el.clientWidth,cardWidth:el.firstElementChild.getBoundingClientRect().width,scrollWidth:el.scrollWidth,bodyFont:parseFloat(getComputedStyle(el.querySelector('article p')).fontSize)}));
      assert(Math.abs(metric.width-metric.cardWidth)<=1,'One full-width card: '+label);assert(metric.width>=width-34);assert(metric.bodyFont>=14);measures.cards.push({label,...metric});
      const status=browser.getByRole('status');assert.equal(await status.innerText(),'1 of '+total);
      await browser.getByRole('button',{name:'Next '+label+' card',exact:true}).click();await status.getByText('2 of '+total,{exact:true}).waitFor();
      assert(await track.evaluate(el=>Math.abs(el.children[1].getBoundingClientRect().left-el.getBoundingClientRect().left)<2));
      await track.focus();await track.press('End');await status.getByText(total+' of '+total,{exact:true}).waitFor();assert(await browser.getByRole('button',{name:'Next '+label+' card',exact:true}).isDisabled());
      await track.press('Home');await status.getByText('1 of '+total,{exact:true}).waitFor();
      await track.evaluate(el=>el.scrollTo({left:el.firstElementChild.getBoundingClientRect().width+16,behavior:'instant'}));await status.getByText('2 of '+total,{exact:true}).waitFor();
      await browser.getByRole('button',{name:'Previous '+label+' card',exact:true}).click();await status.getByText('1 of '+total,{exact:true}).waitFor();
      await browser.screenshot({path:path.join(out,'cards-'+label+'-'+mode+'-'+width+'.png')});
      if(label==='supplier'){await root.getByRole('tab',{name:'Farmers',exact:true}).click();assert.equal(await root.locator('[data-card-browser="farmer"]').getByRole('status').innerText(),'1 of 4');}
    }
    const steps=root.locator('#homepage-how').locator('..').locator('..').locator('ol');assert(await steps.locator('li').evaluateAll(nodes=>new Set(nodes.map(n=>Math.round(n.getBoundingClientRect().left))).size===1));
    const teaser=root.getByRole('heading',{name:'Everything You Need to Manage Your Farm Better',exact:true}).locator('..');assert(await teaser.locator('li').evaluateAll(nodes=>new Set(nodes.map(n=>Math.round(n.getBoundingClientRect().top))).size===4));
    measures.targets=await root.locator('button:visible').evaluateAll(nodes=>nodes.map(n=>({label:n.textContent,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,clipped:n.scrollWidth>n.clientWidth+1})));
    assert(measures.targets.every(t=>t.width>=43.9&&t.height>=43.9&&!t.clipped),'Touch targets and complete labels');
    measures.pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);assert(!measures.pageOverflow);
    measures.pageHeight=await root.evaluate(el=>el.getBoundingClientRect().height);
    await writeFile(path.join(out,'mobile-metrics-'+mode+'-'+width+'.json'),JSON.stringify(measures,null,2));
  }
  results.widths.push(width);await root.screenshot({path:path.join(out,'homepage-'+mode+'-'+width+'.png')});
 }
 await page.setViewportSize({width:1440,height:1000});
 const desktop=root.getByRole('navigation',{name:'Homepage navigation',exact:true});
 for(const label of ['Explore','Find','How it works']){const summary=desktop.locator('summary').filter({hasText:label});await summary.focus();await summary.press('Enter');assert(await summary.evaluate(n=>n.parentElement.open));await summary.press('Escape');assert(await summary.evaluate(n=>!n.parentElement.open&&document.activeElement===n));}
 for(const width of [390,768]){await page.setViewportSize({width,height:1000});const menu=root.locator('[data-preview-header] > div > details > summary');await menu.click();const mobile=root.getByRole('navigation',{name:'Mobile homepage navigation'});const explore=mobile.getByText('Explore',{exact:true});if(!(await explore.evaluate(n=>n.parentElement.open)))await explore.click();assert(await mobile.getByRole('button',{name:'Marketplace',exact:true}).isVisible());assert(await mobile.getByRole('button',{name:'Marketplace',exact:true}).isDisabled());await page.screenshot({path:path.join(out,'menu-'+mode+'-'+width+'.png')});await menu.press('Escape');assert(!(await mobile.isVisible()));}
 await page.setViewportSize({width:1440,height:1000});
 results.contrast=await root.evaluate(el=>{
 function lum(rgb){const a=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
 return [...el.querySelectorAll('p,h1,h2,h3,button,label,input,strong,figcaption')].map(n=>{let p=n,bg;while(p){bg=getComputedStyle(p).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')break;p=p.parentElement;}const a=lum(getComputedStyle(n).color),b=lum(bg);return{label:n.textContent.slice(0,35),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
 });
 assert(results.contrast.every(c=>c.ratio>=4.5),'Text contrast');
 await root.locator('img').evaluateAll(ns=>ns.forEach(n=>n.dispatchEvent(new Event('error'))));
 await root.locator('img').first().waitFor({state:'detached'}).catch(()=>{});assert.equal(await root.locator('img').count(),0);assert.equal(await root.getByRole('link',{name:'Ghana Growers home',exact:true}).count(),2);assert.equal(await root.locator('figure').count(),0);await page.reload();await root.waitFor();
 await writeFile(path.join(out,'reading-order-'+mode+'.txt'),await root.ariaSnapshot());
 await page.setViewportSize({width:1280,height:1000});for(const zoom of [2,4]){await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);assert(await root.evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 await page.evaluate(()=>document.documentElement.style.zoom='');await page.reload();await root.waitFor();
 await verifyHeroShortlist(page,base.origin,out);
 for(const scenario of ['empty','unavailable']){
   await page.goto(new URL(route+'?fixture='+scenario,base).href);await root.waitFor();
   assert.equal(await root.locator('article').count(),0);
   if(scenario==='empty'){assert(await root.getByRole('searchbox').isEnabled());await root.getByRole('button',{name:'Search',exact:true}).click();await root.getByRole('status').getByText(/^0 profiles/).waitFor();}
   else assert(await root.getByRole('searchbox').isDisabled());
 }
 await page.goto(new URL('/farmer-hub',base).href);assert(await page.locator('[data-legacy-shell]:visible').count()>0);assert.equal(await page.locator('[data-preview-header]').count(),0);assert.equal(await page.locator('header[data-legacy-shell]').evaluate(n=>getComputedStyle(n).position),'sticky');
 await page.goto(new URL('/dev-preview?exit=1',base).href);await page.goto(new URL(route,base).href);assert.equal(await page.locator('[data-amended-homepage]').count(),0);
 assert.equal(writes.length,0);assert.equal(results.errors.length,0);
}finally{await browser.close();await writeFile(path.join(out,'acceptance-'+mode+'.json'),JSON.stringify(results,null,2));}
console.log('PASS P09-2 local discovery contracts, gated states, tabs, responsive layout, reflow and private access ('+mode+'). Completion gates remain open.');
