import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href);
const out=process.env.CHECK_OUT||'.work/series-focused';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block',reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.CHECK_URL||'http://localhost:5277');await page.locator('#settings').click();
 for(const [id,value]of [['effects',35],['voice',60]]){await page.locator(`#${id}-volume`).fill(String(value));assert.equal(await page.locator(`output[for="${id}-volume"]`).textContent(),value+'%');}
 await page.screenshot({path:`${out}/audio-settings.png`});await page.reload();await page.locator('#settings').click();
 assert.equal(await page.locator('#effects-volume').inputValue(),'35');assert.equal(await page.locator('#voice-volume').inputValue(),'60');
 await page.locator('#teacher-help').click();await page.locator('.learning-guide > summary').click();
 assert.equal(await page.locator('.learning-guide details').count(),5);await page.locator('.learning-guide details').first().locator('summary').click();
 assert.match(await page.locator('.learning-guide').textContent(),/완료와 보상은 활동을 마쳤다는 뜻/);await page.screenshot({path:`${out}/teacher-evidence-guide.png`});
 await page.locator('.dialog-close').click();
 await page.evaluate(async()=>{const m=await import('/src/main.js');m.enter(0,0);});
 await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.locator('#river-hint').click();
 const hint=()=>page.evaluate(async()=>{const s=(await import('/src/main.js')).state();return s.drafts.river.data.adventure.chapters[0].work[0];});
 assert.equal((await hint()).observationHint,true);assert.notEqual((await hint()).answerHint,true);
 await page.locator('#hint-more').click();assert.equal((await hint()).operationHelp,true);assert.notEqual((await hint()).answerHint,true);
 await page.locator('#hint-return').click();await page.reload();await page.waitForSelector('#settings');
 assert.equal((await hint()).operationHelp,true);assert.equal((await hint()).hintLevel,2);
 const manifest=JSON.parse(await fs.readFile('scripts/voices.json','utf8'));assert.equal(manifest.clips.length,25);
 for(const clip of manifest.clips){const r=await page.request.get(new URL('/assets/voices/'+clip.file,page.url()).href);assert.equal(r.status(),200);assert.ok((await r.body()).length>1000);}
 assert.deepEqual(errors,[]);await fs.writeFile(`${out}/results.json`,JSON.stringify({audioSettingsPersist:true,teacherStages:5,observationVsOperationHint:true,hintReload:true,existingVoiceFiles:25,errors},null,2));console.log('PASS: independent audio settings, five-stage guide, accurate hint/reload records, 25 voice assets.');
}finally{await browser.close();}
