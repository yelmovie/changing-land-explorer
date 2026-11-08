import {observationTour} from './observation-tour.js';
import {CITY_SITES} from '../learning-model.js';
import {CITY_POINTS,CITY_OBSERVATIONS as OBSERVATIONS,cityTimeLabel,cityScene,paintScene,cityEvidence,cityMarker} from '../observation-scenes.js';
import {escapeHTML} from '../ui.js';

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
  api.task(`${s.name}의 두 모습을 비교해 보자`,index===1?'‘이후 모습’은 아주 오랜 시간 뒤야. 같은 농장의 두 모습을 비교해 봐.':'아래 ‘분출 당시’와 ‘이후 모습’을 한 번씩 눌러 어떤 점이 달라졌는지 봐.');
  w.wipe??=.5;w.pairs??=[];w.seen??={before:false,after:false};
  // Both times use exactly the same camera and underlying illustration. The ash,
  // damage and closures below are time-state overlays, not mismatched photographs.
  const earlierScene=cityScene(index,false);
  // The split is a comparison of the same place. Text does not get sliced in half
  // by the handle, and ash keeps the existing town visible underneath it.
  earlierScene.layers=earlierScene.layers.filter(p=>p.type!=='label'&&!(p.type==='image'&&p.asset.includes('volcano-ash-puff'))&&!(p.type==='ellipse'&&p.y<120)&&p.stroke!==10&&!(p.type==='line'&&p.width===10&&p.color==='#b75836'));
  const earlier=paintScene(scene,api,earlierScene,{background:false});
  const weather=scene.add.container(0,0),fallout=scene.add.graphics(),clouds=[];
  const cloudSpecs=[[731,79,112,90],[665,60,176,118],[567,58,230,130],[447,83,278,132],[297,116,290,114]];
  cloudSpecs.forEach(([x,y,width,height],i)=>{
   const key='art/volcano-ash-puff-'+(i%2?2:1)+'-v1';
   if(scene.textures.exists(key)){const image=api.image(key,x,y,width,height).setAlpha(.38+i*.035);weather.add(image);clouds.push({image,x,y});}
   else weather.add(scene.add.ellipse(x,y,width,height,0x73716b,.24));
  });
  weather.add(fallout);earlier.add(weather);
  const barriers=scene.add.graphics();earlier.add(barriers);
  for(const [x,y]of [[210,300],[1030,360]]){
   barriers.fillStyle(0x3a3429,.17).fillEllipse(x,y+37,174,15).fillStyle(0x795336,1).fillRoundedRect(x-65,y-5,9,43,3).fillRoundedRect(x+56,y-5,9,43,3);
   barriers.fillStyle(0xc8a66e,1).fillRoundedRect(x-80,y-14,160,24,4).lineStyle(2,0x7a5436,1).strokeRoundedRect(x-80,y-14,160,24,4);
   for(let i=0;i<5;i++)barriers.fillStyle(i%2?0xc67b4b:0xf6d78d,1).fillPoints([{x:x-76+i*30,y:y-11},{x:x-56+i*30,y:y-11},{x:x-67+i*30,y:y+7},{x:x-87+i*30,y:y+7}],true);
  }
  const wipeMask=scene.add.graphics();wipeMask.setVisible(false);earlier.setMask(wipeMask.createGeometryMask());
  const afterScene=cityScene(index,true);afterScene.layers=afterScene.layers.filter(p=>p.type!=='label');
  const afterLabel=paintScene(scene,api,afterScene,{background:false});
  const afterMask=scene.add.graphics();afterMask.setVisible(false);afterLabel.setMask(afterMask.createGeometryMask());
  const m=cityMarker(index),marker=scene.add.ellipse(m.x,m.y,m.w,m.h).setStrokeStyle(5,0xffdf78).setFillStyle(0,0);
  const line=scene.add.rectangle(600,255,8,450,0xf3cc76).setStrokeStyle(2,0x8c6b36,.8);
  const handle=scene.textures.exists('art/ui/time-knob')?scene.add.container(600,440,[api.image('art/ui/time-knob',0,0,88,88)]).setSize(96,96):token('↔',600,440,82,72);
  api.panel(170,49,290,58,0xfff7df,.96);api.text('분출 당시',170,49,25);
  api.panel(1000,49,350,58,0xfff7df,.96);api.text(cityTimeLabel(index),1000,49,25);
  if(index===1)api.text('···',600,49,30,'#725e3f');
  api.panel(600,568,1170,134,0xfff7df,.96);
  api.target(265,545,315,65,'');api.target(670,545,355,65,'');
  const recordLabels=[api.text(w.pairs.includes(0)?OBSERVATIONS[index][0]:'분출 당시 기록',265,545,22),api.text(w.pairs.includes(1)?OBSERVATIONS[index][1]:(index===1?'아주 오랜 시간 뒤 기록':'안전 확인 뒤 기록'),670,545,22)];
  let range,completed=!!api.completed,display=w.wipe,motion=null;const recordCards=[];
  OBSERVATIONS[index].forEach((label,j)=>{
   const t=token(label,255+j*370,610,345,48);if(w.pairs.includes(j))t.setAlpha(.35);
   function connect(slot){
    if(!w.seen.before||!w.seen.after){api.say('시간 손잡이를 왼쪽 끝과 오른쪽 끝으로 옮겨 두 모습을 먼저 살펴봐.');return false;}
    if(j===2||j!==slot){api.say(index===1?'피해를 입은 때와 아주 오랜 시간 뒤를 나눠 봐. 바로 비옥해지는 건 아니야.':'위험한 때와 안전이 확인된 뒤를 구분해 봐.');return false;}
    if(!w.pairs.includes(j))w.pairs.push(j);t.setAlpha(.35);recordLabels[slot].setText(label);api.spark(slot?670:265,545);api.say('기록을 붙였어. 남은 기록도 골라 줘.');api.save();progress();return false;
   }
   api.drag(t,{onDrop:(o,x,y)=>inBox(x,y,265,545,315,75)?connect(0):inBox(x,y,670,545,355,75)?connect(1):false});
   recordCards.push({object:t,connect});
  });
  // Small canvases use the same judgement through readable DOM controls. Expanding
  // their hit areas alone would overlap the record destinations above the cards.
  const canvas=scene.game?.canvas;
  if(canvas&&typeof ResizeObserver==='function'){
   const fitCards=()=>{
    const scale=canvas.getBoundingClientRect().width/1200;if(!scale)return;
    for(const {object}of recordCards){
     if(scale<.6){object.disableInteractive();scene.input.setDraggable(object,false);continue;}
     object.setInteractive({useHandCursor:true});scene.input.setDraggable(object,true);
     const height=Math.max(48,48/scale);object.input.hitArea.setTo(0,(48-height)/2,345,height);
    }
   };
   const resize=new ResizeObserver(fitCards);resize.observe(canvas);fitCards();api.listenCleanup(()=>resize.disconnect());
  }
  function chooseRecord(){
   api.modal('기록을 어느 시기에 놓을까?',`<p>기록 하나를 고른 뒤, 놓을 시기를 눌러 줘.</p><div class="city-record-choices">${OBSERVATIONS[index].map((label,j)=>`<button class="secondary" data-city-card="${j}" aria-pressed="false" ${w.pairs.includes(j)?'disabled':''}>${escapeHTML(label)}</button>`).join('')}</div><p class="city-record-status" role="status">먼저 기록 하나를 골라 줘.</p><div class="city-record-periods"><button class="secondary" data-city-period="0" disabled>분출 당시</button><button class="secondary" data-city-period="1" disabled>${escapeHTML(cityTimeLabel(index))}</button></div>`,(dialog,close)=>{
    let selected=null;const cards=[...dialog.querySelectorAll('[data-city-card]')],periods=[...dialog.querySelectorAll('[data-city-period]')],status=dialog.querySelector('.city-record-status');
    cards.forEach(button=>button.onclick=()=>{
     selected=Number(button.dataset.cityCard);cards.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));periods.forEach(b=>b.disabled=false);status.textContent=OBSERVATIONS[index][selected]+' · 놓을 시기를 골라 줘.';periods[0].focus({preventScroll:true});
    });
    periods.forEach(button=>button.onclick=()=>{
     if(selected===null)return;
     const chosen=selected,before=w.pairs.length;recordCards[chosen].connect(Number(button.dataset.cityPeriod));
     if(w.pairs.length===before){status.textContent='두 모습을 다시 비교해 봐. 이 기록은 어느 시기에 어울릴까?';return;}
     if(w.pairs.length===2){close();return;}
     cards[chosen].disabled=true;cards[chosen].setAttribute('aria-pressed','false');selected=null;periods.forEach(b=>b.disabled=true);status.textContent='기록을 놓았어. 남은 기록을 고른 뒤 시기를 골라 줘.';cards.find(b=>!b.disabled)?.focus({preventScroll:true});
    });
   });
  }
  function set(value,collect=true){
   const bothSeen=w.seen.before&&w.seen.after;
   display=Math.max(.03,Math.min(.97,value));if(range)range.value=Math.round((1-display)*100);const x=display*1200;handle.setPosition(x,440);line.x=x;
   // Weather shifts only with the comparison control, not with a geological clock.
   clouds.forEach(cloud=>cloud.image.setPosition(cloud.x+(1-display)*12,cloud.y+(1-display)*5));
   fallout.clear();for(let i=0;i<54;i++){const px=110+(i*97)%990-(1-display)*10,py=110+(i*53)%330+(1-display)*8;fallout.fillStyle(0x65655e,.3+(i%3)*.08).fillEllipse(px,py,2+i%3,3+i%4);}
   wipeMask.clear().fillStyle(0xffffff).fillRect(0,0,x,510);afterMask.clear().fillStyle(0xffffff).fillRect(x,0,1200-x,510);
   if(!collect||completed||bothSeen)return;
   w.wipe=display;if(display>.92)w.seen.before=true;if(display<.08)w.seen.after=true;
   if(!bothSeen&&w.seen.before&&w.seen.after)api.say('두 모습을 봤어. 이제 기록 카드를 골라 줘.');
   else if(!bothSeen&&(w.seen.before||w.seen.after))api.say(w.seen.before?'분출 때의 모습을 봤어. ‘이후 모습’도 눌러 봐.':'나중 모습을 봤어. ‘분출 당시’도 눌러 봐.');
   d.citySeen[s.id]={...w.seen};api.save();progress();
  }
  function progress(){api.counter(Number(w.seen.before)+Number(w.seen.after)+w.pairs.length,4,'시간 비교와 기록');if(!completed&&w.pairs.length===2&&w.seen.before&&w.seen.after){completed=true;if(!d.evidence['city-'+s.id]?.pair)api.record({id:'city-'+s.id,kind:'city',...cityEvidence(index),label:s.name+'의 시간 변화',claim:s.claim,pair:true,site:s.id,asset:'city-calm',point:{x:SITE_X[index]/1200,y:SITE_Y[index]/640},time:w.wipe,text:s.now+' '+s.later});api.finish(index===1?'피해가 먼저 생겨. 토양이 변하려면 아주 오랜 시간이 필요해.':s.now+' '+s.later);}api.actions([{id:'city-choose-record',label:'기록 카드 고르기',disabled:completed||!w.seen.before||!w.seen.after,onClick:chooseRecord}]);}
  api.drag(handle,{onMove:(o,x)=>set(x/1200),onDrop:(o,x)=>{set(x/1200);return true;}});
  range=api.range('시간 비교 손잡이',Math.round((1-w.wipe)*100),3,97,v=>set(1-Number(v)/100),['분출 당시','이후 모습']);
  const stop=()=>{const interrupted=!!motion;motion=null;return interrupted;};
  api.autoplay(observationTour(api,{label:'두 시기의 모습 관찰',items:[.97,.03],interval:3200,stop,
    needed:()=>!w.seen.before||!w.seen.after,
    visit(value){if(reduced)set(value);else motion={from:display,to:value,elapsed:0};}
  }));
  api.actions([]);set(w.wipe,false);progress();
  return {update(time,delta){if(!motion)return;const m=motion;m.elapsed+=Math.min(delta,60);const t=Math.min(1,m.elapsed/900),ease=t*t*(3-2*t);set(m.from+(m.to-m.from)*ease,false);if(t===1){motion=null;set(m.to);}},pause:stop,destroy(){stop();marker.destroy();}};
 }

 function advise(){
  const existing=new Set(scene.children.list);let ashShown=false;
  api.task(`${s.name} 주민에게 안내판을 만들어 주자`,'왼쪽에서 카드를 고르고 오른쪽 안내판의 맞는 칸을 눌러 봐. 그림·까닭·할 일을 하나씩 붙여 줘.');
  w.board??={};
  // The notice board art fixes the layout: three pinned notes sit inside its cork area.
  const BX=845,SW=440,SH=68,board=scene.textures.exists('art/ui/notice-board');
  if(board)api.image('art/ui/notice-board',BX,335,700,521);else api.panel(BX,317,650,560,0xfff5d9,.88);
  hero.setPosition(70,540).setScale(hero.scale*.82);
  api.card(['비행기를 타도 될까요?','농사가 바로 잘될까요?','온천에 가도 될까요?'][index],BX,board?168:70,420,58,26);
  const slots={picture:{x:BX,y:262,label:'① 내 관찰 그림'},reason:{x:BX,y:334,label:'② 왜 그럴까요?'},action:{x:BX,y:406,label:'③ 이렇게 해요'}};
  Object.values(slots).forEach(p=>{api.paper('paper-card',p.x,p.y,SW,SH).setAlpha(.82);p.hint=api.text(p.label,p.x,p.y,21,'#8a6d43');});
  const placed={};
  const picture=scene.add.container(300,150);picture.add(api.paper('paper-card',0,0,290,222));
  for(const [j,later]of [false,true].entries())picture.add(paintScene(scene,api,cityScene(index,later),{x:-130+j*132,y:-73,scale:.10}));
  // One text flow keeps the two captions apart when the host enlarges Korean type.
  picture.add(api.text(`${s.name}의 전후 기록\n${cityTimeLabel(index)}`,0,52,20,'#294239',264).setLineSpacing(4));picture.setSize(290,222);
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
   function close(){w.ashWindow=true;api.say('창문을 닫았어. 이제 마스크를 리버의 코와 입으로 옮겨 줘.');pane.setPosition(414,340);hintText.setText('창문 닫음');api.save();safeProgress();return true;}
   function cover(){if(!w.ashWindow){api.say('먼저 창문을 닫아 화산재가 실내로 들어오지 않게 하자.');return false;}w.ashMask=true;mask.setPosition(985,375).setScale(.6);api.save();safeProgress();return true;}
   api.drag(pane,{onMove:(o,x)=>o.setPosition(Math.max(414,Math.min(686,x)),340),onDrop:(o,x)=>{if(x<500)return close();pane.setPosition(w.ashWindow?414:686,340);return true;}});
   api.drag(mask,{onDrop:(o,x,y)=>inBox(x,y,985,375,190,180)?cover():false});
   function safeProgress(){api.counter(Number(!!w.ashWindow)+Number(!!w.ashMask),2,'화산재로부터 보호');if(w.ashWindow&&w.ashMask){d.ashSafety={indoor:true,window:true,mask:true};api.record({id:'city-ash-safety',kind:'safety',label:'화산재 안전 행동',text:'실내에서 창문을 닫고 마스크로 코와 입을 보호하며 안내를 확인해.'});api.save();api.finish('실내에서 창문을 닫고 코와 입을 보호했어. 어른과 함께 안전 안내를 확인하자.');}}
   api.actions([{id:'ash-window-close',label:'창문 닫기',onClick:close},{id:'ash-mask-place',label:'마스크 위치 고르기',onClick:()=>api.modal('마스크를 어디에 둘까?','<div class="accessible-choices"><button class="secondary" data-mask-place="head">이마</button><button class="secondary" data-mask-place="face">코와 입</button><button class="secondary" data-mask-place="neck">목</button></div><p id="mask-choice-status" role="status"></p>',(dialog,done)=>{dialog.querySelectorAll('[data-mask-place]').forEach(b=>b.onclick=()=>{if(b.dataset.maskPlace!=='face'){dialog.querySelector('#mask-choice-status').textContent='화산재를 들이마시지 않도록 어디를 가려야 할까?';return;}if(cover())done();else dialog.querySelector('#mask-choice-status').textContent='창문을 먼저 닫아 화산재가 들어오지 않게 하자.';});})}]);
   safeProgress();
  }
  api.actions([{id:'city-board-choose',label:'안내판 카드 연결',onClick:()=>{
   let selected=null;
   api.modal('관찰로 안내판 만들기','<p>카드를 고른 뒤 안내판의 알맞은 자리를 선택해 줘.</p><div class="accessible-choices">'+cards.map((c,i)=>`<button class="secondary" data-board-card="${i}">${escapeHTML(c.text)}</button>`).join('')+'</div><p id="board-choice-status" role="status">카드를 먼저 골라 줘.</p><div class="accessible-choices">'+Object.entries(slots).map(([key,p])=>`<button class="secondary" data-board-slot="${key}" disabled>${p.label}</button>`).join('')+'</div>',(dialog,close)=>{
    dialog.querySelectorAll('[data-board-card]').forEach(b=>b.onclick=()=>{selected=cards[Number(b.dataset.boardCard)];dialog.querySelectorAll('[data-board-card]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));dialog.querySelectorAll('[data-board-slot]').forEach(c=>c.disabled=false);});
    dialog.querySelectorAll('[data-board-slot]').forEach(b=>b.onclick=()=>{const key=b.dataset.boardSlot;add(selected,key);if(selected.kind===key&&selected.good&&w.board[key])close();else dialog.querySelector('#board-choice-status').textContent='관찰한 사실과 카드의 까닭·행동을 다시 비교해 봐.';});
   });
  }}]);progress();
 }
}
