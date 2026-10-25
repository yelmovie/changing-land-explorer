// Opens the rock 3D viewer in headless Chrome against the dev server.
// Needs a running `npm run dev` and Playwright (PLAYWRIGHT_PATH = its index.mjs).
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const base=process.env.CHECK_URL||'http://localhost:5177',out=process.env.CHECK_OUT||'.work/rock3d-check';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[],ok=(name,pass,extra='')=>{results.push({name,pass,extra});console.log(`${pass?'PASS':'FAIL'} ${name}${extra?' · '+extra:''}`);};
try{
 const page=await (await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'})).newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForSelector('#settings');
 // Teacher preview opens every place; the entry helper below mirrors check-learning-ui.
 await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#preview-nav');
 const enter=(index,step,phase)=>page.evaluate(async({index,step,phase})=>{const m=await import('/src/main.js'),id=['river','volcano','rocks','city','safety'][index];m.state().drafts[id]={step,passed:[],data:{adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};m.enter(index,step);},{index,step,phase});
 const models=await page.evaluate(async()=>{const m=await import('/src/rock3d.js');return Promise.all(['rock-0','rock-1','rock-2','rock-3'].map(a=>m.hasRockModel(a)));});
 for(const [phase,asset] of [[1,0],[2,1]]){
  await enter(2,0,phase);await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(800);
  const shown=await page.locator('#rock-3d').count()>0;
  ok(`rock-${asset} 버튼 표시가 모델 유무와 같음`,shown===models[asset],`모델 ${models[asset]?'있음':'없음'} · 버튼 ${shown?'있음':'없음'}`);
  if(!shown)continue;
  await page.click('#rock-3d');await page.waitForSelector('dialog.rock3d-dialog');
  const loaded=await page.waitForFunction(()=>document.querySelector('.rock3d-status')?.hidden||/못했어|쓸 수 없어/.test(document.querySelector('.rock3d-status')?.textContent),null,{timeout:20000}).then(()=>page.evaluate(()=>document.querySelector('.rock3d-status').hidden));
  ok(`rock-${asset} 3D 표본 불러오기`,loaded,await page.evaluate(()=>document.querySelector('.rock3d-status').textContent));
  await page.waitForTimeout(600);await page.screenshot({path:`${out}/rock-${asset}-open.png`});
  const box=await page.locator('.rock3d-stage canvas').boundingBox();
  if(box){await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+180,box.y+box.height/2+40,{steps:12});await page.mouse.up();}
  await page.click('[data-rock3d="in"]');await page.waitForTimeout(500);await page.screenshot({path:`${out}/rock-${asset}-turned.png`});
  ok(`rock-${asset} 3D 화면 크기`,!!box&&box.width>=480&&box.height>=360,box?`${Math.round(box.width)}x${Math.round(box.height)}`:'캔버스 없음');
  await page.click('.dialog-close');await page.waitForFunction(()=>!document.querySelector('dialog.rock3d-dialog'));
  ok(`rock-${asset} 닫으면 3D 캔버스 정리`,await page.locator('.rock3d-stage canvas').count()===0);
 }
}finally{await browser.close();}
ok('런타임 오류 없음',!errors.length,errors.join(' | '));
await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
