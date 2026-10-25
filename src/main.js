import {playSound,setSoundEnabled,stopSounds} from './sound.js';
import {showConcept,CONCEPTS} from './concepts.js';
import {STAGES,SAVE_KEY,LEGACY_SAVE_KEY,fresh,loadProgress,award,canEnter,saveDecision,seedPreview} from './model.js';
import {SETTINGS_CONTENT} from './settings-content.js';
import {activityComplete} from './learning-model.js';
import {PHASES, TOOL_ASSETS, discoveryCount} from './adventure/rules.js';
import {showEvidence,evidenceCard} from './explore-ui.js';
import {$,$$,icon,escapeHTML,checklist} from './ui.js';
let student,storageReadOnly=false,storageProblem='',storageWarning='',lastRaw=null,conflict=false;
const plainObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function readableProgress(raw){
 if(raw===null)return true;
 try{const value=JSON.parse(raw);if(!plainObject(value)||![2,3].includes(value.version))return false;
  if(value.version===3&&(!Array.isArray(value.completed)||!plainObject(value.drafts)||!plainObject(value.records)))return false;
  return ['drafts','records','final'].every(k=>value[k]===undefined||plainObject(value[k]))&&(value.completed===undefined||Array.isArray(value.completed));
 }catch{return false;}
}
function readStudent(){
 try{
  const current=localStorage.getItem(SAVE_KEY),legacy=current===null?localStorage.getItem(LEGACY_SAVE_KEY):null;lastRaw=current;
  if(!readableProgress(current)||!readableProgress(legacy)){storageReadOnly=true;storageProblem='저장된 기록을 읽지 못했어요. 기존 원본을 보호하기 위해 이번 활동은 저장하지 않아요.';student=fresh();}
  else{storageReadOnly=false;storageProblem='';student=loadProgress({getItem:k=>k===SAVE_KEY?current:legacy});}
 }catch{student=fresh();storageReadOnly=true;storageProblem='이 브라우저에서 저장 공간을 사용할 수 없어요. 이번 활동은 창을 닫으면 사라질 수 있어요.';}
}
readStudent();
let admin=false,preview=null,dispose=()=>{},screen={type:'home'},navRevision=0;
const app=$('#app');
setSoundEnabled(student.sound);
document.addEventListener('click',e=>{if(e.target.closest('button:not(:disabled)'))playSound('click');},true);
export const state=()=>admin?preview:student;
export const isAdmin=()=>admin;
const storageChanged=()=>{try{return localStorage.getItem(SAVE_KEY)!==lastRaw;}catch{return false;}};
function persistStudent(){
 if(conflict){if(!$('dialog[open] #conflict-reload'))showConflict();return false;}
 if(!storageReadOnly)try{const next=JSON.stringify(student),decision=saveDecision(lastRaw,localStorage.getItem(SAVE_KEY),next);if(decision==='conflict'){showConflict();return false;}if(decision==='write')localStorage.setItem(SAVE_KEY,next);lastRaw=next;storageProblem='';return true;}catch{storageProblem='기록을 저장하지 못했어요. 창을 닫기 전에 저장 공간과 브라우저 설정을 확인해 주세요.';}
 if(storageWarning!==storageProblem){storageWarning=storageProblem;toast(storageProblem);}
 return false;
}
// Another window saved newer progress: stop autosaving here until this window reloads it.
function showConflict(){
 conflict=true;
 modal('다른 창에서 기록이 바뀌었어요','<p>다른 창이나 탭에서 탐험 기록이 새로 저장됐어요. 그 기록을 지키기 위해 이 창에서 바꾼 내용은 저장하지 않아요.</p><p>최신 기록을 불러와 이어서 탐험해 주세요.</p><div class="dialog-footer"><button class="primary" id="conflict-reload">최신 기록 불러오기</button></div>',(d,close)=>{$('#conflict-reload',d).onclick=()=>{close();readStudent();conflict=false;storageWarning='';admin=false;preview=null;setSoundEnabled(student.sound);const to=student.location||{type:'map'};navigate(to.type,to.arg,true);};});
}
window.addEventListener('storage',e=>{if(!conflict&&(e.key===SAVE_KEY||e.key===null)&&storageChanged())showConflict();});
export function save(){if(!admin)return persistStudent();return false;}
export function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4000);}
export function chime(success=true){playSound(success?'complete':'place',{force:true});}
export function modal(title,content,setup){
 const previous=document.activeElement;
 stopSounds();
 document.querySelectorAll('#overlay dialog').forEach(d=>d.close());
 $('#overlay').innerHTML=`<dialog class="learning-dialog" aria-labelledby="dialog-title"><header class="dialog-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button dialog-close" aria-label="닫기">${icon('close')}</button></header><div class="dialog-body">${content}</div></dialog>`;
 const dialog=$('dialog');
 if(dialog.querySelector('.evidence-list,.bag-grid,.preview-links,.tool-comparison'))dialog.classList.add('wide-dialog');
 const close=()=>{if(dialog.open)dialog.close();};
 $('.dialog-close',dialog).onclick=close;
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 dialog.addEventListener('close',()=>{dialog.remove();if(!document.querySelector('dialog[open]'))(previous?.isConnected?previous:$('#settings'))?.focus();},{once:true});
 dialog.showModal();setup?.(dialog,close);
}
function setPreview(value){
 if(value===admin)return;
 if(value){preview=seedPreview(structuredClone(student));admin=true;navigate('map');}
 else{admin=false;preview=null;const location=student.location||{type:'home'};navigate(location.type,location.arg,true);}
}
function settings(){modal('탐험 설정',`<label class="setting-row">전체 소리 <input id="sound-setting" type="checkbox" role="switch" ${student.sound?'checked':''}></label><label class="setting-row">관리자 전체 해금 <input id="admin-setting" type="checkbox" role="switch" ${admin?'checked':''}></label><p class="settings-note">모든 활동·엔딩·인증서를 살펴보는 수업 시연 기능이에요. 시연 중 답과 보상은 학생 기록에 저장되지 않아요. 끄면 원래 진행으로 돌아와요.</p>${storageProblem?`<p class="settings-status danger-note" role="status">${escapeHTML(storageProblem)}</p>`:''}<div class="settings-actions"><button class="secondary" id="intro-replay">이 탐험을 하는 이유 다시 보기</button><button class="secondary" id="concept-list">개념 영상 다시 보기</button><button class="secondary" id="bag-open">${icon('bag')} 내 탐험 가방</button><button class="secondary" id="ending-replay" ${!admin&&!student.finished?'disabled':''}>엔딩 다시 보기</button><button class="secondary" id="certificate-open" ${!admin&&!student.finished?'disabled':''}>인증서 받기</button></div>${!admin&&!student.finished?'<p class="settings-note">다섯 장소와 마지막 기록탑을 모두 마치면 엔딩과 인증서가 열려요.</p>':''}<div class="settings-links"><button class="secondary" id="app-info">앱 정보 · 배움과 보상</button><button class="secondary" id="help">학생용 가이드</button><button class="secondary" id="teacher-help">교사용 가이드</button><button class="secondary" id="credits-open">이미지·소리·저작권 고지</button></div><p class="settings-note">기록은 현재 기기의 브라우저와 이 앱 주소에 저장돼요. 다른 기기·브라우저로 자동 연결되지 않아요. 공용 기기에서는 다음 사용자가 기록을 볼 수 있어요.</p>`,(d,close)=>{
 d.classList.add('settings-dialog');
 d.insertAdjacentHTML('beforeend',`<footer class="dialog-footer"><button class="text-button" id="${admin?'reset-preview':'reset-save'}">${admin?'시연 기록 초기화':'탐험 기록 초기화'}</button><button class="primary" id="settings-close">닫기</button></footer>`);
 $('#sound-setting',d).onchange=e=>{student.sound=e.target.checked;saveSound();};
 $('#admin-setting',d).onchange=e=>{const enabled=e.target.checked;close();setPreview(enabled);};
 const open=(id,action)=>{$(id,d).onclick=()=>{close();action();};};
 open('#intro-replay',()=>modal('리버와 지오밸리를 연결해요',SETTINGS_CONTENT.intro));
 open('#concept-list',conceptList);open('#bag-open',bag);open('#help',help);open('#teacher-help',teacherHelp);
 open('#app-info',()=>modal('앱 정보 · 배움과 보상',SETTINGS_CONTENT.info(document.documentElement.dataset.appVersion||'')));
 open('#credits-open',()=>modal('이미지·소리·저작권 고지',SETTINGS_CONTENT.credits));
 open('#ending-replay',()=>navigate('final','ending'));open('#certificate-open',()=>navigate('final','certificate'));
 open(admin?'#reset-preview':'#reset-save',resetProgress);$('#settings-close',d).onclick=close;
 });}
function resetProgress(){
 const previewReset=admin;
 modal(previewReset?'시연 기록을 초기화할까요?':'탐험 기록을 초기화할까요?',`<p>${previewReset?'시연에서 고른 답, 모은 도구, 관찰 기록과 진행만 지워요. 학생의 원래 기록은 그대로 남아요.':'모은 도구, 활동 진행, 관찰 기록과 마지막 발견이 이 기기에서 지워져요. 되돌릴 수 없어요.'}</p><p>소리 설정은 그대로 유지돼요.</p>${storageReadOnly&&!previewReset?'<p class="danger-note">읽지 못한 기존 저장 원본도 새 기록으로 교체해요.</p>':''}<div class="dialog-footer"><button class="secondary" id="cancel-reset" autofocus>취소</button><button class="danger" id="confirm-reset">${previewReset?'시연 기록 지우기':'기록 지우기'}</button></div>`,(d,close)=>{
  $('#cancel-reset',d).onclick=close;$('#cancel-reset',d).focus();
  $('#confirm-reset',d).onclick=()=>{const sound=student.sound;if(previewReset){if(!admin){close();return;}preview=seedPreview(fresh());preview.sound=sound;}else{if(admin){close();return;}if(conflict||storageChanged()){close();showConflict();return;}student=fresh();student.sound=sound;storageReadOnly=false;save();}close();navigate('home');};
 });
}
function saveSound(){persistStudent();$('#sound')?.setAttribute('aria-label',student.sound?'소리 끄기':'소리 켜기');$('#sound')?.setAttribute('aria-pressed',String(student.sound));if($('#sound'))$('#sound').innerHTML=icon(student.sound?'sound':'mute');setSoundEnabled(student.sound);}
const conceptOpen=(id,step)=>admin||state().completed.includes(id)||activityComplete(id,step,state().drafts[id]?.data||{});
function conceptList(){modal('개념 영상 다시 보기',`<div class="preview-links">${STAGES.map((s,i)=>`<strong>${s.place}</strong>${CONCEPTS[s.id].map((c,j)=>conceptOpen(s.id,j)?`<button class="secondary" data-concept="${i},${j}">${escapeHTML(c.title)}</button>`:`<button class="secondary" disabled>${escapeHTML(c.title)}<br><small>${s.place} 활동을 마치면 열려요</small></button>`).join('')}`).join('')}</div>`,d=>$$('[data-concept]',d).forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.concept.split(',').map(Number);showConcept({s:STAGES[i],step:j,modal},null,{replay:true});}));}
function help(){modal('리버와 이렇게 탐험해요',SETTINGS_CONTENT.student);}
export function shell(title,body,cls=''){app.className=cls;app.innerHTML=`<header class="topbar"><div class="nav-group"><button class="icon-button" id="home" aria-label="홈">${icon('home')}</button><button class="icon-button" id="back" aria-label="이전 화면">${icon('back')}</button></div><div class="brand"><strong>${title}</strong></div><div class="nav-group"><button class="icon-button" id="sound" aria-pressed="${student.sound}" aria-label="${student.sound?'소리 끄기':'소리 켜기'}">${icon(student.sound?'sound':'mute')}</button><button class="icon-button" id="settings" aria-label="설정">${icon('settings')}</button></div></header>${admin?'<div class="preview-banner"><span>관리자 미리보기 · 학생 기록에는 저장되지 않아요</span><button class="secondary" id="exit-preview">시연 종료</button></div>':''}${body}`;$('#home').onclick=()=>navigate('home');$('#back').onclick=back;$('#settings').onclick=settings;$('#sound').onclick=()=>{student.sound=!student.sound;saveSound();};$('#exit-preview')?.addEventListener('click',()=>setPreview(false));if(screen.type==='home'){$('#home').disabled=true;$('#back').disabled=true;}}
function bag(){modal('내 탐험 가방',`<div class="bag-grid">${STAGES.map(s=>`<article class="${state().completed.includes(s.id)?'earned':''}">${icon(s.tool,32)}<h3>${state().completed.includes(s.id)?s.reward:'아직 빈 자리'}</h3><p>${escapeHTML(state().records[s.id]?.summary||s.name+'에서 관찰 기록을 모아 봐.')}</p><button class="secondary" data-bag-record="${s.id}">관찰 펼치기</button></article>`).join('')}</div>`,(dialog,close)=>{$$('[data-bag-record]',dialog).forEach(b=>b.onclick=()=>{const data=state().drafts[b.dataset.bagRecord]?.data||state().records[b.dataset.bagRecord]?.data;close();modal('내가 남긴 관찰','<div class="evidence-list">'+(Object.values(data?.evidence||{}).map(e=>evidenceCard(e)).join('')||'<p>아직 관찰 장면이 없어. 해당 장소에서 기록을 남겨 줘.</p>')+'</div>');});});}
function home(){shell('움직이는 지오밸리',`<main class="home-scene"><div class="home-art"></div><div class="home-copy"><span class="eyebrow">초등 4학년 과학 · 땅의 변화</span><h1>움직이는<br><em>지오밸리</em></h1><p>사라진 다섯 관찰 기록.<br>너와 리버의 발견으로 다시 연결해 줘!</p><button class="primary large" id="start">${state().started?'탐험 이어 하기':'리버와 탐험 시작'} ${icon('arrow')}</button><button class="home-help" id="home-help">어떤 탐험이 기다릴까?</button><span class="save-note">강 · 화산 · 암석 · 도시 · 안전길</span></div><img class="home-hero" src="/assets/river-hero.webp" alt="탐험 수첩을 든 수달 리버"><div class="home-message">“네가 찾은 단서가<br>우리의 다음 도구가 될 거야!”</div></main>`,'home');$('#start').onclick=()=>{state().started=true;save();chime();navigate('map');};$('#home-help').onclick=help;}
export async function navigate(type,arg,fromHistory=false){
 const revision=++navRevision;document.querySelectorAll('#overlay dialog').forEach(d=>d.close());stopSounds();dispose();dispose=()=>{};screen={type,arg};
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
 shell(s.place,`<main class="adventure-page"><section class="adventure-heading"><div class="task-copy"><span class="eyebrow">탐험 ${index+1} · ${step===0?'실험과 관찰':'발견으로 문제 해결'}</span><h1 id="instruction">${s.steps[step]}</h1></div><nav id="phase-path" class="phase-path" aria-label="이번 활동의 세 가지 발견"></nav></section><section id="activity" class="adventure-surface" aria-label="${s.steps[step]}"></section><footer class="adventure-footer"><div class="river-narrator"><button class="narrator-help" id="river-hint" aria-label="리버에게 단계별 힌트 받기"><img src="/assets/hero-lens.webp" alt="탐험 동료 리버"><span>힌트</span></button><div><span id="river-status">리버의 길잡이</span><p id="speech" role="status">같이 단서를 찾아보자!</p></div></div><div class="adventure-toolbar"><div id="controls" class="controls"></div><button class="primary" id="next" disabled>다음 발견 ${icon('arrow')}</button></div></footer><div class="adventure-side-tools"><button class="icon-button" id="notebook" aria-label="내 관찰 수첩">${icon('book')}<b id="evidence-count">0</b></button><button class="secondary compact-tool" id="gesture-help">조작 도움</button><button class="secondary compact-tool" id="concept-review">개념 영상</button><button class="earned-tool" id="earned-tool" hidden></button></div><span class="discovery-total" aria-label="모은 발견 조각">${icon('star',18)} <b id="journey-count">${discoveryCount(state())}</b> / 30</span></main>`,'adventure');
 const ctx={index,s,d,step,data:d.data,state:state(),sound:playSound,concept:after=>showConcept(ctx,after),root:$('#activity'),controls:$('#controls'),admin,save,toast,chime,modal,
  refresh:()=>navigate('stage',{index,step}),go:target=>navigate('stage',{index,step:target}),
  say(msg){$('#speech').textContent=msg;},instruction(msg){$('#instruction').textContent=msg;},
  update(){const ok=activityComplete(s.id,step,d.data),review=$('#concept-review'),open=conceptOpen(s.id,step);$('#evidence-count').textContent=Object.keys(d.data.evidence||{}).length;review.classList.toggle('is-locked',!open);if(open)review.removeAttribute('aria-disabled');else review.setAttribute('aria-disabled','true');d.passed=d.passed.filter(n=>n!==step);if(ok)d.passed.push(step);save();},
  ready(value=false){$('#next').disabled=value!==true;},record(key,value){d.data[key]=value;save();},
  finishActivity(){ctx.update();if(!admin&&!activityComplete(s.id,step,d.data)){toast('남은 관찰을 마치고 발견을 연결해 줘.');return;}showConcept(ctx,()=>{if(step===0)navigate('stage',{index,step:1});else if(admin||activityComplete(s.id,0,d.data))complete(index);else ctx.go(0);});}
 };
 $('.adventure-toolbar').prepend($('.adventure-side-tools'));
 const mounted=mount(ctx);dispose=typeof mounted==='function'?mounted:()=>{};
 $('#notebook').onclick=()=>showEvidence(ctx);$('#concept-review').onclick=()=>conceptOpen(s.id,step)?showConcept(ctx,null,{replay:true}):toast('이 활동을 마치면 개념 영상을 다시 볼 수 있어요');ctx.update();
}

function complete(index){const s=STAGES[index],d=state().drafts[s.id];const evidenceCount=Object.keys(d.data.evidence||{}).length;const record={summary:`${s.name}에서 내 관찰 ${evidenceCount}개를 남겼어.`,data:structuredClone(d.data)};if(admin)preview=award(preview,s.id,record);else student=award(student,s.id,record);save();modal('새로운 탐험 도구를 얻었어!',`<div class="reward-reveal"><img class="reward-partner" src="/assets/hero-cheer.webp" alt="함께 기뻐하는 리버"><img class="reward-item" src="/assets/${TOOL_ASSETS[s.tool]}.webp" alt="${s.reward}"></div><h3>${s.reward}</h3><p>${s.benefit}</p><p class="world-change">${icon('check',20)} ${s.change}</p><button class="primary" id="return-map">가방에 넣고 지도로 ${icon('arrow')}</button>`,(dialog,close)=>{$('#return-map').onclick=()=>{close();navigate('map');};});}
window.addEventListener('pagehide',save);
window.addEventListener('popstate',e=>{if(e.state?.geo&&!admin)navigate(e.state.geo.type,e.state.geo.arg,true);else navigate('home',undefined,true);});
const resume=student.started&&student.location?student.location:{type:'home'};
history.replaceState({geo:resume},'');
navigate(resume.type,resume.arg,true);

function viewport(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px');}viewport();window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);

function teacherHelp(){modal('교사용 수업 안내',SETTINGS_CONTENT.teacher);}
