import {CITY_SITES} from '../learning-model.js';
import {CITY_POINTS,CITY_OBSERVATIONS as OBSERVATIONS,cityTimeLabel,cityScene,paintScene,cityEvidence,cityMarker} from '../observation-scenes.js';

const SITE_X=CITY_POINTS.map(p=>p.x),SITE_Y=CITY_POINTS.map(p=>p.y);
const REASONS=['화산재가 비행을 방해해요.','토양이 변하려면 오랜 시간이 필요해요.','위험이 없는지 먼저 확인해야 해요.'];
const ACTIONS=['운항 안내를 확인해요.','피해를 복구하고 기다려요.','안전 안내 뒤에 이용해요.'];
const BAD_ACTIONS=['지금 바로 비행기를 타요.','분출 직후 바로 씨를 뿌려요.','분출 중에도 놀러 가요.'];
const inBox=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;

export function setup(scene,api){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=api.data,w=api.work,index=api.phase,s=CITY_SITES[index];d.evidence??={};d.notices??={};d.citySeen??={};
 api.image(api.step===0?'city-calm':'art/city-message-square-v2',600,320,1200,640);
 const hero=api.hero(105,510,160,'river-pose-1');
 if(api.step===0)return observe();return advise();

 function token(label,x,y,width=270,height=66){return api.card(label,x,y,width,height,22);}

 function observe(){
  api.task(`${s.name}의 시간이 어떻게 달라질까?`,'손잡이를 양쪽 끝까지 옮겨 살핀 뒤, 관찰 표식을 알맞은 시기에 붙여 줘.');
  w.wipe??=.5;w.pairs??=[];w.seen??={before:false,after:false};
  // Both times use exactly the same camera and underlying illustration. The ash,
  // damage and closures below are time-state overlays, not mismatched photographs.
  const earlier=paintScene(scene,api,cityScene(index,false),{background:false});
  const wipeMask=scene.add.graphics();wipeMask.setVisible(false);earlier.setMask(wipeMask.createGeometryMask());
  const afterLabel=paintScene(scene,api,cityScene(index,true),{background:false});
  const afterMask=scene.add.graphics();afterMask.setVisible(false);afterLabel.setMask(afterMask.createGeometryMask());
  const m=cityMarker(index),marker=scene.add.ellipse(m.x,m.y,m.w,m.h).setStrokeStyle(5,0xffdf78).setFillStyle(0,0);
  const line=scene.add.rectangle(600,255,8,450,0xf3cc76).setStrokeStyle(2,0x8c6b36,.8);
  const handle=scene.textures.exists('art/ui/time-knob')?scene.add.container(600,440,[api.image('art/ui/time-knob',0,0,88,88)]).setSize(96,96):token('↔',600,440,82,72);
  api.panel(170,49,290,58,0xfff7df,.96);api.text('분출 당시',170,49,25);
  api.panel(1000,49,350,58,0xfff7df,.96);api.text(cityTimeLabel(index),1000,49,25);
  api.panel(600,568,1170,134,0xfff7df,.96);
  api.target(265,545,315,65,'');api.target(670,545,355,65,'');
  const recordLabels=[api.text(w.pairs.includes(0)?OBSERVATIONS[index][0]:'분출 당시 기록',265,545,22),api.text(w.pairs.includes(1)?OBSERVATIONS[index][1]:(index===1?'아주 오랜 시간 뒤 기록':'안전 확인 뒤 기록'),670,545,22)];
  const stamps=[];
  OBSERVATIONS[index].forEach((label,j)=>{
   const t=token(label,255+j*370,610,345,48);stamps.push(t);if(w.pairs.includes(j))t.setAlpha(.35);
   function connect(slot){
    if(!w.seen.before||!w.seen.after){api.say('시간 손잡이를 왼쪽 끝과 오른쪽 끝으로 옮겨 두 모습을 먼저 살펴봐.');return false;}
    if(j===2||j!==slot){api.say(index===1?'피해를 입은 때와 아주 오랜 시간 뒤를 나눠 봐. 바로 비옥해지는 건 아니야.':'위험한 때와 안전이 확인된 뒤를 구분해 봐.');return false;}
    if(!w.pairs.includes(j))w.pairs.push(j);t.setAlpha(.35);recordLabels[slot].setText(label);api.spark(slot?670:265,545);api.say(label+' 기록을 '+(slot?cityTimeLabel(index):'분출 당시')+'에 붙였어. 남은 시기의 기록을 비교해 줘.');api.save();progress();return false;
   }
   api.drag(t,{onDrop:(o,x,y)=>inBox(x,y,265,545,315,75)?connect(0):inBox(x,y,670,545,355,75)?connect(1):false});
   api.assist(label+' → 분출 당시',()=>connect(0));api.assist(label+' → 이후',()=>connect(1));
  });
  function set(value){
   w.wipe=Math.max(.03,Math.min(.97,value));const x=w.wipe*1200;handle.setPosition(x,440);line.x=x;
   wipeMask.clear().fillStyle(0xffffff).fillRect(0,0,x,510);afterMask.clear().fillStyle(0xffffff).fillRect(x,0,1200-x,510);
   if(w.wipe>.92)w.seen.before=true;if(w.wipe<.08)w.seen.after=true;
   d.citySeen[s.id]={...w.seen};api.save();progress();
  }
  function progress(){api.counter(Number(w.seen.before)+Number(w.seen.after)+w.pairs.length,4,'시간 비교와 기록');if(w.pairs.length===2&&w.seen.before&&w.seen.after){if(!d.evidence['city-'+s.id]?.pair)api.record({id:'city-'+s.id,kind:'city',...cityEvidence(index),label:s.name+'의 시간 변화',claim:s.claim,pair:true,site:s.id,asset:'city-calm',point:{x:SITE_X[index]/1200,y:SITE_Y[index]/640},time:w.wipe,text:s.now+' '+s.later});api.finish(index===1?'피해가 먼저 생겨. 토양이 변하려면 아주 오랜 시간이 필요해.':s.now+' '+s.later);}}
  api.drag(handle,{onMove:(o,x)=>set(x/1200),onDrop:(o,x)=>{set(x/1200);return true;}});
  api.range('시간 비교 손잡이',Math.round(w.wipe*100),3,97,v=>set(Number(v)/100));
  api.assist('분출 당시 모습 살피기',()=>set(.97));api.assist('이후 모습 살피기',()=>set(.03));
  api.actions([]);set(w.wipe);
  return {destroy(){marker.destroy();}};
 }

 function advise(){
  const existing=new Set(scene.children.list);let ashShown=false;
  api.task(`${s.name} 주민에게 안내판을 만들어 주자`,'내 관찰 그림, 까닭, 할 일을 안내판에 끌어다 붙여 줘.');
  w.board??={};
  // The notice board art fixes the layout: three pinned notes sit inside its cork area.
  const BX=845,SW=440,SH=68,board=scene.textures.exists('art/ui/notice-board');
  if(board)api.image('art/ui/notice-board',BX,335,700,521);else api.panel(BX,317,650,560,0xfff5d9,.88);
  hero.setPosition(70,540).setScale(hero.scale*.82);
  api.card(['비행기를 타도 될까요?','농사가 바로 잘될까요?','온천에 가도 될까요?'][index],BX,board?168:70,420,58,26);
  const slots={picture:{x:BX,y:262,label:'① 내 관찰 그림'},reason:{x:BX,y:334,label:'② 왜 그럴까요?'},action:{x:BX,y:406,label:'③ 이렇게 해요'}};
  Object.values(slots).forEach(p=>{api.paper('paper-card',p.x,p.y,SW,SH).setAlpha(.82);p.hint=api.text(p.label,p.x,p.y,21,'#8a6d43');});
  const placed={};
  const picture=scene.add.container(300,150);picture.add(api.paper('paper-card',0,0,290,190));
  for(const [j,later]of [false,true].entries())picture.add(paintScene(scene,api,cityScene(index,later),{x:-138+j*140,y:-65,scale:.115}));
  picture.add(api.text(`${s.name}의 전후 기록`,0,48,22));picture.add(api.text(cityTimeLabel(index),0,76,18));picture.setSize(290,180);
  const cards=[{obj:picture,kind:'picture',good:true,text:OBSERVATIONS[index].slice(0,2).join(' → ')}];
  cards.push({obj:token(REASONS[index],300,315,340,86),kind:'reason',good:true,text:REASONS[index]});
  cards.push({obj:token(ACTIONS[index],300,425,340,82),kind:'action',good:true,text:ACTIONS[index]});
  cards.push({obj:token(BAD_ACTIONS[index],300,533,340,82),kind:'action',good:false,text:BAD_ACTIONS[index]});
  function add(c,slot){
   if(!d.evidence['city-'+s.id]?.pair){api.say('앞 활동에서 이 장소의 두 시기 관찰을 먼저 마쳐 줘.');return false;}
   if(c.kind!==slot){api.say('그림, 까닭, 할 일의 자리를 살펴봐.');return false;}
   if(!c.good){api.say(index===1?'분출 직후에는 농작물이 피해를 입어. 복구와 토양 변화에는 시간이 필요해.':'관찰 그림 속 위험이 사라졌는지 안전 안내부터 확인해야 해.');return false;}
   w.board[slot]=true;api.save();c.obj.setAlpha(.35);show(slot,c.text);api.spark(slots[slot].x,slots[slot].y);api.say('안내판에 붙였어. 관찰 그림과 까닭, 할 일을 모두 연결해 줘.');progress();return false;
  }
  function show(slot,text){if(placed[slot])return;const p=slots[slot];p.hint?.setVisible(false);placed[slot]=api.text(text,p.x,p.y,21,'#294239',SW-36);}
  cards.forEach(c=>{
   api.drag(c.obj,{onDrop:(o,x,y)=>{const slot=Object.keys(slots).find(k=>inBox(x,y,slots[k].x,slots[k].y,SW+40,SH+8));return slot?add(c,slot):false;}});
   api.assist(c.text+' 붙이기',()=>add(c,c.kind));
   if(w.board[c.kind]&&c.good){c.obj.setAlpha(.35);show(c.kind,c.text);}
  });
  function progress(){const n=Object.keys(w.board).filter(k=>w.board[k]).length;api.counter(n,3,'안내판 조각');if(n===3){d.notices[s.id]=s.claim;api.record({id:'notice-'+s.id,kind:'notice',...cityEvidence(index),label:s.name+' 주민 안내',claim:s.claim,text:s.notice,site:s.id});api.save();api.say('주민: '+s.reply,true);if(index===0)ashSafety();else api.finish(s.reply);}}
  function ashSafety(){
   if(ashShown)return;ashShown=true;
   // The city remains visible through an indoor window. These actions happen
   // indoors; learners are never asked to go out into falling ash.
   scene.children.list.filter(o=>!existing.has(o)).forEach(o=>o.setVisible(false));hero.setVisible(false);
   api.task('화산재가 날려. 실내에서 리버를 도와주자','창문 손잡이를 왼쪽으로 밀어 닫고, 마스크로 코와 입을 가려 줘.');
   // One indoor room: the town is only seen through the window opening (545x239 centred on 550,340).
   const art=scene.textures.exists('art/ui/indoor-wall')&&scene.textures.exists('art/ui/window-frame');
   const view=scene.make.graphics({add:false}).fillStyle(0xffffff).fillRect(277,221,546,239);
   if(art)api.image('art/ui/indoor-wall',600,320,1200,640);
   else{api.panel(600,105,1200,210,0xe9dcc2,1);api.panel(600,565,1200,150,0xe9dcc2,1);api.panel(140,350,280,300,0xe9dcc2,1);api.panel(1010,350,380,300,0xe9dcc2,1);}
   api.image('city-eruption',550,340,760,405).setMask(view.createGeometryMask());
   scene.add.rectangle(550,340,546,239,0x6f6a62,.42).setMask(view.createGeometryMask());
   const ash=scene.add.container(0,0);ash.setMask(view.createGeometryMask());
   for(let i=0;i<40;i++){const flake=scene.add.circle(285+(i*73)%530,200+(i*37)%250,4+i%4,0x3f403e,.8);ash.add(flake);if(!reduced)scene.tweens.add({targets:flake,y:flake.y+90,x:flake.x-18,duration:2600+(i%5)*500,repeat:-1,delay:(i*190)%2000});}
   if(art)api.image('art/ui/window-frame',550,352,678,353);else scene.add.rectangle(550,340,545,300).setStrokeStyle(18,0x8e704a).setFillStyle(0xffffff,.04);
   api.card('실내에서 안전하게',600,62,320,60,28);
   const paneArt=()=>scene.textures.exists('art/ui/glass-pane')?api.paper('glass-pane',0,0,272,239):scene.add.rectangle(0,0,260,278,0xc4e3e5,.35).setStrokeStyle(9,0xc7ad82);
   scene.add.container(686,340,[paneArt()]).setAlpha(.9);
   const pane=scene.add.container(w.ashWindow?414:686,340,[paneArt()]);pane.setSize(272,239);
   const river=api.hero(985,400,240,scene.textures.exists('hero-protect')?'hero-protect':'river-pose-2');
   const maskArt=scene.textures.exists('art/ui/dust-mask')?[api.image('art/ui/dust-mask',0,0,175,102)]:[scene.add.rectangle(0,0,112,62,0xd6edf1).setStrokeStyle(4,0x6899a6)];
   const mask=scene.add.container(w.ashMask?985:420,w.ashMask?375:560,maskArt);mask.setSize(185,110);
   if(w.ashMask)mask.setScale(.6);
   const hint=api.card(w.ashWindow?'창문 닫음':'손잡이를 왼쪽으로 ←',550,505,300,52,22);
   const hintText=hint.list.at(-1);
   function close(){w.ashWindow=true;pane.setPosition(414,340);hintText.setText('창문 닫음');api.save();safeProgress();return true;}
   function cover(){if(!w.ashWindow){api.say('먼저 창문을 닫아 화산재가 실내로 들어오지 않게 하자.');return false;}w.ashMask=true;mask.setPosition(985,375).setScale(.6);api.save();safeProgress();return true;}
   api.drag(pane,{onMove:(o,x)=>o.setPosition(Math.max(414,Math.min(686,x)),340),onDrop:(o,x)=>{if(x<500)return close();pane.setPosition(w.ashWindow?414:686,340);return true;}});
   api.drag(mask,{onDrop:(o,x,y)=>inBox(x,y,985,375,190,180)?cover():false});
   api.assist('실내 창문 닫기',close);api.assist('리버의 코와 입에 마스크 씌우기',cover);
   function safeProgress(){api.counter(Number(!!w.ashWindow)+Number(!!w.ashMask),2,'화산재로부터 보호');if(w.ashWindow&&w.ashMask){d.ashSafety={indoor:true,window:true,mask:true};api.record({id:'city-ash-safety',kind:'safety',label:'화산재 안전 행동',text:'실내에서 창문을 닫고 마스크로 코와 입을 보호하며 안내를 확인해.'});api.save();api.finish('실내에서 창문을 닫고 코와 입을 보호했어. 어른과 함께 안전 안내를 확인하자.');}}
   safeProgress();
  }
  api.actions([]);progress();
 }
}
