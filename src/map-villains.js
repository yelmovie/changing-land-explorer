import {MAP_VILLAINS,VILLAIN_HITS,HERO_HEALTH,defeatedVillains} from './map-villain-rules.js';
import {createCombat,stepCombat,attackCombat,restartCombat,COMBAT} from './map-combat-engine.js';
import {playSound} from './sound.js';
export function mountMapVillains({world,page,tools,state,save,reveal,go,getHero,heroPose,stopTravel,respawn,paused,say,reduced}){
 const game=createCombat(state.mapVillains,performance.now());state.mapVillains=game.progress;
 const layer=document.createElement('div');layer.className='map-villains';world.append(layer);
 const meter=document.createElement('button');meter.id='map-villain-focus';meter.type='button';meter.innerHTML='<span class="combat-mini" aria-hidden="true"></span><span></span>';tools.append(meter);
 const hud=document.createElement('section');hud.className='map-combat-hud';hud.setAttribute('aria-label','리버의 지도 모험');hud.innerHTML='<div class="combat-health" role="status" aria-live="polite"><span aria-hidden="true"></span><b></b></div><button type="button" id="map-attack" aria-label="주변 돌먼지 대장 공격, 키보드 J" aria-keyshortcuts="J"><span aria-hidden="true">✦</span>공격 <small>J</small></button><div class="combat-retry" hidden><strong>잠깐 쉬었다 가자!</strong><p>물리친 악당과 탐험 기록은 그대로야.</p><button type="button" id="map-combat-retry">다시 도전</button></div>';page.append(hud);
 const actor=document.createElement('div');actor.className='map-combat-river';actor.hidden=true;actor.setAttribute('aria-hidden','true');layer.append(actor);
 const wave=document.createElement('div');wave.className='combat-wave';wave.setAttribute('aria-hidden','true');layer.append(wave);
 const sizeSprites=()=>{const scale=world.clientWidth/1200;actor.style.width=actor.style.height=(90/(173/256))*scale+'px';layer.style.setProperty('--foe-cell',Math.max(64,Math.min(190,112*scale))+'px');wave.style.width=COMBAT.attackRange*2*scale+'px';wave.style.height=COMBAT.attackRange*scale+'px';};
 const spriteResize=new ResizeObserver(sizeSprites);spriteResize.observe(world);sizeSprites();
 const attack=hud.querySelector('#map-attack'),retry=hud.querySelector('#map-combat-retry'),foes=new Map();
 let closed=false,raf=0,last=0,lastPaint=0,lastPose=-1,flashUntil=0;
 const visibility=()=>{if(!document.hidden)game.invulnerableUntil=Math.max(game.invulnerableUntil,performance.now()+1000);};document.addEventListener('visibilitychange',visibility);
 function setFrame(el,frame,cols=3,rows=2){el.style.backgroundPosition=`${(frame%cols)/(cols-1)*100}% ${Math.floor(frame/cols)/(rows-1||1)*100}%`;}
 function commit(){state.mapVillains=game.progress;save();renderHud();}
 function renderHud(){const n=defeatedVillains(game.progress),hp=game.progress.health;meter.lastElementChild.textContent=n+'/5';meter.setAttribute('aria-label',n===5?'돌먼지 대장 다섯 마리 모두 물리침':'돌먼지 대장 찾기, '+n+'마리 물리침');hud.querySelector('.combat-health span').textContent='♥'.repeat(hp)+'♡'.repeat(HERO_HEALTH-hp);hud.querySelector('.combat-health b').textContent=hp+' / '+HERO_HEALTH;hud.querySelector('.combat-health').setAttribute('aria-label','리버 체력 '+hp+', 전체 '+HERO_HEALTH);hud.querySelector('.combat-retry').hidden=hp>0;attack.disabled=!hp;page.classList.toggle('combat-knockout',!hp);}
 const available=()=>!closed&&!document.hidden&&!document.querySelector('dialog[open]')&&!paused()&&!page.classList.contains('map-overview');
 for(const v of MAP_VILLAINS){
  const el=document.createElement('button');el.type='button';el.className='map-villain';el.dataset.villain=v.id;el.setAttribute('aria-label',v.name+' 가까이 가기');el.innerHTML='<span class="villain-shadow"></span><span class="villain-art" aria-hidden="true"></span><span class="villain-hp" aria-hidden="true"></span><span class="villain-impact" aria-hidden="true">✦</span>';layer.append(el);foes.set(v.id,el);
  el.onclick=e=>{e.stopPropagation();if(!available()||!game.progress.health)return;go(v.node);say('돌먼지 대장에게 다가가고 있어. 가까워지면 공격 버튼이나 J를 눌러! 부딪히면 하트가 줄어.');};
  el.onfocus=()=>{if(el.matches(':focus-visible'))reveal(v.x,v.y);};
 }
 meter.onclick=()=>{if(document.querySelector('dialog[open]'))return;const next=game.enemies.find(e=>game.progress.hits[e.id]<3);if(!next){say('상상 속 돌먼지 대장을 모두 물리쳤어! 이제 관찰 기록을 계속 모아 보자.');return;}reveal(next.x/1200,next.y/675);foes.get(next.id).focus({preventScroll:true});say('돌먼지 대장을 누르면 리버가 다가가. 가까이서 공격 버튼이나 J! 실제 돌이나 화산과 싸우는 놀이는 아니야.');};
 function strike(){
  if(!available())return;const now=performance.now(),hero=getHero(),event=attackCombat(game,hero,now);if(!event)return;
  reveal(hero.x/1200,hero.y/675);wave.style.left=hero.x/12+'%';wave.style.top=hero.y/6.75+'%';wave.classList.remove('strike');void wave.offsetWidth;wave.classList.add('strike');flashUntil=now+(reduced?150:430);
  if(event.type==='miss'){say('조금 더 가까이 가서 공격해 봐!');playSound('move');}
  else{commit();const el=foes.get(event.id);el.classList.add('hit');el.dataset.flashUntil=String(now+350);if(event.type==='defeat'){if(document.activeElement===el)attack.focus({preventScroll:true});say('돌먼지 대장을 물리쳤어! '+defeatedVillains(game.progress)+' / 5마리.');playSound('complete');}else{say('명중! '+event.remaining+'번 더 맞히면 물리쳐.');playSound('stamp');}}
 }
 attack.onclick=strike;
 const key=e=>{const t=e.target;if(e.defaultPrevented||e.repeat||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||t?.closest?.('input,textarea,select,[contenteditable="true"]'))return;if(e.code==='KeyJ'||e.key?.toLowerCase()==='j'){e.preventDefault();strike();}};window.addEventListener('keydown',key);
 retry.onclick=()=>{restartCombat(game,performance.now());respawn();commit();say('하트가 다시 채워졌어. 길을 눌러 이동하고, 가까운 돌먼지 대장을 공격해 봐!');attack.focus({preventScroll:true});};
 function paint(now){
  const h=getHero();if(h){actor.style.left=h.x/12+'%';actor.style.top=h.y/6.75+'%';}
  actor.style.setProperty('--facing',game.heroFacing||1);
  const pose=!game.progress.health?2:now<game.heroPoseUntil?game.heroPose:-1;
  if(pose!==lastPose){lastPose=pose;heroPose(pose);actor.hidden=pose<0;if(pose>=0)setFrame(actor,pose,4,1);}
  if(now>flashUntil)wave.classList.remove('strike');
  for(const enemy of game.enemies){const el=foes.get(enemy.id),remaining=VILLAIN_HITS-game.progress.hits[enemy.id],gone=!remaining&&(enemy.deadAt===-Infinity||now-enemy.deadAt>(reduced?120:550));el.hidden=gone;el.disabled=!remaining;el.dataset.remaining=String(remaining);el.dataset.frame=String(enemy.frame);el.style.left=enemy.x/12+'%';el.style.top=enemy.y/6.75+'%';el.style.zIndex=String(Math.round(enemy.y));el.style.setProperty('--facing',enemy.facing||1);setFrame(el.querySelector('.villain-art'),reduced&&enemy.frame<3?0:enemy.frame);el.querySelector('.villain-hp').textContent='●'.repeat(remaining);el.classList.toggle('defeated',!remaining);if(now>Number(el.dataset.flashUntil||0))el.classList.remove('hit');}
  attack.dataset.ready=String(now-game.attackAt>=COMBAT.attackCooldown);attack.setAttribute('aria-disabled',String(!game.progress.health||now-game.attackAt<COMBAT.attackCooldown));
 }
 function tick(now){if(closed)return;raf=requestAnimationFrame(tick);if(now-lastPaint<33)return;const dt=last?now-last:0;last=now;lastPaint=now;
  if(available()){for(const e of stepCombat(game,getHero(),dt,now)){commit();playSound('move');say(e.type==='knockout'?'하트가 다 줄었어. 다시 도전하면 시작 길에서 계속할 수 있어.':'앗, 부딪혔어! 하트 '+e.health+'개. 잠깐 무적이니 떨어져서 공격해 봐.');if(e.type==='knockout'){stopTravel();retry.focus({preventScroll:true});}}}paint(now);
 }
 renderHud();paint(performance.now());raf=requestAnimationFrame(tick);
 return {blocked:()=>game.progress.health===0,destroy(){closed=true;cancelAnimationFrame(raf);spriteResize.disconnect();window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);heroPose(-1);layer.remove();meter.remove();hud.remove();}};
}
