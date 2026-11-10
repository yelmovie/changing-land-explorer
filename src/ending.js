import {STAGES} from './model.js';
import {$,$$,escapeHTML} from './ui.js';
import {shell,state,isAdmin,save,navigate,enter,toast,chime,modal} from './main.js';
import {evidenceCard,btn,pill,svgFrame,pointerSurface,bindChoices} from './explore-ui.js';
import {riverArt,pin} from './visuals.js';
import {RIVER_MARKS,riverMarkValid,inspectRoute} from './learning-model.js';
import {TOOL_ASSETS} from './adventure/rules.js';
const toolArt=(st,size)=>`<img src="/assets/${TOOL_ASSETS[st.tool]}.webp" alt="${st.reward}" width="${size}" height="${size}">`;
import {mountRoute} from './safety.js';
const TRANSFER_ROUTE={start:{x:120,y:410},goal:{x:880,y:100},areas:[{x:50,y:50,w:900,h:420}],gates:[],hazards:[{x:320,y:180,w:230,h:160,label:'도서관',message:'도서관 건물에서 떨어져 이동해.'},{x:650,y:270,w:70,h:160,label:'담장',message:'담장과 떨어진 길을 찾아 봐.'},{x:760,y:150,w:45,h:65,label:'전신주',message:'전신주가 있는 곳을 피해 가자.'}]};
export function renderFinal(mode='assembly'){
 const s=state();if(s.completed.length<5&&!isAdmin()){navigate('map');return()=>{};}
 s.final??={};const f=s.final;f.selected??={};f.round=Math.min(3,Math.max(0,Number(f.round)||0));
 if(mode==='retry'&&s.finished){
  f.attempts??=[];f.attempts.push({round:f.round,transferRiverTime:f.transferRiverTime,transferRiverPoint:structuredClone(f.transferRiverPoint),transferRockClaims:structuredClone(f.transferRockClaims||[]),transferRockName:f.transferRockName,transferSafety:structuredClone(f.transferSafety||{})});
  f.round=0;f.assembled=true;for(const key of ['transferRiverTime','transferRiverPoint','transferRockClaims','transferRockName','transferSafety'])delete f[key];save();navigate('final');return()=>{};
 }
 const records=id=>Object.values({...s.records[id]?.data?.evidence,...s.drafts[id]?.data?.evidence});
 const chosen=id=>records(id).find(e=>e.id===f.selected[id]);
 const recordTile=(st,e,action)=>`<article class="saved-evidence record-tile"><div class="evidence-symbol">${toolArt(st,52)}</div><div><h3>${st.name}</h3><span>${escapeHTML(e.label)}</span>${action}</div></article>`;
 const openRecords=id=>modal('내가 남긴 관찰',`<div class="evidence-list">${records(id).map(e=>evidenceCard(e)).join('')||'<p>아직 관찰 장면이 없어. 지도에서 해당 탐험의 기록을 남겨 줘.</p>'}</div>`);
 if(mode==='certificate'){
  if(!s.finished&&!isAdmin()){navigate('final');return()=>{};}
  shell('지오밸리 탐험 인증서',`<main class="final-scene"><article class="certificate"><span class="eyebrow">관찰 · 비교 · 설명 · 실천</span><img class="certificate-medal" src="/assets/art/expedition-medallion.webp" alt="지오밸리 탐험 메달"><h1>지오밸리 탐험 인증서</h1>${isAdmin()?'<p>관리자 미리보기 · 실제 완료 인증서가 아니야</p>':''}<input aria-label="인증서에 쓸 별명" maxlength="16" placeholder="나의 탐험가 별명"><p>강의 변화와 화산, 암석을 관찰하고<br>생활과 안전을 연결한 탐험가에게 이 인증서를 줘.</p><div class="cert-tools">${STAGES.map(st=>toolArt(st,56)).join('')}</div><strong>리버와 함께한 지오밸리 탐험대</strong><small>별명은 저장하거나 전송하지 않아.</small></article><div class="certificate-tools">${btn('인증서 인쇄 / PDF 저장','print','primary')}${btn('탐험 기록으로','ending-back')}</div></main>`,'final');$('#print').onclick=()=>window.print();$('#ending-back').onclick=()=>navigate('final','ending');return()=>{};
 }
 if(mode==='ending'){
  if(!s.finished&&!isAdmin()){navigate('final');return()=>{};}
  shell('우리의 발견이 연결됐어',`<main class="final-scene restored-scene"><header class="restored-hero"><span class="eyebrow">${isAdmin()?'교사 시연 · 완료 장면':'지오밸리 탐험 완료'}</span><h1>기록탑에 다시 불이 켜졌어요!</h1><p>${isAdmin()?'학생이 다섯 기록과 마지막 도전을 마치면 만나는 장면이에요.':'다섯 장소에서 모은 관찰을 마지막 도전에도 써 봤어요.'}</p></header><div class="final-panel"><div class="final-record-grid">${STAGES.map(st=>{const e=chosen(st.id);return e?recordTile(st,e,`<button class="secondary" data-read-record="${st.id}">기록 펼치기</button>`):`<article class="saved-evidence"><div><h3>${st.name}</h3><p>${isAdmin()?'시연용 화면':'대표 기록을 골라 주세요.'}</p></div></article>`;}).join('')}</div><div class="final-actions">${btn('나의 탐험 인증서','certificate','primary')}${btn('다시 지도로','journey')}${btn('대표 기록 바꾸기','choose-again')}</div></div></main>`,'final');$('#certificate').onclick=()=>navigate('final','certificate');$('#journey').onclick=()=>navigate('map');$('#choose-again').onclick=()=>{f.assembled=false;save();navigate('final');};$$('[data-read-record]').forEach(button=>button.onclick=()=>{
   const id=button.dataset.readRecord,e=chosen(id),index=STAGES.findIndex(st=>st.id===id);
   modal('내가 남긴 발견',evidenceCard(e,'<button class="primary" data-replay>이 장면 다시 탐구</button>'),(dialog,close)=>{
    $('[data-replay]',dialog).onclick=()=>{s.drafts[id]??={step:0,passed:[],data:structuredClone(s.records[id]?.data||{})};s.drafts[id].data.revisit=e.id;save();close();enter(index,e.activity);};
   });
  });return()=>{};
 }
 if(!f.assembled){
  shell('기억의 기록탑',`<main class="final-scene"><h1>내가 남긴 다섯 발견을 골라 줘</h1><p>아래 장소마다 ‘내 기록 고르기’를 눌러 하나씩 꽂아 줘. <strong>${STAGES.filter(st=>chosen(st.id)).length} / 5개 선택</strong></p><div class="final-panel"><div class="final-record-grid">${STAGES.map(st=>chosen(st.id)?recordTile(st,chosen(st.id),`<button class="secondary" data-select-record="${st.id}">다른 기록 고르기</button>`):`<article class="saved-evidence"><div class="evidence-symbol">${toolArt(st,64)}</div><div><h3>${st.name}</h3><button class="secondary" data-select-record="${st.id}">내 기록 고르기</button></div></article>`).join('')}</div><div class="final-actions">${btn('새 상황에 써 보기','final-connect','primary')}</div></div></main>`,'final');
  $$('[data-select-record]').forEach(b=>b.onclick=()=>{const id=b.dataset.selectRecord,list=records(id);modal('기록탑에 꽂을 내 관찰',`<div class="evidence-list">${list.map(e=>evidenceCard(e,`<button class="secondary" data-evidence-id="${escapeHTML(e.id)}">이 기록 선택</button>`)).join('')||'<p>이전 기록에는 관찰 장면이 없어. 이 장소를 다시 탐험해 새 기록을 남겨 줘.</p>'}</div>${list.length?'':btn('이 장소로','redo-stage')}`,(dialog,close)=>{$$('[data-evidence-id]',dialog).forEach(x=>x.onclick=()=>{f.selected[id]=x.dataset.evidenceId;save();close();navigate('final');});if($('#redo-stage'))$('#redo-stage').onclick=()=>{close();enter(STAGES.findIndex(st=>st.id===id));};});});$('#final-connect').onclick=()=>{if(!isAdmin()&&!STAGES.every(st=>chosen(st.id))){const missing=STAGES.find(st=>!chosen(st.id));toast(`${missing.place}의 기록을 하나 골라 줘.`);$(`[data-select-record="${missing.id}"]`).focus();return;}f.assembled=true;save();navigate('final');};return()=>{};
 }
 if(f.round>=3){s.finished=true;save();navigate('final','ending');return()=>{};}
 const round=f.round,source=['river','rocks','safety'][round],topic=['새 물길','새 암석','새 안전길'][round];
 shell('기억의 기록탑',`<main class="explore-page transfer-page"><div class="explore-heading"><div><span class="eyebrow">기록탑 · ${round+1}/3 · ${topic}</span><h1 id="instruction"></h1></div>${btn('내 관찰 펼치기','final-source')}</div><section id="activity" class="activity-surface" aria-labelledby="instruction"></section><div class="transfer-aside"><div class="explore-feedback"><img src="/assets/hero-lens.webp" alt=""><p id="speech" role="status">내 관찰을 떠올려 새 상황을 살펴봐.</p></div><div class="explore-actions"><div id="controls" class="controls"></div>${btn(round===2?'탐험 마치기':'다음 도전','next','primary')}</div></div></main>`,'exploration');$('#final-source').onclick=()=>openRecords(source);$('#next').disabled=true;$('#next').setAttribute('aria-describedby','speech');
 const finish=()=>{f.round++;if(f.round>=3)s.finished=true;save();chime();navigate('final',f.round>=3?'celebration':'assembly');};$('#next').onclick=finish;
 if(round===0){
  let time=f.transferRiverTime??0,point=f.transferRiverPoint;
  $('#instruction').textContent='시간 손잡이를 오른쪽으로 밀고, 흙이 쌓인 곳을 눌러 봐.';
  $('#activity').innerHTML=svgFrame('<g id="transfer-river"></g>','오른쪽 높은 곳에서 왼쪽 낮은 곳으로 흐르는 물')+
    '<div class="scene-tools"><label class="timeline">시간 <input type="range" id="transfer-time" aria-label="새 물길 시간" min="0" max="100" value="'+time*100+'"><output id="transfer-clock" for="transfer-time"></output></label></div>';
  $('#controls').innerHTML=btn('장소를 버튼으로 고르기','transfer-locations');
  const canObserve=()=>riverMarkValid('deposit',RIVER_MARKS.deposit,time);
  const validPoint=()=>point&&riverMarkValid('deposit',{x:1-point.x,y:point.y},time);
  const draw=()=>{
   const bank=(x,y,label)=>`<g transform="translate(${x} ${y})"><rect width="144" height="46" rx="14" fill="#fff7df" stroke="#a98a52" stroke-width="2"/><text x="72" y="32" font-size="28" text-anchor="middle" fill="#26493c">${label}</text></g>`;
   $('#transfer-river').innerHTML='<g transform="translate(1000 0) scale(-1 1)">'+riverArt(time,2).replace(/<text[\s\S]*?<\/text>/g,'')+'</g>'+bank(90,428,'낮은 곳')+bank(762,60,'높은 곳')+(validPoint()?pin(point,'✓'):'');
   $('#transfer-clock').textContent=Math.round(time*100)+'%';
   $('#next').disabled=!validPoint();
  };
  function guide(){
   $('#speech').textContent=validPoint()?'옮겨 온 흙이 쌓인 것을 퇴적이라고 해. 이제 다음 도전으로 가자.':canObserve()?'흐르기 전과 달라진 곳을 찾아 그림 위에 표시해 봐.':'물길을 살펴보자. 시간 손잡이를 오른쪽 끝까지 밀면 흙이 움직여.';
  }
  const mark=p=>{
   if(!canObserve()){guide();return;}
   if(!riverMarkValid('deposit',{x:1-p.x,y:p.y},time)){$('#speech').textContent='물이 옮겨 온 흙이 모인 곳을 다시 살펴봐.';return;}
   const fresh=!validPoint();point=f.transferRiverPoint=p;save();draw();guide();if(fresh)chime();
  };
  $('#transfer-time').oninput=e=>{time=+e.target.value/100;f.transferRiverTime=time;draw();guide();save();};
  $('#transfer-locations').onclick=()=>modal('흙이 쌓인 곳은 어디일까?',`<div class="choice-row">${btn('왼쪽 낮은 곳','transfer-left')}${btn('오른쪽 높은 곳','transfer-right')}</div>`,(d,c)=>{
   $('#transfer-left',d).onclick=()=>{c();mark({x:.18,y:.72});};
   $('#transfer-right',d).onclick=()=>{c();mark({x:.73,y:.38});};
  });
  draw();guide();
  return pointerSurface($('svg',$('#activity')),{up(p){mark({x:p.x/1000,y:p.y/500});}});
 }
 if(round===1){
  let zoom=1,view={x:.5,y:.5},claims=f.transferRockClaims||[];$('#instruction').textContent='돌을 살펴보고 색과 알갱이 특징을 하나씩 골라 봐.';$('#activity').innerHTML=svgFrame('<g id="transfer-rock"></g>','방향을 돌린 암석의 확대 관찰','0 0 500 500')+'<div class="scene-tools" id="transfer-features"></div>';$('#controls').innerHTML=btn('확대 / 원래 크기','transfer-zoom')+btn('이름 붙이기','transfer-name');const draw=()=>{$('#transfer-rock').innerHTML=`<g transform="translate(${250-view.x*500*zoom} ${250-view.y*500*zoom}) scale(${zoom})"><image href="/assets/rock-3.webp" width="500" height="500" transform="rotate(25 250 250)"/></g>`;};$('#transfer-zoom').onclick=()=>{zoom=zoom===1?2:1;draw();};$('#speech').textContent=claims.length===2?'두 특징을 모았어. ‘이름 붙이기’를 눌러 봐.':'돌을 누르면 그 부분을 크게 볼 수 있어. 색과 알갱이 버튼을 하나씩 골라 봐.';const choices={dark:'전체가 어두운색',light:'전체가 밝은색',fine:'알갱이가 잘 안 보임',coarse:'알갱이가 뚜렷함'};const render=()=>{$('#transfer-features').innerHTML=Object.entries(choices).map(([k,v])=>pill(v,claims.includes(k),`data-transfer-feature="${k}"`)).join('');bindChoices($('#activity'),'data-transfer-feature',k=>{if(!['light','coarse'].includes(k)){$('#speech').textContent='방향이 달라도 돌의 전체 색과 알갱이를 함께 봐.';return;}claims=[...new Set([...claims,k])];f.transferRockClaims=claims;save();render();$('#speech').textContent=claims.length===2?'두 특징을 모았어. ‘이름 붙이기’를 눌러 봐.':k==='light'?'색을 기록했어. 이제 알갱이가 어떻게 보이는지 골라 봐.':'알갱이를 기록했어. 이제 돌 전체의 색을 골라 봐.';});};$('#transfer-name').onclick=()=>{if(claims.length!==2){$('#speech').textContent='확대해 살펴보고 색과 알갱이를 하나씩 골라 줘.';return;}modal('내 관찰로 이름 붙이기','<p>밝은색 · 뚜렷한 알갱이</p><div class="choice-row">'+btn('현무암','transfer-basalt')+btn('화강암','transfer-granite')+'</div>',(d,c)=>{$('#transfer-basalt').onclick=()=>{c();$('#speech').textContent='앞서 관찰한 기준 표본과 다시 비교해 봐.';};$('#transfer-granite').onclick=()=>{f.transferRockName='granite';save();c();chime();$('#next').disabled=false;$('#speech').textContent='이 돌은 기준 화강암처럼 밝은 바탕에 여러 색 알갱이가 뚜렷해!';};});};const clean=pointerSurface($('svg',$('#activity')),{down(p){view={x:p.x/500,y:p.y/500};zoom=2;draw();}});render();draw();if(f.transferRockName==='granite')$('#next').disabled=false;return clean;
 }
 f.transferSafety??={};const d=f.transferSafety;const ctx={data:d,step:1,s:{id:'safety'},root:$('#activity'),controls:$('#controls'),save,chime,modal,toast,say:text=>$('#speech').textContent=text,instruction:text=>$('#instruction').textContent=text,refresh:()=>navigate('final'),update(){const good=d.outsideRouteDone===true&&inspectRoute(d.outsideRoute||[],TRANSFER_ROUTE).ok;$('#next').disabled=!good;save();}};const cleanup=mountRoute(ctx,true,TRANSFER_ROUTE);$('#instruction').textContent='리버에서 공터까지 안전한 길을 그리고 확인해.';
 $('.scene-toolbar',ctx.root).append($('#route-keys'));
 if(!d.outsideRoute?.length)$('#speech').textContent='리버에서 도착점까지 길을 그려 줘. 점을 찍어 이어도 돼.';
 return cleanup;
}
