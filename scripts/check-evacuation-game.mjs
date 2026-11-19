// Evacuation walk (safety step 1) on a laptop and a small phone, by touch: the direction pad moves Riber,
// a danger zone stops the walk without losing anything, retry returns to the start, and the three
// walks (classroom, the other classroom, outside) each arrive and save a safe route.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {evacuationCollision} from '../src/adventure/evacuation.js';
import {SCHOOL_CONFIG,SCHOOL_DRILL_CONFIG,OUTSIDE_CONFIG,SCHOOL_PATH,SCHOOL_DRILL_PATH,OUTSIDE_PATH,inspectRoute} from '../src/learning-model.js';
const WALKS=[[SCHOOL_CONFIG,SCHOOL_PATH,'schoolRoute'],[SCHOOL_DRILL_CONFIG,SCHOOL_DRILL_PATH,'schoolRoute'],[OUTSIDE_CONFIG,OUTSIDE_PATH,'outsideRoute']];
for(const [config,path]of WALKS)for(let i=1;i<path.length;i++)assert.equal(evacuationCollision(path[i-1],path[i],config),null);
assert.ok(evacuationCollision({x:650,y:100},{x:850,y:100},SCHOOL_CONFIG));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Users/yel/.local/node/lib/node_modules/playwright/index.mjs').href);
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[],out=process.env.CHECK_OUT||'.work/evacuation-game';await fs.mkdir(out,{recursive:true});
// A finished classroom chapter opens the evacuation walk.
const earned={evidence:Object.fromEntries(['window','shelf','desk','protect'].map(k=>['safety-'+k,{kind:'safety',label:k}])),protect:{under:true,head:true,leg:true,stopped:true,confirmed:true},schoolRoute:[],schoolRouteDone:false,adventure:{version:1,chapters:{0:{phase:2,tasks:{0:{done:true},1:{done:true},2:{done:true}},work:{}},1:{phase:0,tasks:{},work:{}}}}};
try{for(const [width,height]of [[1280,800],[667,375]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(`${width}: ${e.message}`));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForSelector('#settings');
 const data=()=>page.evaluate(async()=>(await import('/src/main.js')).state().drafts.safety.data);
 const speech=()=>page.locator('#speech').textContent();
 const settle=async()=>{await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(300);};
 const tool=async id=>{if(!await page.locator(`#${id}`).isVisible())await page.locator('.topbar .activity-tools>summary').tap();await page.locator(`#${id}`).tap();};
 // The 3D walk sits over the same route rules; the flat map takes taps in map coordinates.
 const flatMap=async()=>{
  if(!await page.waitForSelector('#route-view',{state:'attached',timeout:8000}).catch(()=>null))return;
  if((await page.locator('#route-view').textContent()).includes('지도로'))await tool('route-view');
  await page.locator('.evac3d').waitFor({state:'hidden'});
 };
 const walk=async(x,y,ms)=>{await page.waitForTimeout(250);const b=await page.locator('#activity canvas').first().boundingBox();await page.touchscreen.tap(b.x+(x+100)*b.width/1200,b.y+(y+80)*b.height/640);await page.waitForTimeout(ms);};
 const walkPath=async path=>{let prev=path[0];for(const p of path.slice(1)){await walk(p.x,p.y,Math.ceil(Math.hypot(p.x-prev.x,p.y-prev.y)/.17)+300);prev=p;}};
 // A solved walk moves on by itself, as it does for a learner.
 const nextPhase=async phase=>{const sel=`#activity[data-phase="${phase}"]`;if(!await page.waitForSelector(sel,{timeout:5000}).catch(()=>null)){await page.locator('#next.ready').tap();await page.waitForSelector(sel,{timeout:15000});}await settle();};
 await page.evaluate(async earned=>{const m=await import('/src/main.js'),s=m.state();s.completed=['river','volcano','rocks','city'];s.drafts.safety={step:1,passed:[0],data:earned};m.enter(4);},structuredClone(earned));await settle();
 await page.waitForSelector('#route-down');await flatMap();await page.screenshot({path:`${out}/${width}-start.png`});
 // The direction pad moves Riber: two steps down from the start reach the fallen shelf, which stops the walk.
 for(let i=0;i<3;i++){await page.locator('#route-down').tap();await page.waitForTimeout(700);}
 assert.match(await speech(),/책장이 통로를 막고 있어/,`${width}: the pad walks into the shelf and stops`);
 assert.equal(await page.locator('#next.ready').count(),0,'a stopped walk does not finish the step');
 // Retry returns to the start.
 await tool('route-reset');assert.match(await speech(),/다시 출발/);
 // A tap across a danger zone also stops at its edge.
 await flatMap();await walk(180,230,1200);
 assert.match(await speech(),/책장이 통로를 막고 있어/,`${width}: a tap through the shelf stops`);
 assert.equal(await page.locator('#next.ready').count(),0);
 await tool('route-reset');await page.screenshot({path:`${out}/${width}-blocked.png`});
 // Controls: the direction pad and the tools menu keep 48px targets inside the screen.
 const pad=await page.locator('.action-buttons button').evaluateAll(bs=>bs.map(b=>({id:b.id,r:b.getBoundingClientRect().toJSON()})));
 assert.deepEqual(pad.map(b=>b.id),['route-left','route-up','route-down','route-right']);
 for(const b of pad)assert.ok(b.r.right<=width&&b.r.bottom<=height&&b.r.width>=48&&b.r.height>=48,`${width}: ${b.id} ${JSON.stringify(b.r)}`);
 // Three walks in a row: classroom, the other classroom, outside.
 for(const [phase,[config,path,key]]of WALKS.entries()){
  if(phase)await nextPhase(phase);
  await flatMap();await walkPath(path);await page.waitForSelector('#next.ready',{timeout:20000});
  const d=await data();assert.ok(inspectRoute(d[key],config).ok,`${width}: phase ${phase} route`);if(phase)assert.equal(d[key+'Done'],true);
  await page.screenshot({path:`${out}/${width}-phase${phase}-arrival.png`});
 }
 results.push({width,height,padMoves:true,dangerStops:true,retry:true,allPhases:true,controlsFit:true});await ctx.close();
}assert.deepEqual(errors,[]);console.log('PASS evacuation walk: 1280×800 and 667×375, pad moves, danger stops, retry, three safe walks saved, 48px pad.');}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
