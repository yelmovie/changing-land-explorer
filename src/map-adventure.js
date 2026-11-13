import {bindMapZoom} from './map-gestures.js';
import {bindDirectionPad,mapKeyDirection} from './map-controls.js';
import {syncMapHitLayout} from './map-hit-layout.js';
import {mountMapVillains} from './map-villains.js';
import {RIVER_WALK,createRiverWalker} from './river-walk.js';
import {STAGES,canEnter} from './model.js';
import {guideRecordings} from './guide-recordings.js';
import {OPERATIONS} from './field-operation-model.js';
import {villageLights} from './village-lights.js';
import {RESIDENTS,residentMarker,showResidents} from './residents.js';
import {playSound,playCue} from './sound.js';
import {$,$$,icon} from './ui.js';
import {shell,state,isAdmin,save,enter,navigate,toast,modal} from './main.js';
import {TOOL_ASSETS,stageDiscoveries,discoveryCount} from './adventure/rules.js';
import {destroyGame} from './phaser-lifecycle.js';
import {backgroundForAsset} from './stage-art.js';
import {overviewFrame,clampMapAxis} from './map-camera.js';

const XY=[[.18,.75],[.195,.62],[.26,.56],[.26,.49],[.245,.43],[.235,.38],[.16,.38],[.235,.31],[.265,.25],[.29,.205],[.34,.23],[.39,.25],[.43,.20],[.51,.20],[.58,.215],[.65,.205],[.677,.24],[.70,.31],[.72,.39],[.77,.46],[.72,.50],[.66,.59],[.615,.67],[.635,.75],[.70,.70],[.60,.57],[.54,.55],[.50,.48],[.50,.42]];
const LINKS=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[21,25],[25,26],[26,27],[27,28]];
const DOORS=[6,9,15,19,24];
const LABELS=[[.122,.253],[.31,.105],[.65,.09],[.84,.33],[.704,.571]];
const CORE_LABEL=[.5,.245];
const POINTS=XY.map(([x,y])=>({x:x*1200,y:y*675}));
export function findRoute(from,to){
  const queue=[[from]],seen=new Set([from]);
  while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path.slice(1);for(const [a,b]of LINKS){const next=a===last?b:b===last?a:null;if(next!==null&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}}}
  return [];
}

export function renderMap({arrival,engine,loadEngine}={}){
  const s=state(),all=s.completed.length===5,finished=s.finished===true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coreOpen=all||isAdmin();
  const nextStage=STAGES.find(stage=>!s.completed.includes(stage.id));
  let game,mapScene,current=POINTS[s.mapNode]?s.mapNode:0,moving=false,queue=[],destination=null,guided=false,hero,walker,routeArt,pendingTravel=null,combat=null,closed=false,fallback=false,bootTimer;
  const residents=STAGES.filter(st=>isAdmin()||s.completed.includes(st.id));
  const newcomer=residents.find(st=>st.id===arrival);
  shell('움직이는 지오밸리',`<main class="atlas-page">
    <div class="atlas-strip"><div class="atlas-title"><span class="eyebrow">리버의 발견 여행</span><h1>${finished?'탐험 완료 · 내 발견을 다시 살펴봐':all?'다섯 발견을 기록탑에 연결하자':'길을 따라, 지오밸리 탐험'}</h1></div><div class="atlas-stars">${icon('star',22)} <b>${discoveryCount(s)}</b><span>/ 30 발견</span><i></i>${icon('flag',22)} <b>${s.completed.length}</b><span>/ 5 도구</span></div></div>
    <div class="atlas-world">${villageLights(residents,newcomer?.id,s.residentStamps.length===5)}<div id="atlas-canvas" class="atlas-canvas"></div><img class="atlas-fallback-river" src="/assets/hero-lens.webp" alt="지도 위의 리버" hidden><div class="atlas-destinations">
      ${STAGES.map((st,i)=>{const done=s.completed.includes(st.id),open=canEnter(i,s,isAdmin());return `<button class="atlas-pin ${done?'done':open?'available':'locked'}" data-stage="${i}" style="left:${LABELS[i][0]*100}%;top:${LABELS[i][1]*100}%" aria-label="${i+1}. ${st.place}${done?' 완료':isAdmin()?' 교사 시연 열림':open?' 탐험하기':' 잠김'}"><span class="pin-medallion">${done?icon('check',22):isAdmin()?icon('unlock',22):open?i+1:icon('lock',19)}</span><span class="pin-sign">${st.place}<small>${done?'탐험 완료':isAdmin()?'교사 시연':open?(stageDiscoveries(s,st.id)?`${stageDiscoveries(s,st.id)} / 6 발견`:'탐험하기'):'다음에 만나요'}</small></span></button>`;}).join('')}
      ${residents.map(st=>residentMarker(st,st===newcomer)).join('')}
      <button id="atlas-core" class="atlas-core ${coreOpen?'ready':''}" style="left:${CORE_LABEL[0]*100}%;top:${CORE_LABEL[1]*100}%" aria-label="기록탑 ${coreOpen?'마지막 도전 열림':'다섯 도구를 모아 연결'}">${icon(coreOpen?'star':'lock',22)}<span>기록탑</span><small>${isAdmin()?'시연 가능':s.completed.length+' / 5'}</small></button>
    </div>
    </div><div class="map-view-tools" role="group" aria-label="지도 보기"><button type="button" id="map-hand" aria-label="지도 끌어서 이동" title="지도 끌어서 이동" aria-pressed="true">${icon('hand',26)}</button><button type="button" id="map-overview" aria-label="지도 전체 보기" title="지도 전체 보기" aria-pressed="false">${icon('overview',26)}</button>${residents.length?`<button type="button" id="resident-directory" aria-label="돌아온 주민 ${residents.length}명, 대화 목록 열기" title="주민 대화 목록">${icon('chat',24)}<span>${residents.length}</span></button>`:''}</div><div class="map-dpad" role="group" aria-label="리버 이동 방향키"><button data-dir="up" aria-keyshortcuts="ArrowUp W" aria-label="위로 걷기">${icon('arrow',26)}</button><button data-dir="left" aria-keyshortcuts="ArrowLeft A" aria-label="왼쪽으로 걷기">${icon('arrow',26)}</button><button class="dpad-center" id="dpad-center" aria-label="리버가 있는 곳 보기"><img src="/assets/hero-lens.webp" alt=""></button><button data-dir="right" aria-keyshortcuts="ArrowRight D" aria-label="오른쪽으로 걷기">${icon('arrow',26)}</button><button data-dir="down" aria-keyshortcuts="ArrowDown S" aria-label="아래로 걷기">${icon('arrow',26)}</button></div><button class="next-guide" id="next-guide" hidden></button><button id="travel-skip" class="secondary travel-skip" hidden>도착하기 ${icon('arrow',18)}</button><footer class="atlas-footer"><img class="map-river" src="/assets/hero-cheer.webp" alt="리버"><p id="map-speech" role="status">${newcomer?`마을 불빛 ${residents.length}/5 · ${RESIDENTS[newcomer.id].name}의 말풍선을 눌러 봐!`:isAdmin()?'시연할 장소 이름표를 눌러. 아래 시연 목록에서 활동이나 마지막 도전을 바로 고를 수도 있어.':finished?'30개 발견과 마지막 도전을 마쳤어. 기록을 다시 보거나 새 상황에 다시 도전해 봐.':all?'네가 찾은 단서들이 모였어. 가운데 기록탑에서 마지막 문제를 풀어 보자!':s.completed.length?`흩어진 관찰 기록을 모아 기록탑을 연결하자. 다음은 ${nextStage?.place||'기록탑'}야.`:'‘물길 관측소’를 눌러 첫 단서를 찾으러 가자!'}</p>${finished?'<div class="map-complete-actions"><button class="secondary" id="map-records">기록 다시 보기</button><button class="secondary" id="map-retry">새 상황 다시 도전</button></div>':''}${isAdmin()?'<button class="secondary" id="preview-nav">시연 목록</button>':''}${!finished?`<button class="stage-shortcuts" id="stage-shortcuts" aria-label="${nextStage?.place||'기록탑'} 바로가기"><span class="shortcut-copy"><small>${nextStage?'다음 장소 바로가기':'마지막 도전 바로가기'}</small><strong>${nextStage?.place||'기록탑'}</strong></span>${icon('arrow',24)}</button>`:''}</footer>
  </main>`,'atlas');
  $('.brand').innerHTML='<img class="brand-logo" src="/assets/title-logo.webp" alt="움직이는 지오밸리">';
  const world=$('.atlas-world'),page=$('.atlas-page'),nextButton=$('#stage-shortcuts');
  const retry=document.createElement('button');retry.type='button';retry.className='secondary map-engine-retry';retry.hidden=true;retry.textContent='지도 다시 열기';
  const engineStatus=document.createElement('span');engineStatus.className='map-engine-status';engineStatus.setAttribute('role','status');
  $('.map-view-tools',page).append(retry,engineStatus);
  // 1~4번 프로젝트처럼 지도를 화면보다 크게(cover×ZOOM) 깔고 손으로 끌어 둘러본다. 지도 가장자리가 드러나지 않게 이동 범위를 막는다.
  const ZOOM=1.2,view={x:0,y:0,w:0,h:0,pw:0,ph:0};let grab=null,dragged=false,follow=false,panEnabled=true,overview=false,savedView=null,zoom=1;
  const inputEvents=new AbortController();
  const goal=nextStage?STAGES.indexOf(nextStage):null;
  // 지도에서 실제로 보이는 칸: 위 아이콘 아래 ~ 아래 말풍선 위. 방향키 패드는 왼쪽 아래 덮개로 따로 본다.
  const safe={top:0,bottom:0};
  function measureSafe(){
    const pr=page.getBoundingClientRect();
    safe.top=($('.topbar')?.getBoundingClientRect().bottom??pr.top)-pr.top;safe.bottom=$('.atlas-footer').getBoundingClientRect().top-pr.top;
    page.style.setProperty('--atlas-safe-top',`${Math.max(0,safe.top)}px`);
    page.style.setProperty('--atlas-footer-h',`${Math.round(pr.bottom-$('.atlas-footer').getBoundingClientRect().top)}px`);
  }
  const nextTarget=goal!==null?$(`.atlas-pin[data-stage="${goal}"]`,world):all&&!finished?$('#atlas-core'):null;
  nextTarget?.classList.add('next');
  if(nextTarget){
    const name=goal!==null?STAGES[goal].place:'기록탑',guide=$('#next-guide'),[gx,gy]=goal!==null?LABELS[goal]:CORE_LABEL;
    guide.innerHTML=`${icon('arrow',22)}<span>다음: ${name}</span>`;guide.setAttribute('aria-label',`다음 목적지 ${name}로 지도 옮기기`);
    guide.onclick=()=>{leaveOverview();follow=false;panTo(cameraFor(gx,gy));};
  }
  function dimUnderHud(){
    const pr=page.getBoundingClientRect(),pad=$('.map-dpad')?.getBoundingClientRect();
    $$('.atlas-pin,.atlas-core',world).forEach(pin=>{const r=pin.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2-pr.top;const underPad=pad&&x>pad.left&&x<pad.right&&y+pr.top>pad.top&&y+pr.top<pad.bottom;pin.classList.toggle('under-hud',y<safe.top||y>safe.bottom||!!underPad);});
  }
  // 다음 목적지가 화면 밖이면 가장자리에 화살표를 띄운다. 누르면 그곳으로 지도를 옮긴다.
  function updateGuide(){
    const guide=$('#next-guide');if(!guide||!nextTarget)return;
    const pr=page.getBoundingClientRect(),r=nextTarget.getBoundingClientRect(),cx=(r.left+r.right)/2-pr.left,cy=(r.top+r.bottom)/2-pr.top;
    const off=cx<20||cx>view.pw-20||cy<safe.top+10||cy>safe.bottom-10;guide.hidden=!off;if(!off)return;
    const x=Math.min(view.pw-110,Math.max(110,cx)),y=Math.min(safe.bottom-36,Math.max(safe.top+36,cy));
    guide.style.left=`${x}px`;guide.style.top=`${y}px`;guide.style.setProperty('--turn',`${Math.atan2(cy-y,cx-x)}rad`);
  }
  function place(x,y){
    view.x=overview?(view.pw-view.w)/2:clampMapAxis(x,view.pw,view.w);view.y=overview?overviewFrame(view.pw,safe.top,safe.bottom).y:clampMapAxis(y,view.ph,view.h);
    world.style.transform=`translate(${view.x}px,${view.y}px)`;dimUnderHud();updateGuide();syncMapHitLayout(page,world);
  }
  // 안내 화살표·리버 보기 버튼은 지도를 부드럽게 옮긴다. 움직임 줄이기 설정이면 바로 옮긴다.
  let glide=0;
  function panTo([x,y]){
    cancelAnimationFrame(glide);glide=0;if(reduced){place(x,y);return;}
    const sx=view.x,sy=view.y,t0=performance.now();
    const tick=now=>{const k=Math.min(1,(now-t0)/380),e=1-(1-k)**3;place(sx+(x-sx)*e,sy+(y-sy)*e);glide=k<1&&!closed?requestAnimationFrame(tick):0;};
    glide=requestAnimationFrame(tick);
  }
  const cameraFor=(fx,fy)=>[view.pw/2-fx*view.w,(safe.top+safe.bottom)/2-fy*view.h];
  function fitMap(){
    if(closed||!world.isConnected)return;
    // 처음엔 리버와 다음 목적지 사이를, 크기가 바뀌면 보고 있던 곳을 가운데에 둔다.
    const start=newcomer?RESIDENTS[newcomer.id].feet:goal===null?XY[current]:[(XY[current][0]+LABELS[goal][0])/2,(XY[current][1]+LABELS[goal][1])/2];
    const fx=view.w?(view.pw/2-view.x)/view.w:start[0],fy=view.h?((safe.top+safe.bottom)/2-view.y)/view.h:start[1];
    measureSafe();view.pw=page.clientWidth;view.ph=page.clientHeight;view.w=overview?overviewFrame(view.pw,safe.top,safe.bottom).w:Math.max(view.pw,view.ph*16/9)*ZOOM*zoom;view.h=view.w*9/16;
    world.style.width=`${view.w}px`;world.style.height=`${view.h}px`;world.style.setProperty('--map-unit',`${view.h/675}px`);
    place(...cameraFor(fx,fy));
    // refresh()만 부르면 Phaser가 예전 부모 크기로 캔버스를 그려 작게 남는다. 새 크기를 먼저 넘긴다.
    if(game?.isBooted)game.scale.setParentSize(view.w,view.h);
  }
  const resize=new ResizeObserver(()=>{cancelAnimationFrame(glide);glide=0;fitMap();});resize.observe(page);fitMap();
  function syncViewControls(){
    page.classList.toggle('map-overview',overview);page.classList.toggle('map-pan-disabled',!panEnabled||overview);
    $('#map-hand').setAttribute('aria-pressed',String(panEnabled&&!follow&&!overview));
    const fit=$('#map-overview'),label=overview?'이전 지도 보기로 돌아가기':'지도 전체 보기';fit.setAttribute('aria-pressed',String(overview));fit.setAttribute('aria-label',label);fit.title=label;
  }
  function leaveOverview(){
    if(!overview)return;
    overview=false;syncViewControls();fitMap();
    if(savedView){({follow,panEnabled,zoom}=savedView);fitMap();place(...cameraFor(savedView.fx,savedView.fy));savedView=null;syncViewControls();}
  }
  $('#map-hand').onclick=()=>{
    cancelAnimationFrame(glide);glide=0;grab=null;world.classList.remove('grabbing');
    cancelGuided();if(overview){leaveOverview();panEnabled=true;follow=false;}
    else if(follow||!panEnabled){panEnabled=true;follow=false;}
    else {panEnabled=false;follow=true;resumeCamera();}
    syncViewControls();
  };
  $('#map-overview').onclick=()=>{
    cancelAnimationFrame(glide);glide=0;grab=null;world.classList.remove('grabbing');
    cancelGuided();if(overview){leaveOverview();return;}
    savedView={fx:(view.pw/2-view.x)/view.w,fy:((safe.top+safe.bottom)/2-view.y)/view.h,follow,panEnabled,zoom};
    overview=true;follow=false;syncViewControls();fitMap();
  };
  syncViewControls();
  const hintTimer=setTimeout(()=>page.classList.add('map-dragged'),9000);
  // 장소를 막 되살렸을 때: 문이 열리고 → 창에 불이 켜지고 → 기록탑 등불 → 주민 등장 → 마을 소리. 하나씩 더해지는 마을.
  const cueStops=[];let arrivalTimer=0;
  if(newcomer&&!reduced){
    page.classList.add('village-arriving');
    cueStops.push(playCue('workplace-open',250),playCue('lamp-light',1050),playCue('resident-pop',1650),playCue('village-wake',2050));
    arrivalTimer=setTimeout(()=>page.classList.remove('village-arriving'),3600);
  }
  if(newcomer){
    page.insertAdjacentHTML('beforeend',`<p class="sr-only restored-place-announcement" role="status">${newcomer.place} 다시 열림!${all?' 마을이 모두 깨어났어!':''}</p>`);
  }
  const resumeCamera=()=>{const p=hero?{x:hero.x/1200,y:hero.y/675}:{x:XY[current][0],y:XY[current][1]};panTo(cameraFor(p.x,p.y));};
  page.style.touchAction='none';
  bindMapZoom(page,{signal:inputEvents.signal,enabled:()=>!closed&&!document.hidden&&!overview&&!document.querySelector('dialog[open]'),
    onStart:()=>{grab=null;world.classList.remove('grabbing');cancelAnimationFrame(glide);glide=0;cancelGuided();stopTravel();clearDirections();follow=false;panEnabled=true;syncViewControls();},
    onZoom:(start,end,ratio)=>{const fx=(start.x-view.x)/view.w,fy=(start.y-view.y)/view.h;
      zoom=Math.min(1.7,Math.max(.84,zoom*ratio));fitMap();place(end.x-fx*view.w,end.y-fy*view.h);}
  });
  world.addEventListener('pointerdown',e=>{cancelAnimationFrame(glide);glide=0;if(e.button>0||e.isPrimary===false||document.querySelector('dialog[open]'))return;grab={id:e.pointerId,x:e.clientX,y:e.clientY,ox:view.x,oy:view.y};dragged=false;});
  world.addEventListener('pointermove',e=>{
    if(grab?.id!==e.pointerId)return;const dx=e.clientX-grab.x,dy=e.clientY-grab.y;
    if(!dragged&&Math.hypot(dx,dy)<8)return;
    dragged=true;cancelGuided();if(!panEnabled||overview)return;
    if(!world.hasPointerCapture(e.pointerId)){follow=false;syncViewControls();world.setPointerCapture(e.pointerId);world.classList.add('grabbing');page.classList.add('map-dragged');}
    place(grab.ox+dx,grab.oy+dy);
  });
  const letGo=e=>{if(grab?.id!==e.pointerId)return;grab=null;world.classList.remove('grabbing');if(world.hasPointerCapture(e.pointerId))world.releasePointerCapture(e.pointerId);};
  world.addEventListener('pointerup',letGo);world.addEventListener('pointercancel',letGo);world.addEventListener('lostpointercapture',letGo);
  // 끌기가 끝난 손가락이 장소 누르기로 바뀌지 않게 막는다.
  world.addEventListener('click',e=>{if(!dragged)return;dragged=false;e.preventDefault();e.stopPropagation();},{capture:true});
  function useFallback(){
    if(closed||mapScene)return;
    fallback=true;clearTimeout(bootTimer);world.classList.add('map-fallback');
    retry.hidden=false;retry.disabled=false;retry.textContent='지도 다시 열기';
    engineStatus.textContent='움직이는 지도를 열지 못했어. 지금 지도에서 탐험 장소를 고르거나 지도를 다시 열 수 있어.';
    const river=$('.atlas-fallback-river');river.hidden=false;river.style.left=`${XY[current][0]*100}%`;river.style.top=`${XY[current][1]*100}%`;
    if(game){destroyGame(game);game=null;}

    if(pendingTravel){const {node,target,auto}=pendingTravel;pendingTravel=null;go(node,target,auto);}
  }
  function missionCard(index){
    const st=STAGES[index],done=s.completed.includes(st.id);
    modal(done?'다시 발견하러 갈까?':`${index+1}. ${st.name}`,
      `<div class="mission-preview"><img class="mission-scene" src="/assets/${backgroundForAsset(['river-field','volcano-field','rocks-lab','city-calm','classroom'][index])}.webp" alt="${st.place}"><img class="mission-river" src="/assets/hero-lens.webp" alt="리버"></div><p>${guideRecordings[`guide-intro-${st.id}`].text}</p><div class="mission-reward"><img src="/assets/${TOOL_ASSETS[st.tool]}.webp" alt=""><div><b>${OPERATIONS[st.id].title}</b><span>${done?'모은 도구':'완료 보상'} · ${st.reward}</span></div></div><button class="primary" id="mission-enter">${done?'다시 탐험':'리버와 들어가기'} ${icon('arrow')}</button>`,(dialog,close)=>{
        $('#mission-enter',dialog).onclick=()=>{s.started=true;save();close();enter(index);};
      });
  }
  function doorHere(){if(current===28&&coreOpen)return 'core';const stage=DOORS.indexOf(current);return stage>=0&&canEnter(stage,s,isAdmin())?stage:null;}
  function updateDpad(){const center=$('#dpad-center'),stage=doorHere();if(!center)return;center.classList.toggle('enter',stage!==null);center.setAttribute('aria-label',stage===null?'리버가 있는 곳 보기':`${stage==='core'?'기록탑':STAGES[stage].place} 들어가기`);center.innerHTML=stage===null?'<img src="/assets/hero-lens.webp" alt="">':`${icon('flag',22)}<span>들어가기</span>`;}
  function setGuided(active){
    guided=active;nextButton?.setAttribute('aria-busy',String(active));nextButton?.setAttribute('aria-disabled',String(active));
    if(active)$('#map-speech').textContent='길을 따라 이동 중이야.';
    else if($('#map-speech').textContent==='길을 따라 이동 중이야.')$('#map-speech').textContent='';
  }
  function stopTravel(){
    $('#travel-skip').hidden=true;pendingTravel=null;moving=false;queue=[];destination=null;setGuided(false);travelControls(false);routeArt?.clear();walker?.stop();updateDpad();
  }
  function cancelGuided(){
    if(!guided)return;
    if(hero&&queue.length){
      const d=i=>Math.hypot(POINTS[i].x-hero.x,POINTS[i].y-hero.y);
      if(d(queue[0])<d(current))current=queue[0];
      hero.setPosition(POINTS[current].x,POINTS[current].y);s.mapNode=current;save();
    }
    stopTravel();
  }
  function arrive(){
    const target=destination;
    stopTravel();s.mapNode=current;save();
    if(target==='core'&&coreOpen)navigate('final');
    else if(Number.isInteger(target)&&canEnter(target,s,isAdmin()))missionCard(target);
  }
  function go(node,target,auto=false){
    if(closed||moving||pendingTravel||!auto&&combat?.blocked())return;
    leaveOverview();follow=true;syncViewControls();cancelAnimationFrame(glide);glide=0;
    setGuided(auto);
    if(fallback){current=node;place(...cameraFor(...XY[node]));const river=$('.atlas-fallback-river');river.style.left=`${XY[node][0]*100}%`;river.style.top=`${XY[node][1]*100}%`;destination=target;arrive();return;}
    if(!mapScene){pendingTravel={node,target,auto};travelControls(true);return;}
    queue=findRoute(current,node);destination=target;moving=queue.length>0;travelControls(moving);$('#travel-skip').hidden=!moving;
    if(moving&&!reduced)playSound('trail-step',{force:true});
    if(reduced&&queue.length){current=node;walker.face(POINTS[node].x-hero.x,POINTS[node].y-hero.y);hero.setPosition(POINTS[node].x,POINTS[node].y);place(...cameraFor(...XY[node]));queue=[];arrive();return;}
    if(!moving)arrive();
  }
  $$('[data-stage]').forEach(button=>button.onclick=()=>{cancelGuided();const i=Number(button.dataset.stage);if(!canEnter(i,s,isAdmin())){toast(`먼저 ${STAGES[i-1].place}의 발견을 마치자.`);return;}$('#map-speech').textContent=STAGES[i].intro;go(DOORS[i],i);});
  function greeted(id){
    const marker=$(`.map-resident.arrived[data-resident="${id}"]`,world);
    if(!marker)return;
    marker.classList.remove('arrived');
    const directory=$('#resident-directory');if(directory){if(!isAdmin())$('span',directory).textContent='돌아온 주민';directory.setAttribute('aria-label',`${isAdmin()?'주민 시연':'돌아온 주민'} ${residents.length}명, 대화 목록 열기`);}
    $('.resident-tag',marker).innerHTML=`${icon('chat',16)} ${RESIDENTS[id].name}`;
    $('#map-speech').textContent=nextStage?`다음 탐험은 ${nextStage.place}야. 지도에서 이름표를 눌러 봐!`:'다섯 주민이 돌아왔어! 이제 기록탑에서 발견을 연결하자.';
  }
  function collectStamp(id){
    if(!residents.some(st=>st.id===id)||s.residentStamps.includes(id))return false;
    s.residentStamps.push(id);
    if(!isAdmin())save();
    if(s.residentStamps.length===5){$('.plaza-festival',world).classList.add('celebrating');cueStops.push(playCue('festival',500));}
    playSound('stamp',{force:true,inDialog:true});
    return true;
  }
  function visitPlaza(){
    leaveOverview();follow=false;
    const [x,y]=cameraFor(.51,.408);
    const coreY=CORE_LABEL[1]*view.h;
    const clearOfHud=safe.top+$('#atlas-core').offsetHeight/2+8;
    panTo([x,Math.max(y,clearOfHud-coreY)]);
    const plaza=$('.plaza-festival',world);
    plaza.classList.add('festival-visit');
    $('#map-speech').textContent=finished?'친구 도장 다섯 개가 모였어. 기록탑 광장에서 주민들의 축제를 즐겨 봐!':'친구들의 도장 다섯 개가 모였어! 축제 광장 위쪽에 있는 기록탑을 눌러 마지막 도전을 시작해 봐.';
  }
  const openResidents=id=>showResidents(modal,residents,{initial:id,onGreet:greeted,preview:isAdmin(),stamps:s.residentStamps,collect:collectStamp,visitPlaza});
  function travelControls(busy){
    $$('.map-resident,#resident-directory',page).forEach(button=>{button.disabled=busy;});
  }
  $$('.map-resident',world).forEach(button=>button.onclick=()=>openResidents(button.dataset.resident));
  nextButton?.addEventListener('click',()=>{
    if(guided)return;
    if(!nextStage){if(coreOpen)go(28,'core',true);return;}
    const index=STAGES.indexOf(nextStage);
    if(!canEnter(index,s,isAdmin()))return;
    go(DOORS[index],index,true);
  });
  $('#resident-directory')?.addEventListener('click',()=>openResidents($('.map-resident.arrived',world)?.dataset.resident));
  world.addEventListener('click',e=>{
    if(e.target.closest('button')||document.querySelector('dialog[open]'))return;
    cancelGuided();if(moving)return;
    const r=world.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*1200,py=(e.clientY-r.top)/r.height*675;
    const nearest=POINTS.reduce((best,p,i)=>Math.hypot(px-p.x,py-p.y)<Math.hypot(px-POINTS[best].x,py-POINTS[best].y)?i:best,0);
    const stage=DOORS.indexOf(nearest);if(stage>=0&&!canEnter(stage,s,isAdmin()))return;go(nearest,nearest===28&&coreOpen?'core':stage>=0?stage:null);
  });
  $('#atlas-core').onclick=()=>{cancelGuided();if(!coreOpen){toast('다섯 장소에서 도구를 모으면 기록탑을 연결할 수 있어.');return;}go(28,'core');};
  $('#map-records')?.addEventListener('click',()=>navigate('final','ending'));
  $('#map-retry')?.addEventListener('click',()=>navigate('final','retry'));
  $('#travel-skip').onclick=()=>{if(!moving)return;current=queue.at(-1)??current;hero.setPosition(POINTS[current].x,POINTS[current].y);queue=[];arrive();};
  function startMapGame(P){
  class Atlas extends P.Scene{
    constructor(){super('Atlas');}
    preload(){this.load.once('loaderror',()=>queueMicrotask(useFallback));this.load.image('river','/assets/hero-lens.webp');this.load.spritesheet(RIVER_WALK.key,RIVER_WALK.url,{frameWidth:RIVER_WALK.frameWidth,frameHeight:RIVER_WALK.frameHeight});}
    create(){
      if(closed||!game)return;
      clearTimeout(bootTimer);world.classList.add('map-ready');world.classList.remove('map-fallback');
      fallback=false;$('.atlas-fallback-river',world).hidden=true;
      if(document.activeElement===retry)nextButton?.focus({preventScroll:true});
      retry.hidden=true;engineStatus.textContent='';
      mapScene=this;this.cameras.main.setZoom(1.6).centerOn(600,337.5);
      const paths=this.add.graphics();
      for(let i=0;i<5;i++)if(s.completed.includes(STAGES[i].id)){const route=[i?DOORS[i-1]:0,...findRoute(i?DOORS[i-1]:0,DOORS[i])];
        // 새로 연 장소로 가는 길은 금빛 선이 천천히 그려진다.
        if(STAGES[i].id===newcomer?.id&&!reduced){const glow=this.add.graphics(),pts=route.map(n=>POINTS[n]);this.tweens.addCounter({from:0,to:pts.length-1,duration:1500,delay:300,ease:'Sine.easeInOut',onUpdate:t=>{const v=t.getValue(),k=Math.floor(v),f=v-k;glow.clear().lineStyle(7,0xffe78a,.75).beginPath().moveTo(pts[0].x,pts[0].y);for(let j=1;j<=k;j++)glow.lineTo(pts[j].x,pts[j].y);if(k<pts.length-1)glow.lineTo(pts[k].x+(pts[k+1].x-pts[k].x)*f,pts[k].y+(pts[k+1].y-pts[k].y)*f);glow.strokePath();}});continue;}
        paths.lineStyle(7,0xffe78a,.68).beginPath();route.forEach((n,j)=>j?paths.lineTo(POINTS[n].x,POINTS[n].y):paths.moveTo(POINTS[n].x,POINTS[n].y));paths.strokePath();}
      routeArt=this.add.graphics();const p=POINTS[current];walker=createRiverWalker(this,p.x,p.y);hero=walker.hero;

      if(pendingTravel){const {node,target,auto}=pendingTravel;pendingTravel=null;go(node,target,auto);}
    }
    update(time,delta){
      if(!hero)return;
      if(document.querySelector('dialog[open]')||document.hidden){walker.stop();return;}
      if(follow&&!grab&&!overview&&!glide){const [tx,ty]=cameraFor(hero.x/1200,hero.y/675),blend=reduced?1:1-Math.exp(-Math.min(delta,50)/115);
        const x=clampMapAxis(tx,view.pw,view.w),y=clampMapAxis(ty,view.ph,view.h);
        if(Math.hypot(x-view.x,y-view.y)>.3)place(view.x+(x-view.x)*blend,view.y+(y-view.y)*blend);}
      if(!moving||!queue.length){walker.stop();return;}
      const target=POINTS[queue[0]],dx=target.x-hero.x,dy=target.y-hero.y,distance=Math.hypot(dx,dy),speed=180*Math.min(delta,40)/1000;
      routeArt.clear().lineStyle(4,0xfff4b0,.85).beginPath().moveTo(hero.x,hero.y);for(const node of queue)routeArt.lineTo(POINTS[node].x,POINTS[node].y);routeArt.strokePath();
      if(distance<=speed){current=queue.shift();hero.setPosition(target.x,target.y);walker.move(dx,dy,distance);if(!queue.length)arrive();}else{hero.x+=dx/distance*speed;hero.y+=dy/distance*speed;walker.move(dx,dy,speed);}
    }
  }
  game=new P.Game({type:P.CANVAS,parent:'atlas-canvas',width:1920,height:1080,transparent:true,scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},audio:{noAudio:true},scene:Atlas,callbacks:{postBoot(g){g.canvas.setAttribute('role','img');g.canvas.setAttribute('aria-label','리버가 연결된 길을 따라 걷는 지오밸리 지도');}}});
  if(!mapScene)bootTimer=setTimeout(useFallback,7000);
  }
  async function openMapEngine(initial){
    retry.disabled=true;retry.textContent='지도를 여는 중…';
    try{
      const P=await (initial||loadEngine());
      if(!closed)startMapGame(P);
    }catch{useFallback();}
  }
  retry.onclick=()=>openMapEngine();
  // 방향키·WASD·화면 방향키 패드가 같은 걸음을 쓴다: 그 방향에 가장 가까운 이웃 길목으로 한 칸.
  const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const KEY_DIRS={arrowup:'up',keyw:'up',w:'up',arrowdown:'down',keys:'down',s:'down',arrowleft:'left',keya:'left',a:'left',arrowright:'right',keyd:'right',d:'right'};
  function stepToward(v,quiet=false){if(document.querySelector('dialog[open]'))return;leaveOverview();follow=true;syncViewControls();cancelAnimationFrame(glide);glide=0;if(moving)return;const neighbors=LINKS.flatMap(([a,b])=>a===current?[b]:b===current?[a]:[]);const score=n=>{const p=POINTS[n],a=POINTS[current];return((p.x-a.x)*v[0]+(p.y-a.y)*v[1])/Math.hypot(p.x-a.x,p.y-a.y);};neighbors.sort((a,b)=>score(b)-score(a));if(score(neighbors[0])>0)go(neighbors[0],null);else if(!quiet)toast('그쪽으로는 길이 없어. 다른 방향을 눌러 봐.');}
  const heldDirections=new Map();
  const clearDirections=()=>heldDirections.clear();
  const inputBlocked=()=>closed||document.hidden||!!document.querySelector('dialog[open]')||!!combat?.blocked();
  const repeatDirection=setInterval(()=>{if(inputBlocked()){clearDirections();return;}const d=[...heldDirections.values()].at(-1);if(d)stepToward(DIRS[d],true);},80);
  const key=e=>{
    const target=e.target instanceof Element?e.target:null;
    // Closing a dialog restores focus to its opener. Map buttons must still accept movement keys.
    if(closed||document.hidden||e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;
    if(target?.closest('input,textarea,select,[role="textbox"],[role="slider"]')||target?.isContentEditable)return;
    if(e.key==='Enter'){
      // Preserve native Enter activation for the focused UI control.
      if(!e.repeat&&!target?.closest('button,a[href],[role="button"]')&&doorHere()!==null){e.preventDefault();$('#dpad-center').click();}
      return;
    }
    const dir=KEY_DIRS[e.code?.toLowerCase()]||KEY_DIRS[e.key?.toLowerCase()];
    if(!dir)return;
    e.preventDefault();
    if(!e.repeat)cancelGuided();
    if(!e.repeat){heldDirections.set(e.code||e.key,dir);stepToward(DIRS[dir]);}
  };
  window.addEventListener('keydown',key);
  window.addEventListener('keyup',e=>heldDirections.delete(e.code||e.key),{signal:inputEvents.signal});
  window.addEventListener('blur',clearDirections,{signal:inputEvents.signal});document.addEventListener('visibilitychange',clearDirections,{signal:inputEvents.signal});
  bindDirectionPad(page,'[data-dir]',b=>b.dataset.dir,{signal:inputEvents.signal,blocked:inputBlocked,press:d=>{cancelGuided();heldDirections.set('pad',d);stepToward(DIRS[d]);},release:()=>heldDirections.delete('pad'),tap:d=>{cancelGuided();stepToward(DIRS[d]);}});
  // 가운데 버튼: 장소 입구에 서 있으면 들어가기, 아니면 리버가 있는 곳으로 지도를 옮긴다.
  $('#dpad-center').onclick=()=>{if(moving)return;leaveOverview();const stage=doorHere();if(stage==='core'){navigate('final');return;}if(stage!==null){missionCard(stage);return;}follow=true;syncViewControls();panTo(cameraFor(...XY[current]));};
  updateDpad();
  if(isAdmin())$('#preview-nav').onclick=()=>modal('관리자 · 모든 활동 살펴보기',`<div class="preview-links">${STAGES.map((st,i)=>`<strong>${st.place}</strong>${st.steps.map((name,j)=>`<button class="secondary" data-preview="${i},${j}">${icon('unlock',18)} ${name}</button>`).join('')}`).join('')}<strong>마지막 기록탑</strong><button class="secondary" data-final="assembly">다섯 관찰 고르기</button><button class="secondary" data-final="river">물길 도전</button><button class="secondary" data-final="rocks">암석 도전</button><button class="secondary" data-final="safety">안전길 도전</button><button class="secondary" data-final="ending">엔딩</button><button class="secondary" data-final="certificate">인증서</button></div>`,(dialog,close)=>{$$('[data-preview]',dialog).forEach(button=>button.onclick=()=>{const [index,step]=button.dataset.preview.split(',').map(Number);close();enter(index,step);});$$('[data-final]',dialog).forEach(button=>button.onclick=()=>{close();const target=button.dataset.final;
        if(target==='assembly'){s.final.assembled=false;s.final.round=0;}
        const round=['river','rocks','safety'].indexOf(target);
        if(round>=0){s.final.assembled=true;s.final.round=round;}
        navigate('final',round>=0?'assembly':target==='ending'?'celebration':target);});});
  combat=mountMapVillains({world,page,tools:$('.map-view-tools',page),state:s,save,reduced,
    paused:()=>closed||guided||destination!==null,
    getHero:()=>hero?{x:hero.x,y:hero.y}:fallback?POINTS[current]:null,
    heroPose:pose=>{hero?.setVisible(pose<0);if(fallback)$('.atlas-fallback-river').style.visibility=pose<0?'':'hidden';},
    stopTravel,
    respawn:()=>{current=0;s.mapNode=0;hero?.setPosition(POINTS[0].x,POINTS[0].y);if(fallback){const el=$('.atlas-fallback-river');el.style.left=XY[0][0]*100+'%';el.style.top=XY[0][1]*100+'%';}leaveOverview();follow=true;syncViewControls();place(...cameraFor(...XY[0]));updateDpad();},
    go:node=>go(node,null),say:text=>$('#map-speech').textContent=text,
    reveal:(x,y)=>{leaveOverview();follow=false;panTo(cameraFor(x,y));}
  });
  void openMapEngine(engine);
  return()=>{closed=true;clearInterval(repeatDirection);inputEvents.abort();combat?.destroy();clearTimeout(arrivalTimer);cueStops.forEach(stop=>stop());cancelAnimationFrame(glide);glide=0;clearTimeout(hintTimer);clearTimeout(bootTimer);resize.disconnect();destroyGame(game);window.removeEventListener('keydown',key);};
}
