import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
// Kept as the existing suite entry point; comparison has been superseded by founder selection.
export async function verifyHeroShortlist(page,origin,out) {
 const route=origin+'/dev-preview/amended-homepage',evidence=[];
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});await page.goto(route);const hero=page.locator('[data-homepage-hero]');await hero.waitFor();await page.evaluate(()=>document.fonts.ready);
  const img=hero.locator('[data-hero-candidate="C1"]');await img.evaluate(n=>n.decode());
  assert.equal(await page.locator('[data-hero-comparison]').count(),0);
  assert.equal(await hero.locator('[data-device-cue]').count(),0);
  assert.equal(await hero.locator('h1').innerText(),'Find produce. Find farmers. Farm smarter.');
  assert.equal(await hero.locator('input').getAttribute('placeholder'),'Search product, name or region');
  assert((await hero.locator('span[hidden]').innerText()).includes('supplier'));
  const metrics=await hero.evaluate(el=>{
   const input=el.querySelector('input'),s=getComputedStyle(input),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=s.font;
   const available=input.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);
   const image=el.querySelector('[data-hero-image-slot]'),is=getComputedStyle(image.querySelector('img')),r=image.getBoundingClientRect();
   return {placeholderWidth:ctx.measureText(input.placeholder).width,available,canvas:getComputedStyle(el).backgroundColor,crop:[r.width,r.height],fit:is.objectFit,position:is.objectPosition,opacity:is.opacity,headline:getComputedStyle(el.querySelector('h1')).fontSize,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,ctaHeights:[...el.querySelectorAll('button')].slice(0,3).map(n=>n.getBoundingClientRect().height)};
  });
  assert(metrics.placeholderWidth<=metrics.available,'Empty input placeholder fully visible '+width);
  assert(!metrics.overflow);assert.equal(metrics.fit,'cover');assert.equal(metrics.position,'50% 50%');assert.equal(metrics.opacity,'0.88');assert(metrics.ctaHeights.every(h=>h>=44));assert.notEqual(metrics.canvas,'rgb(238, 245, 232)');
  await hero.screenshot({path:path.join(out,'hero-C1-'+width+'.png')});
  await page.locator('[data-tools-teaser]').screenshot({path:path.join(out,'transition-tools-'+width+'.png')});
  evidence.push({width,height:1000,...metrics});
 }
 for(const query of ['compare','B2','C1','C2']) {await page.goto(route+'?hero='+query);await page.locator('[data-hero-candidate="C1"]').waitFor();assert.equal(await page.locator('[data-hero-comparison]').count(),0);}
 await page.locator('[data-hero-candidate]').evaluate(n=>n.dispatchEvent(new Event('error')));await page.getByRole('img',{name:'Hero candidate unavailable; provisional landscape placeholder'}).waitFor();
 await writeFile(path.join(out,'c1-responsive-verification.json'),JSON.stringify(evidence,null,2));await page.goto(route);
}