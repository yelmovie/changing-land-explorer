import {mountCertificateWax} from './certificate-wax.js';
import {playCue} from './sound.js';
import {STAGES,localDate,certificateDate} from './model.js';
import {$,$$,escapeHTML,icon} from './ui.js';
import {shell,state,isAdmin,save,navigate,toast,chime,modal,showFilm} from './main.js';
import {btn} from './explore-ui.js';
import {scienceText} from './science-learning.js';
import {CONCEPTS,showConcept} from './concepts.js';
import {TOOL_ASSETS} from './adventure/rules.js';
import {playGuideText} from './guide-voice.js';
import {saveCertificatePng} from './certificate-png.js';
const toolArt=(st,size)=>`<img src="/assets/${TOOL_ASSETS[st.tool]}.webp" alt="${st.reward}" width="${size}" height="${size}">`;
const TOWER_PHOTOS={
 river:'/assets/art/river-field-clues-v3.webp',
 volcano:'/assets/art/volcano-caldera-v2.webp',
 rocks:'/assets/art/rocks-basalt-granite-v1.webp',
 city:'/assets/art/city-harbor-v2.webp',
 safety:'/assets/art/safety-evacuation-garden-v2.webp'
};
const towerPhoto=st=>`<img class="tower-photo" src="${TOWER_PHOTOS[st.id]}" alt="${st.place} 대표 그림">`;
// The tower closes the journey by looking back, not by testing again: each frame opens the key
// scene of one place, its three big ideas, the learner's own record and the two concept films.
const KEY_SCENES={
 river:{title:'물이 땅을 바꾸는 세 가지 일',points:[['침식','흐르는 물이 물가의 흙을 깎았어.'],['운반','깎인 흙과 돌을 물이 옮겼어.'],['퇴적','물이 느려진 곳에 모래가 쌓였어.']]},
 volcano:{title:'화산 모형과 실제 화산',points:[['모형','붉은 물이 꼭대기로 나와 경사면을 따라 흘렀어.'],['실제 화산','용암과 기체, 화산재, 암석 조각이 나와.'],['비교','흐르는 모습은 같고, 나오는 물질은 달라.']]},
 rocks:{title:'색과 알갱이로 찾은 암석',points:[['현무암','어두운색이고 알갱이가 아주 작아.'],['화강암','밝은색이고 알갱이가 커서 잘 보여.'],['증거','색과 알갱이 두 가지를 모아 이름을 붙였어.']]},
 city:{title:'화산이 생활에 주는 영향',points:[['분출 당시','화산재 때문에 비행기가 멈추고 밭이 덮였어.'],['복구 뒤','안전을 확인한 뒤 다시 이용해.'],['오랜 시간 뒤','화산 물질이 변해 비옥한 흙이 되기도 해.']]},
 safety:{title:'지진이 났을 때 나를 지키기',points:[['흔들릴 때','튼튼한 책상 아래에서 머리와 몸을 보호해.'],['멈춘 뒤','선생님 안내를 따라 계단으로 이동해.'],['밖에서는','건물·담장·전신주에서 떨어진 넓은 곳으로 가.']]}
};
function frameContents(st,lit){
 return `<span class="tower-mat" aria-hidden="true">${towerPhoto(st)}${lit?'':`<span class="tower-empty-badge">${icon('play',22)}</span>`}</span><span class="tower-plaque"><strong>${st.name}</strong><span class="tower-caption">${KEY_SCENES[st.id].title}</span><span class="tower-frame-action">${lit?'✓ 불 켜짐 · 다시 보기':'눌러서 다시 보기'} ${icon('arrow',16)}</span></span>`;
}
function towerFrames(isLit){
 return `<ol class="tower-frames" aria-label="다섯 장소의 핵심 장면">${STAGES.map(st=>`<li class="tower-slot"><span class="tower-hanger" aria-hidden="true"></span><button type="button" class="tower-frame${isLit(st.id)?' mounted':''}" data-scene="${st.id}">${frameContents(st,isLit(st.id))}</button></li>`).join('')}</ol>`;
}
const playConcept=(id,step)=>showConcept({s:{id},step,modal},null,{replay:true});
function reviewScene(st,mine,onLight){
 const k=KEY_SCENES[st.id];
 modal(`${st.place} · ${k.title}`,`<div class="tower-review" data-stage="${st.id}"><span class="tower-mat">${towerPhoto(st)}</span><ol class="tower-points">${k.points.map(([term,text],i)=>`<li style="--i:${i}"><b>${term}</b><span>${scienceText(text,st.id)}</span></li>`).join('')}</ol>${mine?`<p class="tower-mine"><small>내가 남긴 기록</small><strong>${escapeHTML(mine.label)}</strong></p>`:''}<div class="tower-films" aria-label="개념 영상">${[0,1].map(step=>`<button type="button" class="tower-film" data-film="${step}"><img src="/assets/concepts/${st.id}-${step}.webp" alt=""><span>${icon('play',16)} ${escapeHTML(CONCEPTS[st.id][step].title)}</span></button>`).join('')}</div><button type="button" class="primary tower-light">기억났어! 불 켜기 ${icon('check',18)}</button></div>`,(d,close)=>{
  // One recording reads the three frame points (docs/VOICE-FILL-20261118.json).
  playGuideText(k.points.map(([term,text])=>term+' — '+text).join(' '));
  $$('[data-film]',d).forEach(b=>b.onclick=()=>{close();onLight();playConcept(st.id,Number(b.dataset.film));});
  $('.tower-light',d).onclick=()=>{close();onLight();};
 });
}
function conceptShelf(){
 modal('개념 영상 모아 보기',`<div class="tower-shelf">${STAGES.map(st=>[0,1].map(step=>`<button type="button" class="tower-film" data-shelf="${st.id},${step}"><img src="/assets/concepts/${st.id}-${step}.webp" alt=""><span><small>${st.place}</small>${escapeHTML(CONCEPTS[st.id][step].title)}</span></button>`).join('')).join('')}</div>`,(d,close)=>{
  $$('[data-shelf]',d).forEach(b=>b.onclick=()=>{const [id,step]=b.dataset.shelf.split(',');close();playConcept(id,Number(step));});
 });
}
export function renderFinal(mode='assembly'){
 const s=state();if(s.completed.length<5&&!isAdmin()){navigate('map');return()=>{};}
 s.final??={};const f=s.final;f.selected??={};f.round=Math.min(3,Math.max(0,Number(f.round)||0));
 f.lit??={};
 // "다시 둘러보기" turns the lights off again; finished learners otherwise land on the ending.
 if(mode==='retry'&&s.finished){f.lit={};f.relight=true;save();navigate('final');return()=>{};}
 const records=id=>Object.values({...s.records[id]?.data?.evidence,...s.drafts[id]?.data?.evidence});
 const mine=id=>records(id).find(e=>e.id===f.selected[id])||records(id).at(-1);
 const isLit=id=>!!f.lit[id];
 if(mode==='certificate'){
  if(!s.finished&&!isAdmin()){navigate('final');return()=>{};}
  // Saves finished before the date was recorded get the day the certificate is first opened.
  if(s.finished&&!s.finishedAt&&!isAdmin()){s.finishedAt=localDate();save();}
  const doneDate=certificateDate(s.finishedAt||localDate());
  shell('지오밸리 탐험 인증서',`
   <main class="final-scene certificate-page">
    <div class="certificate-viewport">
     <article class="certificate">
      <img class="cert-frame" src="/assets/art/ui/certificate-frame.webp" alt="">
      <div class="cert-content">
       <span class="eyebrow certificate-overline">관찰 · 비교 · 설명 · 실천</span>
       <h1 class="cert-title">지오밸리 탐험 인증서</h1>
       ${isAdmin()?'<p class="certificate-preview">관리자 미리보기 · 실제 완료 인증서가 아니야</p>':''}
       <div class="cert-recipient" aria-label="인쇄한 뒤 손으로 적는 받는 사람 빈칸">
        <div class="cert-ident-row"><span class="cert-blank cert-school" data-cert-blank="school"></span><span>학교</span><span class="cert-blank" data-cert-blank="grade"></span><span>학년</span><span class="cert-blank" data-cert-blank="class"></span><span>반</span><span class="cert-blank" data-cert-blank="number"></span><span>번</span></div>
        <div class="cert-ident-row"><span>이름</span><span class="cert-blank cert-name" data-cert-blank="name"></span></div>
       </div>
       <p class="cert-award">강의 변화와 화산, 암석을 관찰하고<br>생활과 안전을 연결한 탐험가에게 이 인증서를 줘.</p>
       <div class="cert-tools">${STAGES.map(st=>toolArt(st,56)).join('')}</div>
       <div class="cert-stamp"></div>
       <strong class="cert-issuer">리버와 함께한 지오밸리 탐험대</strong>
       <p class="cert-date">${doneDate}</p>
       <p class="cert-credit">기획·제작: 옐샘 &amp; ⓒ 아이스크림미디어</p>
      </div>
     </article>
    </div>
    <p class="cert-note">인쇄한 뒤 학교·반·번호·이름을 직접 적어요.</p>
    <div class="certificate-tools">${btn('인증서 인쇄 / PDF 저장','print','primary')}${btn('PNG 저장','cert-png')}${btn('탐험 기록으로','ending-back')}</div>
   </main>`,'final');
  mountCertificateWax($('.certificate'),{label:'지오밸리\n탐험 인증',onImpact:()=>playCue('hit-heavy')});
  $('#print').onclick=()=>window.print();
  $('#cert-png').onclick=async()=>{
   const button=$('#cert-png');button.disabled=true;
   try{await saveCertificatePng($('.certificate'));}
   catch{toast('인증서 그림을 저장하지 못했어. 잠시 후 다시 눌러 줘.');}
   finally{if(button.isConnected)button.disabled=false;}
  };
  $('#ending-back').onclick=()=>navigate('final','ending');
  return()=>{};
 }
 if(mode==='ending'){
  if(!s.finished&&!isAdmin()){navigate('final');return()=>{};}
  shell('우리의 발견이 연결됐어',`<main class="final-scene restored-scene tower-scene"><header class="restored-hero"><h1>기록탑에 다시 불이 켜졌어!</h1><p>${isAdmin()?'학생이 다섯 장면을 모두 다시 보면 만나는 장면이야.':'다섯 장소에서 배운 장면이 하나로 이어졌어. 액자를 누르면 다시 볼 수 있어.'}</p></header><section class="tower-display" aria-label="기록탑에 걸린 핵심 장면">${towerFrames(()=>true)}<div class="tower-actions">${btn('다시 지도로','journey')}${btn(`${icon('play',18)} 개념 영상 모아 보기`,'concept-shelf')}${btn(`${icon('play',18)} 마무리 영상 다시 보기`,'final-film-replay')}${btn('나의 탐험 인증서','certificate','primary')}</div></section></main>`,'final');
  $('#certificate').onclick=()=>navigate('final','certificate');$('#journey').onclick=()=>navigate('map');$('#final-film-replay').onclick=()=>showFilm('final',{replay:true});$('#concept-shelf').onclick=conceptShelf;
  $$('[data-scene]').forEach(b=>b.onclick=()=>{const st=STAGES.find(x=>x.id===b.dataset.scene);reviewScene(st,mine(st.id),()=>{});});
  return()=>{};
 }
 if(s.finished&&!f.relight){navigate('final','ending');return()=>{};}
 shell('기억의 기록탑',`<main class="final-scene tower-scene"><header class="tower-heading"><h1>기억의 기록탑</h1><p>액자를 하나씩 눌러 장소마다 배운 장면을 다시 보고, 탑에 불을 켜 줘.</p></header><section class="tower-display" aria-label="기록탑 전시"><div class="tower-progress"><span class="tower-lights" aria-hidden="true">${STAGES.map(()=>'<i></i>').join('')}</span><strong id="tower-count" role="status"></strong></div>${towerFrames(isLit)}<div class="tower-actions">${btn(`${icon('play',18)} 개념 영상 모아 보기`,'concept-shelf')}${btn('기록탑 완성하기','final-connect','primary')}</div></section></main>`,'final');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const updateProgress=()=>{
  const n=STAGES.filter(st=>isLit(st.id)).length,all=n===STAGES.length;
  $$('.tower-lights i').forEach((light,i)=>light.classList.toggle('lit',isLit(STAGES[i].id)));
  $('#tower-count').textContent=all?'다섯 장면에 모두 불이 켜졌어!':`${n} / ${STAGES.length}개 장면에 불을 켰어`;
  const done=$('#final-connect');done.disabled=!all&&!isAdmin();done.classList.toggle('is-ready',all);
  $('.tower-display').classList.toggle('is-complete',all);
 };
 $$('[data-scene]').forEach(b=>b.onclick=()=>{
  const st=STAGES.find(x=>x.id===b.dataset.scene);
  reviewScene(st,mine(st.id),()=>{
   if(isLit(st.id))return;
   f.lit[st.id]=true;save();chime();
   b.innerHTML=frameContents(st,true);b.classList.add('mounted');
   if(!reduced)b.animate?.([{transform:'translateY(-10px) scale(1.04)',filter:'brightness(1.5)'},{transform:'none',filter:'none'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
   updateProgress();
  });
 });
 $('#concept-shelf').onclick=conceptShelf;
 $('#final-connect').onclick=()=>{
  const missing=STAGES.find(st=>!isLit(st.id));
  if(missing&&!isAdmin()){toast(`${missing.place} 액자를 눌러 장면을 다시 봐 줘.`);$(`[data-scene="${missing.id}"]`).focus();return;}
  s.finished=true;s.finishedAt??=localDate();delete f.relight;save();navigate('final','celebration');
 };
 updateProgress();
 return()=>{};
}
