import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/activity-fit-20261108/playback';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:667,height:375},hasTouch:true,serviceWorkers:'block'}),p=await context.newPage(),errors=[],results={};
p.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await p.waitForSelector('#activity canvas');await p.waitForFunction(()=>!document.querySelector('.stage-loader'));await p.waitForTimeout(100);};
async function river(){await p.evaluate(async()=>{const m=await import('/src/main.js');m.state().started=true;m.state().drafts.river={step:0,passed:[],data:{}};await m.enter(0,0);});await ready();}
const work=()=>p.evaluate(async()=>{const d=(await import('/src/main.js')).state().drafts.river.data;return d.adventure.chapters[0].work[0];});
const auto=p.locator('#observation-auto'),speed=p.locator('#observation-speed');
try{
 await p.goto(process.env.CHECK_URL||'http://localhost:5177');await p.locator('#settings').waitFor();
 await river();await speed.selectOption('1');await auto.tap();await p.waitForTimeout(700);await auto.tap();const normal=(await work()).pour;
 assert.ok(normal>0&&normal<.3);const paused=JSON.stringify(await work());await p.waitForTimeout(300);assert.equal(JSON.stringify(await work()),paused);results.pauseFreezesWork=true;
 await river();await speed.selectOption('3');await auto.tap();await p.waitForTimeout(700);await auto.tap();const fast=(await work()).pour;assert.ok(fast>normal*2&&fast<1);results.measuredSpeedRatio=fast/normal;
 await auto.tap();await p.waitForTimeout(100);await speed.selectOption('0.5');assert.equal(await auto.getAttribute('aria-pressed'),'true');const mid=(await work()).pour;await p.waitForTimeout(300);assert.ok((await work()).pour>mid);results.speedChangesWithoutPausing=true;
 await p.locator('.activity-tools>summary').tap();assert.equal(await auto.getAttribute('aria-pressed'),'false');
 const tools=p.locator('.adventure-side-tools');const r=await tools.boundingBox();assert.ok(r.y+r.height<=375);await p.locator('#river-hint').tap();await p.locator('dialog').waitFor();const beforeHint=JSON.stringify(await work());await p.waitForTimeout(250);assert.equal(JSON.stringify(await work()),beforeHint);await p.locator('.dialog-close').tap();assert.equal(await p.locator('.activity-tools>summary').evaluate(e=>e===document.activeElement),true);results.toolsAndHintPauseAndRestoreFocus=true;
 await speed.selectOption('3');await auto.tap();await p.waitForSelector('#next.ready',{timeout:15000});assert.equal(await auto.getAttribute('aria-pressed'),'false');
 const finished=await p.evaluate(async()=>{const m=await import('/src/main.js');return structuredClone(m.state().drafts.river.data);});assert.equal(finished.adventure.chapters[0].phase,0);assert.equal(finished.runs.length,1);results.completionWaitsForNextClick=true;
 await auto.tap();await p.waitForTimeout(300);await auto.tap();const replayed=await p.evaluate(async()=>(await import('/src/main.js')).state().drafts.river.data);assert.deepEqual(replayed,finished);results.replayDoesNotRewriteEvidence=true;
 await p.reload();await ready();assert.equal((await work()).pour,1);assert.equal(await auto.getAttribute('aria-pressed'),'false');assert.equal(await p.locator('#next.ready').isVisible(),true);results.reloadPreservesCompletionWithoutRestartingPlayback=true;
 await p.locator('#settings').tap();await p.locator('#admin-setting').evaluate(e=>e.click());await p.locator('#preview-nav').waitFor();
 await p.evaluate(async()=>{const m=await import('/src/main.js');m.state().drafts.city={step:0,passed:[],data:{}};await m.enter(3,0);});await ready();await speed.selectOption('3');await auto.tap();
 await p.waitForFunction(()=>document.querySelector('#observation-auto').getAttribute('aria-pressed')==='false',{timeout:10000});
 const city=await p.evaluate(async()=>{const d=(await import('/src/main.js')).state().drafts.city.data;return d.adventure.chapters[0].work[0];});assert.deepEqual(city.seen,{before:true,after:true});assert.deepEqual(city.pairs,[]);assert.equal(await p.locator('#next').isDisabled(),true);assert.equal(await p.locator('#city-choose-record').evaluate(e=>e.classList.contains('suggested')),true);results.observationHandsOffToLearnerChoice=true;
 const fit=await p.locator('.adventure-footer').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,buttons:[...e.querySelectorAll('button,input,select')].filter(e=>e.checkVisibility()).map(e=>({id:e.id,r:e.getBoundingClientRect().toJSON()}))}));assert.ok(fit.scroll<=fit.height+2);assert.ok(fit.buttons.every(x=>x.r.bottom<=375));
 await p.screenshot({path:`${out}/city-after-observation.png`});await p.locator('#city-choose-record').tap();await p.locator('[data-city-card="0"]').tap();await p.locator('[data-city-period="1"]').tap();const wrong=await p.evaluate(async()=>(await import('/src/main.js')).state().drafts.city.data.adventure.chapters[0].work[0].pairs);assert.deepEqual(wrong,[]);results.wrongAnswerStillRejected=true;
 assert.deepEqual(errors,[]);console.log(JSON.stringify(results));
}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
