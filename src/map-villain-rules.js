// Fictional map play never changes scientific records or stage unlocks.
export const VILLAIN_HITS=3;
export const HERO_HEALTH=3;
export const MAP_VILLAINS=[
 {id:'river',name:'물길의 돌먼지 대장',node:1,x:.26,y:.56,cue:'바위',tint:'#5dd7bc',lines:['물은 여기서 멈춰!','이 바위를 물길에 밀어 넣을까?']},
 {id:'volcano',name:'화산길의 돌먼지 대장',node:10,x:.39,y:.36,cue:'분화 표지',tint:'#ff8958',lines:['이 표지판은 내 장난이지!','표지를 위로 차 볼까?']},
 {id:'rocks',name:'암석길의 돌먼지 대장',node:16,x:.70,y:.38,cue:'층진 돌',tint:'#e4bd6c',lines:['맨 위 돌을 빼면 어쩔래?','이 돌은 비스듬히 놓아야지!']},
 {id:'city',name:'도시길의 돌먼지 대장',node:20,x:.67,y:.52,cue:'돌 표찰',tint:'#9ed2ff',lines:['이 기록은 잠깐 가려 둘게!','표찰 뒤에 기록을 숨겨야지!']},
 {id:'safety',name:'안전길의 돌먼지 대장',node:25,x:.54,y:.55,cue:'조약돌',tint:'#f4cd58',lines:['안내 표지는 안 보이게!','조약돌을 한 층 더 쌓자!']}
];
export function normalizeVillains(value){
 const hits={};for(const {id}of MAP_VILLAINS){const n=value?.hits?.[id];hits[id]=Number.isInteger(n)&&n>=0?Math.min(VILLAIN_HITS,n):0;}
 const health=Number.isInteger(value?.health)&&value.health>=0?Math.min(HERO_HEALTH,value.health):HERO_HEALTH;
 return {version:2,hits,health};
}
export const defeatedVillains=value=>MAP_VILLAINS.filter(v=>value?.hits?.[v.id]===VILLAIN_HITS).length;
export function hitVillain(progress,id){
 if(!MAP_VILLAINS.some(v=>v.id===id))return null;
 const before=normalizeVillains(progress),hits=before.hits[id];if(hits===VILLAIN_HITS)return null;
 before.hits[id]=hits+1;return {progress:before,remaining:VILLAIN_HITS-hits-1,defeated:hits+1===VILLAIN_HITS};
}
