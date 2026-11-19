import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
import assert from 'node:assert/strict';
import {bridgeDrag} from './bridge-test-controls.mjs';
import fs from 'node:fs/promises';
import {FIELD_POINTS,RIVER_MARKS,SCHOOL_PATH,SCHOOL_DRILL_PATH,OUTSIDE_PATH} from '../src/learning-model.js';
import {MODEL_MOUTH,MODEL_FLOW} from '../src/observation-scenes.js';
import {CLASSROOM_HAZARDS} from '../src/adventure/safety.js';
import {citySlots} from '../src/adventure/city.js';
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
async function spot(p){const b=await page.locator('#activity canvas').first().boundingBox();return {x:b.x+p.x*b.width/1200,y:b.y+p.y*b.height/640};}
async function tap(x,y){const p=await spot({x,y});await page.mouse.click(p.x,p.y);await page.waitForTimeout(80);}
async function stroke(...points){
 const [first,...rest]=await Promise.all(points.map(spot));
 await page.mouse.move(first.x,first.y);await page.mouse.down();
 for(const p of rest)await page.mouse.move(p.x,p.y,{steps:12});
 await page.mouse.up();await page.waitForTimeout(120);
}
async function riverMarks(){for(const [i,[id,mark]]of Object.entries(RIVER_MARKS).entries()){
 if(width<1000){await tap(275+i*325,535);await tap(150+mark.x*900,120+mark.y*400);}
 else await stroke({x:275+i*325,y:535},{x:150+mark.x*900,y:120+mark.y*400});
}}
async function fieldPoints(side){for(const p of FIELD_POINTS.filter(p=>p.side===side))await tap(p.x*1.2,p.y*640/560);}
async function riverLinks(){
 const slots=[205,405,795,995];
 for(const i of FIELD_POINTS.keys())await stroke({x:168+i*198,y:531},{x:slots[i],y:410});
 await stroke({x:1045,y:518},{x:978,y:281});
 assert.match(await page.locator('#quest-meter').textContent(),/5\s*\/\s*5/);
}
async function assemble(){for(const [i,to]of [{x:580,y:485},{x:560,y:315},{x:957,y:350}].entries())await stroke({x:135,y:170+i*175},to);}
async function trace(){await tap(MODEL_MOUTH.x,MODEL_MOUTH.y);await stroke(...MODEL_FLOW);}
async function volcanoOutputs(){for(const [x,y]of [[385,395],[610,80],[260,115],[670,245]]){await tap(x*1.2,y*640/560);}}
async function volcanoLinks(){for(const [i,to]of [{x:835,y:470},{x:400,y:335},{x:400,y:470},{x:835,y:335}].entries())await stroke({x:165+i*290,y:584},to);}
async function rub(){for(const cx of [440,840])await stroke(...[170,250,330,410].flatMap((y,row)=>(row%2?[120,-120]:[-120,120]).map(dx=>({x:cx+dx,y}))));}
async function sortRocks(){
 await stroke({x:780,y:225},{x:1060,y:275});await stroke({x:420,y:225},{x:140,y:275});
}
async function classifyRock(x){await stroke({x:600,y:316},{x,y:459});}
async function cityCompare(phase){
 if(phase===1){const range=page.getByRole('slider',{name:'관찰할 시기'});await range.press('Home');await range.press('End');}
 else {await tap(300,260);await tap(900,260);}
 // Record cards sit at x 230/600/970 (y 584); card j belongs under photo j and the third card is the decoy.
 const {y,list}=citySlots(phase);
 for(const [j,from]of [230,600].entries()){
  if(width<1000){await tap(from,584);await tap(list[j].x,y);}
  else await stroke({x:from,y:584},{x:list[j].x,y});
 }
}
async function notice(phase){
 const x=phase===1?458:183;
 if(width<1000){await tap(x,305);await tap(861,327);}
 else await stroke({x,y:305},{x:861,y:327});
}
async function ashSafety(){
 await page.locator('.ash-room-hero').waitFor();await tap(686,340);
 const face=await page.locator('.ash-room-face').boundingBox(),mask=await spot({x:420,y:560});
 await page.mouse.move(mask.x,mask.y);await page.mouse.down();
 await page.mouse.move(face.x+face.width/2,face.y+face.height/2,{steps:12});await page.mouse.up();
}
async function hazards(){
 const canvas=await page.locator('#activity canvas').first().boundingBox();
 const targets=await page.locator('.safety-classroom').evaluate((el,hazards)=>{
  const view=el.getBoundingClientRect(),style=getComputedStyle(el,'::before');
  const [w,h]=style.backgroundSize.split(' ').map(parseFloat),[x,y]=style.backgroundPosition.split(' ').map(parseFloat);
  return hazards.map(p=>({x:view.x+x+p.x*w/1200,y:view.y+y+(p.y+17.5)*h/675}));
 },CLASSROOM_HAZARDS);
 for(const [i,p] of targets.entries())await stroke({x:400+i*360,y:565},{x:(p.x-canvas.x)*1200/canvas.width,y:(p.y-canvas.y)*640/canvas.height});
}
async function shelter(){await stroke({x:950,y:465},{x:700,y:482});await stroke({x:520,y:525},{x:724,y:389});}
// A solved phase shows its stamp and moves on without a click.
async function next(){await page.waitForSelector('#next.ready');const phase=await page.locator('#activity').getAttribute('data-phase');
 // A phase that was already solved before a reload keeps the button as the way on.
 if(!await page.locator('.phase-stamp').count()){await page.locator('#next').click();await settle();return;}
 await page.waitForFunction(p=>document.querySelector('#activity')?.dataset.phase!==p,phase,{timeout:20000});await settle();}
async function concept(){await page.waitForSelector('.concept-dialog',{timeout:20000});concepts++;await page.locator('#concept-continue').click();}
async function doneStage(index){
 await concept();
 if(index!==2)await page.waitForSelector('#operation-board');
 const actions=[['observe:erosion','observe:transport','observe:deposit','bridge:checked','test','cross'],['signed','shelter','station'],[],['close','inside','notice'],['cover','hold','stopped','assembly']][index];
 for(const action of actions){
  if(action.startsWith('bridge:'))await bridgeDrag(page,action.slice(7));
  else if(action==='cross'){
   // River walks over the held bridge stop by stop until the flag is reached.
   await page.locator('.crossing-river').waitFor();
   for(let k=0;k<8&&!(await page.locator('.operation-win,#return-map').count());k++){
    if(await page.locator('[data-crossing-step]:not(:disabled)').count())await page.locator('[data-crossing-step]').click();
    await page.waitForTimeout(2600);
   }
  }
  else await page.locator(`[data-operation="${action}"]`).click();
 }
 // The win screen opens the reward by itself.
 if(index!==2)await page.waitForSelector('.operation-win');
 await page.waitForSelector('#return-map',{timeout:10000});
 assert.match(await page.locator('.reward-stamp').textContent(),/도장/);rewards++;
 if(index===2){assert.equal(await page.locator('#operation-board').count(),0);assert.match(await page.locator('.village-reward-dialog h2').textContent(),/탐구 완료/);}
 const colors=await page.locator('.reward-thanks').evaluate(p=>{const name=p.querySelector('.speaker-tag');return {name:getComputedStyle(name).color,badge:getComputedStyle(name).backgroundColor,line:getComputedStyle(p.querySelector('span')).color};});
 assert.notEqual(colors.name,colors.line);assert.notEqual(colors.badge,'rgba(0, 0, 0, 0)');
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
 assert.ok(await page.locator('[data-stamp]').isDisabled(),'the reward already stamped this resident');
 await page.locator('[data-close]').click();
 assert.equal(await page.locator('.plaza-festival.celebrating').count(),index===4?1:0);
 if(index===0||index===4)await page.screenshot({path:`${out}/map-after-${id}.png`});
 console.log('Completed and talked to resident',id);
}
async function enter(index){await page.evaluate(async index=>(await import('/src/main.js')).enter(index,0),index);await settle();}
async function rockInspect(){for(const [x,y]of [[248,220],[350,285],[450,330]])await tap(x,y);for(const x of [210,465,730,1000])await tap(x,570);}
// The 3D walk sits over the same route rules; the flat map (tools menu) takes taps in map coordinates.
async function flatMap(){
 // Without WebGL the 3D view never mounts and the flat map already takes the taps.
 if(!await page.waitForSelector('#route-view',{state:'attached',timeout:8000}).catch(()=>null))return;
 if((await page.locator('#route-view').textContent()).includes('지도로')){await page.locator('.topbar .activity-tools>summary').click();await page.locator('#route-view').click();}
 await page.locator('.evac3d').waitFor({state:'hidden'});
}
async function pathRoute(points){
 await flatMap();
 let last=points[0];
 for(const p of points.slice(1)){await page.waitForTimeout(250);await tap(p.x+100,p.y+80);await page.waitForTimeout(Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/.17)+200);last=p;}
 await page.waitForSelector('#next.ready',{timeout:20000});
}
// The last challenge is the record tower: reopen each place's frame and light it, then finish the tower.
async function finalChallenge(){
 await page.evaluate(async()=>{await(await import('/src/main.js')).navigate('final');});
 await page.waitForSelector('.tower-display');
 assert.equal(await page.locator('#final-connect').isDisabled(),true,'the tower stays dark until every frame is reviewed');
 for(const id of ['river','volcano','rocks','city','safety']){
  await page.locator(`[data-scene="${id}"]`).click();await page.locator('.tower-light').click();
  await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
 }
 assert.equal(await page.locator('.tower-lights i.lit').count(),5);
 const finish=await page.locator('#final-connect').evaluate(b=>({disabled:b.disabled,bottom:b.getBoundingClientRect().bottom,vh:innerHeight}));
 assert.equal(finish.disabled,false);
 await page.locator('#final-connect').click();await page.locator('#story-skip').click();await page.waitForSelector('#certificate');
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
 await page.locator('#observation-auto').click();
 // The second run follows without a navigation click; a reload keeps its phase.
 await page.waitForSelector('#activity[data-phase="1"]');await settle();
 assert.equal(await page.locator('#instruction').evaluate(e=>e===document.activeElement),true);
 assert.equal(await page.locator('[data-phase="2"]').count(),0);
 await page.reload();await settle();await page.waitForSelector('#activity[data-phase="1"]');
 await page.locator('#observation-auto').click();await page.waitForSelector('#next.ready',{timeout:15000});await next();
 const timeline=page.getByRole('slider',{name:'실험 시간'});await timeline.press('Home');await timeline.press('End');
 await riverMarks();
 await page.locator('#river-reflect-foot').click();await concept();await settle();
 await fieldPoints('upper');await next();await fieldPoints('lower');await next();await riverLinks();await doneStage(0);
 await enter(1);await assemble();await next();await stroke({x:957,y:185},{x:957,y:340});await page.waitForSelector('#next.ready',{timeout:15000});await next();await trace();await concept();await settle();
 await volcanoOutputs();await next();await volcanoLinks();await next();await volcanoLinks();await doneStage(1);
 await enter(2);await rub();await next();await rockInspect();await next();await rockInspect();await concept();await settle();
 await sortRocks();await next();await classifyRock(245);await next();await classifyRock(955);await doneStage(2);
 await enter(3);
 for(let p=0;p<3;p++){await cityCompare(p);if(p<2)await next();else await concept();}
 await settle();await notice(0);await ashSafety();await next();await notice(1);await next();await notice(2);await doneStage(3);
 await enter(4);await hazards();await next();await shelter();await next();await stroke({x:1030,y:550},{x:820,y:512});await page.waitForTimeout(2700);await tap(320,80);await concept();await settle();
 await pathRoute(SCHOOL_PATH);await next();await pathRoute(SCHOOL_DRILL_PATH);await next();await pathRoute(OUTSIDE_PATH);await doneStage(4);
 }
 const before=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(Object.keys(before.records).length,5);if(!resumedStageState){assert.equal(concepts,10);assert.equal(rewards,5);}assert.equal(errors.length,0);
 await page.reload();await page.waitForSelector('#settings');const after=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));assert.deepEqual(after.completed,before.completed);if(!resumedStageState)assert.deepEqual(after.residentStamps,after.completed);
 await fs.writeFile(`${out}/flow-student-state.json`,JSON.stringify(after));
 await finalChallenge();
 const finished=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(finished.finished,true);assert.equal(Object.keys(finished.final.lit).length,5);
 await page.reload();await page.waitForSelector('#settings');const resumed=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(resumed.finished,true);assert.deepEqual(resumed.final,finished.final);assert.equal(errors.length,0);assert.deepEqual(httpErrors,[]);
 await fs.writeFile(`${out}/flow-finished-state.json`,JSON.stringify(resumed));
 const discoveries=Object.values(after.drafts).flatMap(d=>Object.values(d.data.adventure.chapters)).reduce((n,c)=>n+Object.keys(c.tasks).length,0);assert.equal(discoveries,30);
 console.log(resumedStageState?'PASS: resumed earned 30-discovery state; record tower, ending, certificate and reload persistence.':'PASS: 30 discoveries, 10 concept handoffs, five rewards, record tower, ending, certificate and reload persistence.');
 await fs.writeFile(`${out}/flow.json`,JSON.stringify({completed:resumed.completed,errors,httpErrors,discoveries,concepts:resumedStageState?null:concepts,rewards:resumedStageState?null:rewards,resumedStageState,stageEvidenceSource:process.env.CHECK_RESUME_STATE||null,towerLit:Object.keys(resumed.final.lit).length,finished:resumed.finished,certificate:true,reloaded:true,interaction:'Real pointer input for every stage activity and route; the script knows each target, so a pass shows the activities can be finished, not independent learner performance.'},null,2));
}catch(error){await page.screenshot({path:`${out}/flow-failure.png`});await fs.writeFile(`${out}/flow-failure.json`,JSON.stringify({message:error.message,errors,httpErrors,concepts,rewards},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
