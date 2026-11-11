// These are teaching models, not real-world hazard or engineering predictions.
export const OPERATIONS={
 river:{title:'물길을 읽고 조사 다리 놓기',goal:'물의 흔적을 조사하고, 점검된 양쪽 받침에 다리를 놓아 리버를 보내 줘.',background:'river-canyon-v2',steps:3},
 volcano:{title:'대피 경로와 관측 소식 잇기',goal:'위험 표시를 살피고 안내된 대피 통로만 이어 줘.',background:'volcano-caldera-v2',steps:3},
 rocks:{title:'두 단서로 표본 배송하기',goal:'표본의 색과 알갱이를 비교해 두 주문을 완성해 줘.',background:'rocks-quarry-atelier-v2',steps:2},
 city:{title:'화산재 안내소 운영하기',goal:'관측 소식을 보고 주민에게 필요한 대응을 배치해 줘.',background:'city-message-square-v2',steps:3},
 safety:{title:'몸 보호에서 집합까지',goal:'흔들릴 때 몸을 보호하고, 멈춘 뒤 안내를 따라 이동해 줘.',background:'safety-evacuation-garden-v2',steps:4}
};
export function freshOperation(){return {version:1,step:0,observed:[],choice:null,position:[0,1],attempts:0,done:false};}
export function operationState(raw,id){const s=freshOperation();if(!raw||raw.version!==1)return s;return {...s,step:Math.max(0,Math.min((OPERATIONS[id]?.steps||5)-1,Number(raw.step)||0)),observed:Array.isArray(raw.observed)?raw.observed.filter(x=>typeof x==='string').slice(0,12):[],choice:typeof raw.choice==='string'?raw.choice:null,position:Array.isArray(raw.position)&&raw.position.length===2&&raw.position.every(Number.isInteger)?[Math.max(0,Math.min(4,raw.position[0])),Math.max(0,Math.min(2,raw.position[1]))]:[0,1],attempts:Math.max(0,Number(raw.attempts)||0),done:raw.done===true};}
export function operate(id,raw,action){
 const s=operationState(raw,id);if(!OPERATIONS[id]||s.done)return {state:s,message:'작전 기록이 완성됐어.',changed:false};
 const fail=message=>({state:{...s,attempts:s.attempts+1},message,changed:true,ok:false});
 const pass=message=>{const next={...s,step:s.step+1,observed:[],choice:null};next.done=next.step>=OPERATIONS[id].steps;return {state:next,message,changed:true,ok:true};};
 if(id==='river'){
  if(s.step===0&&action.startsWith('observe:')){const k=action.slice(8);if(!['erosion','transport','deposit'].includes(k))return fail('물길의 세 흔적을 눌러 살펴봐.');s.observed=[...new Set([...s.observed,k])];if(s.observed.length===3)return pass('깎이고 옮겨져 쌓이는 흐름을 찾았어. 이제 다리 위치를 시험하자.');return {state:s,changed:true,message:{erosion:'물가의 흙이 깎였어. 침식의 흔적이야.',transport:'깎인 흙이 물과 함께 아래쪽으로 옮겨져. 운반이야.',deposit:'흐름이 느려진 곳에 흙이 쌓였어. 퇴적의 흔적이야.'}[k]};}
  if(s.step===1&&action.startsWith('bridge:')){s.choice=action.slice(7);return {state:s,changed:true,message:'이 위치에 놓았어. 모형에 물을 흘려 확인해 봐.'};}
  if(s.step===1&&action==='test')return s.choice==='checked'?pass('점검 표시가 있는 양쪽 받침에 연결됐어. 리버가 건널 수 있어!'):fail(s.choice==='bank'?'깎이는 물가라 받침이 남지 않았어. 관찰한 흔적과 점검 표시를 다시 살펴봐.':'쌓인 흙만으로는 안전한 받침인지 알 수 없어. 점검된 받침을 찾아봐.');
  if(s.step===2&&action.startsWith('move:')){
   const direction={east:[1,0],west:[-1,0],north:[0,-1],south:[0,1]}[action.slice(5)];if(!direction)return fail('방향 버튼으로 리버를 움직여 줘.');
   const [x,y]=s.position,next=[x+direction[0],y+direction[1]];
   if(next[0]<0||next[0]>4||next[1]<0||next[1]>2)return fail('조사 모형의 경계야. 길 안으로 움직여 줘.');
   if(next[0]===2&&next[1]!==1)return fail('여기는 강물이라 걸을 수 없어. 점검한 다리로 돌아가자.');
   if(next[0]===1&&next[1]===0)return fail('흙이 깎인 위험 표시가 있어. 다른 길로 돌아가자.');
   s.position=next;if(next[0]===4&&next[1]===1)return pass('리버가 조사 지점에 도착했어! 실제 다리는 전문가가 안전을 점검해.');
   return {state:s,changed:true,message:next[0]===2?'다리 위를 지나고 있어. 조사 깃발까지 안내해 줘.':'리버가 한 칸 이동했어. 다리를 지나 깃발로 가자.'};
  }
 }
 if(id==='volcano'){
  const good=['signed','shelter','station'][s.step];
  if(action===good)return pass(['안내 표지를 따라 위험 구역에서 멀어졌어.','지정된 대피소에 도착해 안내를 확인했어.','대피소 안에서 관측소에 소식을 전달했어. 밖으로 다시 나가지 않아.'][s.step]);
  return fail('분화구와 화산재 구역으로 가까이 가지 않아. 안내된 통로를 따라가자. 실제로는 재난 안내와 선생님 지시를 따라.');
 }
 if(id==='rocks'){
  if(action.startsWith('inspect:')){const k=action.slice(8);if(!['color','grain'].includes(k))return fail('색과 알갱이를 비교해 줘.');s.observed=[...new Set([...s.observed,k])];return {state:s,changed:true,message:k==='color'?'두 표본의 전체 색을 비교했어.':'두 표본의 알갱이 크기를 비교했어.'};}
  if(action.startsWith('ship:')){if(!['color','grain'].every(k=>s.observed.includes(k)))return fail('색 하나만으로 판단하지 말고 색과 알갱이를 모두 살펴봐.');return action===['ship:granite','ship:basalt'][s.step]?pass(s.step===0?'밝은 색과 큰 알갱이, 두 근거로 화강암을 보냈어.':'어두운 색과 작은 알갱이, 두 근거로 현무암을 보냈어.'):fail('주문의 색과 알갱이가 표본의 두 특징과 모두 맞는지 비교해 봐.');}
 }
 if(id==='city'){
  const good=['close','inside','notice'][s.step];if(action===good)return pass(['창문을 닫아 실내로 들어오는 화산재를 줄였어.','야외 활동을 멈추고 실내에서 안내를 기다려.','관측 정보와 행동 요령을 주민에게 전달했어.'][s.step]);return fail('관측 소식은 화산재가 날린다는 거야. 창문을 열거나 야외로 나가기보다 공식 안내에 맞는 대응을 골라봐.');
 }
 if(id==='safety'){
  const good=['cover','hold','stopped','assembly'][s.step];if(action===good)return pass(['튼튼한 책상 아래에서 몸을 보호해.','책상 다리를 잡고 흔들림이 멈추기를 기다려.','흔들림이 멈췄어. 선생님 안내에 따라 이동하자.','계단을 이용해 넓은 집합 장소에 도착했어.'][s.step]);return fail('순서를 다시 살펴봐. 흔들리는 동안 뛰어나가지 않고 먼저 몸을 보호해. 엘리베이터는 이용하지 않아.');
 }
 return {state:s,changed:false,message:'지금 할 수 있는 조작을 골라 줘.'};
}
