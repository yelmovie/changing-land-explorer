import test from 'node:test';import assert from 'node:assert/strict';
import {MAP_VILLAINS,normalizeVillains,hitVillain} from '../src/map-villain-rules.js';
import {fresh,sanitize} from '../src/model.js';
import {REWARD_CARDS,ownedRewardCards} from '../src/map-rewards.js';
test('one achievement card per map villain, in villain order, with its own art and thumbnail',()=>{
 assert.deepEqual(REWARD_CARDS.map(card=>card.id),MAP_VILLAINS.map(villain=>villain.id));
 assert.deepEqual(REWARD_CARDS.map(card=>card.stage),['물길 관측소','화산 연구소','암석 공방','시간 관측소','안전 훈련소']);
 REWARD_CARDS.forEach((card,index)=>{
  assert.ok(card.title);
  assert.equal(card.art,`/assets/reward-cards/card-${index+1}-${card.id}.webp`);
  assert.equal(card.thumb,`/assets/reward-cards/thumb-${index+1}-${card.id}.webp`);
 });
});
test('a card is owned only when its villain has taken all three hits, straight from the saved hit record',()=>{
 const state=fresh();assert.deepEqual(ownedRewardCards(state.mapVillains),[false,false,false,false,false]);
 let progress=state.mapVillains;
 for(let n=1;n<=3;n++){progress=hitVillain(progress,'rocks').progress;assert.equal(ownedRewardCards(progress)[2],n===3);}
 progress=hitVillain(progress,'river').progress;
 assert.deepEqual(ownedRewardCards(progress),[false,false,true,false,false]);
 // Reloading the save keeps the cards and adds no save field.
 const restored=sanitize(JSON.parse(JSON.stringify({...state,mapVillains:progress})));
 assert.deepEqual(ownedRewardCards(restored.mapVillains),[false,false,true,false,false]);
 assert.deepEqual(Object.keys(restored).sort(),Object.keys(sanitize(fresh())).sort());
 assert.deepEqual(ownedRewardCards(normalizeVillains({hits:Object.fromEntries(MAP_VILLAINS.map(v=>[v.id,3]))})),[true,true,true,true,true]);
 for(const broken of [null,undefined,{},{hits:null}])assert.deepEqual(ownedRewardCards(broken),[false,false,false,false,false]);
});
