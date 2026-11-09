import {setupEvacuation} from './evacuation.js';
import {SHELTER,shelterPoint,inShelter,createShelter} from './shelter.js';

const inside=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;
// Classroom art is 1600 × 900. Draw it at 1200 × 675 in the same coordinate
// system as the targets, instead of anchoring targets to the page's cover crop.
export const CLASSROOM_HAZARDS=[{id:'window',name:'창문',x:190,y:190,w:320,h:320,text:'창문 가까이에서는 유리나 화분이 떨어질 수 있어.'},{id:'shelf',name:'책장',x:465,y:295,w:190,h:290,text:'책장과 책이 넘어질 수 있어. 떨어진 곳에서 몸을 보호해.'}];
export function setup(scene,api){
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=api.data,w=api.work;d.evidence??={};d.protect??={under:false,head:false,leg:false,stopped:false,confirmed:false};
 return api.step===0?protect():route();

 function chip(label,x,y,width=160,icon){return api.card(label,x,y,width,68,22,{icon});}
 // The same placement callbacks serve drag and large, keyboard-operable choices.
 // Choices never advance the activity unless the learner selects a valid target.
 function chooseTarget(title,choices,apply){
  api.modal(title,`<p>그림에서 살펴본 곳을 골라 줘.</p><div class="choice-row">${choices.map(([id,label])=>`<button class="secondary" style="min-height:48px;min-width:48px;font-size:20px" data-safety-target="${id}">${label}</button>`).join('')}</div><p data-safety-reply role="status"></p>`,(dialog,close)=>{
   dialog.querySelectorAll('[data-safety-target]').forEach(button=>{button.onclick=()=>{
    if(apply(button.dataset.safetyTarget))close();
    else dialog.querySelector('[data-safety-reply]').textContent='몸을 보호할 수 있는 곳인지 그림과 앞의 관찰을 다시 살펴봐.';
   };});
  });
 }

 function protect(){
  api.image('classroom',600,320,1200,640);
  const p=d.protect,phase=api.phase;
  api.image('classroom',600,320,1200,675,{sceneBackground:false}).setName('aligned-classroom');
  scene.add.ellipse(950,588,150,27,0x3a2718,.26);
  const hero=api.hero(950,450,270,'river-pose-2').setName('classroom-companion');
  if(phase===0){
   api.task('흔들리기 전에, 위험한 곳을 찾아보자','위험 표식을 창문과 책장에 끌어다 놓아 줘.');
   const hazards=CLASSROOM_HAZARDS;
   const hazardActions=[],risk=scene.add.graphics();
   function showRisk(){
    risk.clear();
    for(const h of hazards){
     const done=!!d.evidence['safety-'+h.id];
     risk.fillStyle(0xffefbf,done?.16:.06).fillRoundedRect(h.x-h.w/2,h.y-h.h/2,h.w,h.h,16).lineStyle(done?4:3,done?0xa95636:0xffe2a0,.95);
     const x=h.x-h.w/2,y=h.y-h.h/2;
     for(const [cx,cy,dx,dy]of [[x,y,1,1],[x+h.w,y,-1,1],[x,y+h.h,1,-1],[x+h.w,y+h.h,-1,-1]])risk.beginPath().moveTo(cx,cy+dy*24).lineTo(cx,cy).lineTo(cx+dx*24,cy).strokePath();
     risk.fillStyle(0x684b36,.17).fillEllipse(h.x,h.y+h.h*.42,h.w*.7,18);
    }
   }
   showRisk();
   hazards.forEach((h,i)=>{
    api.text(h.name,h.x,h.y-h.h/2+26,24,'#ffffff').setBackgroundColor('#315c47').setPadding(12,6);
    const mark=chip(h.name+' 위험',400+i*360,578,240,'warning-sign');
    function place(){api.record({id:'safety-'+h.id,kind:'safety',asset:'classroom',label:h.name,point:{x:h.x/1200,y:(h.y+17.5)/675},text:h.text});showRisk();mark.setPosition(h.x,h.y);mark.setAlpha(1);api.spark(h.x,h.y);api.say(h.text);progress();return true;}
    hazardActions.push({id:'safety-mark-'+h.id,label:h.name+' 표식 놓기',onClick:()=>chooseTarget(h.name+' 표식을 어디에 놓을까?', [['window','창문'],['shelf','책장'],['desk','책상 아래']],id=>id===h.id?place():false)});
    api.drag(mark,{onDrop:(o,x,y)=>inside(x,y,h.x,h.y,h.w,h.h)?place():false});
    if(d.evidence['safety-'+h.id]){mark.setPosition(h.x,h.y);showRisk();}
   });
   function progress(){const n=hazards.filter(h=>d.evidence['safety-'+h.id]).length;api.counter(n,2,'찾은 위험');if(n===2)api.finish('창문과 책장을 피해, 가까운 튼튼한 책상 아래에서 몸을 보호하자.');}
   api.actions([...hazardActions,{id:'earthquake-case',label:'포항 지진 사례',onClick(){
    api.modal('실제 사례 · 포항 지진',`<p>2017년 포항에서 지진이 일어났어. 포항고등학교 건물의 바깥벽이 갈라졌고, 시험장의 안전을 살피기 위해 대학 입학 시험인 수능 날짜도 바뀌었어.</p>
     <p><strong>건물에 생긴 피해는 무엇이었을까?</strong></p>
     <div class="choice-row"><button class="secondary" data-case="wall">학교 벽이 갈라졌어</button><button class="secondary" data-case="exam">시험 날짜가 바뀌었어</button></div>
     <p class="case-reply" role="status"></p><button class="primary" data-case-close>교실로 돌아가기</button>
     <p class="settings-note">자료 · 행정안전부, ‘지진으로 수능 연기된 포항 고등학교 현장’(2017)</p>`,(dialog,close)=>{
      dialog.querySelector('[data-case="exam"]').onclick=()=>{dialog.querySelector('.case-reply').textContent='그것은 학교생활에 생긴 변화야. 기사에서 건물 자체에 생긴 흔적을 찾아봐.';};
      dialog.querySelector('[data-case="wall"]').onclick=()=>{
       dialog.querySelector('.case-reply').textContent='맞아. 건물이 손상되면 조각이 떨어질 수 있어. 흔들림이 멈추면 머리를 보호하고 건물에서 떨어져 대피해.';
       if(!d.evidence['pohang-case'])api.record({id:'pohang-case',kind:'safety',label:'포항 지진의 피해',text:'학교 벽이 갈라졌고 시험 날짜도 바뀌었어. 대피할 때는 머리를 보호하고 건물에서 떨어져 이동해.'});
      };
      dialog.querySelector('[data-case-close]').onclick=close;
    });
   }}]);progress();return;
  }
  if(api.admin&&phase===2){p.under=true;p.head=true;}
  const shelter=createShelter(scene,api,hero,p);
  api.card('가상 행동 연습 · 실제 대피 훈련은 선생님과 함께',600,582,520,50,19);
  if(phase===1){
   api.task('리버의 몸과 머리를 보호하자','리버를 책상 아래로 옮겨. 팔로 머리를 감싸거나 곁에 있는 방석을 써.');
   const pillow=scene.add.container(SHELTER.x-180,525,[api.image('art/safety-cushion',0,0,145,91)]).setSize(150,96);
   function under(){p.under=true;shelter.crouch();api.record({id:'safety-desk',kind:'safety',label:'튼튼한 책상',asset:'classroom',point:{x:SHELTER.x/1200,y:(SHELTER.y+50)/640},text:'튼튼한 책상 아래에서 머리와 몸을 보호해.'});api.save();api.say('몸을 낮췄어. ‘팔로 머리 감싸기’를 누르거나 곁의 방석으로 머리를 보호해.');progress();return true;}
   function head(useArms=false){if(!p.under){api.say('먼저 책상 아래로 몸을 낮추자.');return false;}p.head=true;p.headMethod=useArms?'arms':'cushion';if(useArms)pillow.setVisible(false);else shelter.protectHead(pillow);api.save();const pos=shelterPoint(SHELTER.head);api.spark(pos.x,pos.y);api.say(useArms?'팔로 머리와 목을 보호했어.':'곁에 있던 방석으로 머리를 보호했어.');progress();return true;}
   if(!p.under)api.drag(hero,{onDrop:(o,x,y)=>inShelter(x,y,SHELTER.under)?under():false});
   api.drag(pillow,{onDrop:(o,x,y)=>inShelter(x,y,SHELTER.head)?head():false});
   if(p.head){if(p.headMethod==='arms')pillow.setVisible(false);else shelter.protectHead(pillow);}
   function progress(){api.counter(Number(p.under)+Number(p.head),2,'몸 보호');if(p.under&&p.head)api.finish('머리와 몸을 보호했어. 책상 다리를 잡고 흔들림이 멈출 때까지 기다리자.');}
   api.actions([{id:'protect-body',label:'몸을 보호할 곳 고르기',onClick:()=>chooseTarget('어디에서 몸을 보호할까?', [['desk','튼튼한 책상 아래'],['window','창문 곁'],['door','밖으로 뛰어나가기']],id=>id==='desk'?under():false)},{id:'protect-head',label:'팔로 머리 감싸기',onClick:()=>{if(!p.head)head(true);}}]);progress();return;
  }
  api.task('책상 다리를 잡고, 멈춘 뒤 확인하자','손 표식을 책상 다리로 옮겨 잡아 줘. 멈추기 전에는 밖으로 나가지 않아.');
  api.panel(320,80,510,80,0xfff4d8,.96);const status=api.text(p.stopped?'흔들림이 멈췄어':'흔들리고 있어 · 몸을 보호해',320,80,26);
  if(p.head&&p.headMethod!=='arms')shelter.drawHead();
  const hand=chip('손으로 잡기',1030,550,190),vibration=scene.add.graphics();let elapsed=0,visualTime=0;
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
  api.actions([{id:'protect-hold',label:'잡을 곳 고르기',onClick:()=>chooseTarget('몸을 보호하며 어디를 잡을까?', [['window','창문'],['leg','가까운 책상 다리'],['shelf','책장']],id=>id==='leg'?hold():false)},{id:'confirm-stop',label:'흔들림 멈춤 확인',primary:true,onClick:confirm}]);progress();if(p.confirmed)api.finish('선생님의 안내를 따라 걸어서 안전한 곳으로 이동하자.');
  return {update(time,delta){visualTime+=Math.min(delta,100);drawVibration();if(p.stopped||!p.leg)return;elapsed+=Math.min(delta,100);shelter.shake(reduced?0:Math.sin(elapsed/80)*2);if(elapsed>=2400){p.stopped=true;shelter.shake(0);vibration.clear();status.setText('흔들림이 멈췄어 · 확인해 줘');api.save();api.say('흔들림이 멈췄어. 멈춤을 확인한 뒤 선생님 안내를 따라가자.');progress();}}};
 }

 function route(){return setupEvacuation(scene,api);}
}
