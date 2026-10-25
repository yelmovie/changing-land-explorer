// Run with an installed Playwright or PLAYWRIGHT_PATH pointing at its index.mjs.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const base=process.env.CHECK_URL||'http://localhost:5177';
const out=process.env.CHECK_OUT||'.work/learning-verification';await fs.mkdir(out,{recursive:true});
const results=[],errors=[],loading=[],sizes=[[1024,768],[1280,720],[1920,1080]].filter(s=>!process.env.CHECK_VIEWPORT||s.join('x')===process.env.CHECK_VIEWPORT);
const browser=await chromium.launch({channel:'chrome',headless:true});
const ids=['river','volcano','rocks','city','safety'];
async function record(page,label,scope='body',{scroll=false,shot=false}={}){
 const data=await page.locator(scope).evaluate((root,{scroll})=>{
  const r=root.getBoundingClientRect(),vis=e=>e.getClientRects().length&&!e.closest('[hidden]'),issues=[];
  const inside=b=>b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;
  if(!inside(r))issues.push('surface outside viewport');
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push('page horizontal overflow');
  if(root.matches('dialog')&&(Math.abs(r.top+r.height/2-innerHeight/2)>2))issues.push('dialog off center');
  const body=root.querySelector('.dialog-body');
  if(body&&!scroll&&body.scrollHeight>body.clientHeight+2)issues.push('unnecessary dialog scroll');
  for(const control of root.querySelectorAll(':scope > .dialog-footer button'))if(!inside(control.getBoundingClientRect()))issues.push('dialog footer control outside viewport: '+control.textContent);
  const controls=[...root.querySelectorAll('button,input')].filter(vis).map(e=>{
   const b=e.getBoundingClientRect();
   if(!scroll&&(!inside(b)))issues.push('control outside viewport: '+(e.textContent||e.getAttribute('aria-label')));
   if(b.width<47.5||b.height<47.5)issues.push('touch target under 48px: '+(e.textContent||e.getAttribute('aria-label')));
   return {text:(e.textContent||e.getAttribute('aria-label')||'').trim(),w:b.width,h:b.height};
  });
  if(!scroll){
   for(const a of root.querySelectorAll('p'))if(vis(a)&&parseFloat(getComputedStyle(a).fontSize)<19.9)issues.push('body text under 20px: '+a.textContent);
  }
  const heading=root.querySelector('.task-copy'),phases=root.querySelector('.phase-path');
  const activity=root.querySelector('#activity'),canvas=activity?.querySelector('canvas');
  if(canvas){const a=activity.getBoundingClientRect(),b=canvas.getBoundingClientRect();if(b.left<a.left-1||b.top<a.top-1||b.right>a.right+1||b.bottom>a.bottom+1)issues.push('activity canvas clipped');}
  if(heading&&phases&&heading.getBoundingClientRect().right>phases.getBoundingClientRect().left+1)issues.push('goal overlaps phase navigation');
  return {issues,controls,rect:{x:r.x,y:r.y,w:r.width,h:r.height},dialogScroll:body?body.scrollHeight-body.clientHeight:0};
 },{scroll});
 const pass=!data.issues.length;results.push({label,pass,...data});
 if(!pass||shot)await page.screenshot({path:`${out}/${label}.png`,animations:'disabled'});
 if(!pass)console.log('FAIL',label,data.issues.join('; '));
}
async function enter(page,index,step,phase){
 await page.evaluate(async({index,step,phase})=>{
  const m=await import('/src/main.js'),id=['river','volcano','rocks','city','safety'][index],s=m.state();
  s.drafts[id]={step,passed:[],data:{adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};
  m.enter(index,step);
 },{index,step,phase});
 await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 // Phaser's parent resize event settles after the DOM controls have their final height.
 await page.waitForFunction(()=>{const a=document.querySelector('#activity')?.getBoundingClientRect(),b=document.querySelector('#activity canvas')?.getBoundingClientRect();return a&&b&&b.top>=a.top-1&&b.bottom<=a.bottom+1&&b.left>=a.left-1&&b.right<=a.right+1;});
}
try{
 for(const [width,height]of sizes){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#settings');
  loading.push(await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {width:innerWidth,height:innerHeight,domReadyMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd,uiObservedMs:performance.now(),transferBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0)};}));
  await record(page,`${width}-welcome`,'#app',{shot:true});
  await page.locator('#settings').click();await record(page,`${width}-settings`,'dialog',{scroll:true});
  await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#preview-nav');
  await record(page,`${width}-map`,'#app',{shot:true});
  await page.locator('#preview-nav').click();await record(page,`${width}-preview`,'dialog',{scroll:true});await page.locator('.dialog-close').click();
  for(let index=0;index<5;index++)for(let step=0;step<2;step++)for(let phase=0;phase<3;phase++){
   const key=`${width}-${ids[index]}-${step}-${phase}`;await enter(page,index,step,phase);
   await record(page,key,'#app',{shot:width===1280});
   await page.locator('#river-hint').click();await record(page,key+'-hint','dialog');await page.locator('.dialog-close').click();
   if(phase===0){
    await page.locator('#concept-review').click();await record(page,key+'-concept','dialog',{shot:width===1280});
    await page.locator('video').evaluate(v=>{if(!v.paused)throw Error('Reduced-motion video autoplayed');});
    await page.locator('#concept-play').click();await page.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=2&&v.currentTime>0;});
    const video=await page.locator('video').evaluate(v=>({duration:v.duration,muted:v.muted,width:v.videoWidth,height:v.videoHeight}));
    results.push({label:key+'-media',pass:Math.abs(video.duration-8)<.1&&video.muted&&video.width===1280,...video});
    await page.locator('#concept-continue').click();await page.waitForFunction(()=>!document.querySelector('dialog'));
   }
  }
  for(const mode of ['assembly','ending','certificate']){
   await page.evaluate(async(mode)=>{await(await import('/src/main.js')).navigate('final',mode);},mode);
   await record(page,`${width}-final-${mode}`,'#app',{scroll:mode==='ending',shot:width===1280});
  }
  await context.close();console.log(`Checked ${width}x${height}: 30 phases, hints, concepts, common pages`);
 }
}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors,loading},null,2));}
const failed=results.filter(r=>!r.pass);console.log(`${results.length-failed.length}/${results.length} checks passed; ${errors.length} runtime errors.`);
if(failed.length||errors.length)process.exitCode=1;
