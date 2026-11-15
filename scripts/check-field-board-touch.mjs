import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';
import {FIELD_POINTS} from '../src/learning-model.js';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href),browser=await chromium.launch({channel:'chrome',headless:true});const out=process.env.CHECK_OUT||'.work/phone-accessibility';await fs.mkdir(out,{recursive:true});const results=[];
try{for(const [width,height]of [[1024,768],[915,412],[667,375]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.CHECK_URL||'http://localhost:5277');await p.locator('#settings').click();await p.locator('#admin-setting').evaluate(e=>e.click());
 async function enter(id,index,step,phase,data={}){await p.evaluate(async args=>{const {id,index,step,phase,data}=args,m=await import('/src/main.js');m.state().drafts[id]={step,passed:[],data:{...data,adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};m.enter(index,step);},{id,index,step,phase,data});await p.waitForSelector('#activity canvas');await p.waitForFunction(()=>!document.querySelector('.stage-loader'));}
 async function sizes(selector){const a=await p.locator(selector).evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,f:parseFloat(getComputedStyle(e).fontSize)})));assert.ok(a.length&&a.every(x=>x.w>=48&&x.h>=48&&x.f>=20));}
 let evidence={};for(let phase=0;phase<2;phase++){await enter('river',0,1,phase,{evidence});for(const point of FIELD_POINTS.filter(p=>p.side===(phase?'lower':'upper'))){const b=await p.locator('#activity canvas').boundingBox();await p.touchscreen.tap(b.x+point.x/1000*b.width,b.y+point.y/560*b.height);}await p.waitForSelector('#next.ready');evidence=await p.evaluate(async()=>structuredClone((await import('/src/main.js')).state().drafts.river.data.evidence));}
 const spot=async(x,y)=>{const b=await p.locator('#activity canvas').boundingBox();return {x:Math.round(b.x+b.width*x/1200),y:Math.round(b.y+b.height*y/640)};};
 const touch=await c.newCDPSession(p);
 async function tap(x,y){const pt=await spot(x,y);await p.touchscreen.tap(pt.x,pt.y);}
 async function drag(...points){
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await spot(...points[0])]});
  for(const point of points.slice(1))await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[await spot(...point)]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 const field=()=>p.evaluate(async()=>{const d=(await import('/src/main.js')).state().drafts.river.data;return {deposition:d.adventure.chapters[1].work[2].deposition,link:d.fieldLink};});
 await enter('river',0,1,2,{evidence});
 await p.locator('#river-field-connect').tap();assert.equal(await p.locator('[data-field-card="deposit"]').isDisabled(),true);await p.locator('.dialog-close').tap();
 await drag([1072,494],[1040,456],[978,278]);assert.equal((await field()).deposition,false,'flag stays locked until all cards are placed');
 for(const [id,side]of [['upper-rock','upper'],['upper-slope','upper'],['lower-channel','lower'],['lower-sand','lower']]){
  await p.locator('#river-field-connect').tap();await sizes('[data-field-card]');await p.locator(`[data-field-card="${id}"]`).tap();await p.locator(`[data-field-side="${side==='upper'?'lower':'upper'}"]`).tap();assert.match(await p.locator('#field-choice-status').textContent(),/다시 비교/);await p.locator(`[data-field-side="${side}"]`).tap();
 }
 assert.match(await p.locator('#quest-meter').textContent(),/4 \/ 5/);
 assert.equal(await p.locator('.adventure-heading').textContent(),'네가 모은 단서로 강 지도를 완성해 봐');
 await p.screenshot({path:`${out}/${width}-flag-ready.png`});
 await drag([1072,494],[1040,456],[978,278],[550,260]);assert.equal((await field()).deposition,false,'crossing the target alone and dropping in the river does not plant the flag');
 if(width===667){await tap(1035,480);await tap(978,224);}
 else if(width===915){await drag([1072,494],[1040,456],[917,278]);}
 else {await drag([1072,490],[1040,456],[1053,201]);}
 await p.waitForSelector('#next.ready');
 assert.deepEqual(await field(),{deposition:true,link:'deposit'});
 await p.screenshot({path:`${out}/${width}-flag-planted.png`});
 for(let phase=0;phase<3;phase++){const site=['airport','farm','spa'][phase];await enter('city',3,1,phase,{evidence:{['city-'+site]:{pair:true}},notices:{}});
 // Tests below seed prior observation only; no student-completion claim.
 for(const [card,slot]of [[0,'picture'],[1,'reason'],[2,'action']]){await p.locator('#city-board-choose').tap();await sizes('[data-board-card]');if(card===2){await p.locator('[data-board-card="3"]').tap();await p.locator('[data-board-slot="action"]').tap();assert.match(await p.locator('#board-choice-status').textContent(),/다시 비교/);}await p.locator(`[data-board-card="${card}"]`).tap();await p.locator(`[data-board-slot="${slot}"]`).tap();}
 if(phase===0){await p.locator('#ash-mask-place').tap();await p.locator('[data-mask-place="face"]').tap();assert.match(await p.locator('#mask-choice-status').textContent(),/먼저/);await p.locator('.dialog-close').tap();await p.locator('#ash-window-close').tap();await p.locator('#ash-mask-place').tap();await sizes('[data-mask-place]');await p.locator('[data-mask-place="neck"]').tap();assert.match(await p.locator('#mask-choice-status').textContent(),/어디/);await p.locator('[data-mask-place="face"]').tap();}
 await p.waitForSelector('#next.ready');}
 assert.deepEqual(errors,[]);results.push({width,height,fieldObservation:true,fieldFiveLinks:true,flagInteraction:width===667?'tap':width===915?'touch-drag-pointer':'touch-drag-pole',cityThreeBoards:true,ashSafety:true,wrongRejected:true,minimum48px:true,errors});await c.close();
}await fs.writeFile(`${out}/field-board.json`,JSON.stringify(results,null,2));console.log('PASS field/board/ash touch at three sizes');}finally{await browser.close();}
