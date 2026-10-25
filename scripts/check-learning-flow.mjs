import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.CHECK_OUT||'.work/learning-verification';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});
const resumedStageState=Boolean(process.env.CHECK_RESUME_STATE);
if(resumedStageState){
 const raw=await fs.readFile(process.env.CHECK_RESUME_STATE,'utf8');
 await context.addInitScript(raw=>{if(!sessionStorage.getItem('flow-resumed')){localStorage.setItem('moving-geovalley-v3',raw);sessionStorage.setItem('flow-resumed','true');}},raw);
}
const page=await context.newPage();const errors=[],httpErrors=[];let concepts=0,rewards=0;
page.on('pageerror',e=>errors.push(e.message));
page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
async function settle(){await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(120);}
async function assist(names,{repeat=1,pattern=null}={}){
 await page.locator('#gesture-help').click();
 const buttons=page.locator('[data-assist]'),labels=await buttons.allTextContents();
 const wanted=names||labels.filter(n=>!pattern||pattern.test(n));
 for(const name of wanted)for(let i=0;i<repeat;i++)await page.getByRole('button',{name,exact:true}).click();
 await page.locator('#assist-return').click();
}
async function place(tool,target){await assist(['도구 선택 · '+tool,'대상 선택 · '+target]);}
async function pour(){await page.locator('#gesture-help').click();await page.getByRole('button',{name:'가운데 물주기',exact:true}).click();await page.waitForSelector('#next.ready',{timeout:15000});}
async function riverLinks(){
 for(const [tool,target]of [['상류의 바위 관찰 카드','상류'],['상류의 물길 관찰 카드','상류'],['하류의 물길 관찰 카드','하류'],['하류의 모래 관찰 카드','하류'],['모래가 쌓여요 깃발','하류 끝 모래']])await place(tool,target);
 assert.match(await page.locator('#quest-meter').textContent(),/5\s*\/\s*5/);
}
async function volcanoLinks(){
 await page.locator('#gesture-help').click();const labels=await page.locator('[data-assist]').allTextContents();await page.locator('#assist-return').click();
 for(const label of labels.filter(s=>s.startsWith('도구 선택'))){const text=label.replace('도구 선택 · ',''),side=text.startsWith('모형:')?'내 모형':'실제 화산';const topic=text.includes('구멍으로')?'나오는 곳':text.includes('경사면을 따라')?'흐르는 길':text.includes('차가운')||text.includes('뜨거운')?'흐르는 물질':'함께 나오는 것';await place(text,side+' · '+topic);}
}
async function next(){await page.waitForSelector('#next.ready');await page.locator('#next').click();await settle();}
async function concept(){await page.waitForSelector('#next.ready');await page.locator('#next').click();await page.waitForSelector('.concept-dialog');concepts++;await page.locator('#concept-continue').click();}
async function doneStage(index){await concept();await page.waitForSelector('#return-map');rewards++;await page.locator('#return-map').click();const s=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));assert.equal(s.completed.length,index+1);console.log('Completed',s.completed.at(-1));}
async function enter(index){await page.evaluate(async index=>(await import('/src/main.js')).enter(index,0),index);await settle();}
async function rockInspect(){await assist(null,{pattern:/관찰$/});await assist(null,{pattern:/기록 붙이기$/});}
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
 await page.locator('#next').click();await page.waitForSelector('#certificate');
 await page.screenshot({path:`${out}/flow-ending.png`,animations:'disabled'});
 await page.locator('#certificate').click();await page.waitForSelector('.certificate');
 await page.getByLabel('인증서에 쓸 별명').fill('복구 검증 탐험가');
 await page.screenshot({path:`${out}/flow-certificate.png`,animations:'disabled'});
 assert.equal(await page.locator('#print').count(),1);
}
try{
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForSelector('#settings');
 if(!resumedStageState){
 await page.waitForSelector('#start');await page.locator('#start').click();await enter(0);
 await place('예상 깃발','가운데 흙');await pour();await next();
 await pour();await next();
 await assist(['두 실험 처음으로 되감기','두 실험 마지막 모습 보기']);
 for(const [tool,target]of [['깎임 · 침식','위쪽 깎인 흙'],['이동 · 운반','가운데 흐르는 길'],['쌓임 · 퇴적','아래쪽 모래']])await place(tool,target);
 await page.locator('#river-reflect-different').click();await concept();await settle();
 await assist();await next();await assist();await next();await riverLinks();await doneStage(0);
 await enter(1);await assist();await next();await assist(['손잡이 조금 밀기'],{repeat:5});await page.waitForSelector('#next.ready',{timeout:15000});await next();await assist(['꼭대기 구멍 관찰']);await assist(['흐른 길의 다음 점으로 이동'],{repeat:5});await concept();await settle();
 let outputLabels;await page.locator('#gesture-help').click();outputLabels=await page.locator('[data-assist]').allTextContents();await page.locator('#assist-return').click();
 for(const label of outputLabels){await assist([label]);await page.locator('#volcano-output-pin').click();}
 await next();await volcanoLinks();await next();await volcanoLinks();await doneStage(1);
 await enter(2);await assist(null,{repeat:16});await next();await rockInspect();await next();await rockInspect();await concept();await settle();
 await assist();await next();await rockInspect();await assist(null,{pattern:/쟁반으로 옮기기$/});await next();await rockInspect();await assist(null,{pattern:/쟁반으로 옮기기$/});await doneStage(2);
 await enter(3);
 for(let p=0;p<3;p++){
  await assist(['분출 당시 모습 살피기','이후 모습 살피기']);
  await page.locator('#gesture-help').click();const labels=await page.locator('[data-assist]').allTextContents();await page.locator('#assist-return').click();await assist([labels[0],labels[3]]);
  if(p<2)await next();else await concept();
 }
 await settle();await assist(null,{pattern:/붙이기$/});await assist(['실내 창문 닫기','리버의 코와 입에 마스크 씌우기']);await next();await assist();await next();await assist();await doneStage(3);
 await enter(4);await assist();await next();await place('리버','책상 아래');await place('방석','머리 위');await next();await place('손으로 잡기','가까운 책상 다리');await page.waitForTimeout(2700);await page.locator('#confirm-stop').click();await concept();await settle();
 await pathRoute();await next();await page.locator('#route-check').click();await page.waitForSelector('#next.ready',{timeout:20000});await next();await pathRoute(true);await doneStage(4);
 }
 const before=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(Object.keys(before.records).length,5);if(!resumedStageState){assert.equal(concepts,10);assert.equal(rewards,5);}assert.equal(errors.length,0);
 await page.reload();await page.waitForSelector('#settings');const after=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));assert.deepEqual(after.completed,before.completed);
 await fs.writeFile(`${out}/flow-student-state.json`,JSON.stringify(after));
 await finalChallenge();
 const finished=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(finished.finished,true);assert.equal(finished.final.round,3);assert.equal(Object.keys(finished.final.selected).length,5);
 await page.reload();await page.waitForSelector('#settings');const resumed=await page.evaluate(async()=>structuredClone((await import('/src/main.js')).state()));
 assert.equal(resumed.finished,true);assert.deepEqual(resumed.final,finished.final);assert.equal(errors.length,0);assert.deepEqual(httpErrors,[]);
 await fs.writeFile(`${out}/flow-finished-state.json`,JSON.stringify(resumed));
 const discoveries=Object.values(after.drafts).flatMap(d=>Object.values(d.data.adventure.chapters)).reduce((n,c)=>n+Object.keys(c.tasks).length,0);assert.equal(discoveries,30);
 console.log(resumedStageState?'PASS: resumed earned 30-discovery state; three final challenges, ending, certificate and reload persistence.':'PASS: 30 discoveries, 10 concept handoffs, five rewards, three final challenges, ending, certificate and reload persistence.');
 await fs.writeFile(`${out}/flow.json`,JSON.stringify({completed:resumed.completed,errors,httpErrors,discoveries,concepts:resumedStageState?null:concepts,rewards:resumedStageState?null:rewards,resumedStageState,stageEvidenceSource:process.env.CHECK_RESUME_STATE||null,finalRounds:resumed.final.round,finished:resumed.finished,certificate:true,reloaded:true,interaction:'Gesture assistance for stage tasks; pointer input for school/outside/final routes. Assistance chooses valid task targets and does not establish independent learner performance.'},null,2));
}catch(error){await page.screenshot({path:`${out}/flow-failure.png`});await fs.writeFile(`${out}/flow-failure.json`,JSON.stringify({message:error.message,errors,httpErrors,concepts,rewards},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
