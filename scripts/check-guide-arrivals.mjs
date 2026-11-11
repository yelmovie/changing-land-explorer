import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {fresh,SAVE_KEY,STAGES} from '../src/model.js';
import {guideRecordings} from '../src/guide-recordings.js';
import {OPERATIONS} from '../src/field-operation-model.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const base=process.env.CHECK_URL||'http://localhost:5177';
const out=process.env.CHECK_OUT||'.work/guide-arrivals';
const sizes=(process.env.CHECK_SIZES||'667x375,915x412,1280x800,768x1024').split(',').map(s=>s.split('x').map(Number));
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[],decoded=[];
await fs.mkdir(out,{recursive:true});
try{
 for(const [width,height] of sizes){
  for(const [index,stage] of STAGES.entries()){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
   const seed=fresh();seed.started=true;seed.sound=true;seed.completed=STAGES.slice(0,index).map(s=>s.id);
   seed.mapNode=[6,9,15,19,24][index];seed.location={type:'map'};
   await context.addInitScript(({seed,key})=>{
    localStorage.setItem(key,JSON.stringify(seed));
    window.guidePlays=[];
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
     if(this.src.includes('/guide-intro-'))window.guidePlays.push(this);
     return play.call(this);
    };
   },{seed,key:SAVE_KEY});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   await page.goto(base);await page.locator('#dpad-center.enter').waitFor();
   await page.locator('#dpad-center').click();await page.locator('#mission-enter').waitFor();
   const recording=guideRecordings[`guide-intro-${stage.id}`];
   assert.equal(await page.locator('.mission-preview+p').textContent(),recording.text);
   assert.ok((await page.locator('.mission-reward').textContent()).includes(OPERATIONS[stage.id].title));
   await page.waitForFunction(file=>window.guidePlays.some(a=>a.src.endsWith(file)&&a.currentTime>.05&&!a.paused),recording.file);
   assert.equal(await page.evaluate(()=>window.guidePlays.length),1);
   await page.evaluate(()=>document.fonts.ready);
   const issues=await page.locator('dialog').evaluate(dialog=>{
    const issues=[],body=dialog.querySelector('.dialog-body');
    if(body.scrollHeight>body.clientHeight+1||body.scrollWidth>body.clientWidth+1)issues.push('dialog body scrolls');
    for(const element of dialog.querySelectorAll('p,button,.mission-reward')){
     const r=element.getBoundingClientRect();
     if(r.left<0||r.top<0||r.right>innerWidth||r.bottom>innerHeight)issues.push('outside viewport '+element.tagName);
     if(element.tagName==='BUTTON'&&(r.width<48||r.height<48))issues.push('touch target too small');
    }
    return issues;
   });
   await page.screenshot({path:`${out}/${width}-${stage.id}.png`});
   await page.locator('.dialog-close').click();
   await page.locator('dialog').waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>window.guidePlays.every(a=>a.paused&&a.currentTime===0)),true);
   if(!decoded.length){
    decoded.push(...await page.evaluate(async recordings=>{
     const audio=new AudioContext(),rows=[];
     for(const [id,line] of Object.entries(recordings)){
      const response=await fetch('/assets/voices/'+line.file);
      const buffer=await audio.decodeAudioData(await response.arrayBuffer());
      rows.push({id,ok:response.ok,duration:buffer.duration,expected:line.duration});
     }
     await audio.close();return rows;
    },guideRecordings));
   }
   results.push({width,height,id:stage.id,caption:recording.text,file:recording.file,issues,played:true,stoppedOnClose:true});
   await context.close();
  }
 }
 assert.equal(results.filter(r=>r.issues.length).length,0,JSON.stringify(results.filter(r=>r.issues.length)));
 assert.equal(decoded.length,27);
 assert.ok(decoded.every(r=>r.ok&&Math.abs(r.duration-r.expected)<.2));
 assert.deepEqual(errors,[]);
 console.log(`PASS ${results.length} arrival dialogs, matching captions, real playback, stop on close; 27 audio files decoded.`);
}finally{
 await browser.close();
 await fs.writeFile(`${out}/results.json`,JSON.stringify({base,results,decoded,errors},null,2)+'\n');
}
