// Operating controls must fit without page OR panel scrolling.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const base=process.env.CHECK_URL||'http://localhost:5177',out=process.env.CHECK_OUT||'.work/activity-fit-20261108/layout';
await fs.mkdir(out,{recursive:true});
const sizes=(process.env.CHECK_SIZES||'667x375,915x412,1024x768,1280x800,1920x1080').split(',').map(s=>s.split('x').map(Number));
const ids=['river','volcano','rocks','city','safety'],results=[],errors=[];
const completed=process.env.CHECK_COMPLETED_STATE?JSON.parse(await fs.readFile(process.env.CHECK_COMPLETED_STATE,'utf8')):null;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height]of sizes){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block',hasTouch:true});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.locator('#settings').click();await p.locator('#admin-setting').evaluate(e=>e.click());await p.waitForSelector('#preview-nav');
  for(let index=0;index<5;index++)for(let step=0;step<2;step++)for(let phase=0;phase<3;phase++){
   await p.evaluate(async({index,step,phase,saved})=>{
    const m=await import('/src/main.js'),id=['river','volcano','rocks','city','safety'][index];
    const data=saved?structuredClone(saved):{adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}};
    if(saved)data.adventure.chapters[step].phase=phase;
    m.state().drafts[id]={step,passed:[],data};
    await m.enter(index,step);
   },{index,step,phase,saved:completed?.drafts[ids[index]]?.data||completed?.records[ids[index]]?.data});
   await p.waitForSelector('#activity canvas');await p.waitForFunction(()=>!document.querySelector('.stage-loader'));
   await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   await p.waitForTimeout(100);
   const data=await p.evaluate(()=>{
    const issues=[],rect=e=>e.getBoundingClientRect(),visible=e=>e.checkVisibility()&&rect(e).width>0,inside=r=>r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
    if(document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1)issues.push('page scroll');
    const controls=[...document.querySelectorAll('.adventure-footer button,.adventure-footer input,.adventure-footer select,.topbar button,.topbar summary')].filter(visible);
    for(const e of controls){const r=rect(e),name=e.id||e.textContent;
     if(!inside(r))issues.push('outside '+name);
     if(r.width<47.5||r.height<47.5)issues.push('small '+name);
     if(!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))issues.push('covered '+name);
    }
    for(const e of document.querySelectorAll('.adventure-footer,.controls,.river-narrator>div,.adventure-toolbar'))if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)issues.push('panel overflow '+e.className);
    const a=rect(document.querySelector('#activity')),c=rect(document.querySelector('#activity canvas')),footer=rect(document.querySelector('.adventure-footer')),h=rect(document.querySelector('.adventure-heading'));
    if(c.top<a.top-2||c.bottom>a.bottom+2||c.left<a.left-2||c.right>a.right+2)issues.push('canvas clipped');
    const overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1;
    if(overlap(c,footer))issues.push('experiment covered by controls');
    for(const e of document.querySelectorAll('.topbar .nav-group'))if(overlap(h,rect(e)))issues.push('heading covers navigation');
    const texts=[...document.querySelectorAll('#instruction,#speech,.phase-node b')].filter(visible).map(e=>e.textContent.trim());
    if(new Set(texts).size!==texts.length)issues.push('duplicate instruction');
    return{issues,canvas:{w:c.width,h:c.height},controls:controls.map(e=>e.id||e.textContent.trim()),speech:document.querySelector('#speech').textContent,footer:{height:footer.height,contentHeight:document.querySelector('.adventure-toolbar').scrollHeight}};
   });
   const label=`${width}x${height}-${ids[index]}-${step}-${phase}`;results.push({label,...data});
   if(data.issues.length||step===0&&phase===0||width===1280&&phase===1)await p.screenshot({path:`${out}/${label}.png`,animations:'disabled'});
   if(data.issues.length)console.log('FAIL',label,data.issues.join('; '));
  }
  console.log(`Checked ${width}x${height}`);await context.close();
 }
}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
console.log(`${results.filter(r=>!r.issues.length).length}/${results.length} scenes fit without scrolling; ${errors.length} runtime errors.`);
if(results.some(r=>r.issues.length)||errors.length)process.exitCode=1;
