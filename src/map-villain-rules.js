// Fictional map play never changes scientific records or stage unlocks.
export const VILLAIN_HITS=3;
export const HERO_HEALTH=3;
export const MAP_VILLAINS=[
 {id:'river',name:'물길의 돌먼지 대장',node:1,x:.26,y:.56,cue:'바위',tint:'#5dd7bc',lines:["물이 흙을 옮긴 걸 찾아냈어? 내 바위 댐은 어쩌라고!", "다음엔 돌멩이로 물길 통행료를 받을 테다!"],hit:["앗, 내 바위 댐에 금이 갔어!", "자갈이 물길 밖으로 튀었어!"],finish:"흥, 물길은 열어 줄게!"},
 {id:'volcano',name:'화산길의 돌먼지 대장',node:10,x:.39,y:.36,cue:'분화 표지',tint:'#ff8958',lines:["화산 모형에서 분화 순서를 알아냈어? 표지판을 뒤집었는데!", "분화 그림 맨 위엔 내 얼굴을 그려야겠어!"],hit:["앗, 분화 표지가 펄럭여!", "내가 섞은 분화 그림이 정리됐어!"],finish:"쳇, 분화 안내판은 똑바로 세울게!"},
 {id:'rocks',name:'암석길의 돌먼지 대장',node:16,x:.70,y:.38,cue:'층진 돌',tint:'#e4bd6c',lines:["바위 속 알갱이로 암석을 구별했어? 내 돌 위장이 들통이야!", "다음엔 모든 돌에 ‘돌먼지표’라고 쓸 테다!"],hit:["앗, 숨겨 둔 암석 표본이 굴렀어!", "내가 섞은 바위가 다 나뉘었잖아!"],finish:"흥, 암석 표본은 제자리에 둘게!"},
 {id:'city',name:'도시길의 돌먼지 대장',node:20,x:.67,y:.52,cue:'돌 표찰',tint:'#9ed2ff',lines:["화산이 도시를 어떻게 바꾸는지 찾았어? 안내판 뒤에 숨겨 놨는데!", "그래도 내 돌 표찰에는 먼지가 수북할걸!"],hit:["앗, 돌 표찰 뒤의 기록이 보였어!", "내가 숨긴 도시 기록까지 펼쳐졌잖아!"],finish:"쳇, 도시 기록은 돌려줄게!"},
 {id:'safety',name:'안전길의 돌먼지 대장',node:25,x:.54,y:.55,cue:'조약돌',tint:'#f4cd58',lines:["안전길을 골랐어? 내 조약돌 바리케이드가 다 들켰어!", "다음엔 안전 표지판 뒤에 숨을 거야!"],hit:["앗, 조약돌 탑이 흔들려!", "내가 가린 안전 표시가 보여!"],finish:"흥, 안전길은 막지 않을게!"}
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
