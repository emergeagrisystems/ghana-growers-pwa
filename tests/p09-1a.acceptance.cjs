const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/lynne/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.FOUNDATION_TEST_URL||process.argv[2];
const out=process.env.FOUNDATION_EVIDENCE_DIR;
const slugs=['how-it-works','how-information-is-checked','about','contact'];
const titles=['How Ghana Growers works','How information is checked','About Ghana Growers','Contact Ghana Growers'];
const home='/dev-preview/amended-homepage', routes=[home,...slugs.map(s=>'/dev-preview/public/'+s)];
const cookie='ghana_growers_dev_preview';
const result={mode:process.env.SITE_PRELAUNCH,checks:[],surfaces:[],errors:[]};
const token=expiry=>'v1.'+expiry+'.'+crypto.createHmac('sha256',process.env.PREVIEW_ACCESS_SECRET).update('ghana-growers-preview:v1:'+expiry).digest('hex');
async function review(ctx, page){
  page.on('pageerror',e=>result.errors.push(e.message));
  const writes=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
  for(const width of [320,390,768,1440])for(const [i,route] of routes.entries()){
    await page.setViewportSize({width,height:1000});await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
    const root=page.locator(i?'[data-public-preview]':'[data-amended-homepage]');await root.waitFor();
    assert.equal(await root.locator('h1').count(),1);assert.equal(await page.locator('main').count(),1);
    assert.equal(await page.getByRole('banner').count(),1);assert.equal(await page.getByRole('contentinfo').count(),1);
    assert.equal(await page.locator('[data-legacy-shell]:visible').count(),0);
    assert.match(await page.title(),/Protected/);
    const text=await root.innerText();assert.doesNotMatch(text,/GG FarmMate|Join the Network|Buy\. Sell\. Grow\.|Emerge Agri Systems|E\.A\.Sy|Verified by/);
    if(i){assert.equal(await root.locator('h1').innerText(),titles[i-1]);assert.equal(await root.locator('form').count(),0);}
    for(const href of await root.locator('a[href]').evaluateAll(ns=>ns.map(n=>n.getAttribute('href'))))assert(routes.includes(href)||href==='/dev-preview/suppliers-services'||/^\/dev-preview\/suppliers-services\/p09-preview-supplier-0[1-4]$/.test(href)||href.startsWith('#')||href==='/dev-preview/marketplace'||href==='/dev-preview/list-a-product'||/^\/dev-preview\/marketplace\/p09-preview-listing-[0-3]-[0-3]$/.test(href)||href==='/dev-preview/farmers'||href==='/dev-preview/list-your-farm'||/^\/dev-preview\/farmers\/p09-preview-farmer-0[1-4]$/.test(href),'allowlisted href '+href);
    const metric=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:[...document.querySelectorAll('[data-public-preview] h1,[data-public-preview] h2,[data-public-preview] p,[data-public-preview] a')].filter(n=>n.checkVisibility()&&n.getBoundingClientRect().width&&n.scrollWidth>n.clientWidth+1).map(n=>n.textContent),nav:!!document.querySelector('details[open]')}));
    assert(!metric.overflow);assert.deepEqual(metric.clipped,[]);
    const links=await root.locator('a:visible').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().top>=0).map(n=>({text:n.textContent,height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width})));
    assert(links.every(n=>n.height>=44&&n.width>=44),'44px links: '+JSON.stringify(links));
    const contrast=await root.evaluate(el=>{
      const lum=rgb=>{const a=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=rgb.startsWith('color(srgb')?1:255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
      return [...el.querySelectorAll('a,p,h1,h2,summary')].filter(n=>n.getBoundingClientRect().width).map(n=>{let p=n,bg;while(p){bg=getComputedStyle(p).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')break;p=p.parentElement;}const a=lum(getComputedStyle(n).color),b=lum(bg);return{label:n.textContent.slice(0,30),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    });assert(contrast.every(c=>c.ratio>=4.5),JSON.stringify(contrast.filter(c=>c.ratio<4.5)));
    const menu=root.locator('[data-preview-header] > div > details > summary');
    assert.equal(await menu.isVisible(),width<1072);
    if(width<1072){
      await menu.focus();await menu.press('Enter');const nav=root.getByRole('navigation',{name:'Mobile homepage navigation'});assert(await nav.isVisible());
      const how=nav.locator('summary').filter({hasText:'How it works'});await how.focus();await how.press('Enter');
      const link=nav.getByRole('link',{name:'How information is checked',exact:true});assert(await link.isVisible());assert(await nav.locator('a:visible').evaluateAll(ns=>ns.every(n=>n.scrollWidth<=n.clientWidth+1&&n.getBoundingClientRect().height>=44)));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await link.focus();assert(await link.evaluate(n=>getComputedStyle(n).outlineStyle!=='none'));
      await link.press('Escape');assert(await how.evaluate(n=>document.activeElement===n&&!n.parentElement.open));assert(await nav.isVisible());
      if(i===0&&width===390){await how.press('Enter');await page.screenshot({path:out+'/mobile-navigation-390.png',fullPage:false});await how.press('Escape');}
      await menu.press('Escape');assert(!(await nav.isVisible()));
    }else{
      const nav=root.getByRole('navigation',{name:'Homepage navigation',exact:true});
      const how=nav.locator('summary').filter({hasText:'How it works'});await how.focus();await how.press('Enter');assert(await nav.getByRole('link',{name:'How Ghana Growers works',exact:true}).isVisible());await how.press('Escape');
    }
    await root.getByRole('link',{name:'Skip to page content'}).focus();assert(await root.getByRole('link',{name:'Skip to page content'}).evaluate(n=>n.getBoundingClientRect().top>=0));
    await root.getByRole('link',{name:'Skip to page content'}).press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),i?'preview-content':'homepage-content');
    await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});
    await page.screenshot({path:out+'/'+(i?slugs[i-1]:'homepage')+'-'+width+'.png',fullPage:true});
    result.surfaces.push({route,width,height:1000,mobileMenu:width<1072,...metric,minContrast:Math.min(...contrast.map(c=>c.ratio)),linksChecked:links.length});
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+home);
  const contact=page.locator('[data-preview-footer]').getByRole('link',{name:'Contact',exact:true});await contact.click();await page.locator('[data-public-preview="contact"]').waitFor();
  await page.goBack();await page.locator('[data-amended-homepage]').waitFor();await page.goForward();await page.locator('[data-public-preview="contact"]').waitFor();
  await page.goto(base+'/dev-preview/public/not-a-page');assert.equal(await page.locator('[data-public-preview]').count(),0);
  assert.deepEqual(writes,[]);assert.deepEqual(result.errors,[]);result.checks.push('Back/forward; unknown slug rejected; no application writes; no runtime errors');
  fs.writeFileSync(out+'/p09-1a-results-'+result.mode+'.json',JSON.stringify(result,null,2));console.log('PASS P09-1A: 20 responsive surfaces, shell/navigation/keyboard/contrast/claims/links');
}
module.exports={review};
if(require.main===module)(async()=>{
 assert(new URL(base).hostname==='localhost');fs.mkdirSync(out,{recursive:true});
 const valid=token(Math.floor(Date.now()/1000)+1200);
 for(const route of routes)for(const extra of [{},{rsc:'1'},{rsc:'1','next-router-prefetch':'1'}]){
  for(const [kind,t] of [['missing',''],['invalid','invalid'],['expired',token(1)]]){
   const res=await fetch(base+route,{headers:{...extra,...(t?{cookie:cookie+'='+t}:{})}});assert.match(res.headers.get('cache-control')||'',/no-store/);assert(!/data-public-preview|data-amended-homepage|AmendedHomepage|p09-preview-farmer/.test(await res.text()),'Denied payload contains no protected page');result.checks.push(route+' '+kind+' '+(extra.rsc?'RSC':'HTML'));
  }
  const res=await fetch(base+route,{headers:{...extra,cookie:cookie+'='+valid}});assert.equal(res.status,200);assert.match(res.headers.get('cache-control')||'',/no-store/);assert.match(res.headers.get('x-robots-tag')||'',/noindex/);const body=await res.text();if(extra['next-router-prefetch'])assert.match(res.headers.get('content-type')||'',/text\/x-component/);else assert(/data-public-preview|data-amended-homepage|AmendedHomepage/.test(body),'Authorised page payload');
 }
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const ctx=await b.newContext();await ctx.addCookies([{name:cookie,value:valid,url:base,httpOnly:true,sameSite:'Lax'}]);await review(ctx,await ctx.newPage());}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
