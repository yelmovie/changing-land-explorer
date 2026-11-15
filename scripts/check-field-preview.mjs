import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {FIELD_POINTS} from '../src/learning-model.js';
const out=process.env.CHECK_OUT||'.work/field-preview';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const [width,height]of [[1920,1080],[1024,768],[852,806],[915,412]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#preview-nav');await page.waitForFunction(()=>window.Phaser?.Game);await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(target,args){const game=Reflect.construct(target,args);window.__qaGame=game;return game;}});});
 for(const phase of [0,1]){
 await page.evaluate(async phase=>{const m=await import('/src/main.js');m.state().drafts.river={step:1,passed:[],data:{adventure:{version:1,chapters:{1:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};await m.enter(0,1);},phase);
 await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(250);
 const inspect=()=>page.evaluate(()=>{const scene=window.__qaGame.scene.getScene('Activity');const objects=scene.children.list;const texts=objects.filter(o=>o.type==='Text').map(o=>({text:o.text,b:o.getBounds()}));const zoom=objects.find(o=>o.type==='Image'&&o.mask);const surface=objects.find(o=>o.name==='field-preview-panel'),size=surface?.getData('readingSurface');return{panel:size&&{x:surface.x-size.width/2,y:surface.y-size.height/2,width:size.width,height:size.height},texts,zoom:{x:zoom.x,y:zoom.y},overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1};});
 let data=await inspect();assert.ok(data.panel);assert.equal(data.overflow,false);for(const t of data.texts.filter(t=>/가까이|물길과/.test(t.text))){assert.ok(t.b.x>=data.panel.x+18);assert.ok(t.b.y+t.b.height<=data.panel.y+data.panel.height-18);}
 assert.equal(await page.locator('.stage-kicker').isVisible(),false);assert.equal(await page.locator('#phase-path').isVisible(),false);assert.equal(await page.locator('.activity-tools>summary').isVisible(),false);assert.equal(await page.locator('#river-field-observe').count(),0);
 const heading=await page.locator('.adventure-heading').boundingBox(),back=await page.locator('#back').boundingBox();assert.ok(heading.x>=back.x+back.width&&heading.x-back.x-back.width<28,'title uses the freed tool space');
 assert.deepEqual(await page.evaluate(()=>{const scene=window.__qaGame.scene.getScene('Activity'),lens=scene.children.getByName('field-lens'),hero=scene.children.getByName('field-companion');return {lensLayers:lens.list.length,heroOnLeft:hero.x<200&&hero.y>480,facingIn:hero.texture.key==='hero-lens'&&!hero.flipX};}),{lensLayers:2,heroOnLeft:true,facingIn:true});
 await page.screenshot({path:`${out}/${width}x${height}-${phase}.png`});
 const p=FIELD_POINTS.filter(p=>p.side===(phase?'lower':'upper'))[0],canvas=page.locator('#activity canvas'),b=await canvas.boundingBox();
 await page.mouse.move(b.x+b.width/2,b.y+500/640*b.height);await page.mouse.down();
 await page.mouse.move(b.x+p.x/1000*b.width,b.y+p.y/560*b.height,{steps:12});
 await page.waitForFunction(label=>window.__qaGame.scene.getScene('Activity').children.getByName('field-preview-title').text===label,p.label);
 data=await inspect();assert.notEqual(data.zoom.x,840);assert.ok(data.texts.some(t=>/바위|물길/.test(t.text)));
 const logged=await page.evaluate(async id=>Boolean((await import('/src/main.js')).state().drafts.river.data.evidence[id]),p.id);assert.equal(logged,true,'moving the lens records the clue before releasing it');
 await page.mouse.up();
 await canvas.press('2');await page.waitForSelector('#next.ready');
 assert.deepEqual(errors,[]);results.push({width,height,phase,passed:true});
 }
 await page.close();
}await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
