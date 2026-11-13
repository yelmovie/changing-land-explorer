import {openMapFinale} from './map-finale.js';
import {syncMapHitLayout} from './map-hit-layout.js';
import {MAP_VILLAINS,VILLAIN_HITS,defeatedVillains} from './map-villain-rules.js';
import {createCombat,stepCombat,attackCombat,COMBAT,villainCellSize,riverCombatFrame} from './map-combat-engine.js';
import {playSound} from './sound.js';
// Place speech in map space without covering interactive signs, icons or other speech.
function layoutSpeech(host, entries){
 const visible=entries.filter(({el})=>!el.hidden&&el.closest('[hidden]')===null);
 if(!visible.length)return;
 const bounds=host.getBoundingClientRect(),w=host.clientWidth,h=host.clientHeight;
 if(w<80||h<100||!bounds.width||!bounds.height)return;
 const sx=bounds.width/w,sy=bounds.height/h;
 const rect=r=>({l:(r.left-bounds.left)/sx,t:(r.top-bounds.top)/sy,r:(r.right-bounds.left)/sx,b:(r.bottom-bounds.top)/sy});
 const occupied=[];
 const selectors='button,a[href],.map-encounter-body,.map-encounter-prop,.map-encounter-meter,.villain-line,.village-sprite,.map-walker,.expedition-player,.expedition-companion,[data-map-resident],[data-hub-resident],.npc-bubble,.companion-bubble,[role="status"],.map-resident,.world-pin,.map-label,.map-node,.building-label,.map-encounter-reaction';
 for(const part of host.ownerDocument.querySelectorAll(selectors)){
  if(visible.some(({el})=>el===part||part.contains(el))||part.closest('[hidden],[aria-hidden="true"][inert]'))continue;
  const box=part.getBoundingClientRect();
  if(!box.width||!box.height||part.classList.contains('sr-only')||getComputedStyle(part).visibility==='hidden')continue;
  const b=rect(box);
  if(b.r<0||b.b<0||b.l>w||b.t>h||b.r-b.l>w*.98&&b.b-b.t>h*.75)continue;
  occupied.push({l:b.l-7,r:b.r+7,t:b.t-7,b:b.b+7});
 }
 const clamp=(x,min,max)=>Math.max(min,Math.min(x,max));
 for(const {el,anchor} of visible){
  const ew=el.offsetWidth,eh=el.offsetHeight;if(!ew||!eh)continue;
  const a=anchor?rect(anchor.getBoundingClientRect()):null,ea=rect(el.offsetParent?.getBoundingClientRect()??bounds);
  const x=a?(a.l+a.r)/2:w/2,top=a?a.t-18:12,bottom=a?a.b+18:20,gap=14;
  const preferred=a?[[x-ew/2,top-eh],[a.r+gap,top-eh/3],[a.l-gap-ew,top-eh/3],[x-ew/2,bottom]]:[[x-ew/2,12],[x-ew/2,h-95-eh],[12,85],[w-ew-12,85]];
  const pts=preferred.slice();
  for(let y=12;y<h-eh-6;y+=22)for(let i=0;i<=8;i++)pts.push([12+(w-ew-24)*i/8,y]);
  const fit=pts.map(([l,t])=>({l:clamp(l,8,w-ew-8),t:clamp(t,8,h-eh-8)})).map(p=>({...p,r:p.l+ew,b:p.t+eh}));
  const overlap=p=>occupied.reduce((area,c)=>area+Math.max(0,Math.min(p.r,c.r)-Math.max(p.l,c.l))*Math.max(0,Math.min(p.b,c.b)-Math.max(p.t,c.t)),0);
  let best=fit[0],score=Infinity;
  for(const p of fit){const s=overlap(p)*1000+Math.hypot(p.l-preferred[0][0],p.t-preferred[0][1]);if(s<score){best=p;score=s;}if(s===0)break;}
  occupied.push(best);
  const left=`${Math.round((best.l-ea.l)*10)/10}px`,y=`${Math.round((best.t-ea.t)*10)/10}px`;
  if(el.style.left!==left)el.style.left=left;if(el.style.top!==y)el.style.top=y;
  if(el.style.bottom!=='auto')el.style.bottom='auto';if(el.style.transform!=='none')el.style.transform='none';
 }
}

export function mountMapVillains({world,page,tools,state,save,reveal,go,getHero,heroPose,stopTravel,paused,say,reduced,clearStage,eligible=MAP_VILLAINS.map(v=>v.id)}){
 const game=createCombat(state.mapVillains,performance.now(),{visualOnly:true});
 const roster=MAP_VILLAINS.filter(v=>eligible.includes(v.id));
 game.enemies=game.enemies.filter(e=>eligible.includes(e.id));
 const cleared=()=>roster.every(v=>game.progress.hits[v.id]===VILLAIN_HITS);
 const layer=document.createElement('div');layer.className='map-villains';world.append(layer);
 const meter=document.createElement('button');meter.id='map-villain-focus';meter.type='button';meter.innerHTML='<span class="combat-mini" aria-hidden="true"></span>';tools.append(meter);
 const hud=document.createElement('section');hud.className='map-combat-hud';hud.setAttribute('aria-label','리버의 지도 모험');
 hud.innerHTML='<p class="combat-guide" id="combat-guide">다가가서 <b>3번 공격!</b><small>악당 누르기 · 공격 버튼 · J / Space</small></p><button type="button" id="map-attack" aria-label="주변 돌먼지 대장 공격, J 또는 Space" aria-keyshortcuts="J Space" aria-describedby="combat-guide"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13 2-8 12h6l-1 8 9-12h-6z"/></svg>공격 <small>J / Space</small></button>';
 page.append(hud);
 const callback=document.createElement('p');callback.className='map-encounter-clear';callback.hidden=true;callback.setAttribute('role','status');page.append(callback);
 let clearReady=null,clearPlayed=false,lastSpeechLayout=-Infinity,finaleAt=0;
 const clearLine=roster.find(v=>v.id===clearStage);
 const actor=document.createElement('div');actor.className='map-combat-river';actor.hidden=true;actor.setAttribute('aria-hidden','true');layer.append(actor);
 const wave=document.createElement('div');wave.className='combat-wave';wave.setAttribute('aria-hidden','true');layer.append(wave);
 const sizeSprites=()=>{const scale=world.clientWidth/1200;actor.style.width=actor.style.height=(90/(173/256))*scale+'px';layer.style.setProperty('--foe-cell',villainCellSize(scale)+'px');wave.style.width=COMBAT.attackRange*2*scale+'px';wave.style.height=COMBAT.attackRange*scale+'px';};
 const spriteResize=new ResizeObserver(sizeSprites);spriteResize.observe(world);sizeSprites();
 const attack=hud.querySelector('#map-attack'),foes=new Map();
 let closed=false,raf=0,last=0,lastPaint=0,lastPose=-1,flashUntil=0,lastNear=null;
 const visibility=()=>{if(!document.hidden)game.invulnerableUntil=Math.max(game.invulnerableUntil,performance.now()+1000);};document.addEventListener('visibilitychange',visibility);
 function setFrame(el,frame,cols=3,rows=2){el.style.backgroundPosition=`${(frame%cols)/(cols-1)*100}% ${Math.floor(frame/cols)/(rows-1||1)*100}%`;}
 function commit(){state.mapVillains=game.progress;save();renderHud();}
 function renderHud(){
  const n=defeatedVillains(game.progress);
  meter.setAttribute('aria-label',n===5?'돌먼지 대장 다섯 마리 모두 물리침':'돌먼지 대장 찾기, '+n+'마리 물리침');meter.title='돌먼지 대장 찾기';
  attack.disabled=cleared();page.classList.toggle('combat-cleared',n===MAP_VILLAINS.length);
 }
 const available=()=>!closed&&!document.hidden&&!document.querySelector('dialog[open]')&&!paused()&&!page.classList.contains('map-overview');
 const inRange=enemy=>{const h=getHero();return !!h&&Math.hypot(enemy.x-h.x,enemy.y-h.y)<=COMBAT.attackRange;};
 for(const v of roster){
  const el=document.createElement('button');el.type='button';el.className='map-villain';el.dataset.villain=v.id;el.setAttribute('aria-label',v.name+' 가까이 가기');
  el.innerHTML='<span class="villain-shadow"></span><span class="villain-art" aria-hidden="true"></span><span class="villain-hp" aria-hidden="true"></span><span class="villain-impact" aria-hidden="true"></span><span class="villain-result" aria-hidden="true"></span><span class="villain-target" aria-hidden="true">공격!</span><span class="villain-prop" aria-hidden="true"></span><span class="villain-line" aria-hidden="true" hidden></span>';
  el.style.setProperty('--villain-effect',v.tint);el.querySelector('.villain-prop').textContent=v.cue;
  layer.append(el);foes.set(v.id,el);
  el.onclick=e=>{e.stopPropagation();if(!available())return;const enemy=game.enemies.find(e=>e.id===v.id);if(inRange(enemy)){strike(v.id);return;}go(v.node);say('돌먼지 대장에게 다가가고 있어. 초록 표시가 뜨면 악당을 다시 누르거나 공격! 3번 맞히면 물리칠 수 있어.');};
  el.onfocus=()=>{if(el.matches(':focus-visible')){const enemy=game.enemies.find(e=>e.id===v.id);reveal(enemy.x/1200,enemy.y/675);}};
 }
 meter.onclick=()=>{if(!available())return;const next=game.enemies.find(e=>game.progress.hits[e.id]<VILLAIN_HITS);if(!next){say('열린 지도 도전을 모두 마쳤어. 다른 구역의 관찰을 이어 가 보자!');return;}reveal(next.x/1200,next.y/675);foes.get(next.id).focus({preventScroll:true});say('악당을 눌러 다가간 뒤, 가까이서 3번 공격! 악당 누르기·공격 버튼·J·Space를 쓸 수 있어. 실제 돌이나 화산과 싸우는 놀이는 아니야.');};
 function strike(targetId=null){
  if(!available()||cleared()||!game.enemies.some(enemy=>game.progress.hits[enemy.id]<VILLAIN_HITS&&(!targetId||enemy.id===targetId)&&inRange(enemy)))return;
  const now=performance.now(),hero=getHero(),event=attackCombat(game,hero,now,targetId);if(!event)return;
  stopTravel();reveal(hero.x/1200,hero.y/675);wave.style.left=hero.x/12+'%';wave.style.top=hero.y/6.75+'%';wave.classList.remove('strike');void wave.offsetWidth;wave.classList.add('strike');flashUntil=now+(reduced?150:430);
  if(event.type==='miss'){say('아직 멀어! 악당을 눌러 가까이 가면 초록색 공격 표시가 떠.');playSound('move');}
  else{
   commit();const el=foes.get(event.id);el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');el.dataset.flashUntil=String(now+430);el.querySelector('.villain-result').textContent=event.type==='defeat'?'퇴치!':`${VILLAIN_HITS-event.remaining} / ${VILLAIN_HITS} 명중`;
   const v=roster.find(v=>v.id===event.id);const line=el.querySelector('.villain-line');
   line.textContent=event.type==='defeat'?v.finish:v.hit[VILLAIN_HITS-event.remaining-1];
   lastSpeechLayout=-Infinity;
   el.dataset.lineUntil=String(now+(event.type==='defeat'?2200:1800));
   callback.hidden=true;
   if(event.type==='defeat'){if(defeatedVillains(game.progress)===MAP_VILLAINS.length)finaleAt=now+2350;if(document.activeElement===el)attack.focus({preventScroll:true});say(defeatedVillains(game.progress)===MAP_VILLAINS.length?'5마리 모두 퇴치! 리버가 지오밸리의 길을 지켰어. 탐구 활동은 계속할 수 있어.':'돌먼지 대장 퇴치! '+defeatedVillains(game.progress)+' / 5마리. 위쪽 악당 찾기로 다음 친구를 찾아봐.');playSound('complete');}
   else{say(event.remaining===2?'앗, 바위에 금이 갔어! 두 번 남았어.':'자갈이 튀었어! 한 번 남았어.');playSound(event.remaining===2?'stamp':'pickup');}
  }
  paint(now);
 }
 attack.onclick=()=>strike();
 const key=e=>{
  const t=e.target;if(e.defaultPrevented||e.repeat||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||t?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  const space=e.code==='Space'||e.key===' ';
  // Space on a native button stays that button's activation, never a second attack.
  if(space&&t?.closest?.('button,a,[role="button"]'))return;
  if(e.code==='KeyJ'||e.key?.toLowerCase()==='j'||space){if(!available()||!game.enemies.some(enemy=>game.progress.hits[enemy.id]<VILLAIN_HITS&&inRange(enemy)))return;e.preventDefault();strike();}
 };window.addEventListener('keydown',key);
 function paint(now){
  const h=getHero();if(h){actor.style.left=h.x/12+'%';actor.style.top=h.y/6.75+'%';}
  actor.style.setProperty('--facing',game.heroFacing||1);
  const celebrating=now>=game.celebrateAt&&now<game.celebrateUntil;
  const pose=now<game.heroPoseUntil?game.heroPose:celebrating?3:-1;
  if(pose!==lastPose){lastPose=pose;heroPose(pose);actor.hidden=pose<0;}
  const elapsed=pose===1?now-game.attackAt:pose===3?now-(celebrating?game.celebrateAt:game.heroPoseUntil-550):now-(game.heroPoseUntil-600);
  if(pose>=0){const frame=riverCombatFrame(pose,elapsed,reduced);setFrame(actor,frame,4,2);actor.dataset.frame=String(frame);}
  if(now>flashUntil)wave.classList.remove('strike');
  let nearby=0;const canTalk=available();const nearest=canTalk&&h?game.enemies.filter(e=>game.progress.hits[e.id]<VILLAIN_HITS&&inRange(e)).sort((a,b)=>Math.hypot(h.x-a.x,h.y-a.y)-Math.hypot(h.x-b.x,h.y-b.y))[0]:null;
  for(const enemy of game.enemies){
   const el=foes.get(enemy.id),remaining=VILLAIN_HITS-game.progress.hits[enemy.id],speaking=now<Number(el.dataset.lineUntil||0),gone=!remaining&&!speaking&&(enemy.deadAt===-Infinity||now-enemy.deadAt>(reduced?120:550)),near=remaining>0&&inRange(enemy);
   if(near)nearby++;el.hidden=gone;el.disabled=!remaining;el.classList.toggle('villain-departed',!remaining&&now-enemy.deadAt>(reduced?120:550));el.dataset.remaining=String(remaining);el.dataset.frame=String(enemy.frame);el.style.left=enemy.x/12+'%';el.style.top=enemy.y/6.75+'%';el.style.zIndex=String(Math.round(enemy.y));el.style.setProperty('--facing',enemy.facing||1);
   setFrame(el.querySelector('.villain-art'),reduced&&enemy.frame<3?0:enemy.frame);el.querySelector('.villain-hp').textContent='●'.repeat(remaining)+'○'.repeat(VILLAIN_HITS-remaining);
   const line=el.querySelector('.villain-line');
   if(!speaking&&enemy===nearest&&!enemy.wasNear){line.textContent=enemy.lines[(enemy.lineCount??0)%enemy.lines.length];enemy.lineCount=(enemy.lineCount??0)+1;enemy.lineUntil=now+2300;}
   enemy.wasNear=enemy===nearest;line.hidden=!(speaking||enemy.wasNear&&now<=(enemy.lineUntil??0)&&!el.classList.contains('hit'))||!canTalk;
   el.dataset.play=String(!reduced&&enemy.frame>0&&enemy.frame<4);
   el.classList.toggle('defeated',!remaining);el.classList.toggle('in-range',near&&canTalk);el.setAttribute('aria-label',enemy.name+(near?', 공격하기, '+remaining+'번 남음':', 가까이 가기'));
   if(now>Number(el.dataset.flashUntil||0))el.classList.remove('hit');
  }
  if(!canTalk||!h)clearReady=null;
  else if(clearLine&&!clearPlayed){
   clearReady??=now;
   if(now-clearReady>=1250){clearPlayed=true;callback.textContent=`돌먼지 대장 · “${clearLine.lines[0]}”`;callback.hidden=false;}
  }
  if(!canTalk&&clearPlayed){clearPlayed=false;callback.hidden=true;}
  if(clearPlayed&&now-clearReady>=5450)callback.hidden=true;
  if(finaleAt&&now>=finaleAt&&canTalk){finaleAt=0;openMapFinale(page,"/assets/story/final.mp4");}
  const n=defeatedVillains(game.progress),guideKey=n===5?'clear':nearby?'near':'far';
  if(lastNear!==guideKey){lastNear=guideKey;hud.querySelector('.combat-guide').innerHTML=guideKey==='clear'?'<b>5마리 모두 퇴치!</b><small>관찰 기록을 계속 모아 보자</small>':guideKey==='near'?'<b>지금 공격할 수 있어!</b><small>악당 누르기 · 공격 버튼 · J / Space</small>':'다가가서 <b>3번 공격!</b><small>악당 누르기 · 공격 버튼 · J / Space</small>';}
  const ready=now-game.attackAt>=COMBAT.attackCooldown;attack.dataset.ready=String(ready);attack.dataset.inRange=String(nearby>0);attack.setAttribute('aria-disabled',String(attack.disabled||!ready));
  hud.hidden=!canTalk||!nearby;
  syncMapHitLayout(page,world);
  if(now-lastSpeechLayout>=110){lastSpeechLayout=now;layoutSpeech(page,[{el:callback},...Array.from(foes.values(),anchor=>({el:anchor.querySelector('.villain-line'),anchor}))]);}
 }
 function tick(now){
  if(closed)return;raf=requestAnimationFrame(tick);if(now-lastPaint<33)return;const dt=last?now-last:0;last=now;lastPaint=now;
  if(available())for(const e of stepCombat(game,getHero(),dt,now)){playSound('move');say('돌먼지가 톡 닿았어. 떨어져서 파동을 써 봐!');}
  paint(now);
 }
 renderHud();paint(performance.now());raf=requestAnimationFrame(tick);
 return {blocked:()=>false,destroy(){closed=true;cancelAnimationFrame(raf);spriteResize.disconnect();callback.remove();window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);heroPose(-1);layer.remove();meter.remove();hud.remove();page.classList.remove('combat-cleared','combat-knockout');}};
}
