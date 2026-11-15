import {observationTour} from './observation-tour.js';
import {CITY_SITES} from '../learning-model.js';
import {CITY_POINTS,CITY_OBSERVATIONS as OBSERVATIONS,cityTimeLabel,cityScene,paintScene,cityEvidence,cityMarker} from '../observation-scenes.js';
import {AIRPORT_CLIPS} from '../airport-clips.js';

const SITE_X=CITY_POINTS.map(p=>p.x),SITE_Y=CITY_POINTS.map(p=>p.y);
const POSTER_CAPTIONS=[
 ['운항 안내를 확인해요','화산재가 날려도 비행해요'],
 ['밭을 복구하고 기다려요','곧바로 풍년이 들어요'],
 ['안전 안내 뒤 온천을 이용해요','분출 중에도 온천을 이용해요']
];
const POSTER_RETRY=[
 '화산재가 날릴 때는 운항을 멈춰. 안내를 확인하는 포스터를 찾아봐.',
 '분출 직후엔 작물이 피해를 입어. 복구하고 기다리는 포스터를 찾아봐.',
 '분출 중에는 온천 이용을 멈춰. 안전이 확인된 뒤의 포스터를 찾아봐.'
];
const inBox=(x,y,cx,cy,w,h)=>Math.abs(x-cx)<w/2&&Math.abs(y-cy)<h/2;

const FARM_VIEW={x:144,y:86,w:912,h:342};

function pinToScene(scene,api,element,{x,y,w,h}){
 const canvas=scene.game?.canvas,parent=canvas?.parentElement;
 if(!parent)return false;
 parent.append(element);
 const fit=()=>{
  const frame=canvas.getBoundingClientRect(),root=parent.getBoundingClientRect();
  Object.assign(element.style,{left:frame.left-root.left+frame.width*x/1200+'px',top:frame.top-root.top+frame.height*y/640+'px',width:frame.width*w/1200+'px',height:frame.height*h/640+'px'});
 };
 const resize=new ResizeObserver(fit);resize.observe(canvas);resize.observe(parent);
 scene.scale.on('resize',fit);
 let frame=requestAnimationFrame(fit);fit();
 api.listenCleanup(()=>{cancelAnimationFrame(frame);resize.disconnect();scene.scale.off('resize',fit);element.querySelector('video')?.pause();element.remove();});
 return true;
}

function bindKeys(scene,api,label,shortcuts,handler){
 const canvas=scene.game?.canvas;
 if(!canvas)return;
 const original=canvas.getAttribute('aria-label');
 canvas.tabIndex=0;canvas.setAttribute('aria-label',label);canvas.setAttribute('aria-keyshortcuts',shortcuts);
 const listen=e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||!shortcuts.split(' ').includes(e.key))return;
  if(handler(e.key)!==false)e.preventDefault();
 };
 canvas.addEventListener('keydown',listen);
 api.listenCleanup(()=>{
  canvas.removeEventListener('keydown',listen);canvas.removeAttribute('tabindex');canvas.removeAttribute('aria-keyshortcuts');
  if(original)canvas.setAttribute('aria-label',original);
 });
}

function airportSlot(scene,api,time,box){
 if(!scene.game?.canvas)return;
 const slot=document.createElement('div');
 slot.className='airport-media-slot';slot.dataset.airportMedia=time;slot.setAttribute('aria-hidden','true');
 const src=AIRPORT_CLIPS[time];
 if(src){
  const video=document.createElement('video');
  video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';
  video.addEventListener('playing',()=>{video.style.visibility='visible';});
  video.addEventListener('error',()=>{video.style.visibility='hidden';});
  video.src=src;slot.append(video);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{});
 }
 pinToScene(scene,api,slot,box);
}

export function setup(scene,api){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=api.data,w=api.work,index=api.phase,s=CITY_SITES[index];d.evidence??={};d.notices??={};d.citySeen??={};
 api.image(api.step===0?'city-calm':'art/city-message-square-v2',600,320,1200,640);
 const hero=api.hero(105,510,160,'river-pose-1');
 if(api.step===0)return observe();return advise();

 function token(label,x,y,width=270,height=66){return api.card(label,x,y,width,height,22);}

 function observe(){
  const farm=index===1;
  api.task(s.name+'은 어떻게 달라졌을까?',farm?'사진 위 막대를 좌우로 움직여 두 모습을 비교해 봐.':'두 사진을 차례로 눌러 봐.');
  w.wipe??=.5;w.pairs??=[];w.seen??={before:false,after:false};
  const labels=['분출 당시',cityTimeLabel(index)];
  const descriptions=[
   ['화산재가 하늘을 덮었어요.','안전을 확인하고 다시 비행해요.'],
   ['화산재가 밭을 덮었어요.','아주 오랜 뒤 흙이 변했어요.'],
   ['위험해서 출입을 막았어요.','안전 확인 뒤 온천을 이용해요.']
  ][index];
  const shortRecords=[
   ['비행 중단','다시 운항','화산재 속 운항'],
   ['농작물 피해','오랜 뒤 토양 변화','곧바로 풍년'],
   ['출입 금지','안전 뒤 이용','분출 중 이용']
  ][index];
  const focus=CITY_POINTS[index],cx=Math.max(230,Math.min(970,focus.x)),zoom=farm?1.34:1.15;
  const frames=[],captions=[],masks=[],photoMasks=[];
  if(farm)api.panel(600,260,948,474,0xfff7df,1);
  [false,true].forEach((later,j)=>{
   const x=18+j*600,center=x+282,box=farm?FARM_VIEW:{x:x+8,y:88,w:548,h:310};
   if(!farm)api.panel(center,252,564,462,0xfff7df,1);
   api.text(labels[j],center,58,26,later?'#285e42':'#7b432d',520);
   const description=cityScene(index,later);
   description.layers=description.layers.filter(p=>p.type!=='label'&&p.stroke!==10&&!(p.type==='line'&&(p.color==='#b75836'||p.color==='#cb6e4d')));
   const picture=paintScene(scene,api,description,{x:(farm?600:center)-cx*zoom,y:258-focus.y*zoom,scale:zoom});
   if(!later&&!farm){
    const bx=focus.x,by=index===2?360:300,g=scene.add.graphics();
    g.fillStyle(0x795336,1).fillRoundedRect(bx-65,by-8,10,46,3).fillRoundedRect(bx+55,by-8,10,46,3);
    g.fillStyle(0xffd66b,1).fillRoundedRect(bx-82,by-18,164,29,4).lineStyle(3,0x765136,1).strokeRoundedRect(bx-82,by-18,164,29,4);
    for(let k=0;k<5;k++)g.fillStyle(0xb86636,1).fillPoints([{x:bx-76+k*31,y:by-15},{x:bx-58+k*31,y:by-15},{x:bx-70+k*31,y:by+8},{x:bx-88+k*31,y:by+8}],true);
    picture.add(g);
   }
   const mask=scene.add.graphics().setVisible(false);
   mask.fillStyle(0xffffff).fillRect(box.x,box.y,box.w,box.h);
   picture.setMask(mask.createGeometryMask());masks.push(mask);photoMasks.push(mask);
   if(!later){
    for(const [offset,dy,size]of [[-.31,112,290],[0,128,320],[.33,106,290]]){
     api.image('art/volcano-ash-puff-1-v1',box.x+box.w*(.5+offset),dy,size,150).setAlpha(.76).setMask(mask.createGeometryMask());
    }
    const ash=scene.add.graphics();
    for(let k=0;k<72;k++)ash.fillStyle(0x5d5d5a,.7).fillEllipse(box.x+12+(k*79)%(box.w-24),144+(k*47)%245,3+k%3,4+k%4);
    ash.setMask(mask.createGeometryMask());
   }
   if(!farm){
    if(index===0)airportSlot(scene,api,later?'after':'before',box);
    api.text(descriptions[j],center,424,23,'#294239',515);
    frames.push(scene.add.graphics());
    scene.add.zone(center,256,564,462).setInteractive({useHandCursor:true}).on('pointerup',()=>{api.stopAutoplay?.();set(later?.03:.97);});
   }
   captions.push(api.text('',center,farm?459:466,20,'#28633e',520));
  });
  const divider=farm?scene.add.graphics().setDepth(18):null;
  const arrows=farm?api.text('◀ ▶',600,FARM_VIEW.y+FARM_VIEW.h/2,23,'#204b42').setDepth(19):null;
  api.panel(600,562,1172,150,0xfff7df,1);
  const slots=[{x:265,w:315},{x:670,w:355}],slotY=510;
  slots.forEach(({x,w})=>api.target(x,slotY,w,58,''));
  const recordLabels=slots.map(({x})=>api.text('',x,slotY,23));
  let range,completed=!!api.completed,display=w.wipe,motion=null,focused=false;
  const recordCards=[];
  function clearForNext(){
   if(completed)return;
   if(!w.seen.before||!w.seen.after)return;
   api.say('기록 카드를 알맞은 시기의 칸에 놓아 줘.');
  }
  OBSERVATIONS[index].forEach((label,j)=>{
   const object=token(shortRecords[j],230+j*370,597,345,54);
   function connect(slot){
    if(completed||w.pairs.includes(j)||!w.seen.before||!w.seen.after)return false;
    if(j===2||j!==slot){api.say(index===1?'분출 직후에는 작물이 피해를 입어. 흙이 변하려면 시간이 필요해.':'두 사진을 다시 보고 알맞은 시기를 찾아봐.');return false;}
    w.pairs.push(j);api.spark(slots[slot].x,slotY);api.save();
    if(w.pairs.length<2)api.say('남은 기록도 빈칸에 놓아 줘.');
    progress();return false;
   }
   const drop=(_o,x,y,pointer)=>{
    const point=pointer||{x,y},slot=slots.findIndex(p=>inBox(point.x,point.y,p.x,slotY,p.w+55,83));
    if(slot<0){clearForNext();return false;}return connect(slot);
   };
   api.drag(object,{onDrop:drop,onTap:drop,selectionHint:'카드를 놓을 시기의 칸을 눌러 줘.'});
   recordCards.push({object,connect,enabled:true});
  });
  function setInteraction(card,enabled){
   if(!card.object.input||card.enabled===enabled)return;
   card.enabled=enabled;
   if(enabled)card.object.setInteractive();else card.object.disableInteractive();
  }
  function paintProgress(){
   const selected=display>.6?0:display<.4?1:-1;
   frames.forEach((frame,j)=>{
    const x=18+j*600;
    frame.clear().lineStyle(selected===j?5:2,selected===j?0x38795f:0xc7b78b,1).strokeRoundedRect(x+3,25,558,454,20);
   });
   if(farm){
    const {x,y,w,h}=FARM_VIEW,cut=x+w*display,cy=y+h/2;
    photoMasks[0].clear().fillStyle(0xffffff).fillRect(x,y,cut-x,h);
    photoMasks[1].clear().fillStyle(0xffffff).fillRect(cut,y,x+w-cut,h);
    divider.clear().lineStyle(8,0x214c41,.72).lineBetween(cut,y,cut,y+h).lineStyle(4,0xfffdf0,1).lineBetween(cut,y,cut,y+h);
    divider.fillStyle(0xfff9e8,1).fillRoundedRect(cut-38,cy-26,76,52,22).lineStyle(focused?6:3,0x28644f,1).strokeRoundedRect(cut-38,cy-26,76,52,22);
    arrows.setPosition(cut,cy);
   }
   captions.forEach((caption,j)=>{
    const seen=w.seen[j?'after':'before'];
    caption.setText(seen?(farm?'✓ '+descriptions[j]:'✓ 살펴봤어요'):farm?'': '사진을 눌러 살펴봐');
    recordLabels[j].setText(w.pairs.includes(j)?shortRecords[j]:j?'이후 기록 놓기':'당시 기록 놓기');
   });
   const ready=w.seen.before&&w.seen.after;
   recordCards.forEach((card,j)=>{
    const used=w.pairs.includes(j);
    setInteraction(card,ready&&!used&&!completed);
    card.object.setAlpha(used?.35:ready?1:.65);
   });
  }
  function set(value,collect=true){
   const bothSeen=w.seen.before&&w.seen.after;
   display=Math.max(.03,Math.min(.97,value));
   if(range){
    range.value=Math.round((1-display)*100);
    range.setAttribute?.('aria-valuetext',display>.92?labels[0]:display<.08?labels[1]:'두 모습을 비교하는 중');
   }
   if(collect&&!completed&&!bothSeen){
    const before=Number(w.seen.before)+Number(w.seen.after);
    w.wipe=display;if(display>.92)w.seen.before=true;if(display<.08)w.seen.after=true;
    if(before!==Number(w.seen.before)+Number(w.seen.after)){
     api.say(w.seen.before&&w.seen.after?'기록 카드를 알맞은 시기의 칸에 놓아 줘.':farm?'막대를 반대쪽 끝으로 움직여 봐.':w.seen.before?'이번에는 이후 사진을 눌러 봐.':'이번에는 분출 당시 사진을 눌러 봐.');
    }
    d.citySeen[s.id]={...w.seen};api.save();progress();
   }
   paintProgress();
  }
  function progress(){
   api.counter(Number(w.seen.before)+Number(w.seen.after)+w.pairs.length,4,'관찰과 기록');
   if(!completed&&w.pairs.length===2&&w.seen.before&&w.seen.after){
    completed=true;
    if(!d.evidence['city-'+s.id]?.pair)api.record({id:'city-'+s.id,kind:'city',...cityEvidence(index),label:s.name+'의 시간 변화',claim:s.claim,pair:true,site:s.id,asset:'city-calm',point:{x:SITE_X[index]/1200,y:SITE_Y[index]/640},time:w.wipe,text:s.now+' '+s.later});
    api.finish(index===1?'화산재는 먼저 피해를 줘. 아주 오랜 시간이 지나 비옥한 흙이 되기도 해.':s.now+' '+s.later);
   }
   paintProgress();
  }
  if(farm&&scene.game?.canvas){
   range=document.createElement('input');range.type='range';range.className='farm-wipe-input';
   range.min='3';range.max='97';range.setAttribute('aria-label','관찰할 시기');
   range.oninput=()=>set(1-Number(range.value)/100);
   range.onfocus=()=>{focused=true;paintProgress();};range.onblur=()=>{focused=false;paintProgress();};
   let pointer=null;
   const move=e=>{const box=range.getBoundingClientRect();set((e.clientX-box.left)/box.width);};
   range.addEventListener('pointerdown',e=>{
    if(e.button!==0||pointer!==null)return;
    e.preventDefault();range.focus({preventScroll:true});pointer=e.pointerId;range.setPointerCapture(pointer);move(e);
   });
   range.addEventListener('pointermove',e=>{if(pointer===e.pointerId)move(e);});
   range.addEventListener('pointerup',e=>{if(pointer===e.pointerId){move(e);pointer=null;}});
   range.addEventListener('lostpointercapture',()=>{pointer=null;});
   pinToScene(scene,api,range,FARM_VIEW);
  }else if(!scene.game?.canvas)range=api.range('관찰할 시기',Math.round((1-w.wipe)*100),3,97,v=>set(1-Number(v)/100));
  let cardIndex=null;
  bindKeys(scene,api,'사진 관찰: 1은 당시, 2는 이후. 기록 카드 3, 4, 5를 고른 뒤 6은 당시 칸, 7은 이후 칸.', '1 2 3 4 5 6 7',key=>{
   const n=Number(key);
   if(n<3){set(n===1?.97:.03);return;}
   if(!w.seen.before||!w.seen.after||completed)return false;
   if(n<6){cardIndex=n-3;api.select(recordCards[cardIndex].object);return;}
   if(cardIndex!==null){recordCards[cardIndex].connect(n-6);cardIndex=null;api.deselect();}
  });
  api.actions([]);
  const stop=()=>{const interrupted=!!motion;motion=null;return interrupted;};
  api.autoplay(observationTour(api,{label:'두 시기의 모습 관찰',items:[.97,.03],interval:3200,stop,
   needed:()=>!w.seen.before||!w.seen.after,
   visit(value){if(reduced)set(value);else motion={from:display,to:value,elapsed:0};}
  }));
  set(w.wipe,false);progress();
  return {update(time,delta){if(!motion)return;const m=motion;m.elapsed+=Math.min(delta,60);const t=Math.min(1,m.elapsed/600);set(m.from+(m.to-m.from)*t,false);if(t===1){motion=null;set(m.to);}},pause:stop,destroy(){stop();masks.forEach(mask=>mask.destroy());}};
 }

 function advise(){
  const existing=new Set(scene.children.list);let ashShown=false,ashKey=null;
  api.task(`${s.name} 안내판을 채워 줘`,'카드를 안내판의 빈칸에 놓아 줘.');
  if(w.poster!==true&&['picture','reason','action'].every(key=>w.board?.[key]))w.poster=true;
  const BX=861,BY=327,PW=318,PH=253,asset=key=>'art/posters/'+s.id+'-'+key;
  if(scene.textures.exists('art/ui/notice-board'))api.image('art/ui/notice-board',BX,335,662,523);
  else api.panel(BX,335,625,465,0xf1d3a6,1);
  api.text(['비행기를 이용해도 될까?','농사는 바로 잘될까?','온천을 이용해도 될까?'][index],BX,143,25,'#fff8e5',425);
  const target=scene.add.graphics();
  function paintSlot(over=false){
   target.clear();if(w.poster)return;
   const x=BX-PW/2,y=BY-PH/2;
   target.fillStyle(over?0xd5f0ae:0xfff6d5,over?.89:.28).fillRoundedRect(x,y,PW,PH,12);
   target.lineStyle(4,over?0x317151:0xfff7d8,1);
   for(let dx=0;dx<PW;dx+=22){target.lineBetween(x+dx,y,x+Math.min(PW,dx+13),y);target.lineBetween(x+dx,y+PH,x+Math.min(PW,dx+13),y+PH);}
   for(let dy=0;dy<PH;dy+=22){target.lineBetween(x,y+dy,x,y+Math.min(PH,dy+13));target.lineBetween(x+PW,y+dy,x+PW,y+Math.min(PH,dy+13));}
  }
  const targetLabel=api.text('포스터 붙이는 곳',BX,BY,27,'#543e2c').setBackgroundColor('#fff8e3').setPadding(11,6);
  let posted;
  function poster(x,y,good,w,h){
   const label=POSTER_CAPTIONS[index][good?0:1];
   const card=scene.add.container(x,y,[api.paper('paper-card',0,0,w,h)]);
   const key=asset(good?'guide':'retry');
   const image=api.image(scene.textures.exists(key)?key:'city-calm',0,-34,w-20,h-91);
   const caption=api.text(label,0,h/2-34,23,'#294239',w-26);
   card.add(image).add(caption).setSize(w,h);card.setData('learningCard',true);
   return card.setName('city-poster-'+(good?'guide':'retry'));
  }
  const options=(index===1?[false,true]:[true,false]).map((good,i)=>({good,obj:poster(183+i*275,305,good,240,326)}));
  function nearBoard(x,y){return inBox(x,y,BX,BY,PW+49,PH+47);}
  function put(option){
   if(w.poster||!option)return false;
   if(!d.evidence['city-'+s.id]?.pair){api.say('먼저 이 장소의 전후 모습을 살펴봐.');return false;}
   if(!option.good){api.say(POSTER_RETRY[index]);return false;}
   w.poster=true;api.save();api.spark(BX,BY);
   progress(true);return false;
  }
  options.forEach(option=>{
   const drop=(_o,x,y,pointer)=>{
    const p=pointer||{x,y};paintSlot();
    if(!nearBoard(p.x,p.y)){api.say('포스터를 안내판의 점선 자리에 놓아 줘.');return false;}
    return put(option);
   };
   api.drag(option.obj,{onDrop:drop,onTap:drop,selectionHint:'안내판의 점선 자리를 눌러 붙여 줘.',onMove:(_o,x,y,pointer)=>{const p=pointer||{x,y};paintSlot(nearBoard(p.x,p.y));}});
  });
  function progress(newPlacement=false){
   paintSlot();api.counter(Number(w.poster===true),1,'안내 포스터');
   if(!w.poster)return;
   targetLabel.setVisible(false);
   for(const option of options)option.obj.setVisible(false).disableInteractive();
   if(!posted){posted=poster(BX,BY,true,PW,PH);posted.setName('city-poster-posted');}
   d.notices[s.id]=s.claim;
   if(d.evidence['notice-'+s.id]?.claim!==s.claim)api.record({id:'notice-'+s.id,kind:'notice',...cityEvidence(index),label:s.name+' 주민 안내',claim:s.claim,text:s.notice,site:s.id});
   api.save();
   if(index===0){
    if(newPlacement&&scene.time?.delayedCall){api.say('포스터를 붙였어! 이제 실내에서 리버를 도와주자.');scene.time.delayedCall(reduced?180:750,ashSafety);}
    else ashSafety();
   }else api.finish(s.reply);
  }
  function ashSafety(){
   if(ashShown)return;ashShown=true;
   // The city remains visible through an indoor window. These actions happen
   // indoors; learners are never asked to go out into falling ash.
   scene.children.list.filter(o=>!existing.has(o)).forEach(o=>o.setVisible(false));hero.setVisible(false);
   api.task('화산재가 날려. 실내에서 리버를 도와주자','창문을 누르거나 왼쪽으로 밀어 닫아 줘.');
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
   const maskedPose='hero-protect-mask',basePose=scene.textures.exists('hero-protect')?'hero-protect':'river-pose-2';
   const canMask=scene.textures.exists(maskedPose);
   const river=api.hero(985,400,480,w.ashMask&&canMask?maskedPose:basePose).setFlipX(true);
   const canvas=scene.game?.canvas,parent=canvas?.parentElement,room=parent?.closest('.adventure-page');
   let roomHero,faceNode,mouth={x:985,y:375,w:190,h:180};
   if(room){
    river.setVisible(false);room.classList.add('city-ash-room');
    roomHero=document.createElement('img');roomHero.className='ash-room-hero';roomHero.alt='';roomHero.draggable=false;
    roomHero.src='/assets/'+(w.ashMask&&canMask?maskedPose:basePose)+'.webp';parent.append(roomHero);
    faceNode=document.createElement('span');faceNode.className='ash-room-face';faceNode.hidden=!w.ashWindow||w.ashMask;parent.append(faceNode);
    const fit=()=>{
     const frame=canvas.getBoundingClientRect(),root=parent.getBoundingClientRect(),page=room.getBoundingClientRect(),scale=frame.width/1200;
     if(!scale)return;
     const bg=Math.max(page.width/1280,page.height/716),floor=page.top+(page.height-716*bg)/2+633*bg;
     const bottom=Math.min(root.bottom-9,frame.bottom-6,Math.max(frame.top+30,floor));
     const h=Math.min(480*scale,bottom-frame.top-8),width=h*491/480;
     const ideal=frame.left+985*scale+Math.min(38,frame.width*.07);
     const x=Math.min(root.right-width/2-5,ideal),y=bottom-h;
     Object.assign(roomHero.style,{left:x-width/2-root.left+'px',top:y-root.top+'px',width:width+'px',height:h+'px'});
     const fx=x-width*.114,fy=y+h*.465,fw=width*.37,fh=h*.26;
     Object.assign(faceNode.style,{left:fx-fw/2-root.left+'px',top:fy-fh/2-root.top+'px',width:fw+'px',height:fh+'px'});
     mouth={x:(fx-frame.left)/scale,y:(fy-frame.top)/scale,w:Math.max(150,fw/scale),h:Math.max(140,fh/scale)};
    };
    const resize=new ResizeObserver(fit);resize.observe(parent);resize.observe(canvas);scene.scale.on('resize',fit);fit();
    api.listenCleanup(()=>{resize.disconnect();scene.scale.off('resize',fit);room.classList.remove('city-ash-room');roomHero.remove();faceNode.remove();});
   }
   const maskArt=scene.textures.exists('art/ui/dust-mask')?[api.image('art/ui/dust-mask',0,0,175,102)]:[scene.add.rectangle(0,0,112,62,0xd6edf1,1)];
   const mask=scene.add.container(w.ashMask?mouth.x:420,w.ashMask?mouth.y:560,maskArt);mask.setSize(185,110);mask.setName('ash-mask');
   function wearMask(){
    if(canMask){
     river.setTexture(maskedPose);river.setScale(480/river.height);mask.setVisible(false);
     if(roomHero)roomHero.src='/assets/'+maskedPose+'.webp';
    }else mask.setPosition(mouth.x,mouth.y).setScale(.6);
   }
   if(w.ashMask)wearMask();
   const hint=api.card(w.ashWindow?'창문 닫음':'← 창문 닫기',550,505,300,52,22);
   const hintText=hint.list.at(-1);
   const showFace=visible=>{if(faceNode)faceNode.hidden=!visible;};
   function close(){
    w.ashWindow=true;api.say('마스크를 리버의 코와 입에 놓아 줘.');pane.setPosition(414,340).disableInteractive();
    showFace(!w.ashMask);hintText.setText('창문 닫음');api.save();safeProgress();return true;
   }
   function cover(){if(!w.ashWindow){api.say('먼저 창문을 닫아 화산재가 실내로 들어오지 않게 하자.');return false;}w.ashMask=true;showFace(false);wearMask();api.save();safeProgress();return true;}
   api.drag(pane,{onPick:close,onMove:(o,x)=>o.setPosition(Math.max(414,Math.min(686,x)),340),onDrop:(o,x)=>{if(x<515)return close();pane.setPosition(w.ashWindow?414:686,340);return true;}});
   if(w.ashWindow)pane.disableInteractive();
   const putMask=(_o,x,y,pointer)=>{
    const point=pointer||{x,y};
    if(inBox(point.x,point.y,mouth.x,mouth.y,mouth.w,mouth.h))return cover();
    api.say(w.ashWindow?'마스크로 코와 입을 가려 줘.':'창문을 먼저 닫아 줘.');return false;
   };
   api.drag(mask,{onDrop:putMask,onTap:putMask,selectionHint:'마스크를 놓을 리버의 얼굴을 눌러 줘.'});
   if(w.ashMask)mask.disableInteractive();
   ashKey=key=>key==='1'?close():key==='2'?cover():false;
   function safeProgress(){api.counter(Number(!!w.ashWindow)+Number(!!w.ashMask),2,'화산재로부터 보호');if(w.ashWindow&&w.ashMask){d.ashSafety={indoor:true,window:true,mask:true};api.record({id:'city-ash-safety',kind:'safety',label:'화산재 안전 행동',text:'실내에서 창문을 닫고 마스크로 코와 입을 보호하며 안내를 확인해.'});api.save();api.finish('실내에서 창문을 닫고 코와 입을 보호했어. 어른과 함께 안전 안내를 확인하자.');}}
   api.actions([]);
   safeProgress();
  }
  let selected=null;
  bindKeys(scene,api,'안내판: 숫자 1과 2로 포스터를 고르고 3으로 붙여요. 실내에서는 1로 창문을 닫고 2로 마스크를 써요.', '1 2 3',key=>{
   if(ashKey){ashKey(key);return;}
   const n=Number(key);
   if(n<3){selected=options[n-1];api.select(selected.obj);return;}
   if(selected){put(selected);selected=null;api.deselect();}
  });
  api.actions([]);progress();
 }
}
