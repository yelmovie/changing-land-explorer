import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const out=process.env.CHECK_OUT||'.work/city-redesign';await fs.mkdir(out,{recursive:true});
const results=[],errors=[];
try{
 for(const [width,height]of [[667,375],[915,412],[1024,768],[1280,800]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block',hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForFunction(()=>window.Phaser?.Game);
  await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(target,args){const game=Reflect.construct(target,args);window.__qaGame=game;return game;}});});
  await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
  for(let phase=0;phase<3;phase++){
   await page.evaluate(async phase=>{
    const m=await import('/src/main.js');m.state().drafts.city={step:0,passed:[],data:{adventure:{version:1,chapters:{0:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};await m.enter(3,0);
   },phase);
   await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
   const inspection=await page.evaluate(()=>{
    const scene=window.__qaGame.scene.getScene('Activity'),cards=scene.children.list.filter(o=>o.getData?.('learningCard'));
    return {cardBounds:cards.map(o=>{const b=o.getBounds();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}}),views:scene.children.list.filter(o=>o.type==='Container'&&o.mask).length,scroll:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1};
   });
   assert.equal(inspection.views,2,'the same site has two permanently visible scene views');
   assert.equal(inspection.scroll,false,'no page overflow');
   assert.ok(inspection.cardBounds.every(b=>b.left>=0&&b.right<=1200&&b.top>=0&&b.bottom<=640),'all record cards fit inside the canvas');
   assert.equal(await page.locator('#city-choose-record').isDisabled(),true);
   // A panel itself is tappable, not merely decorated to look like a button.
   const canvas=await page.locator('#activity canvas').boundingBox();
   await page.touchscreen.tap(canvas.x+canvas.width*.25,canvas.y+canvas.height*.4);
   await page.getByRole('button',{name:'이후 모습',exact:true}).tap();
   const work=()=>page.evaluate(async()=>{const d=(await import('/src/main.js')).state().drafts.city.data;return structuredClone(d.adventure.chapters[0].work[d.adventure.chapters[0].phase]);});
   assert.deepEqual((await work()).seen,{before:true,after:true});assert.deepEqual((await work()).pairs,[]);
   await page.screenshot({path:out+'/'+width+'-city-'+phase+'.png',animations:'disabled'});
   await page.locator('#city-choose-record').tap();await page.locator('[data-city-card="2"]').tap();await page.locator('[data-city-period="1"]').tap();
   assert.deepEqual((await work()).pairs,[],'incorrect record never awards progress');
   for(let j=0;j<2;j++){await page.locator('[data-city-card="'+j+'"]').tap();await page.locator('[data-city-period="'+j+'"]').tap();}
   assert.deepEqual((await work()).pairs,[0,1]);await page.waitForSelector('#next.ready');
   results.push({width,height,phase,...inspection,manualObservation:true,wrongRejected:true,completed:true});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 12 city observation flows, two visible site views, card bounds, tap controls and wrong-answer rejection.');
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));await browser.close();}
