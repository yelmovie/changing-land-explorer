import {setupEvacuation,placeholder,stageArt} from './evacuation.js';
import {SHELTER,shelterPoint,inShelter,createShelter} from './shelter.js';

const inside=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;
// Source anchors are in the 1200 × 675 classroom illustration, centered on the 1200 × 640 scene.
export const CLASSROOM_HAZARDS=[{id:'window',name:'창문',x:190,y:190,w:320,h:320,text:'창문 가까이에서는 유리나 화분이 떨어질 수 있어.'},{id:'shelf',name:'책장',x:465,y:295,w:190,h:290,text:'책장과 책이 넘어질 수 있어. 떨어진 곳에서 몸을 보호해.'}];

function fitClassroom(scene,api,onFit){
 const canvas=scene.game?.canvas,page=canvas?.closest('.safety-classroom');
 if(!page)return;
 const [first,last]=CLASSROOM_HAZARDS,clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 const leftAnchor=first.x/1200,rightAnchor=last.x/1200,windowY=(first.y+17.5)/675,bookcaseY=(last.y+17.5)/675;
 function fit(){
  const view=page.getBoundingClientRect(),frame=canvas.getBoundingClientRect();
  if(!view.width||!view.height||!frame.width||!frame.height)return;
  const x=frame.left-view.left,y=frame.top-view.top,pad=Math.min(32,frame.width*.08),padY=Math.min(16,frame.height*.045);
  // Keep the full page painted, but keep both hazards within reach on narrow screens.
  const width=Math.max(view.width,(x+pad)/leftAnchor,Math.min(view.height*16/9,(frame.width-pad*2)/(rightAnchor-leftAnchor)));
  const height=Math.max(view.height,width*9/16,(y+padY)/windowY,(view.height-y-frame.height+padY)/(1-bookcaseY));
  const minLeft=Math.max(view.width-width,x+pad-leftAnchor*width);
  const maxLeft=Math.min(0,x+frame.width-pad-rightAnchor*width);
  const alignWindow=x+leftAnchor*(frame.width-width);
  const left=minLeft<=maxLeft?clamp(alignWindow,minLeft,maxLeft):clamp(alignWindow,view.width-width,0);
  const minTop=Math.max(view.height-height,y+padY-windowY*height);
  const maxTop=Math.min(0,y+frame.height-padY-bookcaseY*height);
  const alignBookcase=y+frame.height*last.y/640-bookcaseY*height;
  const top=minTop<=maxTop?clamp(alignBookcase,minTop,maxTop):clamp(alignBookcase,view.height-height,0);
  page.style.setProperty('--classroom-image-size',`${width}px ${height}px`);
  page.style.setProperty('--classroom-image-position',`${left}px ${top}px`);
  onFit?.(CLASSROOM_HAZARDS.map(h=>({...h,
   x:(left+h.x/1200*width-x)*1200/frame.width,
   y:(top+(h.y+17.5)/675*height-y)*640/frame.height
  })));
 }
 const observer=new ResizeObserver(fit);observer.observe(page);observer.observe(canvas);
 scene.scale.on('resize',fit);fit();
 api.listenCleanup(()=>{observer.disconnect();scene.scale.off('resize',fit);});
}
export function setup(scene,api){
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=api.data,w=api.work;d.evidence??={};d.protect??={under:false,head:false,leg:false,stopped:false,confirmed:false};
 return api.step===0?protect():route();

 function chip(label,x,y,width=160,icon){return api.card(label,x,y,width,68,22,{icon});}
 function sceneKey(label,shortcuts,handler){
  const canvas=scene.game?.canvas;if(!canvas)return;
  const previous=canvas.getAttribute('aria-label');
  canvas.tabIndex=0;canvas.setAttribute('aria-label',label);canvas.setAttribute('aria-keyshortcuts',shortcuts);
  const listen=e=>{
   if(e.altKey||e.ctrlKey||e.metaKey||!shortcuts.split(' ').includes(e.key)||document.querySelector('dialog[open]'))return;
   e.preventDefault();handler(e.key);
  };
  canvas.addEventListener('keydown',listen);
  api.listenCleanup(()=>{canvas.removeEventListener('keydown',listen);canvas.removeAttribute('tabindex');canvas.removeAttribute('aria-keyshortcuts');if(previous)canvas.setAttribute('aria-label',previous);});
 }
 function touchZone(x,y,w,h,run){
  return scene.add.zone(x,y,w,h).setInteractive({useHandCursor:true}).on('pointerup',run);
 }

 function protect(){
  api.image('classroom',600,320,1200,640);
  const p=d.protect,phase=api.phase;
  if(phase!==0)fitClassroom(scene,api);
  scene.add.ellipse(950,588,150,27,0x3a2718,.26);
  const hero=api.hero(950,450,270,'river-pose-2').setFlipX(true).setName('classroom-companion');
  if(phase===0){
   api.task('위험 표시를 붙여 보자','위험 표시를 위험한 곳에 끌어다 놓아 줘.');
   let hazards=CLASSROOM_HAZARDS;
   const risk=scene.add.graphics();
   const placed=new Set(hazards.filter(h=>d.evidence['safety-'+h.id]).map(h=>h.id));
   const labels=hazards.map(h=>api.text(h.name,h.x,h.y+49,24,'#ffffff').setBackgroundColor('#315c47').setPadding(10,5));
   function showRisk(over=null){
    risk.clear();
    hazards.forEach((h,i)=>{
     const done=placed.has(h.id),x=h.x-h.w/2,y=h.y-h.h/2;
     risk.fillStyle(0xffefbf,h===over?.26:done?.12:.045).fillRoundedRect(x,y,h.w,h.h,16);
     risk.lineStyle(h===over?5:3,done?0xa95636:0xffe9b6,.95);
     for(const [cx,cy,dx,dy]of [[x,y,1,1],[x+h.w,y,-1,1],[x,y+h.h,1,-1],[x+h.w,y+h.h,-1,-1]])risk.beginPath().moveTo(cx,cy+dy*24).lineTo(cx,cy).lineTo(cx+dx*24,cy).strokePath();
     labels[i].setPosition(h.x,h.y+49).setVisible(done);
    });
   }
   const warning=(x,y,i)=>{
    // The triangle's corners stay inside the 60-radius disc instead of poking out past its rim.
    const symbol=api.image('art/ui/warning-sign',0,-3,84,78);
    return scene.add.container(x,y,[scene.add.circle(0,0,60,0xfff4cb,.92).setStrokeStyle(3,0x89633b),symbol]).setSize(130,128).setName('hazard-marker-'+i);
   };
   const markers=[warning(400,565,0),warning(760,565,1)],used=new Map();
   const markHazard=(mark,h)=>{used.set(mark,h.id);mark.setPosition(h.x,h.y-22).setScale(.78).disableInteractive();};
   function place(mark,h){
    if(!mark||used.has(mark))return false;
    if(!h||placed.has(h.id)){api.say(h?'이미 표시한 곳이야. 다른 위험한 곳을 찾아봐.':'유리가 깨지거나 물건이 넘어질 수 있는 곳을 찾아봐.');return false;}
    placed.add(h.id);markHazard(mark,h);
    const anchor=CLASSROOM_HAZARDS.find(a=>a.id===h.id);
    api.record({id:'safety-'+h.id,kind:'safety',asset:'classroom',label:h.name,point:{x:anchor.x/1200,y:(anchor.y+17.5)/675},text:h.text});
    showRisk();
    api.spark(h.x,h.y);api.say(h.text);progress();return true;
   }
   function search(x,y){return hazards.find(h=>inside(x,y,h.x,h.y,h.w,h.h));}
   markers.forEach(mark=>{
    const drop=(o,x,y,pointer)=>{const a=pointer||{x,y};showRisk();return place(o,search(a.x,a.y));};
    api.drag(mark,{onDrop:drop,onTap:drop,onMove:(_obj,x,y,pointer)=>{const a=pointer||{x,y};showRisk(search(a.x,a.y));},selectionHint:'위험 표시를 붙일 곳을 눌러 줘.'});
   });
   hazards.filter(h=>placed.has(h.id)).forEach((h,i)=>markHazard(markers[i],h));
   function progress(){api.counter(placed.size,2,'붙인 위험 표시');if(placed.size===2)api.finish('창문과 책장을 피해, 가까운 튼튼한 책상 아래에서 몸을 보호하자.');}
   sceneKey('위험 표시 붙이기: 숫자 1은 창문, 2는 책장이에요.', '1 2',key=>place(markers.find(m=>!used.has(m)),hazards[Number(key)-1]));
   api.actions([]);showRisk();progress();
   fitClassroom(scene,api,anchors=>{
    hazards=anchors;
    for(const [mark,id] of used){const h=hazards.find(a=>a.id===id);mark.setPosition(h.x,h.y-22);}
    showRisk();
   });
   return;
  }
  if(api.admin&&phase===2){p.under=true;p.head=true;}
  const shelter=createShelter(scene,api,hero,p);
  if(phase===1){
   api.task('리버의 몸과 머리를 보호하자','리버를 책상 아래로 옮기거나, 책상 아래를 눌러 줘.');
   const pillow=scene.add.container(SHELTER.x-180,525,[api.image('art/safety-cushion',0,0,145,91)]).setSize(150,96).setName('classroom-cushion');
   const hp=shelterPoint(SHELTER.head);
   const headHalo=scene.add.ellipse(hp.x,hp.y,134,97,0xcaf1b0,.12).setStrokeStyle(3,0xd8f8ac).setDepth(15).setVisible(false);
   const cue=api.text('책상 아래',SHELTER.x,SHELTER.y+113,24,'#fffce8').setBackgroundColor('#2e5e4e').setPadding(9,5).setDepth(16);
   function showCue(){
    headHalo.setVisible(p.under&&!p.head);cue.setVisible(!p.head);
    if(p.under)cue.setText('머리를 눌러 보호').setPosition(hp.x,hp.y+81);
   }
   function under(){
    if(p.under)return false;
    p.under=true;shelter.crouch();api.record({id:'safety-desk',kind:'safety',asset:'classroom',label:'튼튼한 책상',point:{x:SHELTER.x/1200,y:(SHELTER.y+50)/640},text:'튼튼한 책상 아래에서 머리와 몸을 보호해.'});
    api.save();api.say('리버의 머리를 누르거나, 방석을 머리 위에 놓아 줘.');showCue();progress();return true;
   }
   function head(useArms=false){
    if(!p.under){api.say('먼저 책상 아래로 들어가자.');return false;}
    if(p.head)return false;
    p.head=true;p.headMethod=useArms?'arms':'cushion';if(useArms)pillow.setVisible(false).disableInteractive();else shelter.protectHead(pillow);
    api.save();api.spark(hp.x,hp.y);showCue();progress();return true;
   }
   if(!p.under)api.drag(hero,{onDrop:(_o,x,y,at)=>inShelter(at?.x??x,at?.y??y,SHELTER.under)?under():false,selectionHint:'리버가 들어갈 책상 아래를 눌러 줘.'});
   api.drag(pillow,{onDrop:(_o,x,y,at)=>inShelter(at?.x??x,at?.y??y,SHELTER.head)?head():false,selectionHint:'방석을 놓을 리버의 머리를 눌러 줘.'});
   if(p.head){if(p.headMethod==='arms')pillow.setVisible(false).disableInteractive();else shelter.protectHead(pillow);}
   const low=shelterPoint(SHELTER.under);
   touchZone(low.x,low.y+10,250,145,()=>{if(!p.under)under();}).setName('classroom-under-target');
   touchZone(hp.x,hp.y,140,111,()=>{if(p.under&&!p.head)head(true);}).setName('classroom-head-target');
   function progress(){api.counter(Number(p.under)+Number(p.head),2,'몸 보호');if(p.under&&p.head)api.finish('머리와 몸을 보호했어. 책상 다리를 잡고 기다리자.');}
   sceneKey('숫자 1로 책상 아래 들어가기, 2로 머리 보호하기.', '1 2',key=>key==='1'?under():head(true));
   api.actions([]);showCue();progress();return;
  }
  api.task('책상 다리를 잡고, 멈춘 뒤 확인하자','손 표식을 책상 다리로 옮겨 잡아 줘. 멈추기 전에는 밖으로 나가지 않아.');
  api.panel(320,80,510,80,0xfff4d8,.96);const status=api.text(p.stopped?'흔들림이 멈췄어':'흔들리고 있어 · 몸을 보호해',320,80,26);
  if(p.head&&p.headMethod!=='arms')shelter.drawHead();
  const hand=chip('손으로 잡기',1030,550,190),vibration=scene.add.graphics();let elapsed=0,visualTime=0;
  // A painted hand badge hangs off the chip's left edge, reaching toward the desk leg; the hit area stays the chip.
  const handBadge=placeholder(scene,-100,-6);hand.add(handBadge);
  stageArt(scene,api,'hand-badge',key=>{handBadge.setTexture(key).setDisplaySize(74,74).setFlipX(true).setVisible(true);hand.list.find(o=>o.type==='Text')?.setX(14);});
  function drawVibration(){
   vibration.clear();if(p.stopped)return;
   const alpha=reduced?.65:.4+Math.sin(visualTime/180)*.2;
   vibration.lineStyle(3,0xa47b46,alpha);
   for(const side of [-1,1])for(const offset of [0,14]){
    const x=SHELTER.x+side*(185+offset),y=SHELTER.y+10;
    vibration.beginPath().moveTo(x,y-22).lineTo(x+side*6,y-6).lineTo(x,y+10).lineTo(x+side*6,y+26).strokePath();
   }
  }
  drawVibration();
  function hold(){if(!p.under||!p.head){api.say('앞 단계에서 책상 아래로 들어가 머리와 몸을 먼저 보호해 줘.');return false;}if(!shelter.hold()){api.say('보호 자세 그림을 불러오지 못했어. 연결을 확인한 뒤 다시 열어 줘.');return false;}p.leg=true;hand.setVisible(false);api.save();api.say('가까운 책상 다리를 잡았어. 이 자리에서 흔들림이 멈출 때까지 기다리자.');progress();return true;}
  api.drag(hand,{onDrop:(o,x,y)=>inShelter(x,y,SHELTER.leg)?hold():false});
  if(p.leg){hand.setVisible(false);shelter.hold();}
  function confirm(){if(!p.stopped||!p.leg){api.say('아직 흔들리고 있어. 책상 다리를 잡은 채 몸을 보호하자.');return;}p.confirmed=true;api.record({id:'safety-protect',kind:'safety',label:'내 몸 보호 훈련',text:'책상 아래에서 머리와 몸을 보호하고 다리를 잡았어. 흔들림이 멈춘 뒤 선생님의 안내를 따라 이동해.'});api.save();api.finish('흔들림이 멈췄어. 이제 선생님의 안내를 따라 걸어서 이동하자.');progress();}
  function progress(){api.counter(Number(p.leg)+Number(p.stopped)+Number(p.confirmed),3,'보호 → 멈춤 확인');}
  const leg=shelterPoint(SHELTER.leg);
  const legHint=scene.add.ellipse(leg.x,leg.y,88,161,0xe4fec9,.11).setStrokeStyle(4,0xcaf5a1).setVisible(!p.leg);
  touchZone(leg.x,leg.y,94,155,()=>{if(!p.leg){hold();legHint.setVisible(!p.leg);}});
  touchZone(320,80,485,96,()=>{if(p.stopped)confirm();}).setName('classroom-stop-target');
  sceneKey('숫자 1로 책상 다리 잡기, 멈춘 뒤 2로 확인하기.', '1 2',key=>{if(key==='1'){hold();legHint.setVisible(!p.leg);}else confirm();});
  api.actions([]);progress();if(p.confirmed)api.finish('선생님의 안내를 따라 걸어서 안전한 곳으로 이동하자.');
  return {update(time,delta){visualTime+=Math.min(delta,100);drawVibration();if(p.stopped||!p.leg)return;elapsed+=Math.min(delta,100);shelter.shake(reduced?0:Math.sin(elapsed/80)*2);if(elapsed>=2400){p.stopped=true;shelter.shake(0);vibration.clear();legHint.setVisible(false);status.setText('흔들림이 멈췄어 · 여기를 눌러 줘');api.save();api.say('흔들림이 멈췄어. 멈춤을 확인한 뒤 선생님 안내를 따라가자.');progress();}}};
 }

 function route(){return setupEvacuation(scene,api);}
}
