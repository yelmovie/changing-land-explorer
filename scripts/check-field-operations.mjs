import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/field-operations';
await fs.mkdir(out,{recursive:true});
const sizes=(process.env.CHECK_SIZES||'667x375,915x412,830x515,1024x600,1024x768,1280x800,1920x1080').split(',').map(size=>size.split('x').map(Number));
const operations={
 river:['observe:erosion','observe:transport','observe:deposit','bridge:bank','test','bridge:checked','test','move:east','move:east','move:east','move:east'],
 volcano:['crater','signed','shelter','station'],
 rocks:['ship:basalt','inspect:color','inspect:grain','ship:basalt','ship:granite','inspect:color','inspect:grain','ship:basalt'],
 city:['open','close','inside','notice'],
 safety:['run','cover','hold','stopped','assembly']
};
const results=[],errors=[],httpErrors=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
async function inspect(page,label){
 await page.evaluate(()=>Promise.all([...document.querySelectorAll('#operation-board img')].map(img=>img.decode())));
 await page.waitForTimeout(80);
 const issues=await page.evaluate(()=>{
  const issues=[],app=document.querySelector('#app');
  const inside=r=>r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
  for(const e of [document.documentElement,app,document.querySelector('#operation-board')]){
   if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)issues.push('scroll '+e.tagName+'.'+e.className);
  }
  for(const button of document.querySelectorAll('button')){
   if(!button.checkVisibility())continue;
   const r=button.getBoundingClientRect(),label=button.textContent.trim()||button.ariaLabel;
   if(!inside(r))issues.push('outside '+label);
   else if(!button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))issues.push('covered '+label);
   if(r.width<47.5||r.height<47.5)issues.push('small '+label);
  }
  for(const e of document.querySelectorAll('.operation-heading h1,.operation-task,#operation-message,.operation-win')){
   if(!e.checkVisibility())continue;
   if(!inside(e.getBoundingClientRect()))issues.push('text outside '+e.className);
  }
  return issues;
 });
 results.push({label,issues});
 if(issues.length||/-(start|done)$/.test(label))await page.screenshot({path:`${out}/${label}.png`,animations:'disabled'});
}
try{
 for(const [width,height]of sizes){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
  await page.goto(process.env.CHECK_URL||'http://localhost:5177');
  await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
  for(const [index,[id,actions]]of Object.entries(operations).entries()){
   await page.evaluate(async({index,id})=>{
    const main=await import('/src/main.js');
    main.state().drafts[id]={step:1,passed:[],data:{}};
    await main.navigate('operation',{index});
   },{index,id});
   await page.waitForSelector('#operation-board');await page.evaluate(()=>document.fonts.ready);
   await inspect(page,`${width}x${height}-${id}-start`);
   for(const [n,action]of actions.entries()){
    await page.locator(`[data-operation="${action}"]`).click();
    await inspect(page,`${width}x${height}-${id}-${n}`);
   }
   assert.equal(await page.locator('#operation-finish').isVisible(),true);
   await inspect(page,`${width}x${height}-${id}-done`);
   await page.locator('#operation-retry').click();
   assert.equal(await page.locator('#operation-finish').isVisible(),false);
   if(id==='river'||id==='rocks'){
    await page.locator('#operation-speed').selectOption('0.5');
    await page.locator('#operation-auto').click();
    await page.locator('#operation-auto').click();
    await page.waitForTimeout(700);
    const observed=await page.evaluate(async id=>(await import('/src/main.js')).state().drafts[id].data.fieldOperation.observed,id);
    assert.equal(observed.length,1,'pausing holds the current observation');
    await page.locator('#operation-speed').selectOption('3');
    await page.locator('#operation-auto').click();
    await page.locator('#operation-auto').waitFor({state:'hidden'});
    const saved=await page.evaluate(async id=>(await import('/src/main.js')).state().drafts[id].data.fieldOperation,id);
    assert.equal(saved.step,id==='river'?1:0,'autoplay stops before choosing an answer');
    assert.equal(saved.choice,null);
    assert.equal(saved.done,false);
    await inspect(page,`${width}x${height}-${id}-auto-handoff`);
   }
  }
  await context.close();console.log(`Checked operations at ${width}x${height}`);
 }
}finally{
 await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors,httpErrors},null,2));await browser.close();
}
console.log(`${results.filter(r=>!r.issues.length).length}/${results.length} operation states fit; ${errors.length} runtime errors.`);
if(results.some(r=>r.issues.length)||errors.length||httpErrors.length)process.exitCode=1;
