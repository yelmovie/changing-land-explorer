import {SCHOOL_CONFIG,OUTSIDE_CONFIG,inspectRoute,routeSignature} from '../learning-model.js';

const inside=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;
export function setup(scene,api){
 const d=api.data,w=api.work;d.evidence??={};d.protect??={under:false,head:false,leg:false,stopped:false,confirmed:false};
 return api.step===0?protect():route();

 function chip(label,x,y,width=160){const o=scene.add.container(x,y);o.add(scene.add.rectangle(0,0,width,62,0xffeab4).setStrokeStyle(3,0xb38b46));o.add(api.text(label,0,0,22));o.setSize(width,62);return o;}
 function protect(){
  api.image('classroom',600,320,1200,640);
  const p=d.protect,phase=api.phase;
  const hero=api.hero(phase===0?950:p.under?665:970,phase===0?465:p.under?458:510,phase===0?160:145,scene.textures.exists('hero-protect')&&p.under?'hero-protect':'river-pose-2');
  if(phase===0){
   api.task('흔들리기 전에, 위험한 곳을 찾아보자','위험 표식을 창문과 책장에 끌어다 놓아 줘.');
   const hazards=[{id:'window',name:'창문',x:150,y:205,w:240,h:240,text:'창문 가까이에서는 유리나 화분이 떨어질 수 있어.'},{id:'shelf',name:'책장',x:438,y:265,w:190,h:210,text:'책장과 책이 넘어질 수 있어. 떨어진 곳에서 몸을 보호해.'}];
   hazards.forEach((h,i)=>{
    const mark=chip('!  '+h.name+' 위험',400+i*360,578,250);
    function place(){api.record({id:'safety-'+h.id,kind:'safety',asset:'classroom',label:h.name,point:{x:h.x/1200,y:h.y/640},text:h.text});mark.setPosition(h.x,h.y);mark.setAlpha(.9);api.spark(h.x,h.y);api.say(h.text);progress();return true;}
    api.drag(mark,{onDrop:(o,x,y)=>inside(x,y,h.x,h.y,h.w,h.h)?place():false});api.assist(h.name+'에 위험 표식 놓기',place);
    if(d.evidence['safety-'+h.id])mark.setPosition(h.x,h.y);
   });
   function progress(){const n=hazards.filter(h=>d.evidence['safety-'+h.id]).length;api.counter(n,2,'찾은 위험');if(n===2)api.finish('창문과 책장을 피해, 가까운 튼튼한 책상 아래에서 몸을 보호하자.');}
   api.actions([]);progress();return;
  }
  // This outline sits on the sturdy central desk shown in the illustration.
  const shelter=scene.add.rectangle(690,444,225,205).setStrokeStyle(5,0xffda78).setFillStyle(0xffda78,.03);
  api.panel(690,316,290,53,0xfff5db,.95);api.text('튼튼한 책상',690,316,25);
  if(phase===1){
   api.task('리버의 몸과 머리를 보호하자','리버를 책상 아래로 옮긴 뒤, 방석을 머리에 가져다 줘.');
   const pillow=scene.add.container(260,540,[api.image('art/safety-cushion',0,0,145,91)]).setSize(150,96);
   function under(){p.under=true;hero.setPosition(665,458);if(scene.textures.exists('hero-protect'))hero.setTexture('hero-protect');api.record({id:'safety-desk',kind:'safety',label:'튼튼한 책상',asset:'classroom',point:{x:690/1200,y:444/640},text:'튼튼한 책상 아래에서 머리와 몸을 보호해.'});api.save();api.say('좋아. 책상 아래에서 머리도 보호해 줘.');progress();return true;}
   function head(){if(!p.under){api.say('먼저 책상 아래로 몸을 낮추자.');return false;}p.head=true;pillow.setPosition(665,406).setScale(.65);api.save();api.spark(665,406);progress();return true;}
   api.drag(hero,{onDrop:(o,x,y)=>inside(x,y,690,455,240,190)?under():false});
   api.drag(pillow,{onDrop:(o,x,y)=>inside(x,y,665,420,180,140)?head():false});
   api.assist('리버를 튼튼한 책상 아래로',under);api.assist('방석으로 머리 보호하기',head);
   if(p.head)pillow.setPosition(665,406).setScale(.65);
   function progress(){api.counter(Number(p.under)+Number(p.head),2,'몸 보호');if(p.under&&p.head)api.finish('머리와 몸을 보호했어. 책상 다리를 잡고 흔들림이 멈출 때까지 기다리자.');}
   api.actions([]);progress();return;
  }
  api.task('책상 다리를 잡고, 멈춘 뒤 확인하자','손 표식을 책상 다리로 옮겨 잡아 줘. 멈추기 전에는 밖으로 나가지 않아.');
  api.panel(320,80,510,80,0xfff4d8,.96);const status=api.text(p.stopped?'흔들림이 멈췄어':'흔들리고 있어 · 몸을 보호해',320,80,26);
  scene.add.rectangle(665,406,90,45,0xe3b45d).setStrokeStyle(4,0xffe8a8);
  const leg=scene.add.rectangle(960,458,26,170,0xffe08a,.35).setStrokeStyle(4,0xffdf7c);
  const hand=chip('손으로 잡기',980,550,190);let elapsed=0;
  function hold(){if(!p.under||!p.head){api.say('앞 단계에서 책상 아래로 들어가 머리와 몸을 먼저 보호해 줘.');return false;}p.leg=true;hand.setPosition(960,465).setScale(.72);api.save();api.say('책상 다리를 잡았어. 지금은 이 자리에서 몸을 보호하자.');progress();return true;}
  api.drag(hand,{onDrop:(o,x,y)=>inside(x,y,960,460,100,180)?hold():false});api.assist('책상 다리 잡기',hold);
  if(p.leg)hand.setPosition(960,465).setScale(.72);
  function confirm(){if(!p.stopped||!p.leg){api.say('아직 흔들리고 있어. 책상 다리를 잡은 채 몸을 보호하자.');return;}p.confirmed=true;api.record({id:'safety-protect',kind:'safety',label:'내 몸 보호 훈련',text:'책상 아래에서 머리와 몸을 보호하고 다리를 잡았어. 흔들림이 멈춘 뒤 선생님의 안내를 따라 이동해.'});api.save();api.finish('흔들림이 멈췄어. 이제 선생님의 안내를 따라 걸어서 이동하자.');progress();}
  function progress(){api.counter(Number(p.leg)+Number(p.stopped)+Number(p.confirmed),3,'보호 → 멈춤 확인');}
  api.actions([{id:'confirm-stop',label:'흔들림 멈춤 확인',primary:true,onClick:confirm}]);progress();if(p.confirmed)api.finish('선생님의 안내를 따라 걸어서 안전한 곳으로 이동하자.');
  return {update(time,delta){if(p.stopped||!p.leg)return;elapsed+=Math.min(delta,100);shelter.x=690+Math.sin(elapsed/80)*2;leg.x=960+Math.sin(elapsed/80)*2;if(elapsed>=2400){p.stopped=true;shelter.x=690;leg.x=960;status.setText('흔들림이 멈췄어 · 확인해 줘');api.save();api.say('흔들림이 멈췄어. 멈춤을 확인한 뒤 선생님 안내를 따라가자.');progress();}}};
 }

 function route(){
  const outside=api.phase===2,playback=api.phase===1,config=outside?OUTSIDE_CONFIG:SCHOOL_CONFIG,key=outside?'outsideRoute':'schoolRoute';
  d[key]??=[];const ox=100,oy=80,scale=1;
  const toScreen=p=>({x:ox+p.x*scale,y:oy+p.y*scale});
  const toMap=p=>({x:(p.x-ox)/scale,y:(p.y-oy)/scale});
  api.image('school',600,320,1200,640);
  api.panel(600,330,1030,525,0x607f6e,.97);
  const map=scene.add.graphics();
  config.areas.forEach(r=>{map.fillStyle(0xf2e6c9,1).fillRoundedRect(ox+r.x,oy+r.y,r.w,r.h,9);});
  config.hazards.forEach(r=>{
   // The dashed border is the very same ten-unit safety margin used by inspectRoute.
   map.lineStyle(3,0xb2754e,.7).strokeRect(ox+r.x-10,oy+r.y-10,r.w+20,r.h+20);
   map.fillStyle(r.label==='화단'?0x86a56b:0xa98366).fillRoundedRect(ox+r.x,oy+r.y,r.w,r.h,7);
   api.text(r.label,ox+r.x+r.w/2,oy+r.y+r.h/2, r.w<100?16:22,'#fff9e9',r.w-5);
  });
  config.gates.forEach(g=>{api.panel(ox+g.x,oy+g.y,110,42,0x6f9e80,1);api.text('출구',ox+g.x,oy+g.y,23,'#ffffff');});
  const start=toScreen(config.start),goal=toScreen(config.goal);
  scene.add.circle(start.x,start.y,29,0xf6c45f).setStrokeStyle(4,0xfffbdf);
  scene.add.circle(goal.x,goal.y,37,0x84bf85).setStrokeStyle(5,0xfffbdf);api.text(outside?'공터':'운동장',goal.x,goal.y,19);
  api.text('가상 지도 · 실제로는 선생님의 안내를 따라가요',600,42,22,'#fff9e8');
  const lines=scene.add.graphics();const hero=api.hero(start.x,start.y,66,'river-pose-2');
  let points=structuredClone(d[key]),draft=[],drawing=false,pointerDrawing=false,moving=false,segment=1,result=null,current={...config.start},runPoints=[],complete=false,tapMode=false,tapStarted=false;
  function finish(summary){complete=true;api.actions([]);api.finish(summary);}
  let checked=d[key+'Done']&&d[key+'Signature']===routeSignature(points)&&inspectRoute(points,config).ok;
  if(!checked)d[key+'Done']=false;
  function draw(){
   lines.clear();const list=drawing?draft:points;
   if(list.length){lines.lineStyle(13,0xfffcdf,1).beginPath().moveTo(ox+list[0].x,oy+list[0].y);list.slice(1).forEach(p=>lines.lineTo(ox+p.x,oy+p.y));lines.strokePath();lines.lineStyle(6,checked?0x439b70:0x3884a1,1).beginPath().moveTo(ox+list[0].x,oy+list[0].y);list.slice(1).forEach(p=>lines.lineTo(ox+p.x,oy+p.y));lines.strokePath();}
   if(result&&!result.ok){lines.lineStyle(5,0xc36c44,1).strokeCircle(ox+result.point.x,oy+result.point.y,23);}
   const h=toScreen(current);hero.setPosition(h.x,h.y);
  }
  function invalidate(){checked=false;d[key+'Done']=false;d[key+'Signature']=null;w.replayed=false;api.save();}
  function store(){if(draft.length<2)return;points=draft.map(p=>({...p}));draft=[];d[key]=structuredClone(points);result=null;current={...config.start};invalidate();draw();api.say('길을 남겼어. 길 확인으로 위험한 곳이 없는지 살펴보자.');}
  function append(p){const q={x:Math.max(0,Math.min(1000,p.x)),y:Math.max(0,Math.min(500,p.y))},last=draft.at(-1);if(!last||Math.hypot(last.x-q.x,last.y-q.y)>6)draft.push(q);if(draft.length>800)draft=draft.filter((_,i)=>i%2===0);draw();}
  function reset(){if(complete)return;moving=false;drawing=false;pointerDrawing=false;tapStarted=false;points=[];draft=[];d[key]=[];current={...config.start};result=null;invalidate();draw();api.say('리버에서부터 다시 이어 줘. 실패해도 보상은 줄어들지 않아.');}
  function check(){
   if(moving)return;result=inspectRoute(points,config);draw();
   if(!result.ok){api.say(result.message);api.counter(0,1,'안전한 길');return;}
   if(!outside&&!playback){w.planned=true;d[key]=structuredClone(points);api.save();api.counter(1,1,'안전한 길');finish('위험한 곳을 피해 출구까지 이어졌어. 이제 리버와 이 길을 확인하자.');return;}
   runPoints=structuredClone(points);segment=1;current={...config.start};moving=true;api.say('리버가 네 길을 따라 걸어가. 출구와 위험한 곳을 함께 살펴봐.');
  }
  api.task(outside?'학교 밖에서도 안전한 곳으로 가자':playback?'그린 길을 따라 출구로 걸어가자':'학교 안에서 안전한 길을 그리자',outside?'리버에서 넓은 공터까지, 건물·담장·전신주를 피해 길을 이어 줘.':playback?'길을 확인하고 리버를 출구와 운동장으로 안내해 줘. 위험하면 길을 다시 고칠 수 있어.':'리버부터 출구를 지나 운동장까지 손가락으로 이어 줘.');
  function down(p){
   if(moving||complete)return;const q=toMap(p);
   if(tapMode){
    if(!points.length&&!tapStarted&&Math.hypot(q.x-config.start.x,q.y-config.start.y)>45){api.say('먼저 리버가 서 있는 시작점을 눌러 줘.');return;}
    tapStarted=true;
    draft=points.length?structuredClone(points):[{...config.start}];drawing=true;result=null;append(q);drawing=false;store();return;
   }
   if(Math.hypot(q.x-config.start.x,q.y-config.start.y)>45)return;draft=[{...config.start}];drawing=true;pointerDrawing=true;result=null;
  }
  function move(p){if(pointerDrawing)append(toMap(p));}
  function up(p){if(!pointerDrawing)return;pointerDrawing=false;append(toMap(p));drawing=false;store();}
  scene.input.on('pointerdown',down);scene.input.on('pointermove',move);scene.input.on('pointerup',up);scene.input.on('pointerupoutside',up);
  api.listenCleanup(()=>{scene.input.off('pointerdown',down);scene.input.off('pointermove',move);scene.input.off('pointerup',up);scene.input.off('pointerupoutside',up);});
  // These controls append real waypoints; inspectRoute checks every segment, so an
  // accessible route cannot teleport through a wall or over a hazard.
  for(const [label,dx,dy] of [['← 왼쪽',-20,0],['↑ 위쪽',0,-20],['↓ 아래쪽',0,20],['→ 오른쪽',20,0]])api.assist(label+'으로 한 칸 잇기',()=>{if(moving||complete)return;if(!draft.length)draft=points.length?structuredClone(points):[{...config.start}];drawing=true;const last=draft.at(-1);append({x:last.x+dx,y:last.y+dy});});
  api.assist('그린 길 저장',()=>{drawing=false;store();});api.assist('마지막 지점 지우기',()=>{if(moving)return;if(draft.length>1){draft.pop();drawing=true;draw();}else if(points.length>1){draft=structuredClone(points);draft.pop();drawing=true;draw();}});
  const modeLabel=()=>tapMode?'선 그리기로':'점 찍기로';
  function actions(){api.actions([{id:'route-check',label:playback?'리버와 걸어가기':outside?'이 길로 걸어가기':'길 확인',primary:true,onClick:check},{id:'route-input',label:modeLabel(),onClick(){tapMode=!tapMode;actions();api.say(tapMode?'리버부터 차례로 점을 눌러 길을 이어 줘. 위험한 곳을 피해 모서리마다 점을 찍어 봐.':'리버에서 출발해 손가락으로 길을 그려 줘.');}},{id:'route-reset',label:'다시 그리기',onClick:reset}]);}
  actions();
  if(playback&&!points.length)api.say('앞 단계의 길이 없어서 여기서 다시 그릴 수 있어. 리버부터 출구를 지나 이어 줘.');
  api.counter(checked?1:0,1,'안전한 길');draw();
  if(checked&&(outside||playback))finish(outside?'다른 장소에서도 위험을 피해 안전한 곳에 도착했어!':'출구를 지나 운동장에 도착했어.');
  else if(w.planned&&!outside&&!playback&&inspectRoute(points,config).ok)finish('안전한 길을 그렸어. 다음 단계에서 걸어 보자.');
  let compassUntil=0;const compass=scene.add.graphics();
  api.setToolHandler?.('compass',()=>{compass.clear().lineStyle(6,0xffd569,1);config.hazards.forEach(r=>compass.strokeRect(ox+r.x-10,oy+r.y-10,r.w+20,r.h+20));compassUntil=scene.time.now+3000;api.say('노란 테두리 바깥으로 충분히 떨어져 가자. 출구를 지나야 해.');});
  return {update(time,delta){
   if(compassUntil&&time>=compassUntil){compass.clear();compassUntil=0;}
   if(!moving)return;let distance=Math.min(delta,100)*.25;
   while(distance>0&&segment<runPoints.length){const target=runPoints[segment],length=Math.hypot(target.x-current.x,target.y-current.y);if(length<=distance){current={...target};distance-=length;segment++;}else{current.x+=(target.x-current.x)/length*distance;current.y+=(target.y-current.y)/length*distance;distance=0;}}
   draw();if(segment>=runPoints.length){moving=false;checked=true;d[key]=structuredClone(runPoints);d[key+'Done']=true;d[key+'Signature']=routeSignature(runPoints);w.replayed=true;api.record({id:key,kind:'route',label:outside?'내 학교 밖 안전길':'내 학교 안 안전길',points:structuredClone(runPoints),outside,text:'위험한 곳을 피하고 출구를 지나 안전한 곳에 도착했어.'});api.save();api.spark(goal.x,goal.y);api.counter(1,1,'안전한 길');finish(outside?'건물과 담장, 전신주를 피해 넓은 공터에 도착했어!':'출구를 지나 운동장에 도착했어. 학교 밖에서도 안전한 곳을 찾아보자.');}
  }};
 }
}
