import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href);
const out='.work/request-fixes-20261025/records-transfer';await fs.mkdir(out,{recursive:true});
const source=JSON.parse(await fs.readFile('.work/request-fixes-20261025/full-flow/flow-student-state.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[];let context,page;
async function open(width=1280,height=800){await context?.close();context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block',hasTouch:true});await context.addInitScript(s=>{if(!sessionStorage.getItem('test-loaded')){localStorage.setItem('moving-geovalley-v3',JSON.stringify(s));sessionStorage.setItem('test-loaded','yes');}},source);page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5177');await page.waitForSelector('#settings');}
async function library(){await page.evaluate(async()=>{const m=await import('/src/main.js');m.state().final={assembled:true,round:2,selected:{},transferSafety:{}};await m.navigate('final');});await page.waitForSelector('#route-test');}
async function svgPoints(points){return page.locator('#activity svg').evaluate((svg,ps)=>ps.map(p=>{const q=new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};}),points);}
async function draw(points){const ps=await svgPoints(points);await page.mouse.move(ps[0].x,ps[0].y);await page.mouse.down();for(const p of ps.slice(1))await page.mouse.move(p.x,p.y,{steps:12});await page.mouse.up();}
async function hold(i,axis,value){const button=page.locator('#route-dir-'+i),b=await button.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForFunction(({axis,value,i})=>{const p=document.querySelector('#route-lines polyline[stroke="#d49931"]')?.getAttribute('points')?.trim().split(' ').at(-1)?.split(',').map(Number);return p&&(i===1?p[axis]<=value:p[axis]>=value);},{axis,value,i},{timeout:10000});await page.mouse.up();}
async function check(){await page.locator('#route-test').click();await page.waitForFunction(()=>document.querySelector('#next')?.disabled===false,null,{timeout:20000});}
async function screenshot(label){await page.waitForTimeout(400);await page.screenshot({path:out+'/'+label+'.png'});const v=await page.evaluate(()=>({w:innerWidth,h:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,controls:[...document.querySelectorAll('#controls button,#next')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,w:e.offsetWidth,h:e.offsetHeight,bottom:e.getBoundingClientRect().bottom}))}));assert.equal(v.overflow,false);for(const b of v.controls){assert.ok(b.w>=48&&b.h>=48);assert.ok(b.bottom<=v.h+1);}return v;}
try{
 for(const [width,height,mode]of [[1280,800,'drag'],[1024,768,'waypoints'],[768,1024,'hold']]){
  await open(width,height);await library();
  // An unsafe long segment must stop before awarding completion, in every size.
  await draw([{x:120,y:410},{x:880,y:100}]);await page.locator('#route-test').click();await page.waitForFunction(()=>!document.querySelector('#route-test').disabled);assert.equal(await page.locator('#next').isDisabled(),true);await page.locator('#route-reset').click();
  const path=[{x:120,y:410},{x:180,y:410},{x:180,y:100},{x:880,y:100}];
  if(mode==='drag')await draw(path);
  if(mode==='waypoints'){await page.locator('#route-points').click();for(const p of await svgPoints(path))await page.touchscreen.tap(p.x,p.y);}
  if(mode==='hold'){await page.locator('#route-keys').click();await hold(3,0,180);await hold(1,1,100);await hold(3,0,880);await page.locator('#route-key-save').click();}
  await check();const metrics=await screenshot(`${width}-${height}-library-${mode}`);
  const saved=await page.evaluate(async()=>(await import('/src/main.js')).state().final.transferSafety);assert.equal(saved.outsideRouteDone,true);
  await page.reload();await page.waitForSelector('#route-test');assert.equal(await page.locator('#next').isDisabled(),false);
  results.push({test:'library',width,height,mode,waypoints:saved.outsideRoute.length,reloaded:true,unsafeRouteRejected:true,metrics});
 }
 // Review real earned observations, and ensure all images resolve at each size.
 for(const [width,height]of [[1024,768],[1280,800],[768,1024]]){
  await open(width,height);
  for(const [index,id]of ['river','volcano','city'].entries()){
   const stage={river:0,volcano:1,city:3}[id];await page.evaluate(async i=>(await import('/src/main.js')).enter(i),stage);await page.waitForSelector('#notebook');await page.locator('#notebook').click();
   const text=await page.locator('dialog').textContent();assert.ok(text.includes('재현한 그림'));
   if(id==='city'){const headings=await page.locator('dialog .evidence-image svg > text').allTextContents();assert.ok(headings.includes('복구 · 안전 확인 뒤'));assert.ok(headings.includes('아주 오랜 시간 뒤'));}
   const images=await page.locator('dialog svg image').evaluateAll(async els=>Promise.all(els.map(e=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({ok:i.naturalWidth>0});i.onerror=()=>resolve({ok:false,href:e.getAttribute('href')});i.src=e.getAttribute('href');}))));assert.ok(images.every(i=>i.ok));
   await page.screenshot({path:out+`/${width}-${height}-${id}-notebook.png`});await page.locator('.dialog-close').click();
  }
  // Preview modifications and reward collection must leave raw student storage intact.
  const before=await page.evaluate(()=>localStorage.getItem('moving-geovalley-v3'));await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#exit-preview');
  await page.evaluate(async()=>{const m=await import('/src/main.js');m.state().drafts.city.data.citySeen.airport={before:false,after:false};m.state().finished=true;m.save();await m.navigate('final','ending');});
  assert.equal(await page.evaluate(()=>localStorage.getItem('moving-geovalley-v3')),before);await page.locator('#exit-preview').click();assert.equal(await page.evaluate(()=>localStorage.getItem('moving-geovalley-v3')),before);
  await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#exit-preview');await page.reload();await page.waitForSelector('#settings');assert.equal(await page.locator('#exit-preview').count(),0);
  const after=await page.evaluate(async()=>(await import('/src/main.js')).state());assert.deepEqual(after.completed,source.completed);results.push({test:'records-preview',width,height,rawStudentPreserved:true,previewReloadRestoresStudent:true});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({results,errors,realTablet:false},null,2));console.log('PASS records / transfer: '+results.length+' scenarios');
}catch(e){await page?.screenshot({path:out+'/failure.png'});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,results},null,2));console.error(e);process.exitCode=1;}finally{await browser.close();}
