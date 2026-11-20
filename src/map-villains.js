import {dockMapAttack} from './map-attack-control.js';
import {openMapFinale} from './map-finale.js';
import {syncMapHitLayout} from './map-hit-layout.js';
import {MAP_VILLAINS,VILLAIN_HITS,defeatedVillains} from './map-villain-rules.js';
import {createCombat,stepCombat,attackCombat,COMBAT,villainCellSize,riverCombatFrame} from './map-combat-engine.js';
import {playSound,playCue,playVoice,voiceBusy,voiceWaiting,reactionBusy,cueBusy} from './sound.js';
// Villain lines (ElevenLabs Harry, docs/VOICE-FILL-20261118.json) wait until River's line ends so two voices never overlap.
// Once started they are marked as a reaction, so River's next map line waits for them instead of cutting them (sound.js playVoiceAfterReaction).
// The exit line of a defeated villain comes first (River's summary follows the card), so it only replaces the villain's own unfinished line.
let villainVoiceTimer=0;
// The bubble of the line being spoken: while its voice plays the bubble is up (again), until the voice ends (+0.2 s), 6 s at most.
// The voice often starts after River's line, when the bubble's own 1.8-2.3 s are over. With the voice off the bubble keeps its usual time.
// settled: the line has started, or it never will (voice off, dialog open, waited too long).
let spoken={el:null,kind:'',at:0,until:0,settled:true};
function villainVoice(file,el,kind,exit=false){
 clearTimeout(villainVoiceTimer);const started=performance.now(),line=spoken={el,kind,at:0,until:0,settled:false};
 const tick=()=>{
  villainVoiceTimer=0;
  if(!el.isConnected||document.querySelector('dialog[open]')){line.settled=true;return;}
  if((!voiceBusy()||exit&&reactionBusy())&&!voiceWaiting()){playVoice(file,{reaction:true});line.at=performance.now();line.settled=true;return;}
  if(performance.now()-started<8000)villainVoiceTimer=setTimeout(tick,200);else line.settled=true;
 };
 // The hit sound itself starts a few frames after the hit, so an exit line waits 400 ms to come 0.3 s after it.
 villainVoiceTimer=setTimeout(tick,exit?400:350);
 return line;
}
// True once that line is over: it was spoken to the end, replaced by a later villain line, or will not be spoken at all.
const lineOver=line=>(line!==spoken||line.settled)&&!reactionBusy();
// A line still waiting for its turn when its card opens is dropped, so it never starts over the card.
function dropLine(line){if(line===spoken&&!line.settled){clearTimeout(villainVoiceTimer);villainVoiceTimer=0;line.settled=true;}}
function lineSpoken(el,kind,now){
 if(spoken.el!==el||spoken.kind!==kind||!spoken.at||now-spoken.at>=6000)return false;
 if(reactionBusy())spoken.until=now+200;
 return now<spoken.until;
}
import {holdRewardCard,showRewardCard} from './map-rewards.js';
// Villains already announced in this page session; re-entering the map stays quiet.
const announced=new Set();
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
 // Speech never rises into the top HUD bar (its centre has no buttons to avoid).
 const hud=host.ownerDocument.querySelector('.topbar'),minT=hud?Math.max(8,rect(hud.getBoundingClientRect()).b+8):8;
 for(const {el,anchor} of visible){
  const ew=el.offsetWidth,eh=el.offsetHeight;if(!ew||!eh)continue;
  const a=anchor?rect(anchor.getBoundingClientRect()):null,ea=rect(el.offsetParent?.getBoundingClientRect()??bounds);
  const x=a?(a.l+a.r)/2:w/2,top=a?a.t-18:12,bottom=a?a.b+18:20,gap=14;
  const preferred=a?[[x-ew/2,top-eh],[a.r+gap,top-eh/3],[a.l-gap-ew,top-eh/3],[x-ew/2,bottom]]:[[x-ew/2,minT],[x-ew/2,h-95-eh],[12,Math.max(85,minT)],[w-ew-12,Math.max(85,minT)]];
  const pts=preferred.slice();
  for(let y=minT;y<h-eh-6;y+=22)for(let i=0;i<=8;i++)pts.push([12+(w-ew-24)*i/8,y]);
  const fit=pts.map(([l,t])=>({l:clamp(l,8,w-ew-8),t:clamp(t,Math.min(minT,h-eh-8),h-eh-8)})).map(p=>({...p,r:p.l+ew,b:p.t+eh}));
  const overlap=p=>occupied.reduce((area,c)=>area+Math.max(0,Math.min(p.r,c.r)-Math.max(p.l,c.l))*Math.max(0,Math.min(p.b,c.b)-Math.max(p.t,c.t)),0);
  let best=fit[0],score=Infinity;
  for(const p of fit){const s=overlap(p)*1000+Math.hypot(p.l-preferred[0][0],p.t-preferred[0][1]);if(s<score){best=p;score=s;}if(s===0)break;}
  occupied.push(best);
  const left=`${Math.round((best.l-ea.l)*10)/10}px`,y=`${Math.round((best.t-ea.t)*10)/10}px`;
  if(el.style.left!==left)el.style.left=left;if(el.style.top!==y)el.style.top=y;
  if(el.style.bottom!=='auto')el.style.bottom='auto';if(el.style.transform!=='none')el.style.transform='none';
 }
}

export function mountMapVillains({world,page,hand,state,save,reveal,go,getHero,heroPose,stopTravel,paused,say,reduced,clearStage,eligible=MAP_VILLAINS.map(v=>v.id)}){
 const game=createCombat(state.mapVillains,performance.now(),{visualOnly:true});
 const roster=MAP_VILLAINS.filter(v=>eligible.includes(v.id));
 game.enemies=game.enemies.filter(e=>eligible.includes(e.id));
 const cleared=()=>roster.every(v=>game.progress.hits[v.id]===VILLAIN_HITS);
 const layer=document.createElement('div');layer.className='map-villains';world.append(layer);
 const hud=document.createElement('section');hud.className='map-combat-hud';hud.setAttribute('aria-label','리버의 지도 모험');
 hud.innerHTML='<p class="combat-guide" id="combat-guide">다가가서 <b>3번 공격!</b><small>악당 누르기 · 공격 버튼 · J / Space</small></p><button type="button" id="map-attack" aria-label="주변 돌먼지 대장 공격, J 또는 Space" aria-keyshortcuts="J Space" aria-describedby="combat-guide" hidden></button>';
 page.append(hud);
 const callback=document.createElement('p');callback.className='map-encounter-clear';callback.hidden=true;callback.setAttribute('role','status');page.append(callback);
 let clearReady=null,clearPlayed=false,lastSpeechLayout=-Infinity,finaleAt=0,finaleReady=0,cardJingle=false,finaleSay='';
 // Achievement cards waiting for their villain's exit (map-rewards.js). While a card or the card album is open #app is inert and the map holds still.
 const cardsDue=[],cardOpen=()=>!!page.closest('[inert]');
 const clearLine=roster.find(v=>v.id===clearStage);
 const actor=document.createElement('div');actor.className='map-combat-river';actor.hidden=true;actor.setAttribute('aria-hidden','true');layer.append(actor);
 const wave=document.createElement('div');wave.className='combat-wave';wave.setAttribute('aria-hidden','true');layer.append(wave);
 const attack=hud.querySelector('#map-attack'),foes=new Map();
 const residentNodes=Array.from(world.querySelectorAll('.map-resident'));
 let selectedEnemy=null;
 attack.hidden=true;
 const syncDock=dockMapAttack(attack,()=>hand);
 syncDock();
 let closed=false,raf=0,last=0,lastPaint=0,lastPose=-1,flashUntil=0,lastNear=null;
 const cueStops=[],cue=(name,delay)=>{cueStops.push(playCue(name,delay));if(cueStops.length>8)cueStops.shift();};
 // One soft arrival sound once the map has settled, only for villains not heard yet.
 const arrivals=roster.filter(v=>game.progress.hits[v.id]<VILLAIN_HITS&&!announced.has(v.id));
 let appearAt=arrivals.length?performance.now()+700:0;
 // River's summary of the last defeat is spoken once the finale dialog has closed (map-finale.js announces it).
 const finaleClosed=event=>{if(event.detail?.open||closed||!finaleSay)return;const text=finaleSay;finaleSay='';say(text);};document.addEventListener('map-finale',finaleClosed);
 const visibility=()=>{if(!document.hidden)game.invulnerableUntil=Math.max(game.invulnerableUntil,performance.now()+1000);};document.addEventListener('visibilitychange',visibility);
 function setFrame(el,frame,cols=3,rows=2){el.style.backgroundPosition=`${(frame%cols)/(cols-1)*100}% ${Math.floor(frame/cols)/(rows-1||1)*100}%`;}
 function commit(){state.mapVillains=game.progress;save();renderHud();}
 function renderHud(){
  const n=defeatedVillains(game.progress);
  attack.disabled=cleared();page.classList.toggle('combat-cleared',n===MAP_VILLAINS.length);
 }
 const available=()=>!closed&&!document.hidden&&!document.querySelector('dialog[open]')&&!paused()&&!page.classList.contains('map-overview')&&!cardOpen();
 const inRange=enemy=>{const h=getHero();return !!h&&Math.hypot(enemy.x-h.x,enemy.y-h.y)<=COMBAT.attackRange;};
 for(const v of roster){
  const el=document.createElement('button');el.type='button';el.className='map-villain';el.dataset.villain=v.id;el.setAttribute('aria-label',v.name+' 가까이 가기');
  el.innerHTML='<span class="villain-shadow"></span><span class="villain-art" aria-hidden="true"></span><span class="villain-hp" aria-hidden="true"></span><span class="villain-impact" aria-hidden="true"></span><span class="villain-result" aria-hidden="true"></span><span class="villain-target" aria-hidden="true">공격!</span><span class="villain-prop" aria-hidden="true"></span><span class="villain-line" aria-hidden="true" hidden></span>';
  el.style.setProperty('--villain-effect',v.tint);el.querySelector('.villain-prop').textContent=v.cue;
  layer.append(el);foes.set(v.id,el);
  el.onclick=e=>{e.stopPropagation();if(!available())return;const enemy=game.enemies.find(e=>e.id===v.id);selectedEnemy=enemy;if(inRange(enemy)){strike(v.id);return;}go(enemy.x,enemy.y);say('돌먼지 대장에게 다가가고 있어. 초록 표시가 뜨면 악당을 다시 누르거나 공격! 3번 맞히면 물리칠 수 있어.');};
  el.onfocus=()=>{if(el.matches(':focus-visible')){const enemy=game.enemies.find(e=>e.id===v.id);reveal(enemy.x/1200,enemy.y/675);}};
 }
 // Keep combat away from residents' map positions. Moving a label around a HUD
 // control must not move an enemy out of reach.
 let clearZones=[],worldSize='';
 function updateClearZones(){
  const bounds=world.getBoundingClientRect();
  const cell=villainCellSize(world.clientWidth/1200);
  const size=`${world.clientWidth}x${world.clientHeight}`;
  if(size===worldSize||!bounds.width||!bounds.height)return;
  worldSize=size;
  actor.style.width=actor.style.height=(90/(173/256))*world.clientWidth/1200+'px';
  layer.style.setProperty('--foe-cell',cell+'px');wave.style.width=COMBAT.attackRange*2*world.clientWidth/1200+'px';wave.style.height=COMBAT.attackRange*world.clientWidth/1200+'px';
  const sx=1200/bounds.width,sy=675/bounds.height;
  const padX=(cell/2+8)*sx,padY=(cell+8)*sy;
  clearZones=residentNodes.map(resident=>{
   const r=resident.querySelector('img').getBoundingClientRect();
   const x=parseFloat(resident.style.left)*12,y=parseFloat(resident.style.top)*6.75;
   return {left:x-r.width*sx/2-padX,right:x+r.width*sx/2+padX,
    top:y-r.height*sy,bottom:y+padY};
  });
  for(const enemy of game.enemies)if(game.progress.hits[enemy.id]<VILLAIN_HITS){Object.assign(enemy,clearPoint(enemy));
   const el=foes.get(enemy.id);el.style.left=enemy.x/12+'%';el.style.top=enemy.y/6.75+'%';}
 }
 function clearPoint(point){
  let {x,y}=point;
  for(let i=0;i<clearZones.length;i++){
   const zone=clearZones.find(z=>x>z.left&&x<z.right&&y>z.top&&y<z.bottom);
   if(!zone)break;
   const opts=[[x,zone.top],[zone.right,y],[x,zone.bottom],[zone.left,y]];
   const open=opts.filter(([px,py])=>!clearZones.some(z=>px>z.left&&px<z.right&&py>z.top&&py<z.bottom));
   const candidates=open.length?open:opts;
   [x,y]=candidates.reduce((best,choice)=>Math.hypot(choice[0]-x,choice[1]-y)<Math.hypot(best[0]-x,best[1]-y)?choice:best);
  }
  return {x,y};
 }
 const spriteResize=new ResizeObserver(updateClearZones);spriteResize.observe(world);updateClearZones();
 function strike(targetId=null){
  if(!available()||cleared()||!game.enemies.some(enemy=>game.progress.hits[enemy.id]<VILLAIN_HITS&&(!targetId||enemy.id===targetId)&&inRange(enemy)))return;
  if(!targetId&&selectedEnemy&&game.progress.hits[selectedEnemy.id]<VILLAIN_HITS&&inRange(selectedEnemy))targetId=selectedEnemy.id;
  const now=performance.now(),hero=getHero(),event=attackCombat(game,hero,now,targetId,{reduced,clear:clearPoint});if(!event)return;
  // Sound follows the accepted attack only, so cooldown, key repeat and touch+key share one hit.
  cue('attack-swing');
  stopTravel();reveal(hero.x/1200,hero.y/675);wave.style.left=hero.x/12+'%';wave.style.top=hero.y/6.75+'%';wave.classList.remove('strike');void wave.offsetWidth;wave.classList.add('strike');flashUntil=now+(reduced?150:430);
  if(event.type==='miss'){say('아직 멀어! 악당을 눌러 가까이 가면 초록색 공격 표시가 떠.');playSound('retry');}
  else{
   commit();const el=foes.get(event.id);el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');el.dataset.flashUntil=String(now+430);el.querySelector('.villain-result').textContent=event.type==='defeat'?'퇴치!':`${VILLAIN_HITS-event.remaining} / ${VILLAIN_HITS} 명중`;
   const v=roster.find(v=>v.id===event.id);const line=el.querySelector('.villain-line');
   line.textContent=event.type==='defeat'?v.finish:v.hit[VILLAIN_HITS-event.remaining-1];
   const exitLine=villainVoice(`villain/${v.id}-${event.type==='defeat'?'finish':'hit'+(VILLAIN_HITS-event.remaining-1)}.mp3`,el,'hit',event.type==='defeat');
   lastSpeechLayout=-Infinity;
   el.dataset.lineUntil=String(now+(event.type==='defeat'?2200:1800));
   callback.hidden=true;
   if(event.type==='defeat'){
    // After a defeat: hit and exit sounds -> the villain's exit line -> its card once that line is over. River's contact line can come
    // first and push the exit line back (AUDIO-FIX3-BRIEF-20261120): the line may wait up to 8 s after the hit to start; one that has
    // started by then is heard to its end (4 s more at most), one that has not is dropped when the card opens.
    // -> River's summary, words and voice together, once the card is put away. Until then River's last hit line is cleared.
    // The last villain's summary waits for the finale dialog to close: the dialog says the same thing, and "you can keep exploring" belongs to the moment back on the map.
    const all=defeatedVillains(game.progress)===MAP_VILLAINS.length,summary=all?'5마리 모두 퇴치! 리버가 지오밸리의 길을 지켰어. 탐구 활동은 계속할 수 있어.':'돌먼지 대장 퇴치! '+defeatedVillains(game.progress)+' / 5마리. 지도를 둘러보며 남은 악당을 찾아봐.';
    if(all){finaleAt=now+2350;finaleSay=summary;}
    if(document.activeElement===el)attack.focus({preventScroll:true});
    say('');cue('hit-heavy');cue('villain-exit',reduced?120:260);
    cardsDue.push({id:event.id,at:now+(reduced?520:760),cap:now+8000,line:exitLine,summary:all?'':summary});holdRewardCard(event.id);
   }
   else{say(event.remaining===2?'앗, 바위에 금이 갔어! 두 번 남았어.':'자갈이 튀었어! 한 번 남았어.');cue(event.remaining===2?'hit-light':'hit-light-2');}
  }
  paint(now);
 }
 attack.onclick=()=>strike();
 const key=e=>{
  const t=e.target;if(e.defaultPrevented||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||t?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  const space=e.code==='Space'||e.key===' ';
  // Space on a native button stays that button's activation, never a second attack.
  if(space&&t!==attack&&t?.closest?.('button,a,summary,[role="button"]'))return;
  if(e.code==='KeyJ'||e.key?.toLowerCase()==='j'||space){if(!available()||!game.enemies.some(enemy=>game.progress.hits[enemy.id]<VILLAIN_HITS&&inRange(enemy)))return;e.preventDefault();if(!e.repeat)strike();}
 };window.addEventListener('keydown',key);
 function paint(now){
  // The card opens before canTalk is read below, so the finale waits until the card is closed.
  const due=cardsDue[0];
  if(due&&now>=due.at&&(lineOver(due.line)||now>=due.cap&&!(due.line===spoken&&due.line.at&&reactionBusy()&&now<due.cap+4000))&&!cardOpen()&&!document.querySelector('dialog[open]')){
   cardsDue.shift();if(!due.line.at)dropLine(due.line);const box=foes.get(due.id).getBoundingClientRect(),after=()=>{if(!closed&&due.summary)say(due.summary);};
   try{showRewardCard(due.id,game.progress,box.width?{x:box.left+box.width/2,y:box.top+box.height/2}:undefined,name=>{if(name==='card-complete')cardJingle=true;cue(name);}).then(after,after);}catch{after();}
  }
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
   const el=foes.get(enemy.id),remaining=VILLAIN_HITS-game.progress.hits[enemy.id],speaking=now<Number(el.dataset.lineUntil||0)||lineSpoken(el,'hit',now),gone=!remaining&&!speaking&&(enemy.deadAt===-Infinity||now-enemy.deadAt>(reduced?120:550)),near=remaining>0&&inRange(enemy);
   if(near)nearby++;el.hidden=gone;el.disabled=!remaining;el.classList.toggle('villain-departed',!remaining&&now-enemy.deadAt>(reduced?120:550));el.dataset.remaining=String(remaining);el.dataset.frame=String(enemy.frame);el.style.left=enemy.x/12+'%';el.style.top=enemy.y/6.75+'%';el.style.zIndex=String(Math.round(enemy.y));el.style.setProperty('--facing',enemy.facing||1);
   setFrame(el.querySelector('.villain-art'),reduced&&enemy.frame<3?0:enemy.frame);el.querySelector('.villain-hp').textContent='●'.repeat(remaining)+'○'.repeat(VILLAIN_HITS-remaining);
   const line=el.querySelector('.villain-line');
   if(!speaking&&enemy===nearest&&!enemy.wasNear){line.textContent=enemy.lines[(enemy.lineCount??0)%enemy.lines.length];villainVoice(`villain/${enemy.id}-line${(enemy.lineCount??0)%enemy.lines.length}.mp3`,el,'near');enemy.lineCount=(enemy.lineCount??0)+1;enemy.lineUntil=now+2300;}
   enemy.wasNear=enemy===nearest;line.hidden=!(speaking||enemy.wasNear&&(now<=(enemy.lineUntil??0)||lineSpoken(el,'near',now))&&!el.classList.contains('hit'))||!canTalk;
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
  // Celebration order: the fifth card's complete jingle is the "all defeated" sound; the victory jingle only stands in when no card jingle played.
  // The finale dialog and its final theme open after that jingle and any line still being spoken have ended (4 s at most). Nothing is cut.
  if(finaleAt&&now>=finaleAt&&canTalk&&!cardsDue.length){
   if(!finaleReady){finaleReady=now;if(!cardJingle)cue('victory-jingle');}
   if(now-finaleReady>4000||!(cueBusy('card-complete')||cueBusy('victory-jingle')||voiceBusy()||voiceWaiting())){finaleAt=0;openMapFinale(page,"/assets/story/final.mp4");if(!document.querySelector('.map-finale-dialog'))finaleClosed({detail:{open:false}});}
  }
  const n=defeatedVillains(game.progress),guideKey=n===5?'clear':nearby?'near':'far';
  if(lastNear!==guideKey){lastNear=guideKey;hud.querySelector('.combat-guide').innerHTML=guideKey==='clear'?'<b>5마리 모두 퇴치!</b><small>관찰 기록을 계속 모아 보자</small>':guideKey==='near'?'<b>지금 공격할 수 있어!</b><small>악당 누르기 · 공격 버튼 · J / Space</small>':'다가가서 <b>3번 공격!</b><small>악당 누르기 · 공격 버튼 · J / Space</small>';}
  const ready=now-game.attackAt>=COMBAT.attackCooldown;attack.dataset.ready=String(ready);attack.dataset.inRange=String(nearby>0);attack.setAttribute('aria-disabled',String(attack.disabled||!ready));
  const hasFocus=document.activeElement===attack;
  attack.hidden=!(syncDock()&&canTalk&&nearby);
  hud.hidden=attack.hidden;
  if(attack.hidden&&hasFocus&&canTalk)hand.focus({preventScroll:true});
  syncMapHitLayout(page,world);updateClearZones();
  if(now-lastSpeechLayout>=110){lastSpeechLayout=now;layoutSpeech(page,[{el:callback},...Array.from(foes.values(),anchor=>({el:anchor.querySelector('.villain-line'),anchor}))]);}
 }
 function tick(now){
  if(closed)return;raf=requestAnimationFrame(tick);if(now-lastPaint<33)return;const dt=last?now-last:0;last=now;lastPaint=now;
  // Right after loading, before any press or key, the browser refuses sound: the arrival sound waits for that first input.
  if(appearAt&&now>=appearAt&&available()&&navigator.userActivation?.hasBeenActive!==false){appearAt=0;arrivals.forEach(v=>announced.add(v.id));cue('villain-appear');}
  if(available())for(const e of stepCombat(game,getHero(),dt,now,{reduced,clear:clearPoint})){cue('hurt-bump');say('돌먼지가 톡 닿았어. 떨어져서 파동을 써 봐!');}
  paint(now);
 }
 renderHud();paint(performance.now());raf=requestAnimationFrame(tick);
 return {blocked:()=>false,destroy(){closed=true;cancelAnimationFrame(raf);cueStops.forEach(stop=>stop());cardsDue.forEach(({id})=>holdRewardCard(id,false));spriteResize.disconnect();callback.remove();window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('map-finale',finaleClosed);heroPose(-1);layer.remove();attack.remove();hud.remove();page.classList.remove('combat-cleared','combat-knockout');}};
}
