import {RIVER_WALK,walkDirection} from '../river-walk.js';
import {hazardMargin} from '../learning-model.js';

// A 3D walk over the evacuation board. evacuation.js still owns movement, collisions and the
// saved route; this view only reads that state, sends walking targets and adds the game layer:
// safe-footprint badges, rule boards, an aftershock to crouch through and the assembly flag.
const S=50; // map units per world unit
const BOARD={x:85,y:68,w:1030,h:516}; // part of the 1200 × 640 Phaser scene the view covers
const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export const EVAC_PICKUPS={
 school:{
  medals:[{x:330,y:100},{x:470,y:95},{x:620,y:110},{x:285,y:215},{x:300,y:290},{x:650,y:220},{x:560,y:420},{x:760,y:410}],
  rules:[
   {x:205,y:100,title:'뛰지 않고 걸어요',text:'흔들림이 멈춘 뒤에도 뛰지 말고 천천히 걸어서 이동해.'},
   {x:500,y:300,title:'밀지 않아요',text:'친구를 밀지 않고 한 줄로 차례차례 출구를 지나가.'},
   {x:650,y:420,title:'선생님 안내를 따라요',text:'선생님 안내를 듣고 정해진 곳에 모여 기다려.'}
  ]},
 // Outside, badges and boards stay at least 30 units beyond each hazard's own keep-away margin.
 outside:{
  medals:[{x:150,y:360},{x:250,y:300},{x:380,y:300},{x:510,y:300},{x:672,y:160},{x:760,y:100},{x:180,y:200},{x:900,y:330}],
  rules:[
   {x:125,y:320,title:'건물에서 떨어져요',text:'건물 가까이는 유리나 간판이 떨어질 수 있어. 멀리 떨어져 걸어.'},
   {x:440,y:290,title:'담장·전신주 피하기',text:'담장은 무너질 수 있고 전신주는 기울어질 수 있어. 넓게 돌아가.'},
   {x:800,y:95,title:'넓은 곳에 모여요',text:'넓은 공터에서 선생님과 함께 다음 안내를 기다려.'}
  ]}
};
// The second school walk is the mirrored building, so its badges mirror too; its boards teach new rules.
const DRILL_RULES=[
 {title:'엘리베이터 대신 계단으로',text:'흔들린 뒤에는 엘리베이터가 멈출 수 있어. 계단으로 걸어서 이동해.'},
 {title:'머리를 보호하며 이동해요',text:'떨어지는 물건에 대비해 가방이나 책으로 머리를 가리고 걸어.'},
 {title:'모이면 인원 확인을 기다려요',text:'운동장에 모이면 선생님이 모두 왔는지 확인할 때까지 기다려.'}
];
EVAC_PICKUPS.drill={
 medals:EVAC_PICKUPS.school.medals.map(p=>({x:1000-p.x,y:p.y})),
 rules:EVAC_PICKUPS.school.rules.map((r,i)=>({x:1000-r.x,y:r.y,...DRILL_RULES[i]}))
};
export const AFTERSHOCKS={first:2000,gap:3200,length:3000,count:2};

export async function mountEvacuation3D(scene,bridge){
 const canvas=scene.game?.canvas,stage=canvas?.parentElement;
 if(!stage||!globalThis.document)return null;
 // The scene may still be in create() here; evacuation.js destroys this view if the scene ended meanwhile.
 let THREE,playSound;
 try{THREE=await import('three');({playSound}=await import('../sound.js'));}catch{return null;}
 const host=document.createElement('div');host.className='evac3d';
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{return null;}
 await document.fonts?.ready?.catch?.(()=>{});
 const reduced=reducedMotion(),{config,outside}=bridge,set=EVAC_PICKUPS[bridge.scenario]||(outside?EVAC_PICKUPS.outside:EVAC_PICKUPS.school);
 const place=outside?'공터':'운동장';
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.innerHTML=`<div class="evac3d-hud" aria-live="polite">
  <span class="evac3d-chip"><img src="/assets/art/stages/safety/start-pad.webp" alt=""><i>발자국</i> <b data-k="medal">0/${set.medals.length}</b></span>
  <span class="evac3d-chip"><img src="/assets/art/ui/notice-board.webp" alt=""><i>약속</i> <b data-k="rule">0/${set.rules.length}</b></span>
  <span class="evac3d-chip"><img src="/assets/hero-protect.webp" alt=""><i>몸 낮추기</i> <b data-k="crouch">0/${AFTERSHOCKS.count}</b></span>
 </div>
 <canvas class="evac3d-mini" width="200" height="106" aria-hidden="true"></canvas>
 <div class="evac3d-banner" role="alert" hidden><strong>여진!</strong><span>멈추고 몸을 낮춰 머리를 보호해</span></div>
 <button class="evac3d-crouch" type="button" aria-keyshortcuts="Space">몸 낮추기 <kbd>Space</kbd></button>
 <p class="evac3d-help">WASD·방향키로 걷기 · 바닥을 누르면 그곳으로 걸어가 · Space 몸 낮추기</p>
 <div class="evac3d-result" hidden></div>`;
 const view=renderer.domElement;view.className='evac3d-canvas';view.tabIndex=0;
 view.setAttribute('role','img');view.setAttribute('aria-label',`3D ${outside?'학교 밖':'학교 안'} 대피길. 위험 구역을 피해 ${place}까지 걸어가요.`);
 host.prepend(view);stage.append(host);
 const $=s=>host.querySelector(s),mini=$('.evac3d-mini').getContext('2d'),banner=$('.evac3d-banner'),crouchButton=$('.evac3d-crouch'),help=$('.evac3d-help'),result=$('.evac3d-result');

 // ---------- scene ----------
 const world=new THREE.Scene();
 const sky=outside?0xcfe8ef:0xd8e7d6;
 world.background=new THREE.Color(sky);world.fog=new THREE.Fog(sky,16,34);
 const camera=new THREE.PerspectiveCamera(42,2,.1,80);
 world.add(new THREE.HemisphereLight(0xfff6e2,0x5f6e52,1.55));
 const sun=new THREE.DirectionalLight(0xfff1d6,1.7);sun.position.set(-6,12,8);world.add(sun);
 const loader=new THREE.TextureLoader(),textures=[],disposables=[];
 const track=o=>(disposables.push(o),o);
 function texture(url,ready){
  const t=loader.load(url,()=>{ready?.(t);});t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textures.push(t);return t;
 }
 const W=p=>new THREE.Vector3((p.x-500)/S,0,(p.y-265)/S);
 const mat=(o)=>track(new THREE.MeshLambertMaterial(o));
 const basic=(o)=>track(new THREE.MeshBasicMaterial(o));
 function box(w,h,d,material,x,y,z){const m=new THREE.Mesh(track(new THREE.BoxGeometry(w,h,d)),material);m.position.set(x,y,z);world.add(m);return m;}
 function decal(url,w,d,x,z,y=.012,opacity=1){
  const m=new THREE.Mesh(track(new THREE.PlaneGeometry(w,d)),basic({map:texture(url),transparent:true,opacity,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x,y,z);world.add(m);return m;
 }
 function label(text,{bg='#7a3f27',fg='#fff9e9',size=44}={}){
  const c=document.createElement('canvas'),g=c.getContext('2d'),font=`700 ${size}px NanumSquareNeo,'Malgun Gothic',sans-serif`;
  g.font=font;const w=Math.ceil(g.measureText(text).width)+size*1.1,h=Math.ceil(size*1.7);
  c.width=w;c.height=h;g.font=font;g.fillStyle=bg;g.beginPath();g.roundRect(0,0,w,h,h/2.6);g.fill();
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);
  const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true})));
  s.scale.set(w/h*.5,.5,1);s.renderOrder=20;world.add(s);return s;
 }

 // Ground: the walkable areas use the painted floor, everything else is a low wall or hedge.
 const floorUrl=outside?'/assets/art/ui/town-ground.webp':'/assets/art/ui/school-floor.webp';
 const ground=new THREE.Mesh(track(new THREE.PlaneGeometry(60,40)),mat({color:outside?0x7d9a62:0x40594b}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.03;world.add(ground);
 for(const r of config.areas){
  const t=texture(floorUrl);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(r.w/(outside?420:330),r.h/(outside?235:185));
  const m=new THREE.Mesh(track(new THREE.PlaneGeometry(r.w/S,r.h/S)),mat({map:t}));
  m.rotation.x=-Math.PI/2;m.position.copy(W({x:r.x+r.w/2,y:r.y+r.h/2}));world.add(m);
 }
 const wallSide=mat({color:outside?0x5f8a4e:0xe8dcc0}),wallTop=mat({color:outside?0x4c7a3f:0x3f5f50});
 for(const r of solidBlocks(config.areas)){
  const h=outside?.55:.62,m=box(r.w/S,h,r.h/S,[wallSide,wallSide,wallTop,wallSide,wallSide,wallSide],0,h/2,0);
  m.position.copy(W({x:r.x+r.w/2,y:r.y+r.h/2})).setY(h/2);
 }
 for(const r of [{x:-600,y:-600,w:2200,h:600},{x:-600,y:530,w:2200,h:600},{x:-600,y:0,w:600,h:530},{x:1000,y:0,w:600,h:530}]){
  const m=box(r.w/S,.62,r.h/S,wallTop,0,0,0);m.position.copy(W({x:r.x+r.w/2,y:r.y+r.h/2})).setY(outside?.27:.31);
 }

 // Hazards keep their exact rectangles; the dashed orange band is the same 10-unit margin the rules use.
 const hazardMeshes=new Map();
 const stripe=stripeTexture();
 for(const r of config.hazards){
  const c=W({x:r.x+r.w/2,y:r.y+r.h/2}),group=new THREE.Group();group.position.copy(c);world.add(group);
  const zone=new THREE.Mesh(track(new THREE.PlaneGeometry((r.w+2*hazardMargin(r))/S,(r.h+2*hazardMargin(r))/S)),basic({map:stripe,transparent:true,opacity:.75,depthWrite:false,color:0xffffff}));
  zone.rotation.x=-Math.PI/2;zone.position.y=.018;group.add(zone);
  const w=r.w/S,d=r.h/S;let height=.5;
  const add=(m,x=0,y=0,z=0)=>{m.position.set(x,y,z);group.add(m);return m;};
  const mesh=(geo,material)=>new THREE.Mesh(track(geo),material);
  if(r.label==='화단'){
   height=.45;
   add(mesh(new THREE.BoxGeometry(w,.4,d),[mat({color:0x9a6a3d}),mat({color:0x9a6a3d}),mat({map:texture('/assets/art/ui/flowerbed.webp')}),mat({color:0x9a6a3d}),mat({color:0x8a5d35}),mat({color:0x8a5d35})]),0,.2,0);
   const leaf=mat({color:0x5f9a4c});
   for(let i=0;i<6;i++)add(mesh(new THREE.SphereGeometry(.28,10,8),leaf),-w/2+.45+i*(w-.9)/5,.5,(i%2?.2:-.2)*d);
  }else if(r.label==='깨진 유리'){
   height=.25;
   add(decalMesh('/assets/art/ui/broken-glass.webp',w*1.15,d*1.2),0,.02,0);
   const glass=track(new THREE.MeshPhongMaterial({color:0xcff1ff,transparent:true,opacity:.7,shininess:120,specular:0xffffff,side:THREE.DoubleSide}));
   for(let i=0;i<7;i++){const s=add(mesh(new THREE.ConeGeometry(.12+(i%3)*.05,.3+(i%2)*.18,3),glass),(Math.sin(i*2.1))*w*.38,.12,(Math.cos(i*1.7))*d*.36);s.rotation.set(.5*Math.sin(i),i,.6*Math.cos(i*1.3));}
  }else if(r.label==='넘어진 책장'){
   height=.55;
   const shelf=add(mesh(new THREE.BoxGeometry(w*.9,.38,d*.95),[mat({color:0x9b6b3f}),mat({color:0x9b6b3f}),mat({map:texture('/assets/art/ui/fallen-shelf.webp')}),mat({color:0x7b5432}),mat({color:0x8b5e37}),mat({color:0x8b5e37})]),0,.25,0);
   shelf.rotation.set(.12,.35,-.08);
   const colors=[0x3e7d8f,0xb3473d,0xd8a53b,0x5d8a4f];
   for(let i=0;i<5;i++){const b=add(mesh(new THREE.BoxGeometry(.18,.06,.26),mat({color:colors[i%4]})),Math.sin(i*2.4)*w*.7,.04,Math.cos(i*1.9)*d*.7);b.rotation.y=i;}
  }else if(r.label==='건물'){
   height=2.3;
   add(mesh(new THREE.BoxGeometry(w*.92,1.7,d*.88),mat({map:windowsTexture(),color:0xffffff})),0,.85,0);
   const roof=add(mesh(new THREE.ConeGeometry(Math.hypot(w,d)*.5,.9,4),mat({color:0xb5553a})),0,2.15,0);roof.rotation.y=Math.PI/4;roof.scale.set(w/Math.hypot(w,d)*1.42,1,d/Math.hypot(w,d)*1.42);
  }else if(r.label==='담장'){
   height=1.35;
   add(mesh(new THREE.BoxGeometry(w*.75,1.15,d),mat({map:bricksTexture(d),color:0xffffff})),0,.58,0);
   add(mesh(new THREE.BoxGeometry(w*.85,.1,d*1.02),mat({color:0x9a8f80})),0,1.2,0);
  }else if(r.label==='전신주'){
   height=3.4;
   const wood=mat({color:0x8d6a48});
   add(mesh(new THREE.CylinderGeometry(.12,.16,3.2,10),wood),0,1.6,0).rotation.z=.06;
   add(mesh(new THREE.BoxGeometry(1.1,.1,.12),wood),.08,2.9,0);
   const wire=basic({color:0x2c2a28});
   for(const x of [-.45,.6])add(mesh(new THREE.CylinderGeometry(.015,.015,6,4),wire),x,2.95,0).rotation.x=Math.PI/2;
  }
  const tag=label(r.label);tag.position.set(c.x,height+.45,c.z);
  hazardMeshes.set(r.message,{group,zone,flash:0,x:c.x});
 }
 function decalMesh(url,w,d){const m=new THREE.Mesh(track(new THREE.PlaneGeometry(w,d)),basic({map:texture(url),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;return m;}

 // Start pad, exit gate and the assembly flag.
 const start=W(config.start),goal=W(config.goal);
 decal('/assets/art/stages/safety/start-pad.webp',1.4,1.4,start.x,start.z);
 label('출발',{bg:'#735321'}).position.set(start.x,.15,start.z+.95);
 const gateMeshes=config.gates.map(g=>{
  const c=W(g),green=mat({color:0x2f7a55}),group=new THREE.Group();group.position.copy(c);world.add(group);
  decal('/assets/art/ui/exit-mat.webp',2.4,1.05,c.x,c.z,.02);
  for(const x of [-1.12,1.12]){const post=new THREE.Mesh(track(new THREE.BoxGeometry(.16,1.9,.24)),green);post.position.set(x,.95,0);group.add(post);}
  const beam=new THREE.Mesh(track(new THREE.BoxGeometry(2.4,.22,.26)),green);beam.position.y=1.9;group.add(beam);
  const sign=label('출구 →',{bg:'#2f7a55',size:48});sign.position.set(c.x,2.35,c.z);
  return group;
 });
 decal('/assets/art/ui/playground.webp',2.7,2.7,goal.x,goal.z,.02);
 const flag=new THREE.Sprite(track(new THREE.SpriteMaterial({map:texture('/assets/tool-flag.webp'),transparent:true,alphaTest:.2})));
 flag.center.set(.5,.02);flag.scale.set(1.26,1.35,1);flag.position.set(goal.x+.55,0,goal.z-.45);world.add(flag);
 label(place,{bg:'#2f7a55'}).position.set(goal.x,.15,goal.z+1.55);
 const beaconMat=basic({color:0xffe6a0,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 const beacon=new THREE.Mesh(track(new THREE.CylinderGeometry(.75,.75,6,24,1,true)),beaconMat);world.add(beacon);
 function placeBeacon(){const p=config.gates.find((g,i)=>!bridge.gates.has(i))||config.goal,c=W(p);beacon.position.set(c.x,3,c.z);}
 placeBeacon();

 // Medals and rule boards are walk-through pickups placed on safe floor.
 const medalFace=texture('/assets/art/stages/safety/start-pad.webp');
 const medalGeo=track(new THREE.CylinderGeometry(.38,.38,.08,28));medalGeo.rotateX(Math.PI/2);
 const medals=set.medals.map(p=>{const face=basic({map:medalFace,transparent:true,alphaTest:.1}),m=new THREE.Mesh(medalGeo,[basic({color:0xd99a2b,transparent:true}),face,face]);const c=W(p);m.position.set(c.x,.75,c.z);world.add(m);return {p,mesh:m,taken:false,pop:0};});
 const boardImage=new Image();boardImage.src='/assets/art/ui/notice-board.webp';
 const rules=set.rules.map((r,i)=>{
  const c=document.createElement('canvas');c.width=380;c.height=300;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);
  const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:t,transparent:true,alphaTest:.1})));
  s.center.set(.5,0);s.scale.set(2.3,1.82,1);const at=W(r);s.position.set(at.x,0,at.z);world.add(s);
  const rule={...r,sprite:s,canvas:c,tex:t,read:false,n:i+1};paintRule(rule);return rule;
 });
 boardImage.onload=()=>rules.forEach(paintRule);
 function paintRule(rule){
  const g=rule.canvas.getContext('2d'),{width:w,height:h}=rule.canvas;g.clearRect(0,0,w,h);
  if(boardImage.complete&&boardImage.naturalWidth)g.drawImage(boardImage,0,0,w,w*566/760);else{g.fillStyle='#b98b55';g.fillRect(30,40,320,200);}
  g.textAlign='center';g.textBaseline='middle';g.fillStyle=rule.read?'#2f6e52':'#5b3a22';
  g.font=`700 26px NanumSquareNeo,'Malgun Gothic',sans-serif`;g.fillText(rule.read?'✔ 약속 확인':`안전 약속 ${rule.n}`,w/2,104);
  const words=rule.title.length>7?rule.title.split(' '):[rule.title],mid=Math.ceil(words.length/2),lines=words.length>1?[words.slice(0,mid).join(' '),words.slice(mid).join(' ')]:words;
  g.font=`700 38px NanumSquareNeo,'Malgun Gothic',sans-serif`;g.fillStyle='#3a2414';lines.forEach((t,i)=>g.fillText(t,w/2,152+(i-(lines.length-1)/2)*44));
  if(!rule.read){g.fillStyle='#f3b63c';g.beginPath();g.arc(w-46,46,30,0,Math.PI*2);g.fill();g.fillStyle='#4a2c14';g.font=`700 40px NanumSquareNeo,sans-serif`;g.fillText('!',w-46,48);}
  rule.tex.needsUpdate=true;
 }

 // River is the project's 8-direction walk sheet on a camera-facing sprite.
 // Frames sit edge to edge in one sheet: no mipmaps and a 1.5 px inset keep the row above from bleeding in.
 const walkTex=texture(RIVER_WALK.url);walkTex.generateMipmaps=false;walkTex.minFilter=THREE.LinearFilter;
 const SHEET_W=RIVER_WALK.frameWidth*RIVER_WALK.columns,SHEET_H=RIVER_WALK.frameHeight*RIVER_WALK.directions.length,EU=1.5/SHEET_W,EV=1.5/SHEET_H;
 walkTex.repeat.set(1/RIVER_WALK.columns-2*EU,1/RIVER_WALK.directions.length-2*EV);
 const walkMat=track(new THREE.SpriteMaterial({map:walkTex,transparent:true,alphaTest:.25}));
 const protectMat=track(new THREE.SpriteMaterial({map:texture('/assets/hero-protect.webp'),transparent:true,alphaTest:.25}));
 const cheerMat=track(new THREE.SpriteMaterial({map:texture('/assets/hero-cheer.webp'),transparent:true,alphaTest:.25}));
 const river=new THREE.Sprite(walkMat);river.center.set(.5,1-RIVER_WALK.origin[1]);world.add(river);
 const shadow=new THREE.Mesh(track(new THREE.CircleGeometry(.42,20)),basic({color:0x1c3328,transparent:true,opacity:.28,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,.7,1);world.add(shadow);
 const sparks=[];
 function burst(at,color=0xffe28a,count=14){
  const geo=track(new THREE.SphereGeometry(.06,6,4)),m=basic({color,transparent:true});
  for(let i=0;i<count;i++){const s=new THREE.Mesh(geo,m.clone());track(s.material);s.position.copy(at);const a=i/count*Math.PI*2;sparks.push({mesh:s,v:new THREE.Vector3(Math.cos(a)*1.6,2.2+Math.random()*1.4,Math.sin(a)*1.6),life:1});world.add(s);}
 }

 // ---------- state ----------
 let visible=true,facing='south',stride=0,last={...bridge.current},clock=0,walked=0,held=new Set(),keyDriven=false,dragging=null;
 let flagTime=0,quake=null,quakesDone=0,crouchTimer=0,crouchHits=0,medalCount=0,ruleCount=0,arrived=false,frameNo=0,lastHazard={msg:'',at:-1e4},camPos=null,helpShown=true;
 const camTarget=new THREE.Vector3();
 function chips(){
  $('[data-k="medal"]').textContent=`${medalCount}/${medals.length}`;
  $('[data-k="rule"]').textContent=`${ruleCount}/${rules.length}`;
  $('[data-k="crouch"]').textContent=`${crouchHits}/${AFTERSHOCKS.count}`;
 }

 // ---------- layout ----------
 function fit(){
  const c=canvas.getBoundingClientRect(),s=stage.getBoundingClientRect();
  if(!c.width||!c.height)return;
  const k=c.width/1200,w=Math.round(BOARD.w*k),h=Math.round(BOARD.h*c.height/640);
  Object.assign(host.style,{left:`${c.left-s.left+BOARD.x*k}px`,top:`${c.top-s.top+BOARD.y*c.height/640}px`,width:`${w}px`,height:`${h}px`});
  host.classList.toggle('is-compact',w<640);host.classList.toggle('is-tiny',w<420);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 const resize=new ResizeObserver(fit);resize.observe(stage);resize.observe(canvas);scene.scale.on('resize',fit);fit();

 // ---------- input ----------
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3(),ndc=new THREE.Vector2();
 function toMap(e){
  const r=view.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(ndc,camera);if(!ray.ray.intersectPlane(plane,hit))return null;
  return {x:hit.x*S+500,y:hit.z*S+265};
 }
 function walkTo(e){const q=toMap(e);if(q&&q.x>=40&&q.x<=960&&q.y>=40&&q.y<=490){keyDriven=false;bridge.aim(q);hideHelp();}}
 const onDown=e=>{if(document.querySelector('dialog[open]'))return;view.setPointerCapture?.(e.pointerId);dragging=e.pointerId;walkTo(e);};
 const onMove=e=>{if(dragging===e.pointerId)walkTo(e);};
 const onUp=e=>{if(dragging===e.pointerId)dragging=null;};
 view.addEventListener('pointerdown',onDown);view.addEventListener('pointermove',onMove);view.addEventListener('pointerup',onUp);view.addEventListener('pointercancel',onUp);
 const KEYS={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
 const typing=t=>t?.matches?.('input,textarea,select,[contenteditable="true"]');
 const keydown=e=>{
  if(!visible||e.altKey||e.ctrlKey||e.metaKey||typing(e.target)||document.querySelector('dialog[open]'))return;
  const k=e.key.toLowerCase();
  if(KEYS[k]){e.preventDefault();held.add(k);hideHelp();}
  else if(e.key===' '&&spaceTarget(e.target)){e.preventDefault();if(!e.repeat)crouch();}
 };
 // Space crouches even right after a route button was clicked, instead of pressing that button again.
 const spaceTarget=t=>!t||t===document.body||host.contains(t)||!!t.closest?.('.action-buttons');
 const keyup=e=>{held.delete(e.key.toLowerCase());if(e.key===' '&&visible&&spaceTarget(e.target))e.preventDefault();};
 const blur=()=>held.clear();
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
 crouchButton.addEventListener('click',()=>crouch());
 function hideHelp(){if(helpShown){helpShown=false;help.classList.add('is-faded');}}

 function steer(){
  if(!held.size){if(keyDriven){keyDriven=false;bridge.halt();}return;}
  if(quake||bridge.won)return;
  let vx=0,vy=0;for(const k of held){vx+=KEYS[k][0];vy+=KEYS[k][1];}
  const len=Math.hypot(vx,vy);if(!len){if(keyDriven){keyDriven=false;bridge.halt();}return;}
  vx/=len;vy/=len;const cur=bridge.current;
  // Slide along walls; walk into a hazard only once in a while so its warning is heard, not spammed.
  for(const [dx,dy] of [[vx,vy],[Math.sign(vx),0],[0,Math.sign(vy)]]){
   if(!dx&&!dy)continue;
   const probe={x:cur.x+dx*7,y:cur.y+dy*7},msg=bridge.collision(cur,probe);
   if(!msg){keyDriven=true;bridge.aim({x:cur.x+dx*40,y:cur.y+dy*40});return;}
   if(config.hazards.some(h=>h.message===msg)){
    if(lastHazard.msg!==msg||clock-lastHazard.at>2600){keyDriven=true;bridge.aim({x:cur.x+dx*40,y:cur.y+dy*40});}
    else if(keyDriven){keyDriven=false;bridge.halt();}
    return;
   }
  }
  if(keyDriven){keyDriven=false;bridge.halt();}
 }

 function crouch(){
  if(!visible||arrived)return;
  crouchTimer=quake?Infinity:700;
  if(quake&&!quake.crouched){quake.crouched=true;playSound('complete',{force:true});bridge.say('좋아! 그 자리에서 몸을 낮추고 머리를 보호했어. 흔들림이 멈출 때까지 기다리자.');}
 }

 // ---------- aftershocks ----------
 function updateQuake(dt){
  if(arrived)return;
  if(!quake){
   if(quakesDone>=AFTERSHOCKS.count||!walked)return;
   const due=AFTERSHOCKS.first+quakesDone*AFTERSHOCKS.gap;
   if(walked>=due&&bridge.moving){
    quake={t:0,crouched:false};bridge.setLocked(true);held.clear();keyDriven=false;
    banner.hidden=false;crouchButton.classList.add('is-urgent');playSound('alert',{force:true});
    bridge.say('여진이야! 걷지 말고 그 자리에서 몸을 낮춰 머리를 보호해.');
   }
   return;
  }
  quake.t+=dt;
  if(quake.t>=AFTERSHOCKS.length){
   if(quake.crouched){crouchHits++;bridge.say('여진이 멈췄어. 잘 기다렸어! 다시 천천히 걸어가자.');}
   else bridge.say('여진이 올 때는 걷지 말고 몸을 낮춰 머리를 보호해. 이제 다시 천천히 걸어가자.');
   quake=null;quakesDone++;crouchTimer=0;bridge.setLocked(false);banner.hidden=true;crouchButton.classList.remove('is-urgent');chips();
  }
 }

 // ---------- per-frame ----------
 function frame(dt){
  if(!visible)return;
  clock+=dt;frameNo++;
  steer();
  const cur=bridge.current,dx=cur.x-last.x,dy=cur.y-last.y,moved=Math.hypot(dx,dy);
  if(moved>.01){facing=walkDirection(dx,dy,facing);stride+=moved;walked+=dt;}
  last={...cur};
  updateQuake(dt);
  if(crouchTimer!==Infinity)crouchTimer=Math.max(0,crouchTimer-dt);
  const low=!!quake?.crouched||crouchTimer>0,pos=W(cur);
  // River: walk frames, crouch pose during aftershocks, cheer at the flag.
  const material=arrived?cheerMat:low?protectMat:walkMat;
  if(river.material!==material){river.material=material;river.center.set(.5,material===walkMat?1-RIVER_WALK.origin[1]:.03);}
  if(material===walkMat){
   const row=Math.max(0,RIVER_WALK.directions.indexOf(facing)),col=moved>.01?Math.floor(stride/70*4)%4:1;
   walkTex.offset.set(col/RIVER_WALK.columns+EU,1-(row+1)/RIVER_WALK.directions.length+EV);river.scale.set(1.28,1.6,1);
  }else if(material===protectMat)river.scale.set(1.3,1.27,1);
  else river.scale.set(1.14,1.6,1);
  const bob=moved>.01&&!reduced?Math.abs(Math.sin(stride/70*Math.PI))*.05:0;
  river.position.set(pos.x,bob,pos.z+.02);shadow.position.set(pos.x,.025,pos.z);
  // Pickups.
  for(const m of medals){
   if(m.taken){if(m.pop<1){m.pop=Math.min(1,m.pop+dt/350);m.mesh.scale.setScalar(1+m.pop*.8);m.mesh.position.y=.75+m.pop*.9;m.mesh.material.forEach(x=>{x.transparent=true;x.opacity=1-m.pop;});if(m.pop>=1)m.mesh.visible=false;}continue;}
   m.mesh.rotation.set(-.35,reduced?0:Math.sin(clock/520+m.p.y)*.7,0);m.mesh.position.y=.75+(reduced?0:Math.sin(clock/380+m.p.x)*.08);
   if(Math.hypot(m.p.x-cur.x,m.p.y-cur.y)<34){m.taken=true;medalCount++;chips();playSound('coin',{force:true});burst(m.mesh.position.clone());}
  }
  for(const r of rules){
   if(!r.read&&Math.hypot(r.x-cur.x,r.y-cur.y)<46){r.read=true;ruleCount++;paintRule(r);chips();playSound('good',{force:true});burst(r.sprite.position.clone().setY(1.2),0xa8e6b0,10);bridge.say(`안전 약속 ${r.n}: ${r.title}. ${r.text}`);}
   r.sprite.position.y=r.read||reduced?0:Math.abs(Math.sin(clock/420+r.n))*.06;
  }
  for(const [msg,h] of hazardMeshes){if(h.flash>0){h.flash=Math.max(0,h.flash-dt);h.zone.material.opacity=.75+.25*Math.sin(h.flash/60);h.group.position.x=h.x+(reduced?0:Math.sin(h.flash/25)*.05*h.flash/900);}else{h.zone.material.opacity=.75;h.group.position.x=h.x;}}
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.life-=dt/700;s.v.y-=dt*.006;s.mesh.position.addScaledVector(s.v,dt/1000);s.mesh.material.opacity=Math.max(0,s.life);if(s.life<=0){world.remove(s.mesh);sparks.splice(i,1);}}
  beacon.material.opacity=bridge.won?0:.18+(reduced?.06:Math.sin(clock/300)*.08+.08);beacon.rotation.y+=dt*.0006;
  // The assembly flag waves; on arrival it is planted bigger, like a summit flag.
  const grow=arrived?Math.min(1,(flagTime+=dt)/450):0,big=1+grow*.45+(arrived&&!reduced?Math.sin(grow*Math.PI)*.18:0);
  flag.scale.set(1.26*big,1.35*big,1);flag.material.rotation=reduced?0:Math.sin(clock/420)*.05;
  // Camera: a gentle third-person follow from the south, shaking a little during an aftershock.
  camTarget.set(Math.max(-5.4,Math.min(5.4,pos.x)),0,Math.max(-1.3,Math.min(2.2,pos.z)));
  const want=new THREE.Vector3(camTarget.x,arrived?6.2:7.6,camTarget.z+(arrived?5.4:6.2));
  camPos=camPos?camPos.lerp(want,1-Math.pow(.004,dt/1000)):want.clone();
  camera.position.copy(camPos);
  if(quake&&!reduced){const a=.08*(1-quake.t/AFTERSHOCKS.length);camera.position.x+=Math.sin(clock/28)*a;camera.position.y+=Math.cos(clock/23)*a*.6;}
  camera.lookAt(camTarget.x,.4,camTarget.z-.5);
  if(frameNo%3===0)drawMini(cur);
  renderer.render(world,camera);
 }

 function drawMini(cur){
  const g=mini,k=200/1000;g.clearRect(0,0,200,106);
  g.fillStyle='rgba(30,52,42,.82)';g.beginPath();g.roundRect(0,0,200,106,10);g.fill();
  g.fillStyle=outside?'#c9d6a6':'#f2e3c2';for(const r of config.areas)g.fillRect(r.x*k,r.y*k,r.w*k,r.h*k);
  g.fillStyle='#d9733f';for(const r of config.hazards){const m=hazardMargin(r);g.fillRect((r.x-m)*k,(r.y-m)*k,(r.w+2*m)*k,(r.h+2*m)*k);}
  g.fillStyle='#2f7a55';for(const gt of config.gates){g.beginPath();g.arc(gt.x*k,gt.y*k,6,0,7);g.fill();}
  g.fillStyle='#ffd25e';g.beginPath();g.arc(config.goal.x*k,config.goal.y*k,7,0,7);g.fill();
  g.strokeStyle='#3b8fb0';g.lineWidth=2;g.beginPath();bridge.points.forEach((p,i)=>i?g.lineTo(p.x*k,p.y*k):g.moveTo(p.x*k,p.y*k));g.stroke();
  g.fillStyle='#fff';g.strokeStyle='#244';g.lineWidth=2;g.beginPath();g.arc(cur.x*k,cur.y*k,5,0,7);g.fill();g.stroke();
 }

 function arrive(){
  if(arrived)return;arrived=true;quake=null;banner.hidden=true;bridge.setLocked(false);crouchButton.classList.remove('is-urgent');
  burst(W(config.goal).setY(1.4),0xffd25e,26);burst(W(config.goal).setY(1.2),0x9fdcb8,18);
  result.innerHTML=`<strong>${place} 집합 완료!</strong><span>안전 발자국 ${medalCount}/${medals.length} · 안전 약속 ${ruleCount}/${rules.length} · 몸 낮추기 ${crouchHits}/${quakesDone||AFTERSHOCKS.count}</span>`;
  result.hidden=false;crouchButton.hidden=true;
 }
 function reset(){
  arrived=false;quake=null;quakesDone=0;crouchHits=0;crouchTimer=0;walked=0;medalCount=0;ruleCount=0;held.clear();keyDriven=false;
  banner.hidden=true;result.hidden=true;crouchButton.hidden=false;flagTime=0;crouchButton.classList.remove('is-urgent');
  for(const m of medals){m.taken=false;m.pop=0;m.mesh.visible=true;m.mesh.scale.setScalar(1);m.mesh.material.forEach(x=>{x.opacity=1;});}
  for(const r of rules){r.read=false;paintRule(r);}
  placeBeacon();chips();last={...bridge.current};
 }
 chips();frame(0);

 const api={
  // Read-only numbers for the browser checks (host.evac3d.stats).
  get stats(){const {x,y}=bridge.current;return {x,y,walked,quakesDone,crouchHits,medals:medalCount,rules:ruleCount,arrived,quake:!!quake};},
  get visible(){return visible;},
  get ownsKeys(){return visible;},
  setVisible(on){
   visible=on;host.hidden=!on;held.clear();keyDriven=false;
   if(!on&&quake){quake=null;quakesDone++;banner.hidden=true;crouchButton.classList.remove('is-urgent');bridge.setLocked(false);}
   if(on){fit();last={...bridge.current};frame(0);}
  },
  frame,reset,arrive,
  pause(){held.clear();keyDriven=false;},
  gate(){placeBeacon();burst(W(config.gates[0]).setY(1.6),0x9fdcb8,16);},
  blocked(msg){lastHazard={msg,at:clock};const h=hazardMeshes.get(msg);if(h)h.flash=900;},
  destroy(){
   resize.disconnect();scene.scale.off('resize',fit);
   window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);
   for(const t of textures)t.dispose();for(const d of disposables)d.dispose?.();
   renderer.dispose();renderer.forceContextLoss?.();host.remove();
  }
 };
 host.evac3d=api;
 return api;

 // ---------- generated textures ----------
 function stripeTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.fillStyle='rgba(217,115,63,.28)';g.fillRect(0,0,128,128);
  g.strokeStyle='rgba(217,115,63,.85)';g.lineWidth=14;
  for(let i=-128;i<256;i+=44){g.beginPath();g.moveTo(i,128);g.lineTo(i+128,0);g.stroke();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;
 }
 function windowsTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#efe2c4';g.fillRect(0,0,256,128);g.fillStyle='#d7c39d';g.fillRect(0,112,256,16);
  for(let x=18;x<240;x+=56)for(const y of [18,64]){g.fillStyle='#5f8fa6';g.fillRect(x,y,38,32);g.fillStyle='#cfe9f2';g.fillRect(x+3,y+3,15,12);g.strokeStyle='#8a6e52';g.lineWidth=3;g.strokeRect(x,y,38,32);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;
 }
 function bricksTexture(len){
  const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#d9cdb8';g.fillRect(0,0,256,128);
  for(let y=0,row=0;y<128;y+=16,row++)for(let x=row%2?-16:0;x<256;x+=32){g.fillStyle=['#b35a3c','#a8513a','#bd6646'][(x+y)%3];g.fillRect(x+1,y+1,30,14);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(Math.max(1,len/2),1);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;
 }
}

// Non-walkable cells of the 1000 × 530 board, merged into a handful of wall boxes.
export function solidBlocks(areas,cell=10,width=1000,height=530){
 const cols=width/cell,rows=height/cell,open=(x,y)=>areas.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
 const solid=Array.from({length:rows},(_,j)=>Array.from({length:cols},(_,i)=>!open(i*cell+cell/2,j*cell+cell/2)));
 const blocks=[];
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  if(!solid[j][i])continue;
  let w=1;while(i+w<cols&&solid[j][i+w])w++;
  let h=1;grow:while(j+h<rows){for(let k=0;k<w;k++)if(!solid[j+h][i+k])break grow;h++;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)solid[j+y][i+x]=false;
  blocks.push({x:i*cell,y:j*cell,w:w*cell,h:h*cell});
 }
 return blocks;
}
