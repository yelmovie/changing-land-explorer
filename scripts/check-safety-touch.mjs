import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Volumes/T7 Shield/iscreammedia_sc34/8 creatures/node_modules/playwright/index.mjs').href);
const browser=await chromium.launch({channel:'chrome',headless:true});
const out='.work/safety-touch';await fs.mkdir(out,{recursive:true});const results=[];
try{for(const [width,height]of [[915,412],[1024,768]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5377');await page.waitForSelector('#settings');
 await page.evaluate(async()=>{const m=await import('/src/main.js');m.state().completed=['river','volcano','rocks','city'];m.enter(4,0);});
 const data=()=>page.evaluate(async()=>((await import('/src/main.js')).state().drafts.safety.data));
 const ready=async()=>{await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));};await ready();
 const choose=async(id,target)=>{await page.locator('#'+id).tap();const b=page.locator(`[data-safety-target="${target}"]`);const r=await b.boundingBox();assert.ok(r.width>=48&&r.height>=48);assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height);assert.ok(await b.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=20));await b.tap();};
 await choose('safety-mark-window','desk');assert.equal((await data()).evidence['safety-window'],undefined);await page.locator('[data-safety-target="window"]').tap();
 await choose('safety-mark-shelf','shelf');assert.ok((await data()).evidence['safety-window']);assert.ok((await data()).evidence['safety-shelf']);await page.locator('#next.ready').tap();await ready();
 await choose('protect-body','window');assert.equal((await data()).protect.under,false);await page.locator('[data-safety-target="desk"]').tap();await page.locator('#protect-head').tap();assert.equal((await data()).protect.head,true);await page.locator('#next.ready').tap();await ready();
 await page.locator('#confirm-stop').tap();assert.equal((await data()).protect.confirmed,false);
 await choose('protect-hold','shelf');assert.equal((await data()).protect.leg,false);await page.locator('[data-safety-target="leg"]').tap();assert.equal((await data()).protect.leg,true);
 await page.waitForTimeout(2900);assert.equal((await data()).protect.stopped,true);await page.locator('#confirm-stop').tap();assert.equal((await data()).protect.confirmed,true);
 await page.screenshot({path:`${out}/${width}-protect.png`});
 await page.evaluate(async()=>{const m=await import('/src/main.js');m.state().drafts.safety.step=1;m.enter(4,1);});await ready();await page.locator('#route-right').tap();await page.waitForTimeout(450);await page.locator('#route-stop').tap();assert.equal(await page.locator('#next').isDisabled(),true);await page.locator('#route-reset').tap();assert.equal((await data()).schoolRoute.length,0);assert.deepEqual(errors,[]);results.push({width,height,touch:true,wrongChoicesRejected:true,protectionSequence:true,waitBeforeConfirm:true,directMovementRequiresArrival:true,errors});await ctx.close();
}await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS safety DOM placement: both viewports, wrong choices, protection sequence, waiting condition.');}finally{await browser.close();}
