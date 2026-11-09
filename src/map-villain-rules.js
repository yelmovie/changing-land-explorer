// Fictional map play never changes scientific records or stage unlocks.
export const VILLAIN_HITS=3;
export const HERO_HEALTH=3;
export const MAP_VILLAINS=[
 {id:'river',name:'물길의 돌먼지 대장',node:1,x:.26,y:.56},
 {id:'volcano',name:'화산길의 돌먼지 대장',node:10,x:.39,y:.36},
 {id:'rocks',name:'암석길의 돌먼지 대장',node:16,x:.70,y:.38},
 {id:'city',name:'도시길의 돌먼지 대장',node:20,x:.67,y:.52},
 {id:'safety',name:'안전길의 돌먼지 대장',node:25,x:.54,y:.55}
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
