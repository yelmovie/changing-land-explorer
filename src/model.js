import {FIELD_POINTS,ROCKS,FEATURES,CITY_SITES,RIVER_MARKS} from './learning-model.js';
import {MODEL_MOUTH} from './observation-scenes.js';
export const STAGES=[
 {id:'river',name:'강의 비밀',subtitle:'물이 지나가면 땅은 어떻게 달라질까?',place:'물길 관측소',npc:'리버',standard:'4과11-01',color:'#338b9c',reward:'물길 렌즈',tool:'lens',record:'강 변화 기록',change:'강 관측소에 불이 켜졌어!',intro:'강가의 조사 기록이 물에 젖었어. 직접 물을 흘려 보고, 달라진 곳을 찾아 줄래?',benefit:'관찰을 마치면 물길 렌즈를 받아. 다음 장소에서 놓친 단서를 크게 볼 수 있어.',steps:['물을 흘려 보자','달라진 곳을 찾자','강을 따라 조사하자','내 발견을 정리하자']},
 {id:'volcano',name:'깨어나는 화산',subtitle:'모형과 진짜 화산은 무엇이 다를까?',place:'화산 연구소',npc:'마그',standard:'4과11-02',color:'#c86b42',reward:'비교 카메라',tool:'camera',record:'화산 비교 기록',change:'화산 연구소의 관측등이 켜졌어!',intro:'마그가 만든 화산 모형과 실제 화산 자료가 뒤섞였대. 만들고, 관찰하고, 차이를 찾아보자.',benefit:'모형과 실제를 비교하면 비교 카메라를 받아. 암석 두 개를 나란히 살펴볼 수 있어.',steps:['화산 모형을 만들자','천천히 흘려 보자','실제 화산을 관찰하자','같은 점과 다른 점']},
 {id:'rocks',name:'돌 속의 단서',subtitle:'이 돌의 이름은 어떻게 알아낼까?',place:'암석 공방',npc:'지오',standard:'4과11-03',color:'#8971a0',reward:'표본 상자',tool:'box',record:'암석 관찰 기록',change:'암석 공방의 표본 이름표를 되찾았어!',intro:'지오의 표본 상자에서 이름표가 떨어졌어. 색과 알갱이를 크게 살펴서 제자리를 찾아주자.',benefit:'관찰 기록을 완성하면 내 표본 상자를 받아. 마지막 탐험에서 표본과 관찰 메모를 다시 꺼내 볼 수 있어.',steps:['표본을 깨끗하게','돋보기로 살펴보자','같은 돌끼리 모으자','새 표본도 알아볼까?']},
 {id:'city',name:'도시의 시간여행',subtitle:'화산은 우리 생활에 어떤 영향을 줄까?',place:'시간 관측소',npc:'타임',standard:'4과11-04',color:'#6e9562',reward:'안전 나침반',tool:'compass',record:'도시 변화 기록',change:'주민 안내판에 정확한 소식이 도착했어!',intro:'타임의 사진첩이 뒤섞였어. 같은 장소의 시간을 움직이며 주민들에게 필요한 소식을 찾아보자.',benefit:'시간과 장소를 함께 살펴보면 안전 나침반을 받아. 안전 훈련에서 위험한 주변을 점검할 수 있어.',steps:['시간을 움직이자','사진 속 변화를 찾자','영향을 정리하자','주민에게 소식을 전하자']},
 {id:'safety',name:'우리의 안전길',subtitle:'흔들릴 때와 멈춘 뒤, 어떻게 행동할까?',place:'안전 훈련소',npc:'세이프',standard:'4과11-04',color:'#c0903c',reward:'탐험대 깃발',tool:'flag',record:'안전 행동 기록',change:'안전 훈련소의 준비 표시등이 켜졌어!',intro:'세이프와 함께하는 안전 훈련이야. 리버를 보호하고, 흔들림이 멈추면 안전한 길로 안내해 줘.',benefit:'몸 보호와 대피를 모두 마치면 탐험대 깃발을 받아. 마지막 기록탑에서 다섯 발견을 연결하자.',steps:['주변을 먼저 살피자','흔들릴 때 몸을 보호해','멈춘 뒤 안전한 길로','다른 장소에서도 실천해']}
];
export const LEGACY_SAVE_KEY='moving-geovalley-v2';
export const SAVE_KEY='moving-geovalley-v3';
const TITLES=[['두 실험을 비교해','강에서 흔적을 찾아'],['화산 모형을 만들어','모형과 화산을 비교해'],['돌을 크게 살펴봐','내 증거로 이름을 찾아'],['도시의 시간을 비교해','주민 안내판을 만들어'],['흔들릴 때 몸을 보호해','안전한 길을 그려']];
STAGES.forEach((s,i)=>s.steps=TITLES[i]);
export const fresh=()=>({version:3,started:false,completed:[],drafts:{},records:{},sound:true,mapNode:0,final:{round:0,answers:{},links:{}},finished:false});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function cleanData(value,depth=0){if(depth>12)return null;if(typeof value==='string')return value.slice(0,1000);if(typeof value==='number')return Number.isFinite(value)?value:0;if(typeof value==='boolean'||value===null)return value;if(Array.isArray(value)){const coordinates=value.every(p=>object(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y));return (coordinates?value:value.slice(0,600)).map(v=>cleanData(v,depth+1));}if(object(value)){const out={};for(const [k,v]of Object.entries(value).slice(0,100)){if(!['__proto__','constructor','prototype'].includes(k))out[k]=cleanData(v,depth+1);}return out;}return null;}
export function sanitize(value){
 const base=fresh();if(!object(value)||![2,3].includes(value.version))return base;
 base.started=value.started===true;base.sound=value.sound!==false;base.mapNode=Number.isInteger(value.mapNode)&&value.mapNode>=0&&value.mapNode<29?value.mapNode:0;
 base.completed=[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(id=>STAGES.some(s=>s.id===id)))];
 for(const s of STAGES){const record=value.records?.[s.id];if(object(record)){base.records[s.id]=cleanData(record);if(object(base.records[s.id].data))base.records[s.id].data=normalizeActivityData(base.records[s.id].data);}const draft=value.drafts?.[s.id];if(object(draft)){base.drafts[s.id]={step:value.version===2?Math.min(1,Math.floor((Number(draft.step)||0)/2)):Math.min(1,Math.max(0,Number(draft.step)||0)),passed:[],data:{}};if(value.version===3){base.drafts[s.id].data=normalizeActivityData(object(draft.data)?cleanData(draft.data):{});base.drafts[s.id].passed=(Array.isArray(draft.passed)?draft.passed:[]).filter(n=>n===0||n===1);}else base.drafts[s.id].legacy=cleanData(draft);}}
 base.finished=value.finished===true;if(value.version===3&&object(value.final))base.final={...base.final,...cleanData(value.final)};
 const loc=value.location;if(object(loc)&&['home','map','stage','final'].includes(loc.type)){if(loc.type!=='stage'||(Number.isInteger(loc.arg?.index)&&loc.arg.index>=0&&loc.arg.index<5)){base.location=cleanData(loc);if(value.version===2&&base.location.type==='stage')base.location.arg.step=Math.min(1,Math.floor((base.location.arg.step||0)/2));}}
 base.final.round=Math.min(3,Math.max(0,Math.floor(Number(base.final.round)||0)));for(const k of ['answers','links','selected'])if(!object(base.final[k]))base.final[k]={};base.final.assembled=base.final.assembled===true;base.final.transferSafety=normalizeActivityData(object(base.final.transferSafety)?base.final.transferSafety:{});base.final.transferRockClaims=Array.isArray(base.final.transferRockClaims)?[...new Set(base.final.transferRockClaims.filter(k=>['light','coarse'].includes(k)))]:[];if(base.final.transferRiverPoint&&(!Number.isFinite(base.final.transferRiverPoint.x)||!Number.isFinite(base.final.transferRiverPoint.y)))delete base.final.transferRiverPoint;return base;
}
export function loadProgress(storage){try{const current=storage.getItem(SAVE_KEY);if(current){try{return sanitize(JSON.parse(current));}catch{}}const legacy=storage.getItem(LEGACY_SAVE_KEY);return legacy?sanitize(JSON.parse(legacy)):fresh();}catch{return fresh();}}
// Compare-then-write: storage another window changed after our last read/write is never overwritten. Not an atomic lock.
export const saveDecision=(lastRaw,currentRaw,nextRaw)=>currentRaw===nextRaw?'same':currentRaw!==lastRaw?'conflict':'write';
// Teacher preview copy only: example earlier observations (demo:true) so any later phase can be shown. Never call with the student's record.
export function seedPreview(state){
 const data=id=>(state.drafts[id]??={step:0,passed:[],data:{}}).data??={};
 const add=(stage,activity,phase,item)=>{const ev=data(stage).evidence??={};ev[item.id]??={...item,label:'시연 예시 · '+item.label,stage,activity,phase,demo:true};};
 data('river').prediction??={x:RIVER_MARKS.deposit.x,y:RIVER_MARKS.deposit.y,demo:true};
 FIELD_POINTS.forEach(p=>add('river',1,p.side==='upper'?0:1,{id:p.id,kind:'field',label:p.label,asset:'river-field',point:{x:p.x/1000,y:p.y/560},zoom:2.5,claim:p.claim,text:p.text}));
 const parts=['tray','mountain','water'],volcano=data('volcano');if(!volcano.assembly?.length)volcano.assembly=[...parts];
 for(const [claim,label,point,text] of [['mouth','물이 나온 입구',{x:MODEL_MOUTH.x/1200,y:MODEL_MOUTH.y/640},'붉은 물이 꼭대기의 구멍으로 나왔어.'],['flow','경사면을 흐른 붉은 물',{x:700/1200,y:398/640},'붉은 물이 모형의 경사면을 따라 흘렀어.']])add('volcano',0,2,{id:'model-'+claim,kind:'model',sceneVersion:1,parts:[...parts],time:1,asset:'volcano-lab',label,point,claim,text});
 for(const r of ROCKS.slice(0,2))for(const claim of [r.color,r.grain])add('rocks',0,r.id+1,{id:`rock-${r.id}-${claim}`,kind:'rock',sample:r.id,claim,asset:r.asset,label:`${r.name} · ${FEATURES[claim]}`,point:{x:.5,y:.5},zoom:2.35,annotations:[],text:FEATURES[claim]});
 CITY_SITES.forEach((s,i)=>add('city',0,i,{id:'city-'+s.id,kind:'city',label:s.name+'의 시간 변화',claim:s.claim,pair:true,site:s.id,text:s.now+' '+s.later}));
 return state;
}
export function canEnter(index,state,admin=false){return admin||index===0||state.completed.includes(STAGES[index-1]?.id);}
export function award(state,id,record){if(!STAGES.some(s=>s.id===id))return state;return {...state,completed:[...new Set([...state.completed,id])],records:{...state.records,[id]:structuredClone(record)}};}
export const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
export function pointInRect(p,r,pad=0){return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
export function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;const t=den?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/den):0;return distance(p,{x:a.x+t*dx,y:a.y+t*dy});}
export function segmentHitsRect(a,b,r){const d=distance(a,b);for(let i=0;i<=Math.ceil(d/2);i++){const t=i/Math.max(1,Math.ceil(d/2));if(pointInRect({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},r))return true;}return false;}
export function validateRoute(points,{start,goal,hazards=[],gates=[],corridors=[],bounds={x:0,y:0,w:1000,h:560}}){
 if(points.length<2||distance(points[0],start)>55)return {ok:false,message:'리버가 서 있는 시작점에서 길을 그려 줘.'};
 for(let i=1;i<points.length;i++){if(!pointInRect(points[i],bounds))return {ok:false,message:'지도 안의 길로 안내해 줘.',index:i};const hit=hazards.find(h=>segmentHitsRect(points[i-1],points[i],h));if(hit)return {ok:false,message:hit.message||'위험한 곳을 지나고 있어. 이 구간을 돌아가자.',index:i};if(corridors.length){const a=points[i-1],b=points[i],n=Math.ceil(distance(a,b)/3);for(let k=0;k<=n;k++){const t=k/Math.max(1,n),p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(!corridors.some(r=>distanceToSegment(p,r.a,r.b)<r.width/2))return {ok:false,message:'벽이나 화단은 통과할 수 없어. 보이는 통로를 따라 그려 줘.',index:i};}}}
 if(distance(points.at(-1),goal)>55)return {ok:false,message:'안전한 도착점까지 길을 이어 줘.'};
 const missing=gates.find(g=>!points.some((p,i)=>i&&distanceToSegment(g,points[i-1],p)<(g.radius||55)));if(missing)return {ok:false,message:missing.message||'안전한 통로를 지나가자.'};
 return {ok:true,message:'주변 위험을 피해서 안전한 곳에 도착했어!'};
}
export function compareFlow(runs){return runs.length>=2&&new Set(runs.map(r=>r.water)).size>=2;}
export function sortCorrect(placements,answers){return Object.entries(answers).every(([id,target])=>placements[id]===target);}
export function observedEnough(observations,keys){return keys.every(k=>observations.includes(k));}

export function normalizeActivityData(d){
 for(const k of ['runs','assembly','schoolRoute','outsideRoute','schoolRouteHistory','outsideRouteHistory'])if(!Array.isArray(d[k]))d[k]=[];
 for(const k of ['evidence','rockNames','rockProofs','comparisons','notices','citySeen','protect'])if(!object(d[k]))d[k]={};
 const index=(k,max)=>d[k]=Math.max(0,Math.min(max,Math.floor(Number(d[k])||0)));
 for(const k of ['fieldIndex','compareIndex','rockSample'])index(k,3);for(const k of ['citySite','noticeSite'])index(k,2);
 d.runs=d.runs.filter(r=>object(r)&&[1,2].includes(r.water));d.assembly=d.assembly.filter(k=>['tray','mountain','water'].includes(k));
 for(const k of ['schoolRoute','outsideRoute'])d[k]=d[k].filter(p=>object(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y));
 for(const [key,e] of Object.entries(d.evidence)){if(!object(e)||typeof e.id!=='string'||typeof e.kind!=='string'){delete d.evidence[key];continue;}if(e.point&&(!Number.isFinite(e.point.x)||!Number.isFinite(e.point.y)))delete e.point;if(['river','model','rock','field'].includes(e.kind)&&!e.point){delete d.evidence[key];continue;}if(e.kind==='route'&&!Array.isArray(e.points))delete d.evidence[key];if(e.annotations&&!Array.isArray(e.annotations))e.annotations=[];}
 for(const key of Object.keys(d.rockProofs))if(!Array.isArray(d.rockProofs[key]))d.rockProofs[key]=[];
 if(!object(d.rockView))d.rockView={x:.5,y:.5,zoom:1.8};d.rockView={x:Math.max(0,Math.min(1,Number(d.rockView.x)||.5)),y:Math.max(0,Math.min(1,Number(d.rockView.y)||.5)),zoom:Math.max(1,Math.min(3,Number(d.rockView.zoom)||1.8))};
 for(const k of ['modelTime','injected','wipe','scrub'])if(d[k]!==undefined)d[k]=Math.max(0,Math.min(1,Number(d[k])||0));
 if(d.prediction&&(!Number.isFinite(d.prediction.x)||!Number.isFinite(d.prediction.y)))delete d.prediction;
 return d;
}
