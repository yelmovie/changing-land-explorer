import {SCHOOL_CONFIG,OUTSIDE_CONFIG,inspectRoute,routeSignature} from '../learning-model.js';
export function setupEvacuation(scene,api){
 const d=api.data,w=api.work;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const outside=api.phase===2,playback=api.phase===1,config=outside?OUTSIDE_CONFIG:SCHOOL_CONFIG,key=outside?'outsideRoute':'schoolRoute';
  d[key]??=[];const ox=100,oy=80,scale=1;
  const toScreen=p=>({x:ox+p.x*scale,y:oy+p.y*scale});
  const toMap=p=>({x:(p.x-ox)/scale,y:(p.y-oy)/scale});
  api.image('school',600,320,1200,640);
  // Walls stay a dark board; walkable floor and hazards are illustrated, but every
  // shape keeps the exact rectangles inspectRoute uses.
  const board=scene.add.graphics().fillStyle(0x3f5f50,.96).fillRoundedRect(85,68,1030,525,22).lineStyle(6,0xd9b46a,1).strokeRoundedRect(85,68,1030,525,22);
  const floorKey=outside?'art/ui/town-ground':'art/ui/school-floor',areaMask=scene.make.graphics({add:false});
  config.areas.forEach(r=>areaMask.fillStyle(0xffffff).fillRoundedRect(ox+r.x,oy+r.y,r.w,r.h,12));
  if(scene.textures.exists(floorKey))api.image(floorKey,600,330,1030,560).setMask(areaMask.createGeometryMask());
  else{const plain=scene.add.graphics();config.areas.forEach(r=>plain.fillStyle(0xf2e6c9,1).fillRoundedRect(ox+r.x,oy+r.y,r.w,r.h,9));}
  const map=scene.add.graphics();
  config.areas.forEach(r=>map.lineStyle(3,0xffffff,.5).strokeRoundedRect(ox+r.x,oy+r.y,r.w,r.h,12));
  const HAZARD_ART={'화단':['flowerbed',1,1],'깨진 유리':['broken-glass',1,1],'넘어진 책장':['fallen-shelf',1,1],'건물':['house-roof',1,1],'담장':['brick-wall',.5,1],'전신주':['utility-pole',1.3,1.1]};
  config.hazards.forEach(r=>{
   // The dashed border is the very same ten-unit safety margin used by inspectRoute.
   map.fillStyle(0xc36c44,.16).fillRoundedRect(ox+r.x-10,oy+r.y-10,r.w+20,r.h+20,10);
   for(let x=ox+r.x-10;x<ox+r.x+r.w+10;x+=16)map.lineStyle(3,0xc36c44,.8).lineBetween(x,oy+r.y-10,Math.min(x+9,ox+r.x+r.w+10),oy+r.y-10).lineBetween(x,oy+r.y+r.h+10,Math.min(x+9,ox+r.x+r.w+10),oy+r.y+r.h+10);
   for(let y=oy+r.y-10;y<oy+r.y+r.h+10;y+=16)map.lineStyle(3,0xc36c44,.8).lineBetween(ox+r.x-10,y,ox+r.x-10,Math.min(y+9,oy+r.y+r.h+10)).lineBetween(ox+r.x+r.w+10,y,ox+r.x+r.w+10,Math.min(y+9,oy+r.y+r.h+10));
   const art=HAZARD_ART[r.label],key=art&&'art/ui/'+art[0],cx=ox+r.x+r.w/2,cy=oy+r.y+r.h/2;
   if(key&&scene.textures.exists(key))api.image(key,cx,cy,r.w*art[1],r.h*art[2]);
   else map.fillStyle(r.label==='화단'?0x86a56b:0xa98366).fillRoundedRect(ox+r.x,oy+r.y,r.w,r.h,7);
   // Labels stay inside the blocked footprint, so a legal route does not cover them.
   const label=r.label==='넘어진 책장'?'넘어진\n책장':r.label;
   const tag=api.text(label,cx,oy+r.y+17,19,'#fff9e9');tag.setBackgroundColor('#7a3f27').setPadding(7,3).setDepth(4);
  });
  config.gates.forEach(g=>{if(scene.textures.exists('art/ui/exit-mat'))api.image('art/ui/exit-mat',ox+g.x,oy+g.y,150,68);else api.panel(ox+g.x,oy+g.y,110,42,0x6f9e80,1);api.text('출구',ox+g.x,oy+g.y+46,19,'#ffffff').setBackgroundColor('#2f7a55').setPadding(8,2);});
  const start=toScreen(config.start),goal=toScreen(config.goal);
  scene.add.circle(start.x,start.y,32,0xf6c45f,.55).setStrokeStyle(4,0xfffbdf);
  api.text('출발',start.x,start.y-60,19,'#ffffff').setBackgroundColor('#735321').setPadding(8,2);
  if(scene.textures.exists('art/ui/playground'))api.image('art/ui/playground',goal.x,goal.y,104,104);else scene.add.circle(goal.x,goal.y,37,0x84bf85).setStrokeStyle(5,0xfffbdf);
  api.text(outside?'공터':'운동장',goal.x,goal.y+64,19,'#ffffff').setBackgroundColor('#2f7a55').setPadding(8,2);
  api.card('가상 대피 게임 · 흔들림이 멈춘 뒤 선생님과 걸어요',600,40,650,52,20);
  const shadow=scene.add.ellipse(start.x,start.y+24,42,12,0x183d32,.24);
  const hero=api.hero(start.x,start.y,78,'river-pose-2').setDepth(8);
  const marker=scene.add.graphics().setDepth(7),prints=scene.add.graphics();
  api.panel(225,610,265,48,0x55382c,.98);api.panel(780,610,580,48,0x234d3c,.98);
  const hearts=api.text('',225,610,22,'#fff1e8'),status=api.text('',780,610,20,'#ffffff');
  let current={...config.start},points=[{...config.start}],target=null,lives=3,blockedUntil=0,clock=0,steps=0,complete=!!api.completed,won=false,paused=false;
  const gates=new Set(),trail=[];
  function hud(){hearts.setText('천천히 · 다시 시도 가능');status.setText(won?'안전 도착!':lives===0?'다시 도전하면 하트 3개로 시작해요':outside?'건물 · 담장 · 전신주와 거리 두기':gates.size?'출구 통과! 운동장으로 걸어요':'위험을 피해 출구 → 운동장');api.counter(won?1:0,1,'안전 도착');}
  function stop(){target=null;marker.clear();hero.setAngle(0);paused=true;draw(false);}
  function reset(){current={...config.start};points=[{...config.start}];target=null;lives=3;blockedUntil=0;won=false;paused=false;gates.clear();trail.length=0;prints.clear();marker.clear();hero.setAlpha(1).setAngle(0);hud();draw(false);api.say('다시 출발! 급하게 가지 않아도 괜찮아. 위험 구역 바깥의 통로를 골라 줘.');}
  function aim(p){if(lives===0||won||globalThis.document?.hidden||globalThis.document?.querySelector('dialog[open]'))return;paused=false;target=p;marker.clear().lineStyle(3,0xffe28a,1).strokeCircle(ox+p.x,oy+p.y,15);}
  function moveBy(x,y){aim({x:current.x+x,y:current.y+y});}
  api.actions([{id:'route-left',label:'← 왼쪽',onClick:()=>moveBy(-55,0)},{id:'route-up',label:'↑ 위',onClick:()=>moveBy(0,-55)},{id:'route-down',label:'↓ 아래',onClick:()=>moveBy(0,55)},{id:'route-right',label:'→ 오른쪽',onClick:()=>moveBy(55,0)},{id:'route-stop',label:'멈추기',onClick:stop},{id:'route-reset',label:'다시 도전',onClick:reset}]);
  api.task(outside?'공터까지 안전하게 대피하자':playback?'한 번 더! 출구를 지나 운동장으로':'리버를 움직여 안전한 길을 찾아보자','가까운 통로를 누르면 리버가 걸어가. 방향 버튼도 써 봐. 주황 위험 구역 앞에서는 멈춰. 다른 길로 다시 갈 수 있어.');
  const down=p=>{const q=toMap(p);if(q.x>=40&&q.x<=960&&q.y>=40&&q.y<=490)aim(q);};
  const keydown=e=>{if(e.repeat||e.target?.matches?.('input,textarea,select')||globalThis.document?.querySelector('dialog[open]'))return;const v={ArrowLeft:[-55,0],ArrowRight:[55,0],ArrowUp:[0,-55],ArrowDown:[0,55]}[e.key];if(v){e.preventDefault();moveBy(...v);}else if(e.key==='Escape')stop();};
  scene.input.on('pointerdown',down);globalThis.window?.addEventListener('keydown',keydown);globalThis.window?.addEventListener('blur',stop);
  api.listenCleanup(()=>{scene.input.off('pointerdown',down);globalThis.window?.removeEventListener('keydown',keydown);globalThis.window?.removeEventListener('blur',stop);});
  function draw(walking){
   const h=toScreen(current),bob=walking&&!reduced?Math.sin(clock/85)*3:0;
   hero.setPosition(h.x,h.y+bob).setAngle(walking&&!reduced?Math.sin(clock/85)*3:0);shadow.setPosition(h.x,h.y+29);hero.setAlpha(clock<blockedUntil?.55:1);
   prints.clear();trail.forEach((p,i)=>prints.fillStyle(0x4c6a55,(i+1)/trail.length*.35).fillEllipse(ox+p.x,oy+p.y+26,7,11));
  }
  function arrive(){
   if(!inspectRoute(points,config).ok)return;
   won=true;stop();hud();api.spark(goal.x,goal.y);
   if(complete){api.say('안전하게 다시 도착했어! 앞서 모은 기록은 그대로야.');return;}
   d[key]=structuredClone(points);w.planned=true;
   if(playback||outside){d[key+'Done']=true;d[key+'Signature']=routeSignature(points);w.replayed=true;api.record({id:key,kind:'route',label:outside?'내 학교 밖 안전길':'내 학교 안 안전길',points:structuredClone(points),outside,text:outside?'건물·담장·전신주를 피해 넓은 공터에 도착했어.':'위험을 피하고 출구를 지나 운동장에 도착했어.'});}
   api.save();complete=true;api.finish(outside?'넓은 공터에 도착했어! 실제로는 선생님과 함께 대피해.':playback?'출구를 지나 운동장에 도착했어. 다음은 학교 밖이야.':'안전한 통로를 찾았어! 다음 단계에서도 직접 걸어 확인하자.');
  }
  api.setToolHandler?.('compass',()=>api.say(outside?'건물·담장·전신주에서 떨어진 넓은 길을 찾아 공터로 가자.':'화단 아래 복도로 돌아서 가운데 출구를 지나 운동장으로 가자.'));
  hud();draw(false);
  return {pause:stop,destroy:stop,update(time,delta){
   clock+=Math.min(delta,50);if(!target||paused||won||lives===0){draw(false);return;}if(clock<blockedUntil){draw(false);return;}
   const dx=target.x-current.x,dy=target.y-current.y,dist=Math.hypot(dx,dy),travel=Math.min(dist,Math.min(delta,50)*.17);
   if(dist<.1){target=null;marker.clear();draw(false);return;}
   const next={x:current.x+dx/dist*travel,y:current.y+dy/dist*travel},hit=evacuationCollision(current,next,config);
   if(hit){target=null;marker.clear();blockedUntil=clock+900;api.say(hit+' 멈췄어. 기록은 그대로야. 다른 길로 천천히 돌아가자.');hud();draw(false);return;}
   current=next;const a=points.at(-2),b=points.at(-1);
   if(a&&Math.abs((b.x-a.x)*(current.y-b.y)-(b.y-a.y)*(current.x-b.x))<1e-7&&(b.x-a.x)*(current.x-b.x)+(b.y-a.y)*(current.y-b.y)>0)points[points.length-1]={...current};
   else if(points.length<4096)points.push({...current});else{stop();api.say('많이 걸었네! 다시 도전해서 더 짧은 안전길을 찾아보자.');return;}
   for(let i=0;i<config.gates.length;i++){const g=config.gates[i];if(Math.hypot(g.x-current.x,g.y-current.y)<g.radius&&!gates.has(i)){gates.add(i);api.spark(ox+g.x,oy+g.y);api.say('출구를 통과했어! 운동장까지 천천히 걸어가자.');hud();}}
   if(++steps%8===0){trail.push({...current});if(trail.length>14)trail.shift();}
   if(dx)hero.setFlipX(dx<0);draw(true);
   if(Math.hypot(current.x-config.goal.x,current.y-config.goal.y)<32&&gates.size===config.gates.length)arrive();
  }};
}
export function evacuationCollision(a,b,config){
 const inside=(p,r,pad)=>p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
 const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));
 for(let i=1;i<=n;i++){const p={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};const h=config.hazards.find(r=>inside(p,r,10));if(h)return h.message;if(!config.areas.some(r=>inside(p,r,-8)))return '벽이나 통로 밖으로 갈 수 없어.';}
 return null;
}
