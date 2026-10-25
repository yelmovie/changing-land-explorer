import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href);
const out=process.env.CHECK_OUT||'.work/request-fixes-20261025/targeted';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[];
let page,context,touchInput=false;
async function fresh(width=1280,height=800,touch=false){
 await context?.close();touchInput=touch;context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce',serviceWorkers:'block'});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForSelector('#start');await page.locator('#start').click();
}
async function ready(){await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(200);}
async function click(x,y){const b=await page.locator('#activity canvas').boundingBox();const p={x:b.x+x*b.width/1200,y:b.y+y*b.height/640};if(touchInput)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
async function drag(from,to){const b=await page.locator('#activity canvas').boundingBox();const p=v=>({x:b.x+v.x*b.width/1200,y:b.y+v.y*b.height/640});const a=p(from),z=p(to);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(z.x,z.y,{steps:15});await page.mouse.up();await page.waitForTimeout(220);}
async function place(tool,target){await page.locator('#gesture-help').click();for(const label of ['도구 선택 · '+tool,'대상 선택 · '+target])await page.getByRole('button',{name:label,exact:true}).click();await page.locator('#assist-return').click();}
async function data(stage){return page.evaluate(async stage=>(await import('/src/main.js')).state().drafts[stage].data,stage);}
async function beginPour(mode){
 if(mode==='button'){await page.locator('#gesture-help').click();await page.getByRole('button',{name:'가운데 물주기',exact:true}).click();}
 else if(mode==='tap'){await click(140,515);await click(400,195);}
 else {const b=await page.locator('#activity canvas').boundingBox();await page.mouse.move(b.x+140*b.width/1200,b.y+515*b.height/640);await page.mouse.down();await page.mouse.move(b.x+400*b.width/1200,b.y+195*b.height/640,{steps:15});}
}
async function layout(label){
 const metrics=await page.evaluate(()=>{const c=document.querySelector('#activity canvas')?.getBoundingClientRect(),a=document.querySelector('#activity')?.getBoundingClientRect();const buttons=[...document.querySelectorAll('.adventure-toolbar button,#next')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim(),rect:e.getBoundingClientRect().toJSON()}));return {width:innerWidth,height:innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,canvas:c?.toJSON(),surface:a?.toJSON(),buttons};});
 assert.equal(metrics.horizontalOverflow,false,label+' overflow');
 for(const b of metrics.buttons){assert.ok(b.rect.width>=47.5&&b.rect.height>=47.5,label+' target '+b.text);assert.ok(b.rect.bottom<=metrics.height+1,label+' hidden control '+b.text);}
 if(metrics.canvas)assert.ok(metrics.canvas.bottom<=metrics.surface.bottom+1&&metrics.canvas.top>=metrics.surface.top-1,label+' clipped canvas');
 await page.screenshot({path:out+'/'+label+'.png'});return metrics;
}
try{
 for(const [width,height,mode,touch]of (process.env.CHECK_PART&&process.env.CHECK_PART!=='water'?[]:[[1280,800,'drag',false],[1024,768,'tap',true],[768,1024,'tap',true],[1280,800,'button',false]])){
  await fresh(width,height,touch);await page.evaluate(async()=>{(await import('/src/main.js')).enter(0);});await ready();
  await click(340,515);await click(100,70);assert.equal((await data('river')).prediction,undefined,'wrong flag placement stays incomplete');
  await click(340,515);await click(627,340);assert.ok((await data('river')).prediction,'flag returned to its original place');
  await click(140,515);await click(1100,80);assert.equal((await data('river')).adventure.chapters[0].work[0].pour,0,'wrong watering position cannot advance');
  if(mode==='button'){await page.locator('#gesture-help').click();await page.getByRole('button',{name:'가운데 물주기',exact:true}).click();}
  else if(mode==='tap'){await click(140,515);await click(400,195);}
  else {const b=await page.locator('#activity canvas').boundingBox();await page.mouse.move(b.x+140*b.width/1200,b.y+515*b.height/640);await page.mouse.down();await page.mouse.move(b.x+400*b.width/1200,b.y+195*b.height/640,{steps:15});}
  await page.waitForTimeout(900);const partial=(await data('river')).adventure.chapters[0].work[0].pour;assert.ok(partial>.02&&partial<1,mode+' has real continuous progress');
  if(mode==='drag')await page.mouse.up();else await page.locator('#river-pour-stop').click();
  const stopped=(await data('river')).adventure.chapters[0].work[0].pour;await page.waitForTimeout(400);assert.equal((await data('river')).adventure.chapters[0].work[0].pour,stopped,'explicit stop');
  if(width===1024){await page.setViewportSize({width:768,height:1024});await ready();assert.equal((await data('river')).adventure.chapters[0].work[0].pour,stopped);await layout('water-rotated-portrait');await page.setViewportSize({width,height});await ready();}
  await page.reload();await ready();assert.equal((await data('river')).adventure.chapters[0].work[0].pour,stopped,'intermediate saved amount');
  if(mode==='button'){await page.locator('#gesture-help').click();await page.getByRole('button',{name:'가운데 물주기',exact:true}).click();}
  else if(mode==='tap'){await click(140,515);await click(400,195);}
  else {const b=await page.locator('#activity canvas').boundingBox();await page.mouse.move(b.x+140*b.width/1200,b.y+515*b.height/640);await page.mouse.down();await page.mouse.move(b.x+400*b.width/1200,b.y+195*b.height/640,{steps:15});}
  await page.waitForSelector('#next.ready',{timeout:15000});if(mode==='drag')await page.mouse.up();
  const d=await data('river');assert.equal(d.runs.length,1);assert.equal(d.evidence['river-run-1'].time,1);assert.equal(d.adventure.chapters[0].work[0].pour,1);
  const metrics=await layout(`${width}-${height}-water-${mode}`);
  await page.locator('#next').click();await ready();await beginPour(mode);await page.waitForSelector('#next.ready',{timeout:15000});if(mode==='drag')await page.mouse.up();
  const compared=await data('river');assert.deepEqual(compared.runs.map(r=>r.water),[1,2]);assert.equal(compared.evidence['river-run-2'].water,2);
  results.push({test:'water',width,height,mode,touchEmulation:touch,partial,stopped,record:d.evidence['river-run-1'],bothWaterAmounts:true,metrics});
 }
 for(const [width,height,mode]of (process.env.CHECK_PART&&process.env.CHECK_PART!=='safety'?[]:[[1280,800,'drag'],[1024,768,'tap'],[768,1024,'button']])){
  await fresh(width,height,mode==='tap');await page.evaluate(async()=>{const m=await import('/src/main.js'),s=m.state();s.completed=['river','volcano','rocks','city'];s.drafts.safety={step:0,passed:[],data:{adventure:{version:1,chapters:{0:{phase:1,tasks:{0:{done:true}},work:{}}}}}};m.enter(4);});await ready();
  const poseBefore=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
  await click(260,540);await click(724,389);assert.ok(!(await data('safety')).protect?.head,'head protection requires getting under the desk first');
  if(mode==='drag'){await drag({x:950,y:465},{x:700,y:482});await drag({x:260,y:540},{x:724,y:389});}
  else if(mode==='tap'){await click(950,465);await click(700,482);await click(260,540);await click(724,389);}
  else {await place('리버','책상 아래');await place('방석','머리 위');}
  const d=await data('safety');assert.ok(d.protect.under&&d.protect.head,mode+' shelter and head align');
  await layout(`${width}-${height}-safety-head-${mode}`);
  await page.locator('#next').click();await ready();
  if(mode==='drag')await drag({x:1030,y:550},{x:820,y:512});else if(mode==='tap'){await click(1030,550);await click(820,512);}else await place('손으로 잡기','가까운 책상 다리');
  await page.waitForTimeout(2700);await page.locator('#confirm-stop').click();assert.ok((await data('safety')).protect.confirmed);
  const metrics=await layout(`${width}-${height}-safety-leg-${mode}`);await page.reload();await ready();assert.ok((await data('safety')).protect.confirmed);
  results.push({test:'safety',mode,...poseBefore,metrics});
 }
 // A real long route with over 600 turns, stored as a student record and reloaded.
 if(!process.env.CHECK_PART||process.env.CHECK_PART==='route'){
 const earned=JSON.parse(await fs.readFile('.work/request-fixes-20261025/full-flow/flow-student-state.json','utf8')).drafts.safety.data;
 await fresh();await page.evaluate(async earned=>{const m=await import('/src/main.js'),s=m.state();s.completed=['river','volcano','rocks','city'];earned.schoolRoute=[];earned.schoolRouteDone=false;earned.adventure.chapters[1]={phase:0,tasks:{},work:{}};s.drafts.safety={step:1,passed:[0],data:earned};m.enter(4);},earned);await ready();
 const b=await page.locator('#activity canvas').boundingBox(),screen=p=>({x:b.x+(p.x+100)*b.width/1200,y:b.y+(p.y+80)*b.height/640});
 const route=[{x:140,y:100},...Array.from({length:720},(_,i)=>({x:150+i%10*10,y:100+i%2*25})),{x:280,y:100},{x:280,y:280},{x:500,y:280},{x:500,y:370},{x:880,y:420}];
 let p=screen(route[0]);await page.mouse.move(p.x,p.y);await page.mouse.down();for(const q of route.slice(1)){p=screen(q);await page.mouse.move(p.x,p.y);}await page.mouse.up();
 const original=(await data('safety')).schoolRoute;assert.ok(original.length>600);await page.locator('#route-check').click();await page.waitForSelector('#next.ready');await page.reload();await ready();const restored=(await data('safety')).schoolRoute;assert.deepEqual(restored,original);results.push({test:'long-route',points:original.length,last:original.at(-1),identicalAfterReload:true});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({results,errors,realTablet:false},null,2));console.log('PASS targeted: '+results.length+' scenarios');
}catch(e){await page?.screenshot({path:out+'/failure.png'});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,results},null,2));console.error(e);process.exitCode=1;}finally{await browser.close();}
