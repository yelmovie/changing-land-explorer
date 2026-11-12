import {scoreFilm} from './music.js';
import {icon} from './ui.js';
import {voiceVolume} from './sound.js';

const films={
 intro:{title:'강가에 남은 단서',chapter:'탐험의 시작',theme:'main',next:'물길 탐험 시작',duration:17.252,cues:[
  [0.1,2.31,'앗, 기록탑에 무슨 일이지?'],
  [2.33,5.78,'수첩에 있던 강가의 기록이 흐려졌어.'],
  [5.82,9.22,'여기 쌓인 모래는 어디서 왔을까?'],
  [9.24,12.12,'물을 흘려 보면 단서를 찾을 수 있어.'],
  [12.18,16.80,'나랑 다리를 건너 물길을 조사하러 가자!']
 ]},
 final:{title:'다시 빛나는 기록탑',chapter:'탐험의 끝',theme:'final',next:'내 탐험 기록 보기',duration:17.275,cues:[
  [.38,3.73,'물이 흙을 깎고 옮긴 흔적을 찾았어.'],
  [3.77,7.46,'두 돌은 색과 알갱이를 함께 보고 구별했지.'],
  [7.6,10.77,'안전하게 대피할 길도 찾아냈어!'],
  [10.84,13.9,'봐, 기록탑에 다시 불이 켜졌어!'],
  [13.97,17.11,'이 인증서는 네 거야. 고마워, 탐험가!']
 ]}
};
let dismiss;
export const stopStory=()=>dismiss?.();
const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');

export function openStory(kind,{onFinish,replay=false,soundOn,toggleSound}){
 stopStory();
 const film=films[kind],previous=document.activeElement;
 const dialog=document.createElement('dialog');
 dialog.className='story-film';dialog.setAttribute('aria-labelledby','story-heading');
 dialog.innerHTML=`<header class="film-head"><div><small>${film.chapter}</small><h2 id="story-heading">${film.title}</h2></div><button id="story-skip" class="film-button">${replay?'돌아가기':'건너뛰기'} ${icon('arrow',18)}</button></header>
 <div class="film-picture"><video playsinline preload="metadata" poster="/assets/story/${kind}.webp" aria-label="${film.title}" aria-describedby="story-caption"></video><p class="film-caption" id="story-caption" hidden></p><p class="film-error" role="status" hidden></p></div>
 <footer class="film-controls"><button class="film-button" id="story-play">재생</button><input type="range" id="story-seek" min="0" max="${film.duration}" step=".05" value="0" aria-label="영상 재생 위치"><span class="film-time"></span><button class="film-button" id="story-caption-toggle" aria-pressed="true">자막 켜짐</button><button class="film-button" id="story-sound"></button></footer>`;
 document.body.append(dialog);dialog.showModal();
 const el=id=>dialog.querySelector(id),video=el('video'),caption=el('#story-caption'),hint=el('.film-error');
 const play=el('#story-play'),seek=el('#story-seek'),cc=el('#story-caption-toggle'),sound=el('#story-sound'),skip=el('#story-skip');
 const events=new AbortController(),on=(target,name,fn)=>target.addEventListener(name,fn,{signal:events.signal});
 let closed=false,captions=true;
 const releaseScore=scoreFilm(video,film.theme,replay,voiceVolume);
 function finish(advance){
  if(closed)return;closed=true;dismiss=undefined;events.abort();
  video.pause();releaseScore();video.removeAttribute('src');video.load();
  dialog.close();dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});
  if(advance)onFinish?.();
 }
 dismiss=()=>finish(false);
 function refresh(){
  const t=video.currentTime,total=Number.isFinite(video.duration)?video.duration:film.duration;
  const line=film.cues.find(([from,to])=>t>=from&&t<to)?.[2]||'';
  caption.hidden=!captions||!line;if(caption.textContent!==line)caption.textContent=line;
  seek.max=String(total);seek.value=String(t);el('.film-time').textContent=clock(t)+' / '+clock(total);
  play.textContent=video.paused?'재생':'일시 정지';
 }
 function volume(){
  video.muted=!soundOn();video.volume=.86 * voiceVolume()/100;
  sound.innerHTML=icon(soundOn()?'sound':'mute',21);
  sound.setAttribute('aria-label',soundOn()?'전체 소리 끄기':'전체 소리 켜기');sound.setAttribute('aria-pressed',String(soundOn()));
 }
 function start(){video.play().catch(()=>{if(!closed)refresh();});}
 function failed(){
  hint.textContent=kind==='intro'?'강가에 쌓인 모래는 어디서 왔을까? 리버와 물길을 조사하러 가자.':'물과 암석에서 찾은 단서로 안전한 길까지 완성했어. 내 탐험 기록을 펼쳐 보자.';
  hint.hidden=false;caption.hidden=true;play.disabled=true;seek.disabled=true;
  skip.textContent=replay?'돌아가기':film.next;
 }
 on(play,'click',()=>video.paused?start():video.pause());
 on(seek,'input',()=>{if(video.readyState){video.currentTime=Number(seek.value);refresh();}});
 on(cc,'click',()=>{captions=!captions;cc.setAttribute('aria-pressed',String(captions));cc.textContent=captions?'자막 켜짐':'자막 꺼짐';refresh();});
 on(sound,'click',()=>{toggleSound();volume();});
 on(skip,'click',()=>finish(true));on(dialog,'cancel',e=>{e.preventDefault();finish(true);});
 for(const event of ['timeupdate','play','pause','seeked','loadedmetadata'])on(video,event,refresh);
 on(video,'ended',()=>finish(true));on(video,'error',failed);
 on(document,'visibilitychange',()=>{if(document.hidden)video.pause();});
 if(window.VTTCue){const track=video.addTextTrack('captions','한국어','ko');for(const [a,b,s] of film.cues)track.addCue(new VTTCue(a,b,s));track.mode='hidden';}
 volume();refresh();video.src=`/assets/story/${kind}.mp4`;
 play.focus({preventScroll:true});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)start();
}
