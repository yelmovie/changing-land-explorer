// Real browser keyboard regression. Run with dev server and PLAYWRIGHT_PATH if needed.
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fresh,SAVE_KEY} from '../src/model.js';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const out=process.env.CHECK_OUT||'.work/map-keyboard';
await fs.mkdir(out,{recursive:true});
const results=[],errors=[],base=process.env.CHECK_URL||'http://127.0.0.1:5177';
async function scenario(name,fn,{reduced=false,fallback=false,node=0}={}){
 const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block'});
 const state=fresh();state.started=true;state.mapNode=node;state.location={type:'home'};
 await context.addInitScript(({state,key})=>{if(!sessionStorage.keyboardQA){sessionStorage.keyboardQA='1';localStorage.setItem(key,JSON.stringify(state));}},{state,key:SAVE_KEY});
 const page=await context.newPage();page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(String(e)));
 if(fallback)await page.route('**/assets/vendor/*phaser*.js',r=>r.abort());
 try{
  await page.goto(base);await page.locator('#start').waitFor();
  await page.locator('#start').click();await page.locator(fallback?'.map-fallback':'.map-ready').waitFor();
  await fn(page);results.push({name,pass:true});console.log('PASS',name);
 }catch(error){results.push({name,pass:false,error:String(error)});console.log('FAIL',name,String(error));await page.screenshot({path:out+'/'+name+'.png'});process.exitCode=1;}
 finally{await context.close();}
}
const at=(p,n)=>p.waitForFunction(({key,n})=>JSON.parse(localStorage.getItem(key)).mapNode===n,{key:SAVE_KEY,n});
const node=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).mapNode,SAVE_KEY);
try{
 await scenario('arrows-after-buttons',async p=>{
  await p.locator('#sound').click();await p.keyboard.press('ArrowUp');await at(p,1);
  await p.locator('[data-dir="up"]').click();await at(p,2);
  await p.keyboard.press('ArrowDown');await at(p,1);
  await p.locator('#dpad-center').click();await p.keyboard.press('ArrowDown');await at(p,0);
 });
 await scenario('settings-close-and-wasd',async p=>{
  await p.locator('#settings').click();await p.locator('#settings-close').click();await p.locator('dialog').waitFor({state:'detached'});
  assert.equal(await p.locator(':focus').getAttribute('id'),'settings');
  await p.keyboard.press('ArrowUp');await at(p,1);
  await p.keyboard.press('Shift+KeyD');await at(p,2);
  await p.keyboard.press('KeyS');await at(p,1);
  await p.keyboard.press('KeyS');await at(p,0);
 });
 await scenario('held-key-repeat',async p=>{
  await p.locator('#sound').focus();await p.keyboard.down('ArrowUp');await at(p,1);
  // A repeated native keydown has repeat=true, just like holding an OS arrow key.
  await p.keyboard.down('ArrowUp');await at(p,2);await p.keyboard.up('ArrowUp');
  await p.waitForTimeout(250);assert.equal(await node(p),2);
 });
 await scenario('dialog-and-enter',async p=>{
  await p.locator('#settings').click();await p.locator('#music-volume').focus();const volume=Number(await p.locator('#music-volume').inputValue());
  await p.keyboard.press('ArrowRight');assert.ok(Number(await p.locator('#music-volume').inputValue())>volume);
  await p.keyboard.press('ArrowUp');await p.waitForTimeout(300);assert.equal(await node(p),6);
  await p.keyboard.press('Escape');await p.locator('dialog').waitFor({state:'detached'});
  // Enter on a focused settings button must open settings, not enter the nearby mission.
  await p.keyboard.press('Enter');await p.locator('#sound-setting').waitFor();assert.equal(await p.locator('#mission-enter').count(),0);
  await p.locator('#settings-close').click();await p.locator('dialog').waitFor({state:'detached'});
  await p.locator('#dpad-center').focus();await p.keyboard.press('Enter');await p.locator('#mission-enter').waitFor();
  assert.equal(await node(p),6);
 },{node:6});
 await scenario('modifiers-and-screen-movement',async p=>{
  await p.locator('#sound').focus();await p.keyboard.press('Control+ArrowUp');await p.waitForTimeout(200);assert.equal(await node(p),0);
  await p.locator('[data-dir="up"]').click();await at(p,1);
  await p.keyboard.press('ArrowRight');await at(p,2);
  await p.locator('#home').click();await p.locator('#start').waitFor();await p.keyboard.press('ArrowDown');assert.equal(await node(p),2);
 });
 for(const fallback of [false,true])await scenario(fallback?'fallback-keyboard':'reduced-motion-keyboard',async p=>{
  await p.locator('#dpad-center').focus();await p.keyboard.press('ArrowUp');await at(p,1);
  await p.keyboard.press('ArrowDown');await at(p,0);
 },{reduced:!fallback,fallback});
 assert.deepEqual(errors,[]);
}finally{await browser.close();await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2)+'\n');}

