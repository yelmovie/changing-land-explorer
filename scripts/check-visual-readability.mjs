import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(process.env.PLAYWRIGHT_PATH).href:'playwright');
const out=process.env.CHECK_OUT||'.work/visual-readability-20261109';await fs.mkdir(out,{recursive:true});
const sizes=(process.env.CHECK_SIZES||'667x375,915x412,852x806,1024x768,1280x800,1920x1080').split(',').map(s=>s.split('x').map(Number)),ids=['river','volcano','rocks','city','safety'];
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[];
try{for(const [width,height]of sizes){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CHECK_URL||'http://localhost:5177');await page.waitForFunction(()=>window.Phaser?.Game);
 await page.evaluate(()=>{const Original=window.Phaser.Game;window.Phaser.Game=new Proxy(Original,{construct(target,args){const game=Reflect.construct(target,args);window.__qaGame=game;return game;}});});
 await page.locator('#settings').click();await page.locator('#admin-setting').evaluate(e=>e.click());
 for(let index=0;index<5;index++)for(let step=0;step<2;step++)for(let phase=0;phase<3;phase++){
  await page.evaluate(async({index,step,phase})=>{const m=await import('/src/main.js'),id=['river','volcano','rocks','city','safety'][index];m.state().drafts[id]={step,passed:[],data:{adventure:{version:1,chapters:{[step]:{phase,tasks:Object.fromEntries(Array.from({length:phase},(_,i)=>[i,{done:true}])),work:{}}}}}};await m.enter(index,step);},{index,step,phase});
  await page.waitForSelector('#activity canvas');await page.waitForFunction(()=>!document.querySelector('.stage-loader'));await page.waitForTimeout(120);
  const data=await page.evaluate(()=>{
   const issues=[],scene=window.__qaGame.scene.getScene('Activity');let cards=0;
   const inside=(a,b,p=0)=>a.x>=b.x+p-1&&a.y>=b.y+p-1&&a.right<=b.right-p+1&&a.bottom<=b.bottom-p+1;
   const visit=object=>{
    if(!object.visible||object.alpha===0)return;
    if(object.getData?.('learningCard')){
     cards++;const text=object.list.at(-1),b=text.getBounds(),matrix=object.getWorldTransformMatrix(),tl=matrix.transformPoint(-object.width/2,-object.height/2),br=matrix.transformPoint(object.width/2,object.height/2),surface={x:tl.x,y:tl.y,right:br.x,bottom:br.y};
     if(!inside(b,surface,9*Math.min(object.scaleX,object.scaleY)))issues.push('card text outside inset: '+text.text);
     if(!inside(surface,{x:0,y:0,right:1200,bottom:640}))issues.push('card outside canvas: '+text.text);
    }
    if(object.type==='Container')for(const child of object.list)visit(child);
   };
   for(const object of scene.children.list)visit(object);
   for(const panel of scene.children.list.filter(o=>o.visible&&o.getData?.('readingSurface'))){
    const {width,height}=panel.getData('readingSurface'),area={x:panel.x-width/2,y:panel.y-height/2,right:panel.x+width/2,bottom:panel.y+height/2};
    for(const text of scene.children.list.filter(o=>o.type==='Text'&&o.text.trim()&&o.visible&&o.alpha>0&&o.x>area.x&&o.x<area.right&&o.y>area.y&&o.y<area.bottom)){
     if(!inside(text.getBounds(),area,12))issues.push('panel text outside inset: '+text.text);
    }
   }
   const narrator=document.querySelector('.river-narrator'),speech=document.querySelector('#speech'),nr=narrator.getBoundingClientRect(),style=getComputedStyle(narrator),radius=parseFloat(style.borderTopLeftRadius),padding=parseFloat(style.paddingLeft);
   const range=document.createRange();range.selectNodeContents(speech);
   for(const r of range.getClientRects())if(r.left<nr.left+padding-1||r.right>nr.right-padding+1||r.top<nr.top+3||r.bottom>nr.bottom-3)issues.push('narration outside reading area');
   if(radius>24)issues.push('multiline narration has capsule ends');
   if(document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1)issues.push('page overflow');
   return {issues,cards,speech:speech.textContent};
  });
  const label=`${width}x${height}-${ids[index]}-${step}-${phase}`;results.push({label,...data});
  if(data.issues.length||width===1024||width===915&&['river','volcano','rocks'].includes(ids[index]))await page.screenshot({path:`${out}/${label}.png`,animations:'disabled'});
  if(data.issues.length)console.log('FAIL',label,data.issues.join('; '));
 }
 await context.close();console.log(`Checked ${width}x${height}`);
}}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
console.log(`${results.filter(r=>!r.issues.length).length}/${results.length} reading layouts passed; ${errors.length} runtime errors.`);
if(results.some(r=>r.issues.length)||errors.length)process.exitCode=1;
