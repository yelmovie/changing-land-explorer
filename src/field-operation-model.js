// These are teaching models, not real-world hazard or engineering predictions.
export const OPERATIONS={
 river:{title:'물길을 읽고 조사 다리 놓기',goal:'물의 흔적을 조사하고, 점검된 양쪽 받침에 다리를 놓아 리버를 보내 줘.',background:'river-canyon-v2',steps:3},
 volcano:{title:'분출물 관찰을 대피와 연결하기',goal:'용암과 화산재의 특징을 떠올려 안전하게 대피하고, 모형과 실제의 차이를 알려 줘.',background:'volcano-caldera-v2',steps:3},
 city:{title:'화산재 안내소 운영하기',goal:'관측 소식을 보고 주민에게 필요한 대응을 배치해 줘.',background:'city-message-square-v2',steps:3},
 safety:{title:'몸을 보호하고 넓은 곳으로',goal:'흔들릴 때 몸을 보호하고, 멈춘 뒤 안내를 따라 이동해 줘.',background:'safety-evacuation-garden-v2',steps:4}
};
export function freshOperation(){return {version:1,step:0,observed:[],choice:null,position:[0,1],attempts:0,done:false};}
const BRIDGE_CHOICES=['bank','checked','sand'];
export function operationState(raw,id){
 const initial=freshOperation();
 if(!raw||raw.version!==1)return initial;
 const steps=OPERATIONS[id]?.steps||5;
 const step=Number(raw.step),attempts=Number(raw.attempts);
 const allowed=id==='river'?['erosion','transport','deposit']:[];
 const observed=Array.isArray(raw.observed)?raw.observed.filter(item=>allowed.includes(item)):[];
 const position=Array.isArray(raw.position)&&raw.position.length===2&&raw.position.every(Number.isInteger)
  ?[Math.max(0,Math.min(4,raw.position[0])),Math.max(0,Math.min(2,raw.position[1]))]:initial.position;
 return {
  ...initial,
  step:Number.isFinite(step)?Math.max(0,Math.min(steps-1,Math.floor(step))):0,
  observed:[...new Set(observed)],
  choice:id==='river'&&BRIDGE_CHOICES.includes(raw.choice)?raw.choice:null,
  position,
  attempts:Number.isFinite(attempts)?Math.max(0,Math.min(999,Math.floor(attempts))):0,
  done:raw.done===true
 };
}
export function operate(id,raw,action){
 const s=operationState(raw,id);if(!OPERATIONS[id]||s.done)return {state:s,message:'작전 기록이 완성됐어.',changed:false};
 const fail=message=>({state:{...s,attempts:s.attempts+1},message,changed:true,ok:false});
 const pass=message=>{const next={...s,step:s.step+1,observed:[],choice:null};next.done=next.step>=OPERATIONS[id].steps;return {state:next,message,changed:true,ok:true};};
 if(id==='river'){
  if(s.step===0&&action.startsWith('observe:')){const k=action.slice(8);if(!['erosion','transport','deposit'].includes(k))return fail('물길의 세 흔적을 눌러 살펴봐.');s.observed=[...new Set([...s.observed,k])];if(s.observed.length===3)return pass('깎이고 옮겨져 쌓이는 흐름을 찾았어. 다리 그림을 끌어서 점선 안에 놓아 봐.');return {state:s,changed:true,message:{erosion:'물가의 흙이 깎였어. 침식의 흔적이야.',transport:'깎인 흙이 물과 함께 아래쪽으로 옮겨져. 운반이야.',deposit:'흐름이 느려진 곳에 흙이 쌓였어. 퇴적의 흔적이야.'}[k]};}
  if(s.step===1&&action.startsWith('bridge:')){
   const site=action.slice(7);
   if(!BRIDGE_CHOICES.includes(site))return {state:s,changed:false,message:'강 위의 점선 안에 다리를 놓아 줘.'};
   s.choice=site;return {state:s,changed:true,message:'다리를 놓았어. 물을 흘려 양쪽 받침이 버티는지 확인해 봐.'};
  }
  if(s.step===1&&action==='test'){
   if(!BRIDGE_CHOICES.includes(s.choice))return fail('점선 안에 다리를 먼저 놓아 줘.');
   if(s.choice==='checked')return pass('물이 흘러도 점검한 양쪽 받침이 움직이지 않았어. 이제 리버를 끌어서 다리를 건너게 해 줘!');
   const reason=s.choice==='bank'?'물이 깎이는 물가 쪽 받침을 무너뜨렸어.':'새로 쌓인 모래가 물에 옮겨져 받침이 흔들렸어.';
   s.choice=null;
   return fail(reason+' 다른 점선 자리에 다리를 놓고 다시 시험해 봐.');
  }
  // Step 3 is the walk over the checked bridge; the view reports when River reached the flag.
  if(s.step===2&&action==='cross')return pass('리버가 점검한 다리를 건너 조사 지점에 도착했어! 실제 다리는 전문가가 안전을 점검해.');
  if(s.step===2)return {state:s,changed:false,message:'리버를 끌어서 다리를 건너게 해 줘.'};
 }
 if(id==='volcano'){
  const good=['signed','shelter','station'][s.step];
  if(action===good)return pass(['용암은 땅 위로 나온 뜨거운 물질이야. 안내된 통로를 따라 멀어졌어.','화산재는 날아다니는 작은 고체 알갱이야. 지정된 대피소에서 안내를 확인하자.','모형은 붉은 물의 흐름을 보여 줘. 실제 화산에서는 뜨거운 용암과 기체, 화산재, 암석 조각도 나올 수 있어.'][s.step]);
  return fail(s.step===2?'모형에서 본 붉은 물과 실제 화산에서 관찰한 분출물을 다시 비교해 봐.':'용암은 뜨겁고, 화산재는 숨을 쉴 때 몸에 해로울 수 있어. 위험 구역에서 멀어지는 공식 안내를 따라가자.');
 }
 if(id==='city'){
  const good=['close','inside','notice'][s.step];if(action===good)return pass(['창문을 닫아 실내로 들어오는 화산재를 줄였어.','야외 활동을 멈추고 실내에서 안내를 기다려.','관측 정보와 행동 요령을 주민에게 전달했어.'][s.step]);return fail('관측 소식은 화산재가 날린다는 거야. 창문을 열거나 야외로 나가기보다 공식 안내에 맞는 대응을 골라봐.');
 }
 if(id==='safety'){
  const good=['cover','hold','stopped','assembly'][s.step];if(action===good)return pass(['튼튼한 책상 아래에서 몸을 보호해.','책상 다리를 잡고 흔들림이 멈추기를 기다려.','흔들림이 멈췄어. 선생님 안내에 따라 이동하자.','계단을 이용해 넓은 집합 장소에 도착했어.'][s.step]);return fail('순서를 다시 살펴봐. 흔들리는 동안 뛰어나가지 않고 먼저 몸을 보호해. 엘리베이터는 이용하지 않아.');
 }
 return {state:s,changed:false,message:'지금 할 수 있는 조작을 골라 줘.'};
}
