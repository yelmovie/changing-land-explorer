import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fresh} from '../src/model.js';
const fixture=fresh();fixture.completed=['river'];fixture.residentStamps=['river'];fixture.sound=false;
fixture.drafts={volcano:{step:0,passed:[],data:{}}};
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const base=process.env.CHECK_BASE||'http://localhost:5189';
const out=process.env.CHECK_OUT||'.work/video-design-20261109';
const sizes=(process.env.CHECK_SIZES||'1024x768,1280x800,873x580,850x420,768x1024,390x844,320x740,1920x1080').split(',').map(s=>s.split('x').map(Number));
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[];
async function open(page,id,step,replay=false){
 await page.evaluate(async({id,step,replay})=>{const {showConcept}=await import('/src/concepts.js');const {modal}=await import('/src/main.js');window.conceptContinues=0;showConcept({s:{id},step,modal},()=>window.conceptContinues++,{replay});},{id,step,replay});
 await page.waitForSelector('dialog.science-focus-player');
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
}
try{
 for(const [width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(value=>localStorage.setItem('moving-geovalley-v3',value),JSON.stringify(fixture));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#settings');
  const saved=await page.evaluate(()=>localStorage.getItem('moving-geovalley-v3'));
  for(const id of ['river','volcano','rocks','city','safety'])for(const step of [0,1]){
   await open(page,id,step,true);
   assert.ok(await page.locator('video').evaluate(v=>v.paused),'reduced motion does not autoplay');
   for(const cue of [0,1,2]){
    await page.locator(`[data-science-step="${cue}"]`).click();
    await page.waitForFunction(cue=>Math.abs(document.querySelector('video').currentTime-cue*8/3)<.02,cue);
    assert.equal(await page.locator('[aria-current="step"]').getAttribute('data-science-step'),String(cue));
    assert.equal(await page.locator('.concept-caption').textContent(),await page.evaluate(async({id,step,cue})=>(await import('/src/concepts.js')).CONCEPTS[id][step].cues[cue],{id,step,cue}));
    const issues=await page.locator('dialog').evaluate(d=>{
     const found=[],r=d.getBoundingClientRect(),body=d.querySelector('.dialog-body');
     if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)found.push('dialog outside viewport');
     if(body.scrollWidth>body.clientWidth+1)found.push('horizontal scroll');
     for(const el of d.querySelectorAll('button:not([hidden])')){
      const b=el.getBoundingClientRect();if(!el.checkVisibility())continue;
      if(b.height<47.5||b.width<47.5)found.push('small touch target '+el.textContent);
      if(el.scrollWidth>el.clientWidth+1)found.push('overflowing button '+el.textContent);
     }
     const v=d.querySelector('.concept-visual').getBoundingClientRect(),reading=d.querySelector('.concept-reading').getBoundingClientRect();
     if(v.left<reading.right-1&&v.right>reading.left+1&&v.top<reading.bottom-1&&v.bottom>reading.top+1)found.push('video overlaps text');
     return found;
    });
    results.push({width,height,id,step,cue,issues});
    if(issues.length)await page.screenshot({path:`${out}/fail-${width}-${id}-${step}-${cue}.png`});
   }
   if((id==='river'&&step===0)||(id==='volcano'&&step===1)||(id==='safety'&&step===1)){
    await page.locator('[data-science-step="0"]').click();
    await page.locator('.dialog-body').evaluate(e=>e.scrollTop=0);
    await page.screenshot({path:`${out}/screen-${width}-${height}-${id}-${step}.png`});
   }
   await page.locator('#concept-continue').click();await page.waitForSelector('dialog',{state:'detached'});
   assert.equal(await page.evaluate(()=>window.conceptContinues),0,'replay does not advance');
   assert.equal(await page.evaluate(()=>localStorage.getItem('moving-geovalley-v3')),saved,'review preserves student storage');
  }
  await context.close();
 }
 // Actual playback, pause/resume, replay, natural end, keyboard, dismissal and error recovery.
 const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForSelector('#settings');
 await open(page,'river',0);await page.waitForFunction(()=>document.querySelector('video').currentTime>.1);
 await page.locator('.science-focus-toggle').click();const paused=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(300);assert.equal(await page.locator('video').evaluate(v=>v.currentTime),paused);
 await page.locator('[data-science-step="1"]').click();await page.locator('video').click();await page.waitForFunction(()=>document.querySelector('video').currentTime>3);assert.ok(await page.locator('video').evaluate(v=>v.currentTime>8/3),'video tap resumes rather than restarts');
 await page.locator('#concept-replay').click();assert.ok(await page.locator('video').evaluate(v=>v.currentTime<1));
 await page.waitForFunction(()=>document.querySelector('video').ended,{},{timeout:12000});assert.equal(await page.locator('.concept-scene-count').textContent(),'3 / 3');
 await page.locator('[data-science-step="0"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
 assert.equal(await page.locator('[data-science-step="0"]').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
 await page.keyboard.press('Escape');await page.waitForSelector('dialog',{state:'detached'});assert.equal(await page.evaluate(()=>window.conceptContinues),0);
 await open(page,'safety',1);await page.locator('#concept-continue').evaluate(b=>{b.click();b.click();});assert.equal(await page.evaluate(()=>window.conceptContinues),1,'repeat continue advances once');
 await context.close();
 const failedContext=await browser.newContext({viewport:{width:873,height:580},reducedMotion:'reduce',serviceWorkers:'block'});
 const failedPage=await failedContext.newPage();await failedPage.route(/\/assets\/concepts\/.*\.(mp4|webm)$/,r=>r.abort());await failedPage.goto(base);await failedPage.waitForSelector('#settings');
 await failedPage.evaluate(async()=>{const {showConcept}=await import('/src/concepts.js'),{modal}=await import('/src/main.js');showConcept({s:{id:'volcano'},step:1,modal},()=>{});});
 await failedPage.locator('.concept-error').waitFor({state:'visible'});await failedPage.waitForTimeout(300);
 assert.equal(await failedPage.locator('.concept-fallback-cues > span').count(),3);assert.equal(await failedPage.locator('.concept-current-term').textContent(),'핵심 내용');assert.ok(await failedPage.locator('.science-focus-toggle').isDisabled());
 await failedPage.locator('video').evaluate(v=>v.dispatchEvent(new Event('timeupdate')));assert.equal(await failedPage.locator('.concept-fallback-cues > span').count(),3,'late events preserve all fallback cues');
 await failedPage.screenshot({path:`out/error.png`.replace('out/',out+'/')});await failedPage.locator('#concept-continue').click();await failedPage.waitForSelector('dialog',{state:'detached'});await failedContext.close();
 // Regression: static CDN ignores Range and exposes seekable=[0,0].
 const noRangeContext=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce',serviceWorkers:'block'});
 const noRange=await noRangeContext.newPage();
 await noRange.route(/\/assets\/concepts\/.*\.(mp4|webm)$/,async route=>{
  const pathname=new URL(route.request().url()).pathname;
  const body=await fs.readFile(new URL('../public'+pathname,import.meta.url));
  await route.fulfill({status:200,body,contentType:pathname.endsWith('.webm')?'video/webm':'video/mp4'});
 });
 await noRange.goto(base);await noRange.waitForSelector('#settings');await open(noRange,'river',0,true);
 await noRange.locator('[data-science-step="1"]').click();
 await noRange.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-8/3)<.02);
 assert.equal(await noRange.locator('.concept-current-term').textContent(),'운반');
 await noRange.locator('[data-science-step="2"]').click();
 await noRange.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-16/3)<.02);
 assert.equal(await noRange.locator('.concept-current-term').textContent(),'퇴적');
 await noRange.locator('.dialog-close').click();await noRangeContext.close();
 await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));
 assert.equal(results.filter(r=>r.issues.length).length,0);assert.deepEqual(errors,[]);
 console.log(`PASS: ${results.length} concept/scene/viewport cases, playback, resume, replay, keyboard, repeated continue, close, failed-media fallback, and storage preservation.`);
}finally{await browser.close();}
