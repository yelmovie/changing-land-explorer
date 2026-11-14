import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {fresh,SAVE_KEY,STAGES} from '../src/model.js';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Users/yel/.local/node/lib/node_modules/playwright/index.mjs').href);
const out=process.env.CHECK_OUT||'.work/map-combat/qa';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[];
const url=process.env.CHECK_URL||'http://localhost:5177';
const completed=STAGES.map(stage=>stage.id);
async function setup(width,height,{node=0,reduce=true,fallback=false,stages=completed}={}){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:reduce?'reduce':'no-preference',serviceWorkers:'block'});const seed=fresh();seed.started=true;seed.location={type:'map'};seed.sound=false;seed.mapNode=node;seed.completed=[...stages];
 await context.addInitScript(({seed,key,fallback})=>{if(!sessionStorage.combatQA){sessionStorage.combatQA='1';localStorage.setItem(key,JSON.stringify(seed));}window.__audioPlays=0;HTMLMediaElement.prototype.play=function(){window.__audioPlays++;return Promise.resolve();};if(fallback)Object.defineProperty(window,'Phaser',{get:()=>undefined,set:()=>{},configurable:true});},{seed,key:SAVE_KEY,fallback});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto(url);await p.waitForSelector(fallback?'.map-fallback':'.map-ready');return {context,p};
}
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY);
try{
 const first=await setup(1024,768,{stages:[]});
 assert.equal(await first.p.locator('.map-villain').count(),0,'optional enemies appear only after the relevant observations');
 assert.equal(await first.p.locator('#map-attack').isVisible(),false,'first map has no attack control');
 assert.match(await first.p.locator('[data-stage="1"]').getAttribute('class'),/locked/);
 await first.p.locator('#stage-shortcuts').tap();await first.p.locator('#mission-enter').tap();await first.p.waitForSelector('#activity canvas');assert.equal((await state(first.p)).location.type,'stage');
 await first.context.close();
 for(const [width,height]of [[667,375],[915,412],[768,1024],[1280,800],[1920,1080]]){
  const {context,p}=await setup(width,height,{reduce:width!==1280});
  assert.equal(await p.locator('#map-attack').isVisible(),false,'out-of-range attack control stays hidden');
  await p.keyboard.press('KeyJ');assert.equal((await state(p)).mapVillains.hits.river,0,'attack out of range does not hit');
  await p.locator('#map-villain-focus').tap();await p.waitForTimeout(450);const foe=p.locator('[data-villain="river"]'),r=await foe.boundingBox();
  assert.ok(r.width>=48&&r.height>=48&&r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,'first enemy is visible');
  await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+r.width/2+45,r.y+r.height/2,{steps:8});await p.mouse.up();assert.equal((await state(p)).mapNode,0,'drag does not trigger enemy approach');
  await p.locator('#map-villain-focus').tap();await p.waitForTimeout(450);await foe.tap();
  await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).mapNode===1,SAVE_KEY);assert.equal((await state(p)).mapVillains.hits.river,0,'clicking villain only moves River');
  await p.locator('#map-attack').waitFor({state:'visible'});
  const attack=await p.locator('#map-attack').boundingBox();assert.ok(attack.width>=48&&attack.height>=48&&attack.x>=0&&attack.y>=0&&attack.x+attack.width<=width&&attack.y+attack.height<=height);
  await p.locator('#map-attack').focus();await p.keyboard.press('KeyJ');await p.waitForTimeout(60);assert.equal((await state(p)).mapVillains.hits.river,1);assert.equal(await p.locator('.map-combat-river').isVisible(),true);assert.equal(await foe.getAttribute('data-frame'),'4');
  await p.keyboard.press('KeyJ');assert.equal((await state(p)).mapVillains.hits.river,1,'cooldown rejects repeat');await p.screenshot({path:out+'/'+width+'-attack.png'});
  for(let n=2;n<=3;n++){await p.waitForTimeout(610);if(n===2)await p.locator('#map-attack').tap();else{await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press('Space');}assert.equal((await state(p)).mapVillains.hits.river,n);}
  await p.waitForTimeout(650);assert.equal(await foe.isVisible(),false);assert.equal(await p.evaluate(()=>window.__audioPlays),0);assert.deepEqual((await state(p)).completed,completed);
  await p.reload();await p.waitForSelector('.map-ready');assert.equal(await p.locator('[data-villain="river"]').isVisible(),false);assert.match(await p.locator('#map-villain-focus').getAttribute('aria-label'),/1마리 물리침/);
  // Every foe can be approached with a native button and defeated through attack, not click removal.
  for(const [id,node]of [['volcano',10],['rocks',16],['city',20],['safety',25]]){
   await p.locator('#map-villain-focus').tap();await p.waitForTimeout(450);const v=p.locator('[data-villain="'+id+'"]');await v.press('Enter');
   await p.waitForFunction(({key,node})=>JSON.parse(localStorage.getItem(key)).mapNode===node,{key:SAVE_KEY,node},{timeout:20000});
   for(let i=0;i<3;i++){await p.locator('#map-attack').tap();await p.waitForTimeout(610);}
   assert.equal((await state(p)).mapVillains.hits[id],3,id+' defeated');
  }
  assert.deepEqual((await state(p)).completed,completed);assert.equal((await state(p)).finished,false);
  await p.locator('#map-overview').tap();assert.equal(await p.locator('#map-overview').getAttribute('aria-pressed'),'true');await p.locator('#map-hand').tap();
  await p.screenshot({path:out+'/'+width+'-clear.png'});await p.reload();await p.waitForSelector('.map-ready');assert.equal(await p.locator('.map-villain:not([hidden])').count(),0);
  await p.locator('#stage-shortcuts').tap();await p.waitForSelector('.final-scene');assert.equal((await state(p)).location.type,'final');
  results.push({width,height,attack:'touch + J + Space',proximity:true,cooldown:true,approach:true,dragGuard:true,allFiveDefeated:true,persistence:true,mute:true,learningGate:true,stageEntry:true});await context.close();
 }
 for(const fallback of [false,true]){
  const {context,p}=await setup(667,375,{node:2,fallback});
  await p.waitForFunction(()=>document.querySelector('.map-combat-river')?.dataset.frame==='4',{},{timeout:15000});
  assert.equal((await state(p)).mapVillains.health,3);
  assert.equal(await p.locator('#map-combat-retry').count(),0);
  assert.deepEqual((await state(p)).completed,completed);
  await p.screenshot({path:out+(fallback?'/fallback':'/collision')+'-reaction.png'});
  results.push({fallback,contactReaction:true,progressUnchanged:true});await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS GeoValley combat '+results.length+' scenarios');
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));await browser.close();}
