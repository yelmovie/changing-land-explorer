import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='.work/field-preview';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const [width,height]of [[1920,1080],[1024,768],[852,806],[915,412]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForFunction(()=>window.Phaser?.Game);await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(target,args){const game=Reflect.construct(target,args);window.__qaGame=game;return game;}});});await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());await page.waitForSelector('#preview-nav');
 for(const phase of [0,1]){
 await page.evaluate(async phase=>{const m=await import('/src/main.js');m.state().drafts.river={step:1,passed:[],data:{adventure:{version:1,chapters:{1:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};await m.enter(0,1);},phase);
 await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(250);
 const inspect=()=>page.evaluate(()=>{const scene=window.__qaGame.scene.getScene('Activity');const objects=scene.children.list;const texts=objects.filter(o=>o.type==='Text').map(o=>({text:o.text,b:o.getBounds()}));const zoom=objects.find(o=>o.type==='Image'&&o.mask);const surface=objects.find(o=>o.name==='field-preview-panel'),size=surface?.getData('readingSurface');return{panel:size&&{x:surface.x-size.width/2,y:surface.y-size.height/2,width:size.width,height:size.height},texts,zoom:{x:zoom.x,y:zoom.y},overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1};});
 let data=await inspect();assert.ok(data.panel);assert.equal(data.overflow,false);for(const t of data.texts.filter(t=>/가까이|물길과/.test(t.text))){assert.ok(t.b.x>=data.panel.x+18);assert.ok(t.b.y+t.b.height<=data.panel.y+data.panel.height-18);}
 await page.screenshot({path:`${out}/${width}x${height}-${phase}.png`});
 await page.locator('#river-field-observe').click();await page.locator('[data-field-point="0"]').click();data=await inspect();assert.notEqual(data.zoom.x,840);assert.ok(data.texts.some(t=>/바위|물길/.test(t.text)));
 await page.locator('#river-field-observe').click();await page.locator('[data-field-point="1"]').click();
 assert.deepEqual(errors,[]);results.push({width,height,phase,passed:true});
 }
 await page.close();
}await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
