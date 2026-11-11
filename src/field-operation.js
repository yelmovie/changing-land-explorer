import {$,escapeHTML,icon} from './ui.js';
import {OPERATIONS,operationState,operate,freshOperation} from './field-operation-model.js';
export function mountOperation({id,data,save,shell,sound,onComplete,onBack}){
 const spec=OPERATIONS[id];let model=operationState(data.fieldOperation,id),message=spec.goal,closed=false;
 shell('리버의 현장 작전',`<main class="field-operation" style="--operation-bg:url('/assets/art/${spec.background}.webp')"><header class="operation-heading"><span>관찰에서 실제 작전으로</span><h1>${spec.title}</h1><p>${spec.goal}</p></header><section class="operation-scene" aria-label="직접 조작하는 현장 모형"><div class="operation-progress"></div><div id="operation-board"></div><img class="operation-hero" src="/assets/river-hero.webp" alt="함께 작전하는 리버"></section><footer class="operation-footer"><p id="operation-message" role="status"></p><div><button class="secondary" id="operation-back">관찰로 돌아가기</button><button class="secondary" id="operation-retry">작전 다시</button><button class="primary" id="operation-finish" hidden>도구 받고 지도 가기 ${icon('arrow')}</button></div></footer><small class="operation-model-note">교육용 모형 · 실제 현장에서는 전문가·재난 안내와 선생님 지시를 따라요.</small></main>`,'operation-app');
 const board=$('#operation-board'),hero=$('.operation-hero');
 const button=(key,label,cls='')=>`<button class="operation-action ${cls}" data-operation="${key}">${label}</button>`;
 const sceneLabel=text=>`<h2 class="operation-task">${text}</h2>`;
 function render(){
  $('.operation-progress').textContent=`현장 작전 ${Math.min(model.step+1,spec.steps)} / ${spec.steps}`;
  $('#operation-message').textContent=message;$('#operation-finish').hidden=!model.done;
  hero.hidden=id==='river'&&model.step===2&&!model.done;
  hero.style.left=(model.done?82:8+model.step*18)+'%';hero.src=model.done?'/assets/hero-cheer.webp':'/assets/river-hero.webp';
  if(model.done){board.innerHTML=`<div class="operation-win"><span>${icon('flag',54)}</span><h2>내 관찰로 작전 성공!</h2><p>${escapeHTML(message)}</p><strong>시도 ${model.attempts+1}번 · 고쳐서 해결했어</strong></div>`;return;}
  if(id==='river'){
   board.innerHTML=sceneLabel(['세 흔적을 눌러 물길을 읽어 봐','다리를 놓을 곳을 고르고 물을 흘려 봐','연결된 다리로 리버를 보내 줘'][model.step])+(model.step<2?`<div class="river-operation-stream"><i></i><i></i><i></i></div>`:'')+(model.step===0?`<div class="operation-sites">${button('observe:erosion',(model.observed.includes('erosion')?'✓ ':'')+'깎인 물가','site-bank')}${button('observe:transport',(model.observed.includes('transport')?'✓ ':'')+'움직이는 흙','site-flow')}${button('observe:deposit',(model.observed.includes('deposit')?'✓ ':'')+'쌓인 모래','site-sand')}</div>`:model.step===1?`<div class="operation-sites bridge-sites">${button('bridge:bank','깎이는 물가',model.choice==='bank'?'placed':'')}${button('bridge:checked','점검된 양쪽 받침',model.choice==='checked'?'placed':'')}${button('bridge:sand','새로 쌓인 모래',model.choice==='sand'?'placed':'')}</div><div class="operation-center">${button('test','물 흘려 시험하기','primary')}</div>`:`<div class="operation-walk-grid" aria-label="강 조사 모형 지도">${Array.from({length:15},(_,i)=>{const x=i%5,y=Math.floor(i/5),player=model.position[0]===x&&model.position[1]===y,water=x===2&&y!==1,bridge=x===2&&y===1,hazard=x===1&&y===0;return `<div class="${water?'water':bridge?'bridge':hazard?'hazard':'path'}">${player?'<img src="/assets/river-hero.webp" alt="리버 현재 위치">':x===4&&y===1?'⚑ 조사':water?'강물':bridge?'다리':hazard?'침식 위험':''}</div>`;}).join('')}</div><div class="operation-move">${button('move:west','← 왼쪽')}${button('move:north','↑ 위')}${button('move:south','↓ 아래')}${button('move:east','오른쪽 →')}</div>`);
  }else if(id==='volcano'){
   const options=[['signed','안내된 우회 통로','crater','분화구 쪽 지름길'],['shelter','지정된 대피소','ash','화산재 구역'],['station','대피소에서 무전 전달','crater','분화구 가까이']][model.step];
   board.innerHTML=sceneLabel(model.step===2?'대피소 안에서 소식을 전달해 줘':'리버가 갈 다음 지점을 눌러 경로를 이어 줘')+`<div class="operation-route"><span>출발</span>${[0,1,2].map(i=>`<i class="${i<model.step?'linked':''}">${i<model.step?'✓':'·'}</i>`).join('')}<span>대피소</span></div><div class="operation-choice">${button(options[0],options[1],'safe-route')}${button(options[2],options[3],'hazard-route')}</div>`;
  }else if(id==='rocks'){
   board.innerHTML=sceneLabel(model.step===0?'주문: 밝은 전체 색 + 큰 알갱이':'주문: 어두운 전체 색 + 작은 알갱이')+`<div class="operation-specimens"><figure><img src="/assets/art/rock-basalt-study-v1.webp" alt="현무암 표본"><figcaption>현무암</figcaption>${button('ship:basalt','이 표본 보내기')}</figure><figure><img src="/assets/art/rock-granite-study-v1.webp" alt="화강암 표본"><figcaption>화강암</figcaption>${button('ship:granite','이 표본 보내기')}</figure></div><div class="operation-inspect">${button('inspect:color',(model.observed.includes('color')?'✓ ':'')+'전체 색 비교')}${button('inspect:grain',(model.observed.includes('grain')?'✓ ':'')+'알갱이 확대 비교')}</div>`;
  }else if(id==='city'){
   const options=[['close','창문 닫기','open','창문 열기'],['inside','실내에서 안내 기다리기','outside','야외 활동 계속하기'],['notice','공식 행동 요령 전달','rumor','확인 안 된 소식 전하기']][model.step];
   board.innerHTML=sceneLabel('관측 소식: 마을에 화산재가 날리고 있어')+`<div class="operation-city"><div class="operation-window ${model.step>0?'closed':''}">학교 창문<br>${model.step>0?'닫힘':'열림'}</div><div class="operation-residents">주민 ${model.step>1?'실내 대기':'야외 활동 중'}</div><div class="operation-notice">안내판 ${model.step>2?'전달 완료':'대기'}</div></div><div class="operation-choice">${button(options[0],options[1])}${button(options[2],options[3])}</div>`;
  }else{
   const options=[['cover','책상 아래 몸 보호','run','지금 밖으로 뛰기'],['hold','책상 다리 잡고 기다리기','run','흔들리는 중 이동하기'],['stopped','멈춤 확인 후 선생님 따라','lift','엘리베이터 타기'],['assembly','계단으로 넓은 집합 장소','lift','엘리베이터 타기']][model.step];
   board.innerHTML=sceneLabel(model.step<2?'흔들리는 동안: 몸을 보호해':model.step===2?'모의 흔들림이 멈췄어':'멈춘 뒤: 안내에 따라 대피해')+`<div class="operation-safety"><img src="/assets/${model.step<2?'hero-protect':'hero-cheer'}.webp" alt="${model.step<2?'몸을 보호하는 리버':'이동을 준비하는 리버'}"><div>${['몸을 보호할 곳 찾기','보호 자세 유지','흔들림 멈춤 확인','넓은 집합 장소로'][model.step]}</div></div><div class="operation-choice">${button(options[0],options[1])}${button(options[2],options[3])}</div>`;
  }
  for(const b of board.querySelectorAll('[data-operation]'))b.onclick=()=>{
   if(closed)return;const action=b.dataset.operation,result=operate(id,model,action);model=result.state;message=result.message;if(result.changed){data.fieldOperation=model;save();}sound(result.ok?'complete':'place',{force:true});render();
   if(id==='river'&&action==='test'&&!result.ok)board.querySelector('.bridge-sites')?.classList.add('washed');
   if(id==='rocks'&&action==='inspect:grain')board.querySelector('.operation-specimens')?.classList.add('magnified');
  };
 }
 $('#operation-back').onclick=onBack;$('#operation-retry').onclick=()=>{model=freshOperation();message=spec.goal;data.fieldOperation=model;save();render();};$('#operation-finish').onclick=()=>{if(model.done&&!closed){closed=true;onComplete();}};
 const keydown=e=>{if(closed||id!=='river'||model.step!==2||model.done||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select'))return;const dir={ArrowLeft:'west',ArrowRight:'east',ArrowUp:'north',ArrowDown:'south'}[e.key];if(dir){e.preventDefault();board.querySelector(`[data-operation="move:${dir}"]`)?.click();}};
 window.addEventListener('keydown',keydown);render();return()=>{closed=true;window.removeEventListener('keydown',keydown);};
}
