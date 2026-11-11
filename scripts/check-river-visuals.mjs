import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href);
const out=process.env.CHECK_OUT||'.work/river-visuals-20261110';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],results=[];
try{
 for(const [width,height]of [[1280,800],[667,375]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  const ready=async()=>{await p.waitForSelector('#activity canvas');await p.waitForFunction(()=>!document.querySelector('.stage-loader'));};
  const data=()=>p.evaluate(()=>window.qaMain.state().drafts.river.data);
  await p.goto(process.env.CHECK_URL||'http://localhost:5197');await p.evaluate(async()=>{window.qaMain=await import('/src/main.js');});
  await p.evaluate(async()=>{const m=await import('/src/main.js');m.state().started=true;m.state().sound=false;m.state().drafts.river={step:0,passed:[],data:{}};m.enter(0);});await ready();
  for(const water of [1,2]){
   await p.locator('#observation-speed').selectOption('3');await p.locator('#observation-auto').tap();
   await p.waitForFunction(phase=>window.qaMain.state().drafts.river.data.adventure.chapters[0].work[phase].pour>.65,water-1);
   await p.screenshot({path:out+'/'+width+'-water-'+water+'.png'});
   await p.waitForSelector('#next.ready',{timeout:20000});
   const d=await data();assert.equal(d.evidence['river-run-'+water].water,water);
   await p.screenshot({path:out+'/'+width+'-deposit-'+water+'.png'});
   if(water===1){await p.locator('#next').tap();await ready();}
  }
  const completed=await data();assert.deepEqual(completed.runs.map(r=>r.water),[1,2]);
  await p.evaluate(async()=>{const m=await import('/src/main.js'),draft=m.state().drafts.river,d=draft.data;draft.step=1;draft.passed=[0];d.reflection='foot';for(const [id,point]of Object.entries((await import('/src/learning-model.js')).RIVER_MARKS))d.evidence['river-'+id]={point:{x:point.x,y:point.y},time:1};d.adventure.chapters[0].tasks[2]={done:true};d.adventure.chapters[1]={phase:0,tasks:{},work:{}};m.enter(0,1);});await ready();
  for(const side of ['upper','lower']){
   for(const i of [0,1]){
    await p.locator('#river-field-observe').tap();await p.locator('[data-field-point="'+i+'"]').tap();
    await p.screenshot({path:out+'/'+width+'-'+side+'-'+i+'.png'});
   }
   await p.waitForSelector('#next.ready');
   const d=await data(),records=Object.values(d.evidence).filter(r=>r.asset==='art/river-'+side+'-photo-v1');
   assert.equal(records.length,2,side+' observation records retain the correct generated image');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   if(side==='upper'){await p.locator('#next').tap();await ready();}
  }
  await p.reload();await ready();await p.evaluate(async()=>{window.qaMain=await import('/src/main.js');});assert.equal(Object.values((await data()).evidence).filter(r=>r.kind==='field').length,4);
  results.push({width,height,bothWaterAmounts:true,generatedFieldObservations:4,reloadPreservesRecords:true});await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS generated river visuals',results);
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));await browser.close();}
