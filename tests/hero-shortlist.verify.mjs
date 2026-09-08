import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
export async function verifyHeroShortlist(page,origin,out) {
 const route=origin+'/dev-preview/amended-homepage';const evidence=[];
 const geometry=()=>page.locator('[data-homepage-hero]').evaluate(el=>{
  const b=el.getBoundingClientRect();const selectors=['h1','form','[aria-label="Popular searches"]','[data-hero-image-slot]'];
  const rect=n=>{const r=n.getBoundingClientRect();return [r.x-b.x,r.y-b.y,r.width,r.height].map(v=>Math.round(v*100)/100)};
  const h=getComputedStyle(el.querySelector('h1'));
  return {size:[b.width,b.height],rects:selectors.map(s=>rect(el.querySelector(s))),text:el.innerText,font:[h.fontFamily,h.fontSize,h.fontWeight,h.letterSpacing,h.lineHeight]};
 });
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(route);await page.locator('[data-homepage-hero]').waitFor();await page.evaluate(()=>document.fonts.ready);const baseline=await geometry();
  await page.goto(route+'?hero=compare');const controls=page.locator('[data-hero-comparison]');await controls.waitFor();assert.equal(await controls.getByRole('button').count(),3);
  for(const label of ['B2','C1','C2']){
   const button=controls.getByRole('button',{name:label,exact:true});await button.focus();await button.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),'true');
   const hero=page.locator('[data-homepage-hero]'),img=hero.locator('[data-hero-candidate="'+label+'"]');await img.waitFor();await img.evaluate(n=>n.decode());await page.evaluate(()=>document.fonts.ready);
   assert.deepEqual(await geometry(),baseline,'Equivalent approved geometry: '+label+' '+width);
   assert.equal(await hero.locator('[data-device-cue]').count(),0);
   assert(await img.evaluate(n=>{const s=getComputedStyle(n);return n.naturalWidth>0&&s.objectFit==='cover'&&s.objectPosition==='50% 50%'&&s.opacity==='0.88'}));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
   await hero.screenshot({path:path.join(out,'hero-'+label+'-'+width+'.png')});
   await hero.locator('[data-hero-image-slot]').screenshot({path:path.join(out,'crop-'+label+'-'+width+'.png')});
   evidence.push({label,width,height:1000,geometryUnchanged:true,crop:'centre cover',opacity:.88});
  }
 }
 for(const label of ['B2','C1','C2']){await page.goto(route+'?hero='+label);await page.locator('[data-hero-candidate="'+label+'"]').waitFor();}
 await page.locator('[data-hero-candidate]').evaluate(n=>n.dispatchEvent(new Event('error')));await page.locator('[data-homepage-hero]').getByRole('img',{name:'Hero candidate unavailable; provisional landscape placeholder'}).waitFor();
 await page.goto(route+'?hero=compare');for(const zoom of [2,4]){await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);assert(await page.locator('[data-amended-homepage]').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}await page.evaluate(()=>document.documentElement.style.zoom='');
 await writeFile(path.join(out,'hero-shortlist-verification.json'),JSON.stringify(evidence,null,2));await page.goto(route);
}
