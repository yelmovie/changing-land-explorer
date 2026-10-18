import {STAGES,SAVE_KEY,fresh,loadProgress,award,canEnter} from './model.js';
import {activityComplete} from './learning-model.js';
import {PHASES, TOOL_ASSETS, discoveryCount} from './adventure/rules.js';
import {showEvidence,evidenceCard} from './explore-ui.js';
import {$,$$,icon,escapeHTML,checklist} from './ui.js';
let student;try{student=loadProgress(localStorage);}catch{student=fresh();}
let admin=false,preview=null,dispose=()=>{},screen={type:'home'},audio,navRevision=0;
const app=$('#app');
export const state=()=>admin?preview:student;
export const isAdmin=()=>admin;
export function save(){if(!admin)try{localStorage.setItem(SAVE_KEY,JSON.stringify(student));}catch{toast('이 브라우저는 저장 공간을 쓸 수 없어. 창을 닫으면 기록이 사라질 수 있어.');}}
export function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4000);}
export function chime(success=true){if(!student.sound)return;try{audio??=new AudioContext();audio.resume();for(let i=0;i<(success?3:1);i++){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.11;o.type='sine';o.frequency.value=(success?[523,659,784]:[280])[i];g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.24);}}catch{}}
export function modal(title,content,setup){const previous=document.activeElement;$('#overlay').innerHTML=`<dialog aria-labelledby="dialog-title"><button class="icon-button dialog-close" aria-label="닫기">${icon('close')}</button><h2 id="dialog-title">${title}</h2>${content}</dialog>`;const dialog=$('dialog');dialog.showModal();const close=()=>{dialog.close();dialog.remove();previous?.focus();};$('.dialog-close',dialog).onclick=close;dialog.addEventListener('click',e=>{if(e.target===dialog)close();});dialog.addEventListener('close',()=>previous?.focus());setup?.(dialog,close);}
function settings(){modal('탐험 설정',`<label class="setting-row">소리 <input id="sound-setting" type="checkbox" role="switch" ${student.sound?'checked':''}></label><label class="setting-row">관리자 전체 해금 <input id="admin-setting" type="checkbox" role="switch" ${admin?'checked':''}></label><p class="small">관리자 미리보기는 학생의 기록과 따로 진행돼. 모든 활동·엔딩을 바로 살펴볼 수 있어.</p><button class="secondary" id="help">조작 방법</button>${admin?'<button class="text-button" id="reset-save">학생 기록 초기화</button>':''}<button class="secondary" id="teacher-help">교사용 안내</button>`,(d,close)=>{$('#sound-setting').onchange=e=>{student.sound=e.target.checked;saveSound();};$('#admin-setting').onchange=e=>{admin=e.target.checked;if(admin)preview=structuredClone(student);close();navigate('map');};$('#help').onclick=()=>{close();help();};$('#teacher-help').onclick=()=>{close();teacherHelp();};if($('#reset-save'))$('#reset-save').onclick=()=>{close();modal('학생 기록을 지울까?','<p>모은 도구와 진행 기록이 모두 사라져. 되돌릴 수 없어.</p><button class="danger" id="confirm-reset">기록 지우고 처음부터</button>',(d,c)=>{$('#confirm-reset').onclick=()=>{student=fresh();admin=false;preview=null;save();c();navigate('home');};});};});}
function saveSound(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(student));}catch{}$('#sound')?.setAttribute('aria-label',student.sound?'소리 끄기':'소리 켜기');if($('#sound'))$('#sound').innerHTML=icon(student.sound?'sound':'mute');if(!student.sound)audio?.suspend();}
function help(){modal('리버와 이렇게 탐험해',`<p>지도에서 장소 이름을 누르면 리버가 길을 따라 걸어가. 방향키·WASD나 화면 방향 버튼으로도 이동할 수 있어.</p><p>활동에서는 그림 속 도구를 끌거나 슬라이더를 움직여 봐. 자료는 누른 다음 놓을 곳을 눌러도 옮길 수 있어.</p><p>오답 감점이나 제한시간은 없어. 관찰한 단서를 보고 고쳐 보면 돼. 기록은 이 브라우저에 자동으로 저장돼.</p>`);}
export function shell(title,body,cls=''){app.className=cls;app.innerHTML=`<header class="topbar"><div class="nav-group"><button class="icon-button" id="home" aria-label="홈">${icon('home')}</button><button class="icon-button" id="back" aria-label="이전 화면">${icon('back')}</button></div><div class="brand"><strong>${title}</strong></div><div class="nav-group"><button class="icon-button" id="bag" aria-label="탐험 가방">${icon('bag')}</button><button class="icon-button" id="sound" aria-label="${student.sound?'소리 끄기':'소리 켜기'}">${icon(student.sound?'sound':'mute')}</button><button class="icon-button" id="settings" aria-label="설정">${icon('settings')}</button></div></header>${admin?'<div class="preview-banner">관리자 미리보기 · 학생 기록에는 저장되지 않아</div>':''}${body}`;$('#home').onclick=()=>navigate('home');$('#back').onclick=back;$('#settings').onclick=settings;$('#sound').onclick=()=>{student.sound=!student.sound;saveSound();};$('#bag').onclick=bag;if(screen.type==='home'){$('#home').disabled=true;$('#back').disabled=true;}}
function bag(){modal('내 탐험 가방',`<div class="bag-grid">${STAGES.map(s=>`<article class="${state().completed.includes(s.id)?'earned':''}">${icon(s.tool,32)}<h3>${state().completed.includes(s.id)?s.reward:'아직 빈 자리'}</h3><p>${escapeHTML(state().records[s.id]?.summary||s.name+'에서 관찰 기록을 모아 봐.')}</p><button class="secondary" data-bag-record="${s.id}">관찰 펼치기</button></article>`).join('')}</div>`,(dialog,close)=>{$$('[data-bag-record]',dialog).forEach(b=>b.onclick=()=>{const data=state().drafts[b.dataset.bagRecord]?.data||state().records[b.dataset.bagRecord]?.data;close();modal('내가 남긴 관찰',Object.values(data?.evidence||{}).map(e=>evidenceCard(e)).join('')||'<p>아직 관찰 장면이 없어. 해당 장소에서 기록을 남겨 줘.</p>');});});}
function home(){shell('움직이는 지오밸리',`<main class="home-scene"><div class="home-art"></div><div class="home-copy"><span class="eyebrow">초등 4학년 과학 · 땅의 변화</span><h1>움직이는<br><em>지오밸리</em></h1><p>사라진 다섯 관찰 기록.<br>너와 리버의 발견으로 다시 연결해 줘!</p><button class="primary large" id="start">${state().started?'탐험 이어 하기':'리버와 탐험 시작'} ${icon('arrow')}</button><button class="home-help" id="home-help">어떤 탐험이 기다릴까?</button><span class="save-note">강 · 화산 · 암석 · 도시 · 안전길</span></div><img class="home-hero" src="/assets/river-hero.webp" alt="탐험 수첩을 든 수달 리버"><div class="home-message">“네가 찾은 단서가<br>우리의 다음 도구가 될 거야!”</div></main>`,'home');$('#start').onclick=()=>{state().started=true;save();chime();navigate('map');};$('#home-help').onclick=help;}
export async function navigate(type,arg,fromHistory=false){
 const revision=++navRevision;dispose();dispose=()=>{};screen={type,arg};
 if(type!=='home')app.innerHTML='<main class="loading-card" role="status">탐험 도구를 준비하고 있어…</main>';
 try{
  if(type==='home'){const m=await import('./map-adventure.js');if(revision!==navRevision)return;dispose=m.renderMap({welcome:true});}
  else if(type==='map'){const m=await import('./map-adventure.js');if(revision!==navRevision)return;dispose=m.renderMap();}
  else if(type==='stage'){
   const index=arg?.index,s=STAGES[index],draft=s&&state().drafts[s.id];
   if(!draft||!canEnter(index,state(),admin)){navigate('map');return;}
   const desired=arg.step??draft.step??0;
   draft.step=desired===1&&(admin||activityComplete(s.id,0,draft.data))?1:0;
   const files=Object.fromEntries(STAGES.map(s=>[s.id,'./adventure/index.js']));
   const m=await import(files[s.id]);if(revision!==navRevision)return;
   renderStage(index,m.mount);screen.arg={index,step:draft.step};
  }else if(type==='final'){const m=await import('./ending.js');if(revision!==navRevision)return;dispose=m.renderFinal(arg||'assembly');}
  else{navigate('home');return;}
  if(revision!==navRevision)return;
  if(!admin){student.location=structuredClone(screen);save();if(!fromHistory)history.pushState({geo:screen},'');}
  window.scrollTo(0,0);
 }catch(error){if(revision!==navRevision)return;console.error(error);app.innerHTML='<main class="loading-card"><h1>도구를 불러오지 못했어</h1><p>인터넷 연결을 확인하고 다시 눌러 줘.</p><button class="primary" id="retry-load">다시 시도</button><button class="secondary" id="load-home">홈으로</button></main>';$('#retry-load').onclick=()=>navigate(type,arg,true);$('#load-home').onclick=()=>navigate('home');}
}
function back(){if(screen.type==='stage'){const {index}=screen.arg,d=state().drafts[STAGES[index].id];if(d.step>0){d.step--;save();navigate('stage',{index,step:d.step});}else navigate('map');}else if(screen.type==='final'&&screen.arg!=='assembly')navigate('final','assembly');else if(screen.type==='map'||screen.type==='final')navigate('home');else navigate('home');}
export function enter(index,step){if(!canEnter(index,state(),admin)){toast('앞 장소의 관찰 기록을 먼저 완성하자.');return;}const s=STAGES[index];state().drafts[s.id]??={step:0,passed:[],data:{}};if(step!==undefined&&admin)state().drafts[s.id].step=step;navigate('stage',{index,step});}
function renderStage(index,mount){
 const s=STAGES[index],d=state().drafts[s.id],step=d.step;d.data??={};d.passed??=[];
 shell(s.place,`<main class="adventure-page"><section class="adventure-heading"><div class="task-copy"><span class="eyebrow">탐험 ${index+1} · ${step===0?'실험과 관찰':'발견으로 문제 해결'}</span><h1 id="instruction">${s.steps[step]}</h1></div><nav id="phase-path" class="phase-path" aria-label="이번 활동의 세 가지 발견"></nav></section><section id="activity" class="adventure-surface" aria-label="${s.steps[step]}"></section><footer class="adventure-footer"><div class="river-narrator"><img src="/assets/hero-lens.webp" alt="탐험 동료 리버"><div><span>리버</span><p id="speech" role="status">같이 단서를 찾아보자!</p></div></div><div class="adventure-toolbar"><div id="controls" class="controls"></div><button class="primary" id="next" disabled>다음 발견 ${icon('arrow')}</button></div></footer><div class="adventure-side-tools"><button class="icon-button" id="notebook" aria-label="내 관찰 수첩">${icon('book')}<b id="evidence-count">0</b></button><button class="icon-button" id="gesture-help" aria-label="버튼으로 조작하기">${icon('water')}</button><button class="earned-tool" id="earned-tool" hidden></button></div><span class="discovery-total" aria-label="모은 발견 조각">${icon('star',18)} <b id="journey-count">${discoveryCount(state())}</b> / 30</span></main>`,'adventure');
 const ctx={index,s,d,step,data:d.data,state:state(),root:$('#activity'),controls:$('#controls'),admin,save,toast,chime,modal,
  refresh:()=>navigate('stage',{index,step}),go:target=>navigate('stage',{index,step:target}),
  say(msg){$('#speech').textContent=msg;},instruction(msg){$('#instruction').textContent=msg;},
  update(){const ok=activityComplete(s.id,step,d.data);$('#evidence-count').textContent=Object.keys(d.data.evidence||{}).length;d.passed=d.passed.filter(n=>n!==step);if(ok)d.passed.push(step);save();},
  ready(value=false){$('#next').disabled=value!==true;},record(key,value){d.data[key]=value;save();},
  finishActivity(){ctx.update();if(!admin&&!activityComplete(s.id,step,d.data)){toast('남은 관찰을 마치고 발견을 연결해 줘.');return;}chime();if(step===0)navigate('stage',{index,step:1});else if(admin||activityComplete(s.id,0,d.data))complete(index);else ctx.go(0);}
 };
 const mounted=mount(ctx);dispose=typeof mounted==='function'?mounted:()=>{};
 $('#notebook').onclick=()=>showEvidence(ctx);ctx.update();
}

function complete(index){const s=STAGES[index],d=state().drafts[s.id];const evidenceCount=Object.keys(d.data.evidence||{}).length;const record={summary:`${s.name}에서 내 관찰 ${evidenceCount}개를 남겼어.`,data:structuredClone(d.data)};if(admin)preview=award(preview,s.id,record);else student=award(student,s.id,record);save();modal('새로운 탐험 도구를 얻었어!',`<div class="reward-reveal"><img class="reward-partner" src="/assets/hero-cheer.webp" alt="함께 기뻐하는 리버"><img class="reward-item" src="/assets/${TOOL_ASSETS[s.tool]}.webp" alt="${s.reward}"></div><h3>${s.reward}</h3><p>${s.benefit}</p><p class="world-change">${icon('check',20)} ${s.change}</p><button class="primary" id="return-map">가방에 넣고 지도로 ${icon('arrow')}</button>`,(dialog,close)=>{$('#return-map').onclick=()=>{close();navigate('map');};});}
window.addEventListener('pagehide',save);
window.addEventListener('popstate',e=>{if(e.state?.geo&&!admin)navigate(e.state.geo.type,e.state.geo.arg,true);else navigate('home',undefined,true);});
const resume=student.started&&student.location?student.location:{type:'home'};
history.replaceState({geo:resume},'');
navigate(resume.type,resume.arg,true);

function viewport(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px');}viewport();window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);

function teacherHelp(){modal('교사용 수업 안내',`<p>2022 개정 과학 [4과11-01]~[4과11-04]에 맞춘 가상 탐구야.</p><ul class="record-list"><li>강: 같은 지형에서 물의 양만 바꾸고 깎임·이동·쌓임의 흔적을 설명해.</li><li>화산: 모형을 구성하고 실제 분출물과 같은 점·다른 점을 구분해.</li><li>암석: 현무암·화강암의 색과 알갱이를 관찰해 두 근거로 분류해.</li><li>도시·안전: 피해와 이로움을 조사하고 몸 보호·안전한 이동을 연습해.</li></ul><p>수첩에서 학생의 관찰 장면과 경로를 확인해. 실제 암석 표본 관찰과 학교 대피 훈련을 함께 진행해 줘. 가상 실험은 자연의 모든 조건을 재현하지 않아.</p><p class="small">그림의 출처·수업 유의점과 검증 결과는 프로젝트의 docs/ADVENTURE_UPGRADE.md에 정리했어. 저장은 이 기기의 브라우저에만 남아.</p>`);}
