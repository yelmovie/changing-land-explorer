import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {CLASSROOM_HAZARDS} from '../src/adventure/safety.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/classroom-geometry-20261109';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{for(const [width,height]of [[390,844],[667,375],[915,412],[852,806],[1024,768],[1872,830],[1920,1080]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');
 await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
 await page.waitForSelector('.preview-banner');await page.waitForFunction(()=>window.Phaser?.Game);
 await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(target,args){const game=Reflect.construct(target,args);window.__qaGame=game;return game;}});});
 await page.evaluate(async()=>{(await import('/src/main.js')).enter(4,0);});
 await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(150);
 const geometry=await page.locator('.safety-classroom').evaluate(el=>{
  const view=el.getBoundingClientRect(),style=getComputedStyle(el,'::before');
  const [w,h]=style.backgroundSize.split(' ').map(parseFloat),[x,y]=style.backgroundPosition.split(' ').map(parseFloat);
  const objects=window.__qaGame.scene.getScene('Activity').children.list,hero=objects.find(o=>o.name==='classroom-companion');
  return {art:style.backgroundImage,view:{x:view.x,y:view.y,w:view.width,h:view.height},image:{x,y,w,h},sceneBackgrounds:objects.filter(o=>o.texture?.key==='classroom'&&o.visible).length,hero:{height:hero.displayHeight,bottom:hero.getBounds().bottom}};
 });
 assert.match(geometry.art,/safety-island-classroom-v2\.webp/);
 const {view,image}=geometry;
 assert.ok(image.x<=0&&image.y<=0&&image.x+image.w>=view.w-.1&&image.y+image.h>=view.h-.1,'the illustration covers the page');
 assert.equal(geometry.sceneBackgrounds,0);assert.equal(geometry.hero.height,270);assert.ok(geometry.hero.bottom<=640);
 await page.screenshot({path:`${out}/${width}x${height}-before.png`,animations:'disabled'});
 for(let i=0;i<CLASSROOM_HAZARDS.length;i++){
  const target=CLASSROOM_HAZARDS[i],r=await page.locator('#activity canvas').boundingBox(),screen=(x,y)=>({x:r.x+x*r.width/1200,y:r.y+y*r.height/640}),start=screen(400+i*360,565);
  const end={x:view.x+image.x+target.x/1200*image.w,y:view.y+image.y+(target.y+17.5)/675*image.h};
  assert.ok(end.x>=r.x&&end.x<=r.x+r.width&&end.y>=r.y&&end.y<=r.y+r.height,`${width}×${height}: ${target.id} is inside the playable area`);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();await page.waitForTimeout(120);
  const record=await page.evaluate(async id=>(await import('/src/main.js')).state().drafts.safety.data.evidence['safety-'+id],target.id);assert.ok(record);assert.equal(record.point.x,target.x/1200);assert.equal(record.point.y,(target.y+17.5)/675);
 }
 await page.waitForSelector('#next.ready');await page.screenshot({path:`${out}/${width}x${height}-placed.png`,animations:'disabled'});assert.deepEqual(errors,[]);results.push({width,height,geometry,dragTargetsAligned:true,errors});await context.close();
}}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
 console.log(`PASS classroom: ${results.length} sizes, full-page picture, two real drag placements aligned to the artwork.`);
