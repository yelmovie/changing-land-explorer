import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href),browser=await chromium.launch({channel:'chrome',headless:true});
const out=process.env.CHECK_OUT||'.work/phone-accessibility';await fs.mkdir(out,{recursive:true});const results=[];
try{for(const [width,height]of [[915,412],[667,375],[1024,768]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5277');await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
 for(const [step,phase,correct]of [[0,1,['dark','fine']],[0,2,['light','coarse']],[1,1,['dark','fine']],[1,2,['light','coarse']]]){
 await page.evaluate(async({step,phase})=>{const m=await import('/src/main.js');m.state().drafts.rocks={step,passed:[],data:{adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};m.enter(2,step);},{step,phase});await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));
 const open=()=>page.locator('#rock-observe-tools').tap();await open();assert.equal(await page.locator('[data-rock-proof]:disabled').count(),4);await page.locator('.dialog-close').tap();
 for(let i=0;i<3;i++){await open();await page.locator(`[data-rock-scan="${i}"]`).tap();}
 await open();const dims=await page.locator('[data-rock-proof]').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)})));assert.ok(dims.every(r=>r.w>=48&&r.h>=48&&r.font>=20));
 const wrong=correct[0]==='dark'?'light':'dark';await page.locator(`[data-rock-proof="${wrong}"]`).tap();assert.match(await page.locator('#rock-choice-status').textContent(),/아직 기록하지/);
 for(const c of correct)await page.locator(`[data-rock-proof="${c}"]`).tap();
 if(step===1)await page.locator('#rock-name-'+(correct[0]==='dark'?'basalt':'granite')).tap();
 await page.waitForSelector('#next.ready');results.push({width,height,step,phase,preObservationBlocked:true,wrongRejected:true,correctComplete:true,minTarget:Math.min(...dims.map(x=>x.h))});
 }
 assert.deepEqual(errors,[]);await page.screenshot({path:`${out}/rocks-${width}.png`});await context.close();
}await fs.writeFile(`${out}/rocks.json`,JSON.stringify(results,null,2));console.log('PASS',results.length,'rock touch scenarios');}finally{await browser.close();}
