import {STAGES,canEnter} from './model.js';
import {$,$$,icon} from './ui.js';
import {shell,state,isAdmin,save,enter,navigate,toast,modal} from './main.js';
import {TOOL_ASSETS,stageDiscoveries,discoveryCount} from './adventure/rules.js';

const XY=[[.18,.75],[.195,.62],[.26,.56],[.26,.49],[.245,.43],[.235,.38],[.16,.38],[.235,.31],[.265,.25],[.29,.205],[.34,.23],[.39,.25],[.43,.20],[.51,.20],[.58,.215],[.65,.205],[.677,.24],[.70,.31],[.72,.39],[.77,.46],[.72,.50],[.66,.59],[.615,.67],[.635,.75],[.70,.70],[.60,.57],[.54,.55],[.50,.48],[.50,.42]];
const LINKS=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[21,25],[25,26],[26,27],[27,28]];
const DOORS=[6,9,15,19,24];
const LABELS=[[.135,.28],[.31,.105],[.65,.09],[.84,.33],[.78,.675]];
const POINTS=XY.map(([x,y])=>({x:x*1200,y:y*675}));
export function findRoute(from,to){
  const queue=[[from]],seen=new Set([from]);
  while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path.slice(1);for(const [a,b]of LINKS){const next=a===last?b:b===last?a:null;if(next!==null&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}}}
  return [];
}

export function renderMap({welcome=false}={}){
  const s=state(),all=s.completed.length===5,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let game,mapScene,current=POINTS[s.mapNode]?s.mapNode:0,moving=false,queue=[],destination=null,hero,routeArt,pendingTravel=null,closed=false;
  shell('움직이는 지오밸리',`<main class="atlas-page ${welcome?'atlas-welcome':''}">
    <div class="atlas-strip"><div class="atlas-title"><span class="eyebrow">리버의 발견 여행</span><h1>${all?'다섯 발견을 기록탑에 연결하자':'길을 따라, 지오밸리 탐험'}</h1></div><div class="atlas-stars">${icon('star',22)} <b>${discoveryCount(s)}</b><span>/ 30 발견</span><i></i>${icon('flag',22)} <b>${s.completed.length}</b><span>/ 5 도구</span></div></div>
    <div class="atlas-world"><div id="atlas-canvas" class="atlas-canvas"></div><div class="atlas-destinations">
      ${STAGES.map((st,i)=>{const done=s.completed.includes(st.id),open=canEnter(i,s,isAdmin());return `<button class="atlas-pin ${done?'done':open?'available':'locked'}" data-stage="${i}" style="left:${LABELS[i][0]*100}%;top:${LABELS[i][1]*100}%" aria-label="${i+1}. ${st.place}${done?' 완료':open?' 탐험하기':' 잠김'}"><span class="pin-medallion">${done?icon('check',22):open?i+1:icon('lock',19)}</span><span class="pin-sign">${st.place}<small>${done?'탐험 완료':open?(stageDiscoveries(s,st.id)?`${stageDiscoveries(s,st.id)} / 6 발견`:'탐험하기'):'다음에 만나요'}</small></span></button>`;}).join('')}
      <button id="atlas-core" class="atlas-core ${all?'ready':''}" style="left:50%;top:35%" aria-label="기록탑 ${all?'마지막 도전':'다섯 도구를 모아 연결'}">${icon(all?'star':'lock',22)}<span>기록탑</span><small>${s.completed.length} / 5</small></button>
    </div><div class="atlas-route-help">${icon('flag',18)} 장소를 누르면 리버가 길을 따라가</div><button id="travel-skip" class="secondary travel-skip" hidden>도착하기 ${icon('arrow',18)}</button>
    ${welcome?`<section class="welcome-scroll"><img class="welcome-river" src="/assets/hero-lens.webp" alt="탐험가 수달 리버"><div><span>초등 과학 · 땅의 변화</span><h2>리버와 발견 여행을 떠나자!</h2><p>다섯 곳의 관찰 기록을 모아<br>꺼진 기록탑을 다시 연결해 줘.</p><button class="primary" id="start">${s.started?'탐험 이어 하기':'탐험 시작'} ${icon('arrow')}</button></div></section>`:''}
    </div><footer class="atlas-footer"><img class="map-river" src="/assets/hero-cheer.webp" alt="리버"><p id="map-speech">${all?'네가 찾은 단서들이 모였어. 가운데 기록탑에서 마지막 문제를 풀어 보자!':'나는 리버야. 첫 번째 목적지는 물길 관측소! 함께 물을 흘려 볼까?'}</p><div class="reward-rack" aria-label="모은 탐험 도구">${STAGES.map(st=>`<button class="rack-item ${s.completed.includes(st.id)?'earned':''}" data-tool="${st.id}" aria-label="${st.reward} ${s.completed.includes(st.id)?'획득':'미획득'}"><img src="/assets/${TOOL_ASSETS[st.tool]}.webp" alt=""><span>${s.completed.includes(st.id)?'✓':'?'}</span></button>`).join('')}</div>${isAdmin()?'<button class="secondary" id="preview-nav">전체 화면</button>':''}</footer>
  </main>`,'atlas');
  $('.brand').innerHTML='<img class="brand-logo" src="/assets/title-logo.webp" alt="움직이는 지오밸리">';
  function missionCard(index){
    const st=STAGES[index],done=s.completed.includes(st.id);
    modal(done?'다시 발견하러 갈까?':`${index+1}. ${st.name}`,
      `<div class="mission-preview"><img class="mission-scene" src="/assets/${['river-field','volcano-field','rocks-lab','city-calm','classroom'][index]}.webp" alt="${st.place}"><img class="mission-river" src="/assets/hero-lens.webp" alt="리버"></div><p>${st.intro}</p><div class="mission-reward"><img src="/assets/${TOOL_ASSETS[st.tool]}.webp" alt=""><div><b>${done?'가방에 모은 도구':'이번 탐험의 보상'} · ${st.reward}</b><span>${st.benefit}</span></div></div><button class="primary" id="mission-enter">${done?'다시 탐험':'리버와 들어가기'} ${icon('arrow')}</button>`,(dialog,close)=>{
        $('#mission-enter',dialog).onclick=()=>{s.started=true;save();close();enter(index);};
      });
  }
  function arrive(){moving=false;$('#travel-skip').hidden=true;s.mapNode=current;save();routeArt?.clear();hero?.setAngle(0);if(destination!==null){const target=destination;destination=null;if(target==='core')navigate('final');else missionCard(target);}}
  function go(node,target){
    if(closed||moving)return;
    if(!mapScene){pendingTravel={node,target};return;}
    queue=findRoute(current,node);destination=target;moving=queue.length>0;$('#travel-skip').hidden=!moving;
    if(reduced&&queue.length){current=node;hero.setPosition(POINTS[node].x,POINTS[node].y);queue=[];arrive();return;}
    if(!moving)arrive();
  }
  $$('[data-stage]').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.stage);if(!canEnter(i,s,isAdmin())){toast(`먼저 ${STAGES[i-1].place}의 발견을 마치자.`);return;}if(welcome){s.started=true;save();$('.welcome-scroll')?.remove();}$('#map-speech').textContent=STAGES[i].intro;go(DOORS[i],i);});
  $('#atlas-core').onclick=()=>{if(!all&&!isAdmin()){toast('다섯 장소에서 도구를 모으면 기록탑을 연결할 수 있어.');return;}go(28,'core');};
  $('#travel-skip').onclick=()=>{if(!moving)return;current=queue.at(-1)??current;hero.setPosition(POINTS[current].x,POINTS[current].y);queue=[];arrive();};
  $('#start')?.addEventListener('click',()=>{s.started=true;save();navigate('map');});
  $$('[data-tool]').forEach(button=>button.onclick=()=>{const i=STAGES.findIndex(st=>st.id===button.dataset.tool),st=STAGES[i];if(s.completed.includes(st.id))modal(st.reward,`<img class="tool-detail-image" src="/assets/${TOOL_ASSETS[st.tool]}.webp" alt="${st.reward}"><p>${st.benefit}</p><p>${s.records[st.id]?.summary||'이 장소의 관찰 기록을 가방에 모았어.'}</p>`);else toast(`${st.place}에서 ${st.reward}를 얻을 수 있어.`);});
  class Atlas extends window.Phaser.Scene{
    constructor(){super('Atlas');}
    preload(){this.load.image('atlas','/assets/map-adventure.webp');this.load.image('river','/assets/hero-lens.webp');}
    create(){
      if(closed)return;
      mapScene=this;this.add.image(600,337.5,'atlas').setDisplaySize(1200,675);
      const paths=this.add.graphics();
      for(let i=0;i<5;i++)if(s.completed.includes(STAGES[i].id)){const route=[i?DOORS[i-1]:0,...findRoute(i?DOORS[i-1]:0,DOORS[i])];paths.lineStyle(7,0xffe78a,.68).beginPath();route.forEach((n,j)=>j?paths.lineTo(POINTS[n].x,POINTS[n].y):paths.moveTo(POINTS[n].x,POINTS[n].y));paths.strokePath();const p=POINTS[DOORS[i]];this.add.circle(p.x,p.y-20,17,0xffe69a,.45);this.add.circle(p.x,p.y-20,8,0xfff0ae);}
      routeArt=this.add.graphics();const p=POINTS[current];hero=this.add.image(p.x,p.y,'river').setOrigin(.5,.94).setDisplaySize(50,69).setDepth(10);
      this.input.on('pointerdown',pointer=>{if(welcome&&!s.started||moving||document.querySelector('dialog[open]'))return;const nearest=POINTS.reduce((best,p,i)=>Math.hypot(pointer.x-p.x,pointer.y-p.y)<Math.hypot(pointer.x-POINTS[best].x,pointer.y-POINTS[best].y)?i:best,0);const stage=DOORS.indexOf(nearest);if(stage>=0&&!canEnter(stage,s,isAdmin()))return;go(nearest,stage>=0?stage:null);});
      if(pendingTravel){const {node,target}=pendingTravel;pendingTravel=null;go(node,target);}
    }
    update(time,delta){
      if(!moving||!queue.length||document.querySelector('dialog[open]')||document.hidden)return;
      const target=POINTS[queue[0]],dx=target.x-hero.x,dy=target.y-hero.y,distance=Math.hypot(dx,dy),speed=210*Math.min(delta,40)/1000;
      routeArt.clear().lineStyle(4,0xfff4b0,.85).beginPath().moveTo(hero.x,hero.y);for(const node of queue)routeArt.lineTo(POINTS[node].x,POINTS[node].y);routeArt.strokePath();
      if(distance<=speed){current=queue.shift();hero.setPosition(target.x,target.y);if(!queue.length)arrive();}else{hero.x+=dx/distance*speed;hero.y+=dy/distance*speed;hero.setFlipX(dx<0);hero.angle=Math.sin(time/100)*2;}
    }
  }
  game=new window.Phaser.Game({type:window.Phaser.AUTO,parent:'atlas-canvas',width:1200,height:675,backgroundColor:'#56afbb',scale:{mode:window.Phaser.Scale.FIT,autoCenter:window.Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},scene:Atlas,callbacks:{postBoot(g){g.canvas.setAttribute('role','img');g.canvas.setAttribute('aria-label','리버가 연결된 길을 따라 걷는 지오밸리 지도');}}});
  const key=e=>{if(moving||e.target.closest('button,input,dialog')||document.querySelector('dialog[open]'))return;const v={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key];if(!v)return;e.preventDefault();const neighbors=LINKS.flatMap(([a,b])=>a===current?[b]:b===current?[a]:[]);const score=n=>{const p=POINTS[n],a=POINTS[current];return((p.x-a.x)*v[0]+(p.y-a.y)*v[1])/Math.hypot(p.x-a.x,p.y-a.y);};neighbors.sort((a,b)=>score(b)-score(a));if(score(neighbors[0])>0)go(neighbors[0],null);};
  window.addEventListener('keydown',key);
  if(isAdmin())$('#preview-nav').onclick=()=>modal('관리자 · 모든 활동 살펴보기',`<div class="preview-links">${STAGES.map((st,i)=>`<strong>${st.place}</strong>${st.steps.map((name,j)=>`<button class="secondary" data-preview="${i},${j}">${name}</button>`).join('')}`).join('')}<button class="primary" data-final="assembly">마지막 도전</button><button class="secondary" data-final="ending">엔딩</button><button class="secondary" data-final="certificate">인증서</button></div>`,(dialog,close)=>{$$('[data-preview]',dialog).forEach(button=>button.onclick=()=>{const [index,step]=button.dataset.preview.split(',').map(Number);close();enter(index,step);});$$('[data-final]',dialog).forEach(button=>button.onclick=()=>{close();navigate('final',button.dataset.final);});});
  return()=>{closed=true;game.destroy(true);window.removeEventListener('keydown',key);};
}
