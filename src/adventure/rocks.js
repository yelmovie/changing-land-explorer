import {observationTour} from './observation-tour.js';
import {ROCKS,FEATURES,hasRockEvidence} from '../learning-model.js';
import {hasRockModel,openRock3D} from '../rock3d.js';

const near=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;
const TRAY={basalt:140,granite:1060},TRAY_Y=275;
// Painted props for this stage (scripts/prepare-rocks-stage-art.mjs). They load on demand,
// and the code-drawn shapes stay on screen until (or unless) the picture arrives.
const PROPS={
 magnifier:'/assets/art/stages/rocks/magnifier.webp',
 ring:'/assets/art/stages/rocks/loupe-ring.webp',
 tag:'/assets/art/stages/rocks/order-tag.webp'
};
export function setup(scene,api){
 function prop(name,owner,ready){
  const key='rocks-stage/'+name,go=()=>{if(owner.scene&&scene.textures.exists(key))ready(key);};
  if(scene.textures.exists(key))return go();
  scene.load.image(key,PROPS[name]);scene.load.once('filecomplete-image-'+key,go);
  if(!scene.load.isLoading())scene.load.start();
 }
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=api.data,w=api.work;d.evidence??={};d.rockNames??={};d.rockProofs??={};
 api.image(api.step===0?'rocks-lab':'art/rocks-quarry-atelier-v2',600,320,1200,640);
 const companion=api.hero(110,470,165,scene.textures.exists(api.step===0&&api.phase===0?'hero-brush':'hero-lens')?(api.step===0&&api.phase===0?'hero-brush':'hero-lens'):'river-pose-0');
 companion.setVisible(api.step===0&&api.phase===0);
 return api.step===1?(api.phase===0?sortKnown():classifyNew()):api.phase===0?brush():inspect();

 function tray(x,y,label,w=220){if(scene.textures.exists('art/ui/specimen-tray'))api.image('art/ui/specimen-tray',x,y,w,w*.66);else api.target(x,y,w,w*.6,'');api.card(label,x,y-w*.43,128,50,22);}

 function brush(){
  api.task('붓으로 두 돌의 먼지를 털어 줘','왼쪽 돌과 오른쪽 돌을 손가락으로 골고루 문질러 봐. 먼지가 걷히면 표본 이름에 ✓가 생겨.');
  w.dust??=[[],[]];let dust=w.dust,completed=!!api.completed;const tiles=[],covers=[],labels=[],centers=[440,840],CY=290,R=230;
  // Dust is a scratch-off layer: brushing erases what the student touches, while
  // the 16 counted spots per stone keep the original completion rule.
  const stamp=scene.make.graphics({add:false}).fillStyle(0xffffff).fillCircle(0,0,62),dab=scene.make.graphics({add:false}).fillStyle(0xffffff).fillCircle(0,0,30);
  const local=(n,x,y)=>[x-(centers[n]-R),y-(CY-R)];
  centers.forEach((cx,n)=>{api.image('rock-'+n,cx,CY,330,330);labels[n]=api.card(ROCKS[n].name,cx,490,245,64,23).list.at(-1);tiles[n]=[];
   const cover=scene.add.renderTexture(cx,CY,R*2,R*2);covers[n]=cover;
   for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const i=row*4+col,x=cx-120+col*80,y=170+row*80;tiles[n].push({x,y});
    if(scene.textures.exists('art/ui/dust-crust'))cover.stamp('art/ui/dust-crust',undefined,...local(n,x,y),{scale:(Math.hypot(x-cx,y-CY)>150?.25:.34)+((i*7+n*3)%5)*.02,angle:(i*67+n*31)%360});
    else cover.fill(0xa98f65,.9);
   }
   dust[n].forEach(i=>cover.erase(stamp,...local(n,tiles[n][i].x,tiles[n][i].y)));
   if(dust[n].length>=16)cover.setVisible(false);
  });
  const brush=scene.add.container(610,565,[api.image('art/geologist-brush',0,0,210,60)]).setSize(210,64);
  let revealed=false;
  function progress(){
   const done=dust.map((cells,n)=>{
    const clean=cells.length>=12;
    labels[n].setText(ROCKS[n].name+(clean?'  ✓':'  '+cells.length+' / 12'));
    if(clean)covers[n].setVisible(false);
    return clean;
   });
   api.counter(done.filter(Boolean).length,2,'먼지를 턴 돌');
   if(done.every(Boolean)&&!revealed){revealed=true;if(completed){api.stopAutoplay();api.say('먼지를 다시 털어 봤어. 관찰 기록은 그대로야.');}else{completed=true;api.finish('두 표본이 드러났어! 이제 색과 알갱이를 확대해 보자.');}}
   else if(!revealed&&done.some(Boolean))api.say('한 표본이 드러났어! 체크가 없는 돌을 문질러 봐.');
  }
  function sweep(x,y){if(revealed)return;let changed=false;centers.forEach((cx,n)=>{if(Math.abs(x-cx)<R&&Math.abs(y-CY)<R)covers[n].erase(dab,...local(n,x,y));tiles[n].forEach((t,i)=>{if(!dust[n].includes(i)&&Math.hypot(t.x-x,t.y-y)<72){dust[n].push(i);covers[n].erase(stamp,...local(n,t.x,t.y));api.spark(t.x,t.y);changed=true;}});if(dust[n].length>=16&&covers[n].visible)scene.tweens.add({targets:covers[n],alpha:0,duration:400,onComplete:()=>covers[n].setVisible(false)});});if(changed){api.sound?.('brush');if(!completed)api.save();progress();}}
  api.drag(brush,{onMove:(o,x,y)=>sweep(x+65,y),onDrop:()=>false});
  // Direct rubbing makes the screen itself a tool, while the brush remains usable.
  let rubbing=false;
  const touch=p=>{if(!rubbing)return;brush.setPosition(p.x-65,p.y);sweep(p.x,p.y);};
  const start=p=>{rubbing=centers.some(cx=>Math.abs(p.x-cx)<170&&p.y>110&&p.y<465);touch(p);};
  const stop=()=>{rubbing=false;};
  scene.input.on('pointerdown',start);scene.input.on('pointermove',touch);scene.input.on('pointerup',stop);scene.input.on('pointerupoutside',stop);
  api.listenCleanup(()=>{scene.input.off('pointerdown',start);scene.input.off('pointermove',touch);scene.input.off('pointerup',stop);scene.input.off('pointerupoutside',stop);});
  api.autoplay({label:'표본의 먼지 털기',interval:380,allowWhenComplete:true,ready:()=>true,advance(){
    if(revealed){dust=[[],[]];revealed=false;covers.forEach((cover,n)=>{cover.clear().setVisible(true).setAlpha(1);for(let i=0;i<16;i++){const p=tiles[n][i];if(scene.textures.exists('art/ui/dust-crust'))cover.stamp('art/ui/dust-crust',undefined,...local(n,p.x,p.y),{scale:.34,angle:i*67%360});else cover.fill(0xa98f65,.9);}});}
    const n=dust.findIndex(cells=>cells.length<12);
    if(n<0)return;
    const point=tiles[n].find((_,i)=>!dust[n].includes(i));
    if(point){brush.setPosition(point.x-65,point.y);sweep(point.x,point.y);}
  }});
  api.actions([]);progress();
 }

 function inspect(){
  const sample=api.phase-1,r=ROCKS[sample];
  w.scanned??=[];w.proofs??=[];w.lens??={x:350,y:285};
  api.task(`${r.name}를 확대해서 살펴보자`,'왼쪽 돌의 숫자 세 곳을 눌러 확대해 봐. 오른쪽에서 색과 알갱이를 살펴봐.');
  api.panel(350,290,470,450,0xfff8e5,.88);api.panel(850,280,440,450,0xfff8e5,.9);
  const specimen=api.image(r.asset,350,275,400,267);api.text(r.name,350,84,27);const detailTitle=api.text('내가 살핀 부분',850,82,24);
  const maskShape=scene.add.graphics().fillStyle(0xffffff).fillCircle(850,282,141);maskShape.setVisible(false);
  const detail=api.image(r.asset,850,282,960,640).setMask(maskShape.createGeometryMask());
  const optics=scene.add.graphics();
  optics.lineStyle(12,0x503f2b,.2).strokeCircle(852,286,144).lineStyle(8,0xc7a66a,1).strokeCircle(850,282,145).lineStyle(2,0xfff3c9,.9).strokeCircle(850,282,140);
  // A restrained glass reflection leaves the actual illustrated grains visible.
  optics.lineStyle(3,0xfff8dc,.5).beginPath().arc(850,282,133,3.75,4.65).strokePath();
  // Painted brass loupe: its hollow centre (38% of the width) sits just inside the round view.
  prop('ring',optics,key=>{
   optics.clear();
   scene.add.image(850,285,key).setOrigin(.4964,.4976).setDisplaySize(371,374).setTint(0x2d2114).setAlpha(.18);
   scene.add.image(850,282,key).setOrigin(.4964,.4976).setDisplaySize(363,366);
  });
  api.text('2.4배 확대',850,484,20);
  const focusGuide=scene.add.graphics();
  const lens=scene.add.container(w.lens.x,w.lens.y);lens.add(scene.add.circle(0,0,43,0xe6f5f4,.055).setStrokeStyle(5,0xf4c85f));lens.add(scene.add.rectangle(39,46,14,61,0x82613f).setAngle(-38));lens.setSize(150,160);
  // Painted magnifier: the image origin is the lens centre, so dragging and the hit area stay the same.
  prop('magnifier',lens,key=>{
   lens.removeAll(true);
   lens.add(scene.add.image(5,8,key).setOrigin(.2935,.3034).setDisplaySize(160,160).setTint(0x2d2114).setAlpha(.2));
   lens.add(scene.add.image(0,0,key).setOrigin(.2935,.3034).setDisplaySize(160,160));
  });
  let compare=false;
  api.setToolHandler?.('camera',()=>{compare=!compare;detail.setTexture(compare?ROCKS[sample%2?0:1].asset:r.asset);focusGuide.setVisible(!compare);detailTitle.setText(compare?'다른 표본과 비교':'내가 살핀 부분');api.say(compare?'반대 특징의 표본을 같은 확대 크기로 꺼냈어. 카메라를 다시 누르면 내 돌로 돌아와.':'내 돌의 확대 관찰로 돌아왔어.');});
  const notes=api.text('',350,462,20,'#365548',420);
  const scanSites=[[248,220,0],[350,285,4],[450,330,5]];
  let completed=!!api.completed,focus={...w.lens},motion=null;
  const scanMarkers=[],claimTokens={},claimActions={};
  function drawLens(x,y,collect=true){
   const px=Math.max(230,Math.min(470,x)),py=Math.max(190,Math.min(360,y));lens.setPosition(px,py);focus={x:px,y:py};
   detail.setPosition(850-(px-350)*2.4,282-(py-275)*2.4);
   focusGuide.clear().lineStyle(2,0x9f834f,.68).lineBetween(px+48,py,666,282).fillStyle(0xfff3cd,.9).fillCircle(666,282,4);
   if(collect&&!compare&&!completed&&w.scanned.length<3){w.lens={...focus};const cell=Math.min(2,Math.floor((px-200)/101))+Math.min(1,Math.floor((py-130)/146))*3;if(!w.scanned.includes(cell)){w.scanned.push(cell);api.spark(px,py);api.save();}}
   scanMarkers.forEach((paint,i)=>paint(w.scanned.includes(scanSites[i][2])));
   paintClaims();
   if(collect&&w.scanned.length===3&&!w.proofs.length)api.say('아래 카드에서 이 돌의 색 하나와 알갱이 특징 하나를 눌러 봐.');
   notes.setText(w.scanned.length>=3?'색 카드 하나 + 알갱이 카드 하나':`관찰한 곳 ${Math.min(3,w.scanned.length)} / 3`);
   if(collect)check();
  }
  api.drag(lens,{onMove:(o,x,y)=>drawLens(x,y),onDrop:(o,x,y)=>{drawLens(x,y);return true;}});
  const stop=()=>{const interrupted=!!motion;motion=null;return interrupted;};
  api.autoplay(observationTour(api,{label:'돌 세 곳 확대 관찰',items:scanSites,interval:2400,
    needed:()=>w.scanned.length<3,
    ready:()=>!compare,stop,
    visit(site){lens.setVisible(true);if(reduced)drawLens(site[0],site[1]);else motion={from:{...focus},x:site[0],y:site[1],elapsed:0};}
  }));
  const claimPositions={dark:210,light:465,fine:730,coarse:1000};
  function paintClaims(){
   for(const [claim,card] of Object.entries(claimTokens))
    card.setAlpha(w.proofs.includes(claim)?.42:w.scanned.length<3?.72:1);
  }
  for(const claim of Object.keys(FEATURES)){
   const token=api.card(FEATURES[claim],claimPositions[claim],570,240,70,20);
   claimTokens[claim]=token;
   const apply=()=>{
    if(compare){api.say('카메라를 다시 눌러 지금 조사하는 돌로 돌아온 뒤 기록하자.');return false;}
    if(w.scanned.length<3){api.say('돋보기를 다른 곳으로 움직여 세 곳을 먼저 살펴봐.');return false;}
    if(![r.color,r.grain].includes(claim)){api.say(['dark','light'].includes(claim)?'돌 전체가 밝은지 어두운지 다시 살펴봐.':'돋보기 안에서 알갱이가 하나하나 구별되는지 살펴봐.');return false;}
    if(w.proofs.includes(claim)){api.say('이미 기록했어. 다른 특징을 살펴봐.');return false;}
    w.proofs.push(claim);
    api.record({id:`rock-${sample}-${claim}`,kind:'rock',sample,claim,asset:r.asset,label:`${r.name} · ${FEATURES[claim]}`,point:{x:(focus.x-150)/400,y:(focus.y-141.5)/267},zoom:2.4,annotations:[],text:FEATURES[claim]});
    paintClaims();api.spark(350,360);api.say(FEATURES[claim]+' 증거를 기록했어. 색과 알갱이를 모두 남겨 줘.');api.save();check();return false;
   };
   claimActions[claim]=apply;
   api.drag(token,{onPick:apply,onDrop:(o,x,y)=>near(x,y,350,285,440,410)?apply():false});
  }
  function check(){
   const n=w.proofs.filter(c=>[r.color,r.grain].includes(c)).length;
   api.counter(Math.min(3,w.scanned.length)+n,5,'관찰과 증거');
   if(n!==2||w.scanned.length<3)return;
   notes.setText(FEATURES[r.color]+' · '+FEATURES[r.grain]);
   if(completed)return;
   completed=true;api.finish((r.type==='basalt'?'현무암':'화강암')+'이야. 색과 알갱이 두 가지를 기억하자.');
  }
  scanSites.forEach(([x,y],index)=>scanMarkers.push(api.marker(x,y,index+1,()=>drawLens(x,y))));
  const canvas=scene.game?.canvas;
  if(canvas){
   const previousLabel=canvas.getAttribute('aria-label'),claims=Object.keys(FEATURES);
   canvas.tabIndex=0;
   canvas.setAttribute('aria-label',r.name+' 관찰. 숫자 1, 2, 3으로 확대하고, '+claims.map((claim,i)=>(i+4)+'번: '+FEATURES[claim]).join(', '));
   canvas.setAttribute('aria-keyshortcuts','1 2 3 4 5 6 7');
   const key=e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||!/^[1-7]$/.test(e.key)||document.querySelector('dialog[open]'))return;
    e.preventDefault();
    const site=scanSites[Number(e.key)-1];
    if(site)drawLens(site[0],site[1]);else claimActions[claims[Number(e.key)-4]]();
   };
   canvas.addEventListener('keydown',key);
   api.listenCleanup(()=>{
    canvas.removeEventListener('keydown',key);canvas.removeAttribute('tabindex');canvas.removeAttribute('aria-keyshortcuts');
    if(previousLabel)canvas.setAttribute('aria-label',previousLabel);
   });
  }
  api.actions([]);drawLens(w.lens.x,w.lens.y,false);check();
  // The 3D specimen is an extra way to look, offered only once its GLB is in assets/models.
  hasRockModel(r.asset).then(ok=>{if(ok&&specimen.active&&scene.sys.isActive()){api.actions([{id:'rock-3d',label:'돌 돌려 보기',onClick:()=>openRock3D(api.modal,r)}]);}});
  return {update(time,delta){
    if(!motion)return;motion.elapsed+=Math.min(delta,60);const t=Math.min(1,motion.elapsed/650),ease=t*t*(3-2*t),m=motion;
    drawLens(m.from.x+(m.x-m.from.x)*ease,m.from.y+(m.y-m.from.y)*ease,false);
    if(t===1){motion=null;drawLens(m.x,m.y,true);}
  },pause:stop,destroy:stop};
 }

 function sortKnown(){
  w.sorted??=[];let finished=!!api.completed;
  const orders=['granite','basalt'],names={basalt:'현무암',granite:'화강암'},stones=[],glow=scene.add.graphics();
  tray(TRAY.basalt,TRAY_Y,'현무암');tray(TRAY.granite,TRAY_Y,'화강암');
  const orderText=api.text('',600,38,26).setBackgroundColor('#fff8e8').setPadding(18,8);
  const current=()=>orders.find(type=>!w.sorted.some(id=>ROCKS[id].type===type));
  function progress(){
   const type=current();glow.clear();orderText.setText(type?'전시관 주문 · '+names[type]:'두 주문을 모두 보냈어');
   if(type)glow.lineStyle(4,0xe5b94e,.95).strokeRoundedRect(TRAY[type]-112,TRAY_Y-72,224,150,28);
   api.counter(w.sorted.length,2,'처리한 주문');
   if(w.sorted.length===2&&!finished){finished=true;api.finish('관찰 기록으로 두 주문을 해결했어. 이제 처음 보는 돌에도 적용해 보자!');}
  }
  function ship(id,x,y){
   if(w.sorted.includes(id)||finished)return false;
   const r=ROCKS[id],type=current();
   if(!hasRockEvidence(d,id)){api.say('앞 활동에서 모은 색과 알갱이 기록을 먼저 확인해 줘.');return false;}
   if(!near(x,y,TRAY[type],TRAY_Y,235,176)){api.say('반짝이는 주문 상자까지 표본을 옮겨 줘.');return false;}
   if(r.type!==type){api.say('주문과 표본의 색, 알갱이 기록을 다시 비교해 봐.');return false;}
   const stone=stones[id];
   d.rockNames[id]=r.type;d.rockProofs[id]=[r.color,r.grain];w.sorted.push(id);
   stone.disableInteractive();
   scene.tweens.add({targets:stone,x:TRAY[type],y:TRAY_Y-8,displayWidth:140,displayHeight:140,duration:reduced?0:240,ease:'Sine.easeOut'});
   api.spark(TRAY[type],TRAY_Y);api.save();api.say(r.name+'를 '+names[type]+' 주문으로 보냈어.');progress();return true;
  }
  [0,1].forEach(id=>{
   const r=ROCKS[id],cx=id?780:420;
   api.panel(cx,280,330,430,0xfff7df,.9);api.text(r.name,cx,100,25);
   const stone=stones[id]=api.image(r.asset,cx,225,240,240);
   api.text(hasRockEvidence(d,id)?FEATURES[r.color]+'\n'+FEATURES[r.grain]:'앞 활동에서 기록을 확인해 봐',cx,374,21,'#345546',290);
   if(w.sorted.includes(id))stone.setPosition(TRAY[r.type],TRAY_Y-8).setDisplaySize(140,140);
   else api.drag(stone,{onDrop(_obj,x,y){return ship(id,x,y);}});
  });
  api.task('주문에 맞는 표본을 보내자','색과 알갱이 기록을 읽고, 맞는 표본을 반짝이는 상자로 끌어 줘.');
  progress();
 }

 function classifyNew(){
  const r=ROCKS[api.phase+1],ref=ROCKS.find(item=>item.id<2&&item.type===r.type);
  const bins={basalt:{x:245,y:459},granite:{x:955,y:459}},names={basalt:'현무암',granite:'화강암'};
  const already=w.classified&&d.rockNames[r.id]===r.type&&hasRockEvidence(d,r.id);
  let finished=!!api.completed;
  api.task(r.name+'를 알맞은 표본함에 넣자','앞에서 기록한 색과 알갱이를 새 돌과 비교해 봐. 더 잘 맞는 표본함으로 끌어 줘.');
  for(const base of ROCKS.slice(0,2)){
   const {x,y}=bins[base.type];
   api.panel(x,320,288,448,0xfff7df,.94);
   api.text(names[base.type]+'의 관찰 기록',x,132,23);
   api.image(base.asset,x,212,144,98);
   const note=hasRockEvidence(d,base.id)?FEATURES[base.color]+'\n'+FEATURES[base.grain]:'앞 활동에서 관찰 기록 확인';
   api.text(note,x,305,21,'#345546',262);
   tray(x,y,names[base.type],202);
  }
  const nameTag=api.text(r.name,600,150,27).setBackgroundColor('#fff8e8').setPadding(14,7);
  // Painted specimen tag: the writable paper starts right of the eyelet (centre at 60% of the width).
  prop('tag',nameTag,key=>{
   const width=Math.max(230,(nameTag.width+24)/.74),tag=scene.add.image(600-width*.1,150,key).setDisplaySize(width,width*242/520);
   nameTag.setBackgroundColor(null).setDepth(1);tag.setDepth(.5);
  });
  const specimen=api.image(r.asset,600,316,290,194);
  function check(){
   const done=w.classified&&hasRockEvidence(d,r.id)&&d.rockNames[r.id]===r.type;
   api.counter(done?1:0,1,'새 표본 분류');
   if(done&&!finished){finished=true;api.finish('앞에서 기록한 두 특징을 비교해 '+r.name+'의 이름을 알아냈어.');}
  }
  if(already)specimen.setPosition(bins[r.type].x,bins[r.type].y-9).setDisplaySize(146,98);
  else api.drag(specimen,{onDrop(_obj,x,y){
   const type=Object.keys(bins).find(key=>near(x,y,bins[key].x,bins[key].y,246,165));
   if(!type){api.say('새 돌을 양쪽 표본함 중 한 곳에 끌어 놓아 줘.');return false;}
   if(!ROCKS.slice(0,2).every(base=>hasRockEvidence(d,base.id))){api.say('앞 활동에서 기준 표본 두 개의 관찰 기록을 먼저 남겨 줘.');return false;}
   if(type!==r.type){api.say('새 돌의 전체 색과 알갱이가 어느 기록과 더 가까운지 다시 비교해 봐.');return false;}
   const claims=[r.color,r.grain];
   d.rockNames[r.id]=type;d.rockProofs[r.id]=claims;w.classified=true;
   specimen.setPosition(bins[type].x,bins[type].y-9).setDisplaySize(146,98).disableInteractive();
   for(const claim of claims)api.record({id:'rock-'+r.id+'-'+claim,kind:'rock',sample:r.id,claim,asset:r.asset,label:r.name+' · '+FEATURES[claim],reference:ref.id,comparison:true,text:'기준 표본의 '+FEATURES[claim]+' 기록과 새 표본을 비교했어.'});
   api.spark(bins[type].x,bins[type].y);api.save();check();return true;
  }});
  check();
 }
}
