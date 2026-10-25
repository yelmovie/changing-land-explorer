import {CITY_SITES} from '../learning-model.js';

const SITE_X=[210,530,1030],SITE_Y=[282,280,330];
const OBSERVATIONS=[['비행 중단','안전 확인 뒤 운항','화산재 속에서도 운항'],['농작물 피해','오랜 시간 뒤 토양 변화','분출하자마자 풍년'],['위험할 때 출입 금지','안전 확인 뒤 이용','분출 중에도 온천 이용']];
const REASONS=['화산재가 비행을 방해해요.','토양이 변하려면 오랜 시간이 필요해요.','위험이 없는지 먼저 확인해야 해요.'];
const ACTIONS=['운항 안내를 확인해요.','피해를 복구하고 기다려요.','안전 안내 뒤에 이용해요.'];
const BAD_ACTIONS=['지금 바로 비행기를 타요.','분출 직후 바로 씨를 뿌려요.','분출 중에도 놀러 가요.'];
const inBox=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;

export function setup(scene,api){
 const d=api.data,w=api.work,index=api.phase,s=CITY_SITES[index];d.evidence??={};d.notices??={};d.citySeen??={};
 api.image(api.step===0?'city-calm':'art/city-message-square-v2',600,320,1200,640);
 api.hero(105,510,160,'river-pose-1');
 if(api.step===0)return observe();return advise();

 function token(label,x,y,width=270,height=66){
  const c=scene.add.container(x,y);c.add(scene.add.rectangle(0,0,width,height,0xfff5d9).setStrokeStyle(3,0xb7975e));c.add(api.text(label,0,0,22,'#294239',width-22));c.setSize(width,height);return c;
 }

 function observe(){
  api.task(`${s.name}의 시간이 어떻게 달라질까?`,'손잡이를 양쪽 끝까지 옮겨 살핀 뒤, 관찰 표식을 알맞은 시기에 붙여 줘.');
  w.wipe??=.5;w.pairs??=[];w.seen??={before:false,after:false};
  // Both times use exactly the same camera and underlying illustration. The ash,
  // damage and closures below are time-state overlays, not mismatched photographs.
  const earlier=scene.add.container(0,0),g=scene.add.graphics();earlier.add(g);
  g.fillStyle(0x7b7770,.28).fillRect(0,0,1200,510);
  g.fillStyle(0x646466,.65);for(let i=0;i<10;i++)g.fillEllipse(570+i*43,66+Math.sin(i)*15,170,75);
  g.lineStyle(12,0xcb6e4d,.9);g.beginPath();g.moveTo(720,90);g.lineTo(755,125);g.lineTo(780,165);g.strokePath();
  g.fillStyle(0x656360,.9);for(let i=0;i<70;i++)g.fillCircle(70+(i*79)%1080,150+(i*47)%210,2+i%3);
  // The farm's affected patch is placed on the farm visible in the image.
  g.fillStyle(0x807668,.7).fillEllipse(540,277,360,90);
  const cross=(x,y)=>{g.lineStyle(10,0xb75836,1).strokeRect(x-80,y-23,160,46);g.beginPath();g.moveTo(x-67,y-17);g.lineTo(x+67,y+17);g.moveTo(x-67,y+17);g.lineTo(x+67,y-17);g.strokePath();};
  cross(210,300);cross(1030,360);
  const beforeLabel=api.text(OBSERVATIONS[index][0],SITE_X[index],SITE_Y[index]-55,24,'#ffffff');beforeLabel.setBackgroundColor('#705446').setPadding(12,9);earlier.add(beforeLabel);
  const wipeMask=scene.add.graphics();wipeMask.setVisible(false);earlier.setMask(wipeMask.createGeometryMask());
  const afterLabel=api.text(OBSERVATIONS[index][1],SITE_X[index],SITE_Y[index]-55,24,'#ffffff').setBackgroundColor('#376a4b').setPadding(12,9);
  const afterMask=scene.add.graphics();afterMask.setVisible(false);afterLabel.setMask(afterMask.createGeometryMask());
  const marker=scene.add.ellipse(SITE_X[index],SITE_Y[index]+5,index===1?350:220,145).setStrokeStyle(5,0xffdf78).setFillStyle(0,0);
  const line=scene.add.rectangle(600,265,6,460,0xfff7df);
  const handle=token('↔',600,440,82,72);
  api.panel(170,49,290,58,0xfff7df,.96);api.text('분출 당시',170,49,25);
  api.panel(1000,49,350,58,0xfff7df,.96);api.text(index===1?'아주 오랜 시간 뒤':'복구 · 안전 확인 뒤',1000,49,25);
  api.panel(600,568,1170,134,0xfff7df,.96);
  api.target(265,545,315,65,'');api.target(670,545,355,65,'');
  const recordLabels=[api.text(w.pairs.includes(0)?OBSERVATIONS[index][0]:'분출 당시 기록',265,545,22),api.text(w.pairs.includes(1)?OBSERVATIONS[index][1]:(index===1?'아주 오랜 시간 뒤 기록':'안전 확인 뒤 기록'),670,545,22)];
  const stamps=[];
  OBSERVATIONS[index].forEach((label,j)=>{
   const t=token(label,255+j*370,610,345,48);stamps.push(t);if(w.pairs.includes(j))t.setAlpha(.35);
   function connect(slot){
    if(!w.seen.before||!w.seen.after){api.say('시간 손잡이를 왼쪽 끝과 오른쪽 끝으로 옮겨 두 모습을 먼저 살펴봐.');return false;}
    if(j===2||j!==slot){api.say(index===1?'피해를 입은 때와 아주 오랜 시간 뒤를 나눠 봐. 바로 비옥해지는 건 아니야.':'위험한 때와 안전이 확인된 뒤를 구분해 봐.');return false;}
    if(!w.pairs.includes(j))w.pairs.push(j);t.setAlpha(.35);recordLabels[slot].setText(label);api.spark(slot?670:265,545);api.save();progress();return false;
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
  function progress(){api.counter(Number(w.seen.before)+Number(w.seen.after)+w.pairs.length,4,'시간 비교와 기록');if(w.pairs.length===2&&w.seen.before&&w.seen.after){if(!d.evidence['city-'+s.id]?.pair)api.record({id:'city-'+s.id,kind:'city',label:s.name+'의 시간 변화',claim:s.claim,pair:true,site:s.id,asset:'city-calm',point:{x:SITE_X[index]/1200,y:SITE_Y[index]/640},time:w.wipe,text:s.now+' '+s.later});api.finish(index===1?'피해가 먼저 생겨. 토양이 변하려면 아주 오랜 시간이 필요해.':s.now+' '+s.later);}}
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
  api.panel(820,317,650,560,0xfff5d9,.88);api.text(['비행기를 타도 될까요?','농사가 바로 잘될까요?','온천에 가도 될까요?'][index],820,70,28);
  const slots={picture:{x:820,y:175,label:'① 내 관찰 그림'},reason:{x:820,y:325,label:'② 왜 그럴까요?'},action:{x:820,y:465,label:'③ 이렇게 해요'}};
  Object.values(slots).forEach(p=>{api.target(p.x,p.y,565,110,'');api.text(p.label,p.x,p.y-38,20);});
  const placed={};
  const picture=scene.add.container(300,155);picture.add(scene.add.rectangle(0,0,290,180,0xfff5d9).setStrokeStyle(3,0xc5a36b));
  const img=api.image('city-calm',0,-15,275,120);picture.add(img);picture.add(api.text(`${s.name}의 전후 기록`,0,64,22));picture.setSize(290,180);
  const cards=[{obj:picture,kind:'picture',good:true,text:OBSERVATIONS[index].slice(0,2).join(' → ')}];
  cards.push({obj:token(REASONS[index],290,310,350,88),kind:'reason',good:true,text:REASONS[index]});
  cards.push({obj:token(ACTIONS[index],290,423,350,82),kind:'action',good:true,text:ACTIONS[index]});
  cards.push({obj:token(BAD_ACTIONS[index],290,536,350,82),kind:'action',good:false,text:BAD_ACTIONS[index]});
  function add(c,slot){
   if(!d.evidence['city-'+s.id]?.pair){api.say('앞 활동에서 이 장소의 두 시기 관찰을 먼저 마쳐 줘.');return false;}
   if(c.kind!==slot){api.say('그림, 까닭, 할 일의 자리를 살펴봐.');return false;}
   if(!c.good){api.say(index===1?'분출 직후에는 농작물이 피해를 입어. 복구와 토양 변화에는 시간이 필요해.':'관찰 그림 속 위험이 사라졌는지 안전 안내부터 확인해야 해.');return false;}
   w.board[slot]=true;api.save();c.obj.setAlpha(.35);show(slot,c.text);api.spark(slots[slot].x,slots[slot].y);progress();return false;
  }
  function show(slot,text){if(placed[slot])return;const p=slots[slot];placed[slot]=api.text(text,p.x,p.y+10,24,'#294239',520);}
  cards.forEach(c=>{
   api.drag(c.obj,{onDrop:(o,x,y)=>{const slot=Object.keys(slots).find(k=>inBox(x,y,slots[k].x,slots[k].y,565,110));return slot?add(c,slot):false;}});
   api.assist(c.text+' 붙이기',()=>add(c,c.kind));
   if(w.board[c.kind]&&c.good){c.obj.setAlpha(.35);show(c.kind,c.text);}
  });
  function progress(){const n=Object.keys(w.board).filter(k=>w.board[k]).length;api.counter(n,3,'안내판 조각');if(n===3){d.notices[s.id]=s.claim;api.record({id:'notice-'+s.id,kind:'notice',label:s.name+' 주민 안내',claim:s.claim,text:s.notice,site:s.id});api.save();api.say('주민: '+s.reply,true);if(index===0)ashSafety();else api.finish(s.reply);}}
  function ashSafety(){
   if(ashShown)return;ashShown=true;
   // The city remains visible through an indoor window. These actions happen
   // indoors; learners are never asked to go out into falling ash.
   scene.children.list.filter(o=>!existing.has(o)).forEach(o=>o.setVisible(false));
   api.task('화산재가 날려. 실내에서 리버를 도와주자','창문 손잡이를 왼쪽으로 밀어 닫고, 마스크로 코와 입을 가려 줘.');
   api.panel(600,105,1200,210,0xe9dcc2,1);api.panel(600,565,1200,150,0xe9dcc2,1);
   api.panel(140,350,280,300,0xe9dcc2,1);api.panel(1010,350,380,300,0xe9dcc2,1);
   scene.add.rectangle(550,340,545,300).setStrokeStyle(18,0x8e704a).setFillStyle(0xffffff,.04);
   api.text('실내에서 안전하게',600,70,30);
   const ash=scene.add.graphics().fillStyle(0x5d605f,.7);for(let i=0;i<22;i++)ash.fillCircle(305+(i*73)%485,220+(i*31)%230,4);
   scene.add.rectangle(685,340,270,278,0xc4e3e5,.35).setStrokeStyle(9,0xc7ad82);
   const pane=scene.add.container(w.ashWindow?420:690,340);pane.add(scene.add.rectangle(0,0,260,278,0xc4e3e5,.35).setStrokeStyle(9,0xc7ad82));pane.add(scene.add.rectangle(90,0,15,70,0x846842));pane.setSize(260,278);
   const river=api.hero(955,390,240,scene.textures.exists('hero-protect')?'hero-protect':'river-pose-2');
   const mask=scene.add.container(w.ashMask?955:420,w.ashMask?365:555);mask.add(scene.add.rectangle(0,0,112,62,0xd6edf1).setStrokeStyle(4,0x6899a6));mask.add(scene.add.ellipse(-62,0,35,45).setStrokeStyle(4,0xd7eef1).setFillStyle(0,0));mask.add(scene.add.ellipse(62,0,35,45).setStrokeStyle(4,0xd7eef1).setFillStyle(0,0));mask.setSize(175,80);
   if(w.ashMask)mask.setScale(.65);
   const hint=api.text(w.ashWindow?'창문 닫음':'손잡이를 왼쪽으로 ←',550,470,23);
   function close(){w.ashWindow=true;pane.setPosition(420,340);hint.setText('창문 닫음');api.save();safeProgress();return true;}
   function cover(){if(!w.ashWindow){api.say('먼저 창문을 닫아 화산재가 실내로 들어오지 않게 하자.');return false;}w.ashMask=true;mask.setPosition(955,365).setScale(.65);api.save();safeProgress();return true;}
   api.drag(pane,{onMove:(o,x)=>o.setPosition(Math.max(420,Math.min(690,x)),340),onDrop:(o,x)=>{if(x<500)return close();pane.setPosition(w.ashWindow?420:690,340);return true;}});
   api.drag(mask,{onDrop:(o,x,y)=>inBox(x,y,955,365,180,170)?cover():false});
   api.assist('실내 창문 닫기',close);api.assist('리버의 코와 입에 마스크 씌우기',cover);
   function safeProgress(){api.counter(Number(!!w.ashWindow)+Number(!!w.ashMask),2,'화산재로부터 보호');if(w.ashWindow&&w.ashMask){d.ashSafety={indoor:true,window:true,mask:true};api.record({id:'city-ash-safety',kind:'safety',label:'화산재 안전 행동',text:'실내에서 창문을 닫고 마스크로 코와 입을 보호하며 안내를 확인해.'});api.save();api.finish('실내에서 창문을 닫고 코와 입을 보호했어. 어른과 함께 안전 안내를 확인하자.');}}
   safeProgress();
  }
  api.actions([]);progress();
 }
}
