import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {CLASSROOM_HAZARDS} from '../src/adventure/safety.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/classroom-geometry-20261109';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{for(const [width,height]of [[667,375],[915,412],[852,806],[1024,768],[1280,800],[1920,1080]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForFunction(()=>window.Phaser?.Game);await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(target,args){const game=Reflect.construct(target,args);window.__qaGame=game;return game;}});});await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#preview-nav');await page.evaluate(async()=>{await(await import('/src/main.js')).enter(4,0)});await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(150);
 const geometry=await page.evaluate(()=>{const objects=window.__qaGame.scene.getScene('Activity').children.list,bg=objects.find(o=>o.name==='aligned-classroom'),hero=objects.find(o=>o.name==='classroom-companion');return {background:{x:bg.x,y:bg.y,width:bg.displayWidth,height:bg.displayHeight,visible:bg.visible},hero:{height:hero.displayHeight,bottom:hero.getBounds().bottom}};});
 assert.deepEqual(geometry.background,{x:600,y:320,width:1200,height:675,visible:true});assert.equal(geometry.hero.height,270);assert.ok(geometry.hero.bottom<=640);
 await page.screenshot({path:`${out}/${width}x${height}-before.png`,animations:'disabled'});
 for(let i=0;i<CLASSROOM_HAZARDS.length;i++){
  const target=CLASSROOM_HAZARDS[i],r=await page.locator('#activity canvas').boundingBox(),screen=(x,y)=>({x:r.x+x*r.width/1200,y:r.y+y*r.height/640}),start=screen(400+i*360,578),end=screen(target.x,target.y);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();await page.waitForTimeout(120);
  const record=await page.evaluate(async id=>(await import('/src/main.js')).state().drafts.safety.data.evidence['safety-'+id],target.id);assert.ok(record);assert.equal(record.point.x,target.x/1200);assert.equal(record.point.y,(target.y+17.5)/675);
 }
 await page.waitForSelector('#next.ready');await page.screenshot({path:`${out}/${width}x${height}-placed.png`,animations:'disabled'});assert.deepEqual(errors,[]);results.push({width,height,geometry,dragTargetsAligned:true,errors});await context.close();
}}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
console.log(`PASS classroom: ${results.length} sizes, two real drag placements, source-image anchors, larger character.`);
