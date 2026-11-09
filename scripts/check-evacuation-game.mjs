import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {evacuationCollision} from '../src/adventure/evacuation.js';
import {SCHOOL_CONFIG,OUTSIDE_CONFIG,SCHOOL_PATH,OUTSIDE_PATH,inspectRoute} from '../src/learning-model.js';
for(const [config,path]of [[SCHOOL_CONFIG,SCHOOL_PATH],[OUTSIDE_CONFIG,OUTSIDE_PATH]])for(let i=1;i<path.length;i++)assert.equal(evacuationCollision(path[i-1],path[i],config),null);
assert.ok(evacuationCollision({x:650,y:100},{x:850,y:100},SCHOOL_CONFIG));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Users/yel/.local/node/lib/node_modules/playwright/index.mjs').href);
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[],out='.work/evacuation-game';await fs.mkdir(out,{recursive:true});
try{for(const [width,height]of [[1280,800],[667,375]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5177');await page.waitForFunction(()=>window.Phaser?.Game);
 await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(t,a){const g=Reflect.construct(t,a);window.__qaGame=g;return g;}});});
 await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
 const enter=async phase=>{await page.evaluate(async phase=>{const m=await import('/src/main.js');m.state().drafts.safety={step:1,passed:[],data:{adventure:{version:1,chapters:{1:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};await m.enter(4,1);},phase);await page.waitForSelector('#route-right');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));};
 const texts=()=>page.evaluate(()=>window.__qaGame.scene.getScene('Activity').children.list.filter(o=>o.type==='Text').map(o=>o.text));
 const walk=async(x,y,ms=1500)=>{await page.waitForTimeout(250);const b=await page.locator('#activity canvas').boundingBox();await page.touchscreen.tap(b.x+(x+100)*b.width/1200,b.y+(y+80)*b.height/640);await page.waitForTimeout(ms);};
 await enter(0);await page.locator('#route-right').tap();await page.waitForTimeout(450);await page.screenshot({path:`${out}/${width}-walking.png`});
 await page.locator('#route-reset').tap();await walk(180,230,1000);assert.ok((await texts()).some(t=>t.includes('♥♥♡')));await page.waitForTimeout(1000);await walk(180,230,200);await page.waitForTimeout(1000);await walk(180,230,200);assert.ok((await texts()).some(t=>t.includes('♡♡♡')));assert.equal(await page.locator('#next').isDisabled(),true);
 await page.locator('#route-reset').tap();assert.ok((await texts()).some(t=>t.includes('♥♥♥')));
 for(const phase of [0,1,2]){if(phase)await enter(phase);const path=phase===2?OUTSIDE_PATH:SCHOOL_PATH;let prev=path[0];for(const p of path.slice(1)){await walk(p.x,p.y,Math.ceil(Math.hypot(p.x-prev.x,p.y-prev.y)/.17)+250);prev=p;}await page.waitForSelector('#next.ready');const d=await page.evaluate(async()=>(await import('/src/main.js')).state().drafts.safety.data);const key=phase===2?'outsideRoute':'schoolRoute';assert.ok(inspectRoute(d[key],phase===2?OUTSIDE_CONFIG:SCHOOL_CONFIG).ok);if(phase)assert.equal(d[key+'Done'],true);await page.screenshot({path:`${out}/${width}-phase${phase}-arrival.png`});}
 const fit=await page.locator('.action-buttons').evaluate(e=>[...e.querySelectorAll('button')].map(b=>({id:b.id,r:b.getBoundingClientRect().toJSON()})));assert.ok(fit.every(b=>b.r.right<=width&&b.r.bottom<=height));results.push({width,height,collision:true,threeHearts:true,retry:true,allPhases:true,controlsFit:true});await ctx.close();
}assert.deepEqual(errors,[]);console.log(JSON.stringify(results));}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
