import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {FIELD_POINTS,RIVER_MARKS} from '../src/learning-model.js';
import {MODEL_MOUTH,MODEL_FLOW} from '../src/observation-scenes.js';
const out=process.env.CHECK_OUT||'.work/learning-verification';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const [width,height]=(process.env.CHECK_VIEWPORT||'1280x800').split('x').map(Number);
const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
const resumedStageState=Boolean(process.env.CHECK_RESUME_STATE);
if(resumedStageState){
 const raw=await fs.readFile(process.env.CHECK_RESUME_STATE,'utf8');
 await context.addInitScript(raw=>{if(!sessionStorage.getItem('flow-resumed')){localStorage.setItem('moving-geovalley-v3',raw);sessionStorage.setItem('flow-resumed','true');}},raw);
}
const page=await context.newPage();const errors=[],httpErrors=[];let concepts=0,rewards=0;
page.on('pageerror',e=>errors.push(e.message));
page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
async function settle(){await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(120);}
// Stage activities run on real pointer input in 1200x640 game coordinates.
async function spot(p){const b=await page.locator('#activity canvas').boundingBox();return {x:b.x+p.x*b.width/1200,y:b.y+p.y*b.height/640};}
async function tap(x,y){const p=await spot({x,y});await page.mouse.click(p.x,p.y);await page.waitForTimeout(80);}
async function stroke(...points){
 const [first,...rest]=await Promise.all(points.map(spot));
 await page.mouse.move(first.x,first.y);await page.mouse.down();
 for(const p of rest)await page.mouse.move(p.x,p.y,{steps:12});
 await page.mouse.up();await page.waitForTimeout(120);
}
const jump=name=>page.getByRole('button',{name,exact:true}).click();
async function pour(){await tap(140,515);await tap(400,195);await page.waitForSelector('#next.ready',{timeout:15000});}
async function riverMarks(){for(const [i,[id,mark]]of Object.entries(RIVER_MARKS).entries()){
 if(width<1000){await page.locator('#river-choose-label').click();await page.locator(`[data-river-label="${id}"]`).click();await tap(150+mark.x*900,120+mark.y*400);}
 else await stroke({x:275+i*325,y:535},{x:150+mark.x*900,y:120+mark.y*400});
}}
async function fieldPoints(side){for(const p of FIELD_POINTS.filter(p=>p.side===side))await tap(p.x*1.2,p.y*640/560);}
async function riverLinks(){
 const zones={upper:{x:330,y:235},lower:{x:870,y:370}};
 for(const [i,p]of FIELD_POINTS.entries())await stroke({x:190+i*228,y:515},zones[p.side]);
 await stroke({x:1068,y:500},{x:950,y:375});
 assert.match(await page.locator('#quest-meter').textContent(),/5\s*\/\s*5/);
}
async function assemble(){for(const [i,to]of [{x:580,y:485},{x:560,y:315},{x:957,y:350}].entries())await stroke({x:135,y:170+i*175},to);}
async function trace(){await stroke({x:175,y:260},MODEL_MOUTH);await stroke({x:180,y:480},...MODEL_FLOW);}
async function volcanoOutputs(){for(const [x,y]of [[385,395],[610,80],[260,115],[670,245]]){await tap(x*1.2,y*640/560);}}
async function volcanoLinks(){for(const [i,to]of [{x:835,y:400},{x:400,y:255},{x:400,y:400},{x:835,y:255}].entries())await stroke({x:235+i*247,y:545},to);}
async function rub(){for(const cx of [440,840])await stroke(...[170,250,330,410].flatMap((y,row)=>(row%2?[120,-120]:[-120,120]).map(dx=>({x:cx+dx,y}))));}
async function sortRocks(){
 await page.locator('#rock-ship-1').click();await page.locator('#rock-ship-0').click();
}
async function classifyRock(){for(const x of [750,1010])await stroke({x:350,y:275},{x,y:435});}
async function cityCompare(){await jump('분출 당시');await jump('이후 모습');
 if(width<1000){for(let i=0;i<2;i++){await page.locator('#city-choose-record').click();await page.locator(`[data-city-card="${i}"]`).click();await page.locator(`[data-city-period="${i}"]`).click();if(await page.locator('dialog[open]').count())await page.locator('.dialog-close').click();}}
 else {await stroke({x:255,y:610},{x:265,y:545});await stroke({x:625,y:610},{x:670,y:545});}
}
async function notice(){
 if(width<1000){for(const [i,slot]of ['picture','reason','action'].entries()){await page.locator('#city-board-choose').click();await page.locator(`[data-board-card="${i}"]`).click();await page.locator(`[data-board-slot="${slot}"]`).click();}}
 else for(const [from,to]of [[150,262],[315,334],[425,406]])await stroke({x:300,y:from},{x:845,y:to});
}
async function ashSafety(){await stroke({x:686,y:340},{x:420,y:340});await stroke({x:420,y:560},{x:985,y:375});}
async function hazards(){await stroke({x:400,y:578},{x:150,y:205});await stroke({x:760,y:578},{x:438,y:265});}
async function shelter(){await stroke({x:950,y:465},{x:700,y:482});await stroke({x:520,y:525},{x:724,y:389});}
async function next(){await page.waitForSelector('#next.ready');await page.locator('#next').click();await settle();}
async function concept(){await page.waitForSelector('#next.ready');await page.locator('#next').click();await page.waitForSelector('.concept-dialog');concepts++;await page.locator('#concept-continue').click();}
async function doneStage(index){
 await concept();await page.waitForSelector('#return-map');rewards++;
 if(index===0){
  const original=page.viewportSize();
  await page.setViewportSize({width:850,height:420});
  await page.waitForFunction(()=>{const button=document.querySelector('#return-map').getBoundingClientRect();return button.top>=0&&button.bottom<=innerHeight;});
  await page.setViewportSize(original);
 }
 await page.locator('#return-map').click();
 const s=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(s.completed.length,index+1);
 const id=s.completed.at(-1),resident=page.locator(`.map-resident.arrived[data-resident="${id}"]`);
 await resident.waitFor();
 assert.equal(await page.locator('.map-resident').count(),index+1);
 assert.equal(await page.locator('.workplace.awake').count(),index+1);
 assert.equal(await page.locator('.workplace.reopening').getAttribute('data-workplace'),id);
 await resident.click();await page.locator('[data-ask="0"]').click();
 assert.equal(await page.locator('[data-ask="0"]').getAttribute('aria-pressed'),'true');
 if(index===0)await page.screenshot({path:`${out}/first-resident-dialog.png`});
 await page.locator('[data-stamp]').click();assert.ok(await page.locator('[data-stamp]').isDisabled());
 await page.locator('[data-close]').click();
 assert.equal(await page.locator('.plaza-festival.celebrating').count(),index===4?1:0);
 if(index===0||index===4)await page.screenshot({path:`${out}/map-after-${id}.png`});
 console.log('Completed and talked to resident',id);
}
async function enter(index){await page.evaluate(async index=>(await import('/src/main.js')).enter(index,0),index);await settle();}
async function rockInspect(){for(const [x,y]of [[248,220],[350,285],[450,330]])await tap(x,y);for(const x of [210,465,730,1000])await tap(x,570);}
async function pathRoute(outside=false){
 await page.locator('#route-input').click();
 const points=outside?[{x:120,y:410},{x:180,y:410},{x:180,y:285},{x:550,y:285},{x:550,y:100},{x:880,y:100}]:[{x:140,y:100},{x:280,y:100},{x:280,y:280},{x:500,y:280},{x:500,y:370},{x:880,y:420}];
 const box=await page.locator('#activity canvas').boundingBox();
 for(const p of points){await page.mouse.click(box.x+(p.x+100)*box.width/1200,box.y+(p.y+80)*box.height/640);await page.waitForTimeout(120);}
 await page.locator('#route-check').click();await page.waitForSelector('#next.ready',{timeout:20000});
}
async function finalChallenge(){
 await page.evaluate(async()=>{await(await import('/src/main.js')).navigate('final');});
 await page.waitForSelector('#final-connect');
 for(const id of ['river','volcano','rocks','city','safety']){
  await page.locator(`[data-select-record="${id}"]`).click();
  await page.locator('[data-evidence-id]').first().click();
  await page.waitForSelector('#final-connect');
 }
 await page.locator('#final-connect').click();await page.waitForSelector('#transfer-time');
 assert.equal(await page.locator('#next').isDisabled(),true);
 await page.locator('#transfer-locations').click();await page.locator('#transfer-left').click();
 assert.equal(await page.locator('#next').isDisabled(),true,'an early river frame cannot complete the transfer task');
 await page.locator('#transfer-time').fill('100');
 await page.locator('#transfer-locations').click();await page.locator('#transfer-right').click();
 assert.equal(await page.locator('#next').isDisabled(),true,'the upstream location must be rejected');
 await page.locator('#transfer-locations').click();await page.locator('#transfer-left').click();
 await page.locator('#transfer-time').fill('0');
 assert.equal(await page.locator('#next').isDisabled(),true,'rewinding before deposition invalidates the selected location');
 await page.locator('#transfer-time').fill('100');
 await page.locator('#next').click();await page.waitForSelector('#transfer-name');
 await page.locator('#transfer-name').click();assert.equal(await page.locator('dialog').count(),0,'naming requires both observations');
 await page.locator('[data-transfer-feature="dark"]').click();
 const claims=await page.evaluate(async()=>(await import('/src/main.js')).state().final.transferRockClaims||[]);
 assert.equal(claims.length,0,'an incorrect rock observation must be rejected');
 await page.locator('#transfer-zoom').click();
 await page.locator('[data-transfer-feature="light"]').click();await page.locator('[data-transfer-feature="coarse"]').click();
 await page.locator('#transfer-name').click();await page.locator('#transfer-basalt').click();
 assert.equal(await page.locator('#next').isDisabled(),true,'an incorrect rock name cannot complete the transfer task');
 await page.locator('#transfer-name').click();await page.locator('#transfer-granite').click();
 await page.locator('#next').click();await page.waitForSelector('#route-test');
 await page.locator('#route-test').click();assert.equal(await page.locator('#next').isDisabled(),true,'an empty route cannot complete the transfer task');
 const svg=page.locator('#activity svg');
 const points=[{x:120,y:410},{x:180,y:410},{x:180,y:100},{x:880,y:100}];
 const screenPoints=await svg.evaluate((svg,points)=>points.map(p=>{const q=new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};}),points);
 const start=screenPoints[0];await page.mouse.move(start.x,start.y);await page.mouse.down();
 for(const p of screenPoints.slice(1))await page.mouse.move(p.x,p.y,{steps:6});
 await page.mouse.up();await page.locator('#route-test').click();
 await page.waitForFunction(()=>document.querySelector('#next')?.disabled===false,null,{timeout:20000});
 await page.locator('#next').click();await page.locator('#story-skip').click();await page.waitForSelector('#certificate');
 await page.screenshot({path:`${out}/flow-ending.png`,animations:'disabled'});
 await page.locator('#certificate').click();await page.waitForSelector('.certificate');
 await page.getByLabel('인증서에 쓸 별명').fill('복구 검증 탐험가');
 await page.screenshot({path:`${out}/flow-certificate.png`,animations:'disabled'});
 assert.equal(await page.locator('#print').count(),1);
}
try{
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForSelector('#settings');
 if(!resumedStageState){
 await page.waitForSelector('#start');await page.locator('#start').click();await page.locator('#story-skip').click();await enter(0);
 await pour();
 // A rapid repeat must advance only once; the next unfinished phase must
 // survive a page reload without reopening the completed first experiment.
 await page.locator('#next').evaluate(button=>{button.click();button.click();});
 await page.waitForSelector('[data-phase="1"][aria-current="step"]');await settle();
 assert.equal(await page.locator('#instruction').evaluate(e=>e===document.activeElement),true);
 assert.equal(await page.locator('[data-phase="2"]').isDisabled(),true);
 await page.reload();await settle();await page.waitForSelector('[data-phase="1"][aria-current="step"]');
 await pour();await next();
 await jump('처음 모습');await jump('마지막 모습');
 await riverMarks();
 await page.locator('#river-reflect-foot').click();await concept();await settle();
 await fieldPoints('upper');await next();await fieldPoints('lower');await next();await riverLinks();await doneStage(0);
 await enter(1);await assemble();await next();await stroke({x:957,y:185},{x:957,y:340});await page.waitForSelector('#next.ready',{timeout:15000});await next();await trace();await concept();await settle();
 await volcanoOutputs();await next();await volcanoLinks();await next();await volcanoLinks();await doneStage(1);
 await enter(2);await rub();await next();await rockInspect();await next();await rockInspect();await concept();await settle();
 await sortRocks();await next();await rockInspect();await classifyRock();await next();await rockInspect();await classifyRock();await doneStage(2);
 await enter(3);
 for(let p=0;p<3;p++){await cityCompare();if(p<2)await next();else await concept();}
 await settle();await notice();await ashSafety();await next();await notice();await next();await notice();await doneStage(3);
 await enter(4);await hazards();await next();await shelter();await next();await stroke({x:1030,y:550},{x:820,y:512});await page.waitForTimeout(2700);await page.locator('#confirm-stop').click();await concept();await settle();
 await pathRoute();await next();await page.locator('#route-check').click();await page.waitForSelector('#next.ready',{timeout:20000});await next();await pathRoute(true);await doneStage(4);
 }
 const before=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(Object.keys(before.records).length,5);if(!resumedStageState){assert.equal(concepts,10);assert.equal(rewards,5);}assert.equal(errors.length,0);
 await page.reload();await page.waitForSelector('#settings');const after=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));assert.deepEqual(after.completed,before.completed);if(!resumedStageState)assert.deepEqual(after.residentStamps,after.completed);
 await fs.writeFile(`${out}/flow-student-state.json`,JSON.stringify(after));
 await finalChallenge();
 const finished=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(finished.finished,true);assert.equal(finished.final.round,3);assert.equal(Object.keys(finished.final.selected).length,5);
 await page.reload();await page.waitForSelector('#settings');const resumed=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(resumed.finished,true);assert.deepEqual(resumed.final,finished.final);assert.equal(errors.length,0);assert.deepEqual(httpErrors,[]);
 await fs.writeFile(`${out}/flow-finished-state.json`,JSON.stringify(resumed));
 const discoveries=Object.values(after.drafts).flatMap(d=>Object.values(d.data.adventure.chapters)).reduce((n,c)=>n+Object.keys(c.tasks).length,0);assert.equal(discoveries,30);
 console.log(resumedStageState?'PASS: resumed earned 30-discovery state; three final challenges, ending, certificate and reload persistence.':'PASS: 30 discoveries, 10 concept handoffs, five rewards, three final challenges, ending, certificate and reload persistence.');
 await fs.writeFile(`${out}/flow.json`,JSON.stringify({completed:resumed.completed,errors,httpErrors,discoveries,concepts:resumedStageState?null:concepts,rewards:resumedStageState?null:rewards,resumedStageState,stageEvidenceSource:process.env.CHECK_RESUME_STATE||null,finalRounds:resumed.final.round,finished:resumed.finished,certificate:true,reloaded:true,interaction:'Real pointer input for every stage activity and route; the script knows each target, so a pass shows the activities can be finished, not independent learner performance.'},null,2));
}catch(error){await page.screenshot({path:`${out}/flow-failure.png`});await fs.writeFile(`${out}/flow-failure.json`,JSON.stringify({message:error.message,errors,httpErrors,concepts,rewards},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
