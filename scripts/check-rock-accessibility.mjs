import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';
import {fresh,SAVE_KEY} from '../src/model.js';
import {ROCKS,FEATURES} from '../src/learning-model.js';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href),browser=await chromium.launch({channel:'chrome',headless:true});
const out=process.env.CHECK_OUT||'.work/phone-accessibility';await fs.mkdir(out,{recursive:true});const results=[];
try{for(const [width,height]of [[915,412],[667,375],[1024,768]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5277');await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
 for(const [step,phase,correct]of [[0,1,['dark','fine']],[0,2,['light','coarse']]]){
 await page.evaluate(async({step,phase})=>{const m=await import('/src/main.js');m.state().drafts.rocks={step,passed:[],data:{adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};m.enter(2,step);},{step,phase});await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));
 const canvas=page.locator('#activity canvas');
 const work=()=>page.evaluate(async phase=>(await import('/src/main.js')).state().drafts.rocks.data.adventure.chapters[0].work[phase],phase);
 const card={dark:210,light:465,fine:730,coarse:1000};
 const tap=async(x,y)=>{const b=await canvas.boundingBox();await page.touchscreen.tap(b.x+x*b.width/1200,b.y+y*b.height/640);};
 assert.equal(await page.locator('#rock-observe-tools').count(),0);
 await tap(card[correct[0]],570);assert.deepEqual((await work()).proofs,[]);
 if(width===1024&&phase===2)for(const key of ['1','2','3'])await canvas.press(key);
 else for(const [x,y] of [[248,220],[350,285],[450,330]])await tap(x,y);
 assert.equal((await work()).scanned.length,3);
 const wrong=correct[0]==='dark'?'light':'dark';await tap(card[wrong],570);
 assert.deepEqual((await work()).proofs,[]);
 if(width===1024&&phase===2)for(const claim of correct)await canvas.press(String(Object.keys(FEATURES).indexOf(claim)+4));
 else for(const claim of correct)await tap(card[claim],570);
 await page.waitForSelector('#next.ready');assert.equal(await page.locator('dialog[open]').count(),0);
 results.push({width,height,step,phase,preObservationBlocked:true,wrongRejected:true,correctComplete:true,withoutDialog:true});

 }
 await page.evaluate(async()=>{
  const m=await import('/src/main.js'),{ROCKS}=await import('/src/learning-model.js');
  const evidence=Object.fromEntries(ROCKS.slice(0,2).flatMap(r=>[r.color,r.grain].map(claim=>['rock-'+r.id+'-'+claim,{claim}])));
  m.state().drafts.rocks={step:1,passed:[0],data:{evidence,adventure:{version:1,chapters:{1:{phase:1,tasks:{0:{done:true}},work:{}}}}}};
  m.enter(2,1);
 });
 await page.locator('#activity canvas').waitFor();await page.waitForFunction(()=>!document.querySelector('.stage-loader'));
 assert.equal(await page.locator('#rock-observe-tools,#observation-auto:not([hidden])').count(),0);
 const drag=async x=>{const b=await page.locator('#activity canvas').boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+316/640*b.height);await page.mouse.down();await page.mouse.move(b.x+x/1200*b.width,b.y+459/640*b.height,{steps:12});await page.mouse.up();
 };
 await drag(955);assert.equal(await page.locator('#next').isDisabled(),true);await page.waitForTimeout(150);
 await drag(245);await page.locator('#next.ready').waitFor();results.push({width,height,step:1,phase:1,referenceDrag:true,wrongRejected:true});
 assert.deepEqual(errors,[]);await page.screenshot({path:`${out}/rocks-${width}.png`});await context.close();
}
const legacy=fresh(),data={evidence:{},rockNames:{},rockProofs:{}};
legacy.started=true;legacy.completed=['river','volcano'];legacy.location={type:'operation',arg:{index:2}};
for(const r of ROCKS){
 data.rockNames[r.id]=r.type;data.rockProofs[r.id]=[r.color,r.grain];
 for(const claim of data.rockProofs[r.id]){
  const id=`rock-${r.id}-${claim}`;
  data.evidence[id]={id,kind:'rock',claim,point:{x:.5,y:.5}};
 }
}
legacy.drafts.rocks={step:1,passed:[0,1],data};
const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'}),page=await context.newPage();
await page.addInitScript(({state,key})=>localStorage.setItem(key,JSON.stringify(state)),{state:legacy,key:SAVE_KEY});
await page.goto(process.env.CHECK_URL||'http://localhost:5277');
await page.locator('.village-reward-dialog').waitFor();
assert.match(await page.locator('.village-reward-dialog h2').textContent(),/탐구 완료/);
assert.equal(await page.locator('.speaker-tag').textContent(),'지오');
assert.equal(await page.locator('#operation-board').count(),0);
await page.locator('#return-map').click();await page.locator('#settings').click();await page.locator('#operations-open').click();
assert.equal(await page.locator('[data-operation-index="2"]').count(),0);
await context.close();results.push({legacyOperationSkipped:true,fieldReplayRemoved:true});
await fs.writeFile(`${out}/rocks.json`,JSON.stringify(results,null,2));console.log('PASS',results.length,'rock touch scenarios');}finally{await browser.close();}
