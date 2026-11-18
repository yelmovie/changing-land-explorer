import {createRewardCards} from './reward-cards.js';
import {MAP_VILLAINS,VILLAIN_HITS} from './map-villain-rules.js';
import {STAGES} from './model.js';
// One achievement card per map villain, in MAP_VILLAINS order. The star count rises with the place number.
const TITLES={river:'깎고 쌓는 물길 박사',volcano:'화산 분출 관측왕',rocks:'현무암 화강암 탐정',city:'화산 마을 안내왕',safety:'지오밸리 안전 영웅'};
export const REWARD_CARDS=MAP_VILLAINS.map(({id},index)=>({id,title:TITLES[id],stage:STAGES.find(stage=>stage.id===id).place,
 art:`/assets/reward-cards/card-${index+1}-${id}.webp`,thumb:`/assets/reward-cards/thumb-${index+1}-${id}.webp`}));
// A card is owned once its villain has taken all three hits (state.mapVillains). Nothing extra is saved.
export const ownedRewardCards=progress=>REWARD_CARDS.map(({id})=>progress?.hits?.[id]===VILLAIN_HITS);
// reward-cards.js sound names -> sound.js effect names.
const SOUNDS={whoosh:'card-whoosh',reveal:'card-reveal',epic:'card-epic',slot:'card-slot',complete:'card-complete'};
let cue=()=>{};
// Built on first use: the build script and tests load this module without a browser.
let instance;
function rewards(){
 return instance??=createRewardCards({
  setName:'지오밸리 성취 카드',
  cards:REWARD_CARDS,
  theme:{accent:'#f3cb6c',accent2:'#246b58',glow:'#ffe19b',ink:'#243e36'},
  particles:['drop','leaf','spark','star'],
  colors:['#f3cb6c','#ffe19b','#338b9c','#c86b42','#246b58','#ffffff'],
  // The mountain of the app icon (index.html).
  emblem:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 37L21 10l8 14 6-8 9 21z" fill="#f4d47b" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  sound:name=>cue(SOUNDS[name]),
  inertRoot:()=>document.querySelector('#app'),
 });
}
// A card that is waiting to be shown or on its way to its slot keeps that slot empty, even if the header is drawn again in between.
const held=new Set();
const indexOf=id=>REWARD_CARDS.findIndex(card=>card.id===id);
export const holdRewardCard=(id,on=true)=>{if(on)held.add(indexOf(id));else held.delete(indexOf(id));};
// Slot strip for the header, placed just before the sound button (main.js shell()).
export const rewardSlotsHtml=progress=>rewards().slotsHtml(ownedRewardCards(progress).map((owned,index)=>owned&&!held.has(index)));
// Shows the card of a villain defeated just now. origin is the villain's place on screen, play is the map's sound call (sound.js playCue).
export function showRewardCard(id,progress,origin,play){
 const index=indexOf(id);cue=play;held.add(index);
 return rewards().reveal(index,origin,ownedRewardCards(progress)).finally(()=>held.delete(index));
}
