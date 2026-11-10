import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
import {fresh,SAVE_KEY} from '../src/model.js';
import {RECOVERY_KEY} from '../src/storage-recovery.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[];
try{
 for(const mode of ['preserve','quota','existing']){
  const source=fresh();source.started=true;source.drafts.volcano={step:0,passed:[],data:{assembly:['tray','broken'],evidence:{invalid:null}}};
  const raw=JSON.stringify(source,null,2);
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.addInitScript(({key,backup,raw,mode})=>{
   if(!sessionStorage.recoverySeeded){localStorage.setItem(key,raw);if(mode==='existing')localStorage.setItem(backup,'earlier original');sessionStorage.recoverySeeded='yes';}
   if(mode==='quota'){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===backup)throw new DOMException('Quota','QuotaExceededError');return set.call(this,key,value);};}
  },{key:SAVE_KEY,backup:RECOVERY_KEY,raw,mode});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.CHECK_URL||'http://127.0.0.1:5611');await page.locator('#settings').waitFor();
  await page.locator('#settings').click();
  const text=await page.locator('dialog').innerText();
  const actual=await page.evaluate(({key,backup})=>({current:localStorage.getItem(key),backup:localStorage.getItem(backup)}),{key:SAVE_KEY,backup:RECOVERY_KEY});
  if(mode==='preserve'){assert.equal(actual.backup,raw);assert.match(text,/원본은 이 기기에 따로 보관/);}
  else{assert.equal(actual.current,raw);assert.match(text,/이번 활동은 저장하지 않아요/);if(mode==='existing')assert.equal(actual.backup,'earlier original');}
  await page.reload();await page.locator('#settings').waitFor();
  const after=await page.evaluate(key=>localStorage.getItem(key),mode==='preserve'?RECOVERY_KEY:SAVE_KEY);assert.equal(after,raw);
  checks.push(mode);await context.close();
 }
 assert.deepEqual(errors,[]);await mkdir('.work/recovery',{recursive:true});await writeFile('.work/recovery/results.json',JSON.stringify({checks,errors},null,2));console.log('PASS recovery originals: '+checks.join(', '));
}finally{await browser.close();}
