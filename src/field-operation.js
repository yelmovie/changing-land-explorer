import {scienceText} from './science-learning.js';
import {$,escapeHTML,icon} from './ui.js';
import {OPERATIONS,operationState,operate,freshOperation} from './field-operation-model.js';
import {createPlayback,PLAYBACK_SPEEDS} from './adventure/playback.js';
export function mountOperation({id,data,save,shell,sound,onComplete,onBack}){
 const spec=OPERATIONS[id];let model=operationState(data.fieldOperation,id),message=spec.goal,closed=false;
 shell(spec.title,`<main class="field-operation" style="--operation-bg:url('/assets/art/${spec.background}.webp')"><section class="operation-scene" aria-label="직접 조작하는 현장 모형"><div class="operation-progress"></div><div id="operation-board"></div><img class="operation-hero" src="/assets/river-hero.webp" alt="함께 작전하는 리버"></section><footer class="operation-footer"><p id="operation-message" role="status"></p><div class="operation-playback" hidden><button id="operation-auto" class="primary">자동 관찰</button><select id="operation-speed" aria-label="자동 관찰 속도">${PLAYBACK_SPEEDS.map(speed=>`<option value="${speed}" ${speed===1?'selected':''}>${speed}배</option>`).join('')}</select></div><div class="operation-navigation"><button class="secondary" id="operation-back">관찰로</button><button class="secondary" id="operation-retry">다시 도전</button><button class="primary" id="operation-finish" hidden>도구 받기 ${icon('arrow')}</button></div></footer><small class="operation-model-note">교육용 모형 · 실제 현장에서는 전문가와 선생님 안내를 따라요.</small></main>`,'operation-app');
 const board=$('#operation-board'),hero=$('.operation-hero');
 const button=(key,label,cls='')=>`<button class="operation-action ${cls}" data-operation="${key}">${label}</button>`;
 const illustration=(file,description)=>`<figure class="operation-illustration"><img src="/assets/${file}.webp" alt="${escapeHTML(description)}"></figure>`;
 const choices=options=>{
  const pair=[[options[0],options[1]],[options[2],options[3]]];
  if(model.step%2)pair.reverse();
  return `<div class="operation-choice">${pair.map(([key,label])=>button(key,label)).join('')}</div>`;
 };
 const sceneLabel=text=>`<h2 class="operation-task" tabindex="-1">${text}</h2>`;
 function render(){
  const background=id==='safety'&&model.step<2?'safety-island-classroom-v2':spec.background;
  $('.field-operation').style.setProperty('--operation-bg',`url('/assets/art/${background}.webp')`);
  $('.operation-progress').textContent=`현장 작전 ${Math.min(model.step+1,spec.steps)} / ${spec.steps}`;
  $('#operation-message').innerHTML=scienceText(model.done?'도구를 받고 다음 탐험을 이어 가자.':message,id);$('#operation-finish').hidden=!model.done;
  $('.operation-scene').dataset.operation=id;
  $('.operation-scene').dataset.step=model.step;
  syncPlayback();
  hero.hidden=!model.done;
  hero.style.left=(model.done?82:8+model.step*18)+'%';hero.src=model.done?'/assets/hero-cheer.webp':'/assets/river-hero.webp';
  if(model.done){board.innerHTML=`<div class="operation-win"><span>${icon('flag',54)}</span><h2>내 관찰로 작전 성공!</h2><p>${escapeHTML({river:'물길의 흔적을 읽고 점검된 다리로 건넜어.',volcano:'용암과 화산재를 피해 대피하고 모형과 실제의 차이를 전했어.',rocks:'색과 알갱이 두 근거로 표본을 배송했어.',city:'화산재 관측 소식에 맞춰 주민을 도왔어.',safety:'몸 보호부터 안전한 집합까지 순서대로 해냈어.'}[id])}</p><strong>${model.attempts?'다시 살펴보고 해결했어':'관찰한 단서로 해결했어'}</strong></div>`;return;}
  if(id==='river'){
   board.innerHTML=sceneLabel(['세 흔적을 눌러 물길을 읽어 봐','다리를 놓을 곳을 고르고 물을 흘려 봐','연결된 다리로 리버를 보내 줘'][model.step])+(model.step<2?illustration('art/river-field-clues-v3','왼쪽은 깎인 흙 물가, 가운데는 흙을 옮기는 물, 오른쪽은 쌓인 모래'):'')+(model.step===0?`<div class="operation-sites">${button('observe:erosion',(model.observed.includes('erosion')?'✓ ':'')+'깎인 물가','site-bank')}${button('observe:transport',(model.observed.includes('transport')?'✓ ':'')+'움직이는 흙','site-flow')}${button('observe:deposit',(model.observed.includes('deposit')?'✓ ':'')+'쌓인 모래','site-sand')}</div>`:model.step===1?`<div class="operation-sites bridge-sites">${button('bridge:bank','깎이는 물가',model.choice==='bank'?'placed':'')}${button('bridge:checked','안전 확인한 양쪽 받침',model.choice==='checked'?'placed':'')}${button('bridge:sand','새로 쌓인 모래',model.choice==='sand'?'placed':'')}</div><div class="operation-center">${button('test','물 흘려 시험하기','primary')}</div>`:`<div class="operation-walk-grid" aria-label="강 조사 모형 지도">${Array.from({length:15},(_,i)=>{const x=i%5,y=Math.floor(i/5),player=model.position[0]===x&&model.position[1]===y,water=x===2&&y!==1,bridge=x===2&&y===1,hazard=x===1&&y===0;return `<div class="${water?'water':bridge?'bridge':hazard?'hazard':'path'}">${player?'<img src="/assets/river-hero.webp" alt="리버 현재 위치">':x===4&&y===1?'⚑ 조사':water?'강물':bridge?'다리':hazard?'침식 위험':''}</div>`;}).join('')}</div><div class="operation-move">${button('move:west','← 왼쪽')}${button('move:north','↑ 위')}${button('move:south','↓ 아래')}${button('move:east','오른쪽 →')}</div>`);
  }else if(id==='volcano'){
   const options=[['signed','용암을 피해 안내된 통로로','crater','용암 가까이로'],['shelter','화산재를 피해 지정 대피소로','ash','화산재 구역으로'],['station','실제 화산은 뜨거운 물질도 나와','crater','실제 화산도 붉은 물만 나와']][model.step];
   const tasks=['뜨거운 용암이 경사면을 따라 흘러. 어디로 갈까?','작은 고체 알갱이인 화산재가 날려. 어디로 갈까?','대피소에 도착했어. 모형과 실제의 차이를 알려 줘'];
   board.innerHTML=sceneLabel(tasks[model.step])+illustration('art/volcano-caldera-v2','화산의 경사면을 흐르는 용암과 하늘로 나오는 분출물을 나타낸 그림')+choices(options);
  }else if(id==='rocks'){
   board.innerHTML=sceneLabel(model.step===0?'주문: 밝은 전체 색 + 큰 알갱이':'주문: 어두운 전체 색 + 작은 알갱이')+`<div class="operation-specimens"><figure><img src="/assets/art/rock-basalt-study-v1.webp" alt="현무암 표본"><figcaption>현무암</figcaption>${button('ship:basalt','이 표본 보내기')}</figure><figure><img src="/assets/art/rock-granite-study-v1.webp" alt="화강암 표본"><figcaption>화강암</figcaption>${button('ship:granite','이 표본 보내기')}</figure></div><div class="operation-inspect">${button('inspect:color',(model.observed.includes('color')?'✓ ':'')+'전체 색 비교')}${button('inspect:grain',(model.observed.includes('grain')?'✓ ':'')+'알갱이 확대 비교')}</div>`;
  }else if(id==='city'){
   const options=[['close','창문 닫기','open','창문 열기'],['inside','실내에서 안내 기다리기','outside','야외 활동 계속하기'],['notice','선생님과 확인한 재난 안내','rumor','확인 안 된 소식 전하기']][model.step];
   board.innerHTML=sceneLabel(['화산재가 날려. 창문을 어떻게 할까?','창문을 닫았어. 어디에서 기다릴까?','실내에 모였어. 어떤 소식을 전할까?'][model.step])+illustration(model.step===0?'city-eruption':'art/ash-classroom-v3',model.step===0?'화산재로 영향을 받은 마을을 나타낸 그림':'창문을 닫은 교실 안과 화산재가 날리는 바깥 풍경')+choices(options);
  }else{
   const options=[['cover','책상 아래 몸 보호','run','지금 밖으로 뛰기'],['hold','책상 다리 잡고 기다리기','run','흔들리는 중 이동하기'],['stopped','멈춤 확인 후 선생님 따라','lift','엘리베이터 타기'],['assembly','계단을 이용해 넓은 곳으로','lift','엘리베이터 타기']][model.step];
   board.innerHTML=sceneLabel(model.step<2?'흔들리는 동안 몸을 보호해':model.step===2?'모의 흔들림이 멈췄어':'멈춘 뒤 안내에 따라 대피해')+(model.step<2?`<div class="operation-safety-shelter" role="img" aria-label="튼튼한 책상 아래에서 머리와 몸을 보호하는 리버"><img class="sheltered-hero ${model.step===1?'is-holding':''}" src="/assets/${model.step===1?'art/hero-hold-leg-v1':'hero-protect'}.webp" alt=""><img class="sheltering-desk" src="/assets/art/ui/school-desk.webp" alt=""></div>`:illustration('art/safety-evacuation-garden-v2','건물과 담장에서 떨어진 넓은 집합 장소'))+choices(options);

  }
  for(const b of board.querySelectorAll('[data-operation]'))b.onclick=()=>act(b.dataset.operation,true);
  const testBridge=board.querySelector('[data-operation="test"]');
  if(testBridge)testBridge.disabled=!['bank','checked','sand'].includes(model.choice);
 }
 function act(action,manual){
  if(closed)return;
  if(manual)playback.stop();
  const focusedAuto=document.activeElement===$('#operation-auto');
  const result=operate(id,model,action);
  model=result.state;message=result.message;
  if(result.changed){data.fieldOperation=model;save();}
  sound(result.ok?'complete':'place',{force:true});
  render();
  if(id==='river'&&action==='test'&&!result.ok)board.querySelector('.bridge-sites')?.classList.add('washed');
  if(id==='rocks'&&action==='inspect:grain')board.querySelector('.operation-specimens')?.classList.add('magnified');
  if(manual){
   const target=model.done?$('#operation-finish'):board.querySelector(`[data-operation="${action}"]`)||board.querySelector('.operation-task');
   target?.focus({preventScroll:true});
  }else if(focusedAuto&&!pendingObservations().length){
   board.querySelector('.operation-task')?.focus({preventScroll:true});
  }
 }
 const pendingObservations=()=>{
  if(model.done)return [];
  if(id==='river'&&model.step===0)return ['erosion','transport','deposit'].filter(item=>!model.observed.includes(item)).map(item=>'observe:'+item);
  if(id==='rocks')return ['color','grain'].filter(item=>!model.observed.includes(item)).map(item=>'inspect:'+item);
  return [];
 };
 let frame=0,lastFrame=0;
 const playback=createPlayback({onChange:syncPlayback});
 function syncPlayback(){
  const available=pendingObservations().length>0;
  $('.operation-playback').hidden=!available;
  $('#operation-auto').textContent=playback.playing?'관찰 멈춤':'자동 관찰';
  $('#operation-auto').setAttribute('aria-pressed',String(playback.playing));
  if(!available)playback.stop();
 }
 function tick(now){
  if(closed||document.hidden||document.querySelector('dialog[open]'))playback.stop();
  playback.update(lastFrame?now-lastFrame:0);lastFrame=now;
  if(playback.playing)frame=requestAnimationFrame(tick);
 }
 playback.configure({ready:()=>!closed&&pendingObservations().length>0,interval:1800,advance:()=>act(pendingObservations()[0],false)});
 $('#operation-auto').onclick=()=>{
  if(playback.playing){playback.stop();return;}
  cancelAnimationFrame(frame);lastFrame=0;
  if(playback.start())frame=requestAnimationFrame(tick);
 };
 $('#operation-speed').onchange=e=>playback.setSpeed(e.target.value);
 $('#operation-back').onclick=onBack;
 $('#operation-retry').onclick=()=>{
  playback.stop();model=freshOperation();message=spec.goal;data.fieldOperation=model;save();render();
  board.querySelector('.operation-task')?.focus({preventScroll:true});
 };
 $('#operation-finish').onclick=()=>{if(model.done&&!closed){closed=true;onComplete();}};
 const stopPlayback=()=>{if(document.hidden)playback.stop();};
 document.addEventListener('visibilitychange',stopPlayback);
 const keydown=e=>{if(closed||id!=='river'||model.step!==2||model.done||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select'))return;const dir={ArrowLeft:'west',ArrowRight:'east',ArrowUp:'north',ArrowDown:'south'}[e.key];if(dir){e.preventDefault();board.querySelector(`[data-operation="move:${dir}"]`)?.click();}};
 window.addEventListener('keydown',keydown);render();return()=>{closed=true;playback.stop();cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',stopPlayback);window.removeEventListener('keydown',keydown);};
}
