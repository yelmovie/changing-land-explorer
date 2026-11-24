import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {RIVER_MARKS} from '../src/learning-model.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/activity-fit-20261108/playback';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:667,height:375},hasTouch:true,serviceWorkers:'block'}),p=await context.newPage(),errors=[],results={};
p.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await p.waitForSelector('#activity canvas');await p.waitForFunction(()=>!document.querySelector('.stage-loader'));await p.waitForTimeout(100);};
async function river(){await p.evaluate(async()=>{const m=await import('/src/main.js');m.state().started=true;m.state().drafts.river={step:0,passed:[],data:{}};await m.enter(0,0);});await ready();}
const data=()=>p.evaluate(async()=>(await import('/src/main.js')).state().drafts.river.data);
const work=async(phase=0)=>(await data()).adventure.chapters[0].work[phase];
const auto=p.locator('#observation-auto'),canvas=p.locator('#activity canvas').first();
async function tap(x,y){const b=await canvas.boundingBox();await p.touchscreen.tap(b.x+x*b.width/1200,b.y+y*b.height/640);}
async function setAutoplay(enabled){
 await p.locator('#settings').tap();await p.locator('#autoplay-setting').setChecked(enabled);await p.locator('#settings-close').tap();
 await auto.waitFor({state:enabled?'visible':'hidden'});
}
try{
 await p.goto(process.env.CHECK_URL||'http://localhost:5177');await p.locator('#settings').waitFor();
 await river();assert.equal(await p.locator('#observation-speed,#river-pour-start,#river-pour-stop').count(),0);assert.equal(await p.locator('.activity-tools>summary').isVisible(),false);
 await tap(140,515);await p.waitForTimeout(500);await tap(400,198);
 const paused=(await work()).pour;assert.ok(paused>0&&paused<.25);await p.waitForTimeout(300);assert.equal((await work()).pour,paused);results.canTogglesOnTouch=true;
 await canvas.press('Space');await p.waitForTimeout(300);await canvas.press('Space');assert.ok((await work()).pour>paused);results.canTogglesOnKeyboard=true;
 assert.equal(await auto.isVisible(),false);
 await setAutoplay(true);await setAutoplay(false);await setAutoplay(true);results.teacherSettingControlsVisibility=true;
 await auto.tap();await p.waitForTimeout(250);await tap(400,198);assert.equal(await auto.getAttribute('aria-pressed'),'false');results.canStopsAutoplay=true;
 await auto.tap();await p.locator('#activity[data-phase="1"]').waitFor();assert.equal(await auto.getAttribute('aria-pressed'),'true');
 await p.waitForSelector('#next.ready',{timeout:15000});assert.equal(await auto.getAttribute('aria-pressed'),'false');
 const finished=await data();assert.equal(finished.adventure.chapters[0].phase,1);assert.deepEqual(finished.runs.map(r=>r.water),[1,2]);results.waterExperimentsRunInSequence=true;
 await auto.tap();await p.waitForTimeout(300);await auto.tap();assert.deepEqual(await data(),finished);results.replayDoesNotRewriteEvidence=true;
 await p.reload();await ready();assert.equal((await work(1)).pour,1);assert.equal(await auto.getAttribute('aria-pressed'),'false');assert.equal(await p.locator('#next.ready').isVisible(),true);results.reloadPreservesCompletionWithoutRestartingPlayback=true;
 await p.locator('#next').tap();await p.locator('.river-observation').waitFor();assert.equal(await p.locator('#river-choose-label,#river-grain-guide,.adventure-range .range-jump').count(),0);
 const time=p.getByRole('slider',{name:'실험 시간'});await time.press('Home');assert.equal(await time.inputValue(),'0');await time.press('End');assert.equal(await time.inputValue(),'100');
 for(const [i,mark]of Object.values(RIVER_MARKS).entries()){await tap(275+i*325,535);await tap(150+mark.x*900,120+mark.y*400);}
 await p.locator('#river-reflect-foot').tap();await p.locator('dialog video').waitFor();await p.locator('#concept-continue').tap();await p.locator('.river-field-observation').waitFor();results.conceptOpensOnCompletion=true;
 await p.locator('#settings').tap();await p.locator('#admin-setting').evaluate(e=>e.click());await p.locator('#preview-nav').waitFor();
 await p.evaluate(async()=>{const m=await import('/src/main.js');m.state().drafts.city={step:0,passed:[],data:{}};await m.enter(3,0);});await ready();assert.equal(await p.locator('#observation-speed').count(),0);await auto.tap();
 await p.waitForFunction(()=>document.querySelector('#observation-auto').getAttribute('aria-pressed')==='false',null,{timeout:10000});
 const cityWork=()=>p.evaluate(async()=>(await import('/src/main.js')).state().drafts.city.data.adventure.chapters[0].work[0]);
 const city=await cityWork();assert.deepEqual(city.seen,{before:true,after:true});assert.deepEqual(city.pairs,[]);assert.equal(await p.locator('#next').isDisabled(),true);results.observationHandsOffToLearnerChoice=true;
 const fit=await p.locator('.adventure-footer').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,buttons:[...e.querySelectorAll('button,input,select')].filter(e=>e.checkVisibility()).map(e=>({id:e.id,r:e.getBoundingClientRect().toJSON()}))}));assert.ok(fit.scroll<=fit.height+2);assert.ok(fit.buttons.every(x=>x.r.bottom<=375));
 await p.screenshot({path:`${out}/city-after-observation.png`});
 await tap(230,584);await tap(900,442);assert.deepEqual((await cityWork()).pairs,[]);results.wrongAnswerStillRejected=true;
 await tap(230,584);await tap(300,442);assert.deepEqual((await cityWork()).pairs,[0]);
 assert.deepEqual(errors,[]);console.log(JSON.stringify(results));
}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
