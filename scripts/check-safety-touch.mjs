// Safety classroom (step 0) by touch only, on a phone and a tablet: tap-to-pick hazard markers, the
// shelter and head zones, the desk leg and the stop banner. Wrong order and early confirmation are rejected.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {CLASSROOM_HAZARDS} from '../src/adventure/safety.js';
import {SHELTER,shelterPoint} from '../src/adventure/shelter.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const out=process.env.CHECK_OUT||'.work/safety-touch';await fs.mkdir(out,{recursive:true});const results=[];
// Scene-space touch targets (1200 × 640), as built in src/adventure/safety.js.
const under=shelterPoint(SHELTER.under),head=shelterPoint(SHELTER.head),leg=shelterPoint(SHELTER.leg);
const TARGETS={marker:[130,128],under:[250,145],head:[140,111],leg:[94,155],stop:[485,96]};
try{for(const [width,height]of [[915,412],[1024,768]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForSelector('#settings');
 const data=()=>page.evaluate(async()=>((await import('/src/main.js')).state().drafts.safety.data));
 const enter=async phase=>{
  await page.evaluate(async phase=>{const m=await import('/src/main.js'),s=m.state();s.completed=['river','volcano','rocks','city'];
   s.drafts.safety={step:0,passed:[],data:{evidence:{},protect:{under:phase>1,head:phase>1,leg:false,stopped:false,confirmed:false},adventure:{version:1,chapters:{0:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};m.enter(4,0);},phase);
  await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(300);
 };
 const nextPhase=async phase=>{const sel=`#activity[data-phase="${phase}"]`;if(!await page.waitForSelector(sel,{timeout:5000}).catch(()=>null)){await page.locator('#next.ready').tap();await page.waitForSelector(sel,{timeout:15000});}await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(500);};
 const box=()=>page.locator('#activity canvas').first().boundingBox();
 const tapScene=async(x,y)=>{const b=await box();await page.touchscreen.tap(b.x+x*b.width/1200,b.y+y*b.height/640);await page.waitForTimeout(150);};
 // Touch targets in screen pixels at this viewport.
 const b=await (async()=>{await enter(0);return box();})(),scale=Math.min(b.width/1200,b.height/640);
 const sizes=Object.fromEntries(Object.entries(TARGETS).map(([k,[w,h]])=>[k,{w:Math.round(w*scale),h:Math.round(h*scale)}]));
 // Phase 0: pick a marker by tapping, then tap where it goes. Empty floor and an already marked hazard are rejected.
 const hazardPoints=await page.locator('.safety-classroom').evaluate((el,hazards)=>{
  const view=el.getBoundingClientRect(),style=getComputedStyle(el,'::before');
  const [w,h]=style.backgroundSize.split(' ').map(parseFloat),[x,y]=style.backgroundPosition.split(' ').map(parseFloat);
  return hazards.map(p=>({x:view.x+x+p.x*w/1200,y:view.y+y+(p.y+17.5)*h/675}));
 },CLASSROOM_HAZARDS);
 const tapScreen=async p=>{await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(150);};
 for(const p of hazardPoints)assert.ok(p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height,`${width}×${height}: hazard inside the canvas`);
 await tapScene(400,565);await tapScene(1000,150);assert.deepEqual(Object.keys((await data()).evidence),[],'empty floor is not a hazard');
 await tapScene(400,565);await tapScreen(hazardPoints[0]);assert.ok((await data()).evidence['safety-window'],'window marked by tap');
 await tapScene(760,565);await tapScreen(hazardPoints[0]);assert.equal((await data()).evidence['safety-shelf'],undefined,'the same hazard cannot be marked twice');
 await tapScene(760,565);await tapScreen(hazardPoints[1]);assert.ok((await data()).evidence['safety-shelf'],'shelf marked by tap');
 await page.locator('#next.ready').waitFor({timeout:10000});await page.screenshot({path:`${out}/${width}-hazards.png`});
 // A solved phase moves on by itself, as it does for a learner.
 await nextPhase(1);
 // Phase 1: the head cannot be protected before getting under the desk.
 await tapScene(head.x,head.y);assert.notEqual((await data()).protect.head,true,'head first is rejected');
 await tapScene(under.x,under.y+10);assert.equal((await data()).protect.under,true,'tap under the desk');
 await tapScene(head.x,head.y);const p1=(await data()).protect;assert.equal(p1.head,true);assert.equal(p1.headMethod,'arms');
 await page.locator('#next.ready').waitFor({timeout:10000});await page.screenshot({path:`${out}/${width}-shelter.png`});
 // A solved phase moves on by itself, as it does for a learner.
 await nextPhase(2);
 // Phase 2: confirming before the shaking stops is rejected; hold the leg, wait, then confirm.
 await tapScene(320,80);assert.notEqual((await data()).protect.confirmed,true,'cannot confirm while shaking');
 await tapScene(leg.x,leg.y);assert.equal((await data()).protect.leg,true,'tap the desk leg');
 await tapScene(320,80);assert.notEqual((await data()).protect.confirmed,true,'cannot confirm before the shaking stops');
 // The shaking lasts 2.4 s after the hold; wait on the saved state itself.
 for(let t=0;t<40&&!(await data()).protect.stopped;t++)await page.waitForTimeout(200);assert.equal((await data()).protect.stopped,true,'the shaking stops');
 await tapScene(320,80);{const d=await data();assert.equal(d.protect.confirmed,true,`${width}×${height}: confirm after the shaking stops `+JSON.stringify({protect:d.protect,phase:await page.locator('#activity').getAttribute('data-phase'),speech:await page.locator('#speech').textContent()}));}
 await page.screenshot({path:`${out}/${width}-protect.png`});
 for(const [k,s]of Object.entries(sizes))assert.ok(s.w>=48&&s.h>=48,`${width}×${height}: ${k} touch target ${s.w}×${s.h} is under 48px`);
 assert.deepEqual(errors,[]);results.push({width,height,touch:true,targets:sizes,wrongChoicesRejected:true,protectionSequence:true,waitBeforeConfirm:true,errors});await ctx.close();
}await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS safety classroom by touch: 915×412 and 1024×768, targets ≥48px, wrong taps rejected, protect sequence, wait before confirm.');}finally{await browser.close();}
