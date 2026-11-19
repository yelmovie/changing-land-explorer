import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {SCHOOL_PATH} from '../src/learning-model.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/request-fixes-20261025/targeted';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[];
let page,context,touchInput=false;
async function fresh(width=1280,height=800,touch=false){
 await context?.close();touchInput=touch;context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce',serviceWorkers:'block'});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForSelector('#start');await page.locator('#start').click();await page.locator('#story-skip').click();
}
async function ready(){await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(200);}
async function click(x,y){const b=await page.locator('#activity canvas').first().boundingBox();const p={x:b.x+x*b.width/1200,y:b.y+y*b.height/640};if(touchInput)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
async function drag(from,to){const b=await page.locator('#activity canvas').first().boundingBox();const p=v=>({x:b.x+v.x*b.width/1200,y:b.y+v.y*b.height/640});const a=p(from),z=p(to);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(z.x,z.y,{steps:15});await page.mouse.up();await page.waitForTimeout(220);}
// Number keys on the focused scene are the keyboard path for the classroom (1/2 in each phase).
async function key(k){await page.locator('#activity canvas').focus();await page.keyboard.press(k);await page.waitForTimeout(120);}
// The 3D walk sits over the same route rules; the flat map (tools menu) takes taps in map coordinates.
async function flatMap(){
 if(!await page.waitForSelector('#route-view',{state:'attached',timeout:8000}).catch(()=>null))return;
 if((await page.locator('#route-view').textContent()).includes('지도로')){await page.locator('.topbar .activity-tools>summary').click();await page.locator('#route-view').click();}
 await page.locator('.evac3d').waitFor({state:'hidden'});
}
async function data(stage){return page.evaluate(async stage=>(await import('/src/main.js')).state().drafts[stage].data,stage);}
async function beginPour(mode){
 if(mode==='keyboard'){await page.locator('#activity canvas').press('Space');}
 else if(mode==='tap'){await click(140,515);}
 else {const b=await page.locator('#activity canvas').first().boundingBox();await page.mouse.move(b.x+140*b.width/1200,b.y+515*b.height/640);await page.mouse.down();await page.mouse.move(b.x+400*b.width/1200,b.y+253*b.height/640,{steps:15});}
}
async function layout(label){
 const metrics=await page.evaluate(()=>{const c=document.querySelector('#activity canvas')?.getBoundingClientRect(),a=document.querySelector('#activity')?.getBoundingClientRect();const buttons=[...document.querySelectorAll('.adventure-toolbar button,#next')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim(),rect:e.getBoundingClientRect().toJSON()}));return {width:innerWidth,height:innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,canvas:c?.toJSON(),surface:a?.toJSON(),buttons};});
 assert.equal(metrics.horizontalOverflow,false,label+' overflow');
 for(const b of metrics.buttons){assert.ok(b.rect.width>=47.5&&b.rect.height>=47.5,label+' target '+b.text);assert.ok(b.rect.bottom<=metrics.height+1,label+' hidden control '+b.text);}
 if(metrics.canvas)assert.ok(metrics.canvas.bottom<=metrics.surface.bottom+1&&metrics.canvas.top>=metrics.surface.top-1,label+' clipped canvas');
 await page.screenshot({path:out+'/'+label+'.png'});return metrics;
}
try{
 for(const [width,height,mode,touch]of (process.env.CHECK_PART&&process.env.CHECK_PART!=='water'?[]:[[1280,800,'drag',false],[1024,768,'tap',true],[768,1024,'tap',true],[1280,800,'keyboard',false]])){
  await fresh(width,height,touch);await page.evaluate(async()=>{(await import('/src/main.js')).enter(0);});await ready();
  assert.equal(await page.locator('#observation-auto').isVisible(),true,'water observation offers playback');
  assert.equal(await page.locator('#next').isDisabled(),true,'observation must finish before continuing');
  await click(1100,80);assert.equal((await data('river')).adventure.chapters[0].work[0].pour,0,'only the watering can starts flow');
  await beginPour(mode);
  await page.waitForTimeout(900);const partial=(await data('river')).adventure.chapters[0].work[0].pour;assert.ok(partial>.02&&partial<1,mode+' has real continuous progress');
  if(mode==='drag')await page.mouse.up();else if(mode==='keyboard')await page.locator('#activity canvas').press('Space');else await click(400,198);
  const stopped=(await data('river')).adventure.chapters[0].work[0].pour;await page.waitForTimeout(400);assert.equal((await data('river')).adventure.chapters[0].work[0].pour,stopped,'explicit stop');
  if(width===1024){await page.setViewportSize({width:768,height:1024});await ready();assert.equal((await data('river')).adventure.chapters[0].work[0].pour,stopped);await layout('water-rotated-portrait');await page.setViewportSize({width,height});await ready();}
  await page.reload();await ready();assert.equal((await data('river')).adventure.chapters[0].work[0].pour,stopped,'intermediate saved amount');
  await beginPour(mode);
  await page.locator('#activity[data-phase="1"]').waitFor({timeout:15000});if(mode==='drag')await page.mouse.up();
  const d=await data('river');assert.equal(d.runs.length,1);assert.equal(d.evidence['river-run-1'].time,1);assert.equal(d.adventure.chapters[0].work[0].pour,1);
  const metrics=await layout(`${width}-${height}-water-${mode}`);
  await page.waitForSelector('#next.ready',{timeout:15000});
  const compared=await data('river');assert.deepEqual(compared.runs.map(r=>r.water),[1,2]);assert.equal(compared.evidence['river-run-2'].water,2);
  results.push({test:'water',width,height,mode,touchEmulation:touch,partial,stopped,record:d.evidence['river-run-1'],bothWaterAmounts:true,metrics});
 }
 for(const [width,height,mode]of (process.env.CHECK_PART&&process.env.CHECK_PART!=='safety'?[]:[[1280,800,'drag'],[1024,768,'tap'],[768,1024,'keyboard']])){
  await fresh(width,height,mode==='tap');await page.evaluate(async()=>{const m=await import('/src/main.js'),s=m.state();s.completed=['river','volcano','rocks','city'];s.drafts.safety={step:0,passed:[],data:{adventure:{version:1,chapters:{0:{phase:1,tasks:{0:{done:true}},work:{}}}}}};m.enter(4);});await ready();
  const poseBefore=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
  await click(520,525);await click(724,389);assert.ok(!(await data('safety')).protect?.head,'head protection requires getting under the desk first');
  if(mode==='drag'){await drag({x:950,y:465},{x:700,y:482});await drag({x:520,y:525},{x:724,y:389});}
  else if(mode==='tap'){await click(950,465);await click(700,482);await click(520,525);await click(724,389);}
  else {await key('2');assert.ok(!(await data('safety')).protect.head);await key('1');await key('2');assert.equal((await data('safety')).protect.headMethod,'arms');}
  const d=await data('safety');assert.ok(d.protect.under&&d.protect.head,mode+' shelter and head align');
  await layout(`${width}-${height}-safety-head-${mode}`);
  await page.locator('#next').click();await ready();
  if(mode==='drag')await drag({x:1030,y:550},{x:820,y:512});else if(mode==='tap'){await click(1030,550);await click(820,512);}else await key('1');
  assert.ok((await data('safety')).protect.leg,mode+' holds the desk leg');
  // The stop banner (or key 2) only confirms once the shaking has stopped.
  if(mode==='keyboard')await key('2');else await click(320,80);assert.ok(!(await data('safety')).protect.confirmed,'confirming before the shaking stops is rejected');
  await page.waitForTimeout(2700);assert.ok((await data('safety')).protect.stopped);if(mode==='keyboard')await key('2');else await click(320,80);assert.ok((await data('safety')).protect.confirmed);
  const metrics=await layout(`${width}-${height}-safety-leg-${mode}`);await page.reload();await ready();assert.ok((await data('safety')).protect.confirmed);
  results.push({test:'safety',mode,...poseBefore,metrics});
 }
 // Walk through the current input, then verify a dense legacy record of the same safe path.
 if(!process.env.CHECK_PART||process.env.CHECK_PART==='route'){
 // A finished classroom chapter is enough to open the route; an earlier full-flow state can be passed instead.
 const earned=process.env.CHECK_SAVED_STATE?JSON.parse(await fs.readFile(process.env.CHECK_SAVED_STATE,'utf8')).drafts.safety.data:{evidence:Object.fromEntries(['window','shelf','desk','protect'].map(k=>['safety-'+k,{kind:'safety',label:k}])),protect:{under:true,head:true,leg:true,stopped:true,confirmed:true},adventure:{version:1,chapters:{0:{phase:2,tasks:{0:{done:true},1:{done:true},2:{done:true}},work:{}}}}};
 await fresh();await page.evaluate(async earned=>{const m=await import('/src/main.js'),s=m.state();s.completed=['river','volcano','rocks','city'];earned.schoolRoute=[];earned.schoolRouteDone=false;earned.adventure.chapters[1]={phase:0,tasks:{},work:{}};s.drafts.safety={step:1,passed:[0],data:earned};m.enter(4);},earned);await ready();
 await flatMap();
 const waypoints=SCHOOL_PATH;
 for(let i=1;i<waypoints.length;i++){
  const from=waypoints[i-1],to=waypoints[i];
  await click(to.x+100,to.y+80);
  await page.waitForTimeout(Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/.17)+300);
 }
 await page.waitForSelector('#next.ready',{timeout:20000});
 const walked=(await data('safety')).schoolRoute;
 assert.ok(walked.length>2);
 const dense=[walked[0]],parts=Math.ceil(720/(walked.length-1));
 for(let i=1;i<walked.length;i++)for(let j=1;j<=parts;j++){
  const a=walked[i-1],b=walked[i],t=j/parts;
  dense.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 }
 assert.ok(dense.length>600);
 await page.evaluate(async points=>{
  const m=await import('/src/main.js'),{inspectRoute,SCHOOL_CONFIG}=await import('/src/learning-model.js');
  if(!inspectRoute(points,SCHOOL_CONFIG).ok)throw new Error('Dense legacy route must remain safe');
  m.state().drafts.safety.data.schoolRoute=points;m.save();
 },dense);
 await page.reload();await ready();
 assert.deepEqual((await data('safety')).schoolRoute,dense);
 results.push({test:'long-route-restore',walkedPoints:walked.length,legacyPoints:dense.length,identicalAfterReload:true});
 }

 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({results,errors,realTablet:false},null,2));console.log('PASS targeted: '+results.length+' scenarios');
}catch(e){await page?.screenshot({path:out+'/failure.png'});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,results},null,2));console.error(e);process.exitCode=1;}finally{await browser.close();}
