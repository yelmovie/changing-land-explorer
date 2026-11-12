import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const ids=['river','volcano','rocks','city','safety'],base=process.env.CHECK_URL||'http://127.0.0.1:5177';
const out=process.env.CHECK_OUT||'.work/residents',key='moving-geovalley-v3';
// The current scenic map keeps a directory within reach on compact screens.
async function roster(page){
 await page.locator('#resident-directory').tap();
 if(await page.locator('[data-roster]').isVisible())await page.locator('[data-roster]').tap();
}
try{
 await fs.mkdir(out,{recursive:true});
 for(const [width,height] of [[1280,720],[768,1024],[850,420],[390,844]]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  // Behave like an existing student who earned three stage awards before residents existed.
  await p.addInitScript(({key,ids})=>{if(!sessionStorage.fixture){sessionStorage.fixture='1';localStorage.setItem(key,JSON.stringify({version:3,started:true,completed:ids.slice(0,3),records:{},drafts:{},mapNode:15,location:{type:'map'}}));}},{key,ids});
  await p.goto(base);await p.locator('#resident-directory').waitFor();
  assert.equal(await p.locator('.map-resident').count(),3);
  if(width===390){
   await p.locator('#rotation-note').waitFor({state:'visible'});
   assert.match(await p.locator('#rotation-note').textContent(),/가로로/);
   await p.setViewportSize({width:height,height:width});
   await p.locator('#rotation-note').waitFor({state:'hidden'});
  }

  const snap=()=>p.evaluate(key=>localStorage.getItem(key),key),student=await snap();
  assert.equal(await p.locator('#resident-directory').count(),1);await roster(p);
  assert.equal(await p.locator('[data-talk]').count(),3);
  await p.locator('[data-talk="rocks"]').tap();const first=await p.locator('.resident-reply').innerText();
  await p.locator('[data-ask="0"]').tap();let second=await p.locator('.resident-reply').innerText();
  await p.locator('[data-ask="1"]').tap();assert.notEqual(first,second);assert.notEqual(second,await p.locator('.resident-reply').innerText());
  const rect=await p.locator('[data-close]').boundingBox();assert.ok(rect.height>=48&&rect.y>=0&&rect.y+rect.height<=p.viewportSize().height,'CTA '+width);
  await p.screenshot({path:out+'/chat-'+width+'.png'});
  await p.locator('[data-roster]').tap();assert.equal(await p.locator(':focus').getAttribute('data-talk'),'rocks');
  await p.keyboard.press('Escape');await p.waitForSelector('dialog',{state:'detached'});
  assert.equal(await snap(),student);await p.reload();await p.locator('#resident-directory').waitFor();assert.equal(await p.locator('.map-resident').count(),3);
  await p.locator('#settings').click();await p.locator('#admin-setting').click();await p.waitForSelector('#preview-nav');
  assert.equal(await p.locator('.map-resident').count(),5);
  await roster(p);await p.waitForFunction(()=>[...document.querySelectorAll('.resident-entry img')].every(im=>im.complete&&im.naturalWidth>0));
  if(width===1280)await p.screenshot({path:out+'/roster.png'});
  for(const id of ids){await p.locator('[data-talk="'+id+'"]').tap();await p.locator('[data-ask="1"]').tap();await p.locator('[data-stamp]').tap();assert.ok(await p.locator('[data-stamp]').isDisabled());await p.locator('[data-roster]').tap();}
  assert.equal(await p.locator('.stamp-slot.inked').count(),5);
  assert.equal(await p.locator('.plaza-festival.celebrating').count(),1);
  await p.locator('[data-plaza]').tap();await p.locator('#atlas-core').tap();await p.waitForSelector('#app.final');
  await p.locator('#exit-preview').click();await p.locator('#resident-directory').waitFor();
  assert.equal(await p.locator('.workplace.awake').count(),3);assert.equal(await p.locator('.plaza-festival.celebrating').count(),0);
  assert.equal(await p.locator('.map-resident').count(),3);assert.equal(await snap(),student);
  console.log('PASS',width,height,'legacy, 5 teacher NPCs, replies, focus, save');
  await c.close();
 }
 const browserCtx=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});const p=await browserCtx.newPage();
 await p.route('**/assets/vendor/*phaser*.js',route=>route.abort());await p.goto(base);await p.locator('#start').click();await p.locator('#story-skip').click();await p.waitForSelector('.map-fallback');
 assert.equal(await p.locator('.map-resident').count(),0);assert.equal(await p.locator('.workplace.asleep').count(),5);await p.locator('#settings').click();await p.locator('#admin-setting').click();await p.waitForSelector('.map-fallback');
 await roster(p);await p.locator('[data-talk="volcano"]').click();
 await p.locator('[data-continue]').click();await p.locator('[data-continue]').click();
 await p.locator('[data-ask="0"]').click();console.log('PASS fresh, fallback');
 assert.deepEqual(errors,[]);await browserCtx.close();
}finally{await browser.close();}
