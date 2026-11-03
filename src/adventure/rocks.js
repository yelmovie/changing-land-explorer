import {observationTour} from './observation-tour.js';
import {ROCKS,FEATURES,hasRockEvidence} from '../learning-model.js';
import {hasRockModel,openRock3D} from '../rock3d.js';

const near=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;
const TRAY={basalt:140,granite:1060},TRAY_Y=275;
export function setup(scene,api){
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=api.data,w=api.work;d.evidence??={};d.rockNames??={};d.rockProofs??={};
 api.image(api.step===0?'rocks-lab':'art/rocks-quarry-atelier-v2',600,320,1200,640);
 api.hero(110,470,165,scene.textures.exists(api.step===0&&api.phase===0?'hero-brush':'hero-lens')?(api.step===0&&api.phase===0?'hero-brush':'hero-lens'):'river-pose-0');
 return api.step===0&&api.phase===0?brush():inspect();

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
  centers.forEach((cx,n)=>api.assist(ROCKS[n].name+'의 다음 부분 털기',()=>{const i=tiles[n].findIndex((_,i)=>!dust[n].includes(i));if(i>=0)sweep(tiles[n][i].x,tiles[n][i].y);}));
  api.actions([]);progress();
 }

 function inspect(){
  const known=api.step===1&&api.phase===0;
  if(known)return sortKnown();
  const sample=api.step===0?api.phase-1:api.phase+1,r=ROCKS[sample],classify=api.step===1;
  w.scanned??=[];w.proofs??=[];w.lens??={x:350,y:285};
  api.task(classify?`${r.name}의 정체를 알아내자`:`${r.name}를 확대해서 살펴보자`,'왼쪽 돌의 숫자 세 곳을 눌러 확대해 봐. 오른쪽에서 색과 알갱이를 살펴봐.');
  api.panel(350,300,470,445,0xfff8e5,.88);api.panel(850,290,440,425,0xfff8e5,.9);
  const specimen=api.image(r.asset,350,275,400,267);api.text(r.name,350,95,27);api.text('내가 살핀 부분',850,95,24);
  const maskShape=scene.add.graphics().fillStyle(0xffffff).fillCircle(850,282,160);maskShape.setVisible(false);
  const detail=api.image(r.asset,850,282,960,640).setMask(maskShape.createGeometryMask());
  scene.add.circle(850,282,163).setStrokeStyle(9,0xc7a66a).setFillStyle(0,0);
  api.text('2.4배 확대 · 색과 알갱이',850,470,22);
  const lens=scene.add.container(w.lens.x,w.lens.y);lens.add(scene.add.circle(0,0,49,0xffffff,.03).setStrokeStyle(7,0xf4c85f));lens.add(scene.add.rectangle(43,51,17,75,0x82613f).setAngle(-38));lens.setSize(150,160);
  let compare=false;
  api.setToolHandler?.('camera',()=>{compare=!compare;detail.setTexture(compare?ROCKS[sample%2?0:1].asset:r.asset);api.say(compare?'반대 특징의 표본을 같은 확대 크기로 꺼냈어. 카메라를 다시 누르면 내 돌로 돌아와.':'내 돌의 확대 관찰로 돌아왔어.');});
  const notes=api.text('',350,462,20,'#365548',420);
  const scanSites=[[248,220,0],[350,285,4],[450,330,5]];
  let completed=!!api.completed,focus={...w.lens},motion=null,traysMade=false;
  const scanMarkers=[];
  function drawLens(x,y,collect=true){
   const px=Math.max(230,Math.min(470,x)),py=Math.max(190,Math.min(360,y));lens.setPosition(px,py);focus={x:px,y:py};
   detail.setPosition(850-(px-350)*2.4,282-(py-275)*2.4);
   if(collect&&!compare&&!completed&&w.scanned.length<3){w.lens={...focus};const cell=Math.min(2,Math.floor((px-200)/101))+Math.min(1,Math.floor((py-130)/146))*3;if(!w.scanned.includes(cell)){w.scanned.push(cell);api.spark(px,py);api.save();}}
   scanMarkers.forEach((paint,i)=>paint(w.scanned.includes(scanSites[i][2]),w.scanned.length<3));
   if(collect&&w.scanned.length===3&&!w.proofs.length)api.say('아래 카드에서 이 돌의 색 하나와 알갱이 특징 하나를 눌러 봐.');
   notes.setText(w.scanned.length>=3?'색 카드 하나 + 알갱이 카드 하나':`관찰한 곳 ${Math.min(3,w.scanned.length)} / 3`);
   if(collect)check();
  }
  api.drag(lens,{onMove:(o,x,y)=>drawLens(x,y),onDrop:(o,x,y)=>{drawLens(x,y);return true;}});
  const stop=()=>{const interrupted=!!motion;motion=null;return interrupted;};
  api.autoplay(observationTour(api,{label:'돌 세 곳 확대 관찰',items:scanSites,interval:2400,
    ready:()=>!compare&&(!traysMade||completed),stop,
    visit(site){lens.setVisible(true);if(reduced)drawLens(site[0],site[1]);else motion={from:{...focus},x:site[0],y:site[1],elapsed:0};}
  }));
  const claimPositions={dark:210,light:465,fine:730,coarse:1000};
  for(const claim of Object.keys(FEATURES)){
   const token=api.card(FEATURES[claim],claimPositions[claim],570,240,70,20);
   if(w.proofs.includes(claim))token.setAlpha(.35);
   const apply=()=>{
    if(compare){api.say('카메라를 다시 눌러 지금 조사하는 돌로 돌아온 뒤 기록하자.');return false;}
    if(w.scanned.length<3){api.say('돋보기를 다른 곳으로 움직여 세 곳을 먼저 살펴봐.');return false;}
    if(![r.color,r.grain].includes(claim)){api.say(['dark','light'].includes(claim)?'돌 전체가 밝은지 어두운지 다시 살펴봐.':'돋보기 안에서 알갱이가 하나하나 구별되는지 살펴봐.');return false;}
    if(w.proofs.includes(claim)){api.say('이미 기록했어. 다른 특징을 살펴봐.');return false;}
    w.proofs.push(claim);
    api.record({id:`rock-${sample}-${claim}`,kind:'rock',sample,claim,asset:r.asset,label:`${r.name} · ${FEATURES[claim]}`,point:{x:(focus.x-150)/400,y:(focus.y-141.5)/267},zoom:2.4,annotations:[],text:FEATURES[claim]});
    token.setAlpha(.35);api.spark(350,360);api.say(FEATURES[claim]+' 증거를 기록했어. 색과 알갱이를 모두 남겨 줘.');api.save();check();return false;
   };
   api.drag(token,{onPick:apply,onDrop:(o,x,y)=>near(x,y,350,285,440,410)?apply():false});api.assist(FEATURES[claim]+' 기록 붙이기',apply);
  }
  function check(){
   const n=w.proofs.filter(c=>[r.color,r.grain].includes(c)).length;api.counter(Math.min(3,w.scanned.length)+n+(classify&&w.classified?1:0),classify?6:5,classify?'관찰과 분류':'관찰과 증거');
   if(n!==2||w.scanned.length<3)return;
   notes?.setText(`${FEATURES[r.color]} · ${FEATURES[r.grain]}`);
   if(!classify){if(completed)return;completed=true;api.finish(`${r.type==='basalt'?'현무암':'화강암'}이야. 색과 알갱이 두 가지를 기억하자.`);return;}
   if(!traysMade){traysMade=true;lens.disableInteractive().setVisible(false);api.say('두 증거가 모였어! 돌을 알맞은 이름표로 옮겨 줘.');
    for(const [type,x,label] of [['basalt',750,'현무암'],['granite',1010,'화강암']]){tray(x,445,label,210);api.assist(label+' 쟁반으로 옮기기',()=>put(type));}
    api.drag(specimen,{onDrop:(o,x,y)=>{const type=near(x,y,750,435,220,100)?'basalt':near(x,y,1010,435,220,100)?'granite':null;return type?put(type):false;}});
   }
   if(!completed&&w.classified&&d.rockNames[sample]===r.type){completed=true;api.finish('새 돌도 두 가지 관찰 증거로 알아냈어!');}
  }
  function put(type){if(type!==r.type){api.say('이름을 붙이기 전에 붙여 둔 색과 알갱이 증거를 비교해 봐.');return false;}d.rockNames[sample]=type;d.rockProofs[sample]=[r.color,r.grain];w.classified=true;api.save();api.spark(900,430);check();return false;}
  api.assist('왼쪽 위 관찰',()=>drawLens(248,220));api.assist('가운데 관찰',()=>drawLens(350,285));api.assist('오른쪽 아래 관찰',()=>drawLens(450,330));
  scanSites.forEach(([x,y],index)=>scanMarkers.push(api.marker(x,y,index+1,()=>drawLens(x,y))));
  api.actions([]);drawLens(w.lens.x,w.lens.y,false);check();
  // The 3D specimen is an extra way to look, offered only once its GLB is in assets/models.
  hasRockModel(r.asset).then(ok=>{if(ok&&specimen.active&&scene.sys.isActive())api.actions([{id:'rock-3d',label:'돌 돌려 보기',onClick:()=>openRock3D(api.modal,r)}]);});
  return {update(time,delta){
    if(!motion)return;motion.elapsed+=Math.min(delta,60);const t=Math.min(1,motion.elapsed/650),ease=t*t*(3-2*t),m=motion;
    drawLens(m.from.x+(m.x-m.from.x)*ease,m.from.y+(m.y-m.from.y)*ease,false);
    if(t===1){motion=null;drawLens(m.x,m.y,true);}
  },pause:stop,destroy:stop};
 }

 function sortKnown(){
  api.task('관찰 기록을 붙이고 두 돌을 정리하자','돌마다 색과 알갱이 기록을 붙인 뒤, 알맞은 쟁반으로 옮겨 줘.');
  w.attached??={0:[],1:[]};w.sorted??=[];
  tray(TRAY.basalt,TRAY_Y,'현무암');tray(TRAY.granite,TRAY_Y,'화강암');
  const stones=[];[0,1].forEach((id)=>{
   const r=ROCKS[id],cx=id?780:420;api.panel(cx,260,330,365,0xfff7df,.9);api.text(r.name,cx,95,25);
   stones[id]=api.image(r.asset,cx,240,245,245);api.target(cx,403,300,70,'관찰 기록 두 개');
   [r.color,r.grain].forEach((claim,j)=>{
    const token=api.card(FEATURES[claim],cx+(j?88:-88),552,172,74,18);
    const attach=()=>{if(!hasRockEvidence(d,id)){api.say('앞 활동에서 이 돌의 색과 알갱이 관찰 기록을 먼저 모아 줘.');return false;}if(!w.attached[id].includes(claim))w.attached[id].push(claim);token.setAlpha(.35);api.spark(cx,400);api.save();progress();return false;};
    if(w.attached[id].includes(claim))token.setAlpha(.35);
    api.drag(token,{onDrop:(o,x,y)=>near(x,y,cx,360,320,180)?attach():false});api.assist(r.name+'에 '+FEATURES[claim]+' 붙이기',attach);
   });
   function put(type){if(w.attached[id].length!==2){api.say('이 돌에 색 기록과 알갱이 기록을 모두 붙여 줘.');return false;}if(type!==r.type){api.say('붙인 두 기록을 보고 쟁반 이름을 다시 골라 봐.');return false;}d.rockNames[id]=type;d.rockProofs[id]=[r.color,r.grain];if(!w.sorted.includes(id))w.sorted.push(id);stones[id].setPosition(TRAY[type],TRAY_Y-8).setDisplaySize(140,140);api.save();progress();return true;}
   api.drag(stones[id],{onDrop:(o,x,y)=>near(x,y,TRAY.basalt,TRAY_Y,210,230)?put('basalt'):near(x,y,TRAY.granite,TRAY_Y,210,230)?put('granite'):false});
   api.assist(r.name+'를 현무암 쟁반으로',()=>put('basalt'));api.assist(r.name+'를 화강암 쟁반으로',()=>put('granite'));
   if(w.sorted.includes(id))stones[id].setPosition(id===0?TRAY.basalt:TRAY.granite,TRAY_Y-8).setDisplaySize(140,140);
  });
  function progress(){api.counter(w.sorted.length,2,'증거로 분류한 돌');if(w.sorted.length===2)api.finish('같은 특징을 가진 돌끼리 정리했어. 이제 새로운 돌도 조사하자!');}
  api.actions([]);progress();
 }
}
