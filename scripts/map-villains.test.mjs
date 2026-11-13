import test from 'node:test';import assert from 'node:assert/strict';
import {MAP_VILLAINS,normalizeVillains,hitVillain,defeatedVillains} from '../src/map-villain-rules.js';
import {fresh,sanitize,canEnter} from '../src/model.js';
test('three distinct hits remove a villain once without changing academic progress',()=>{
 const s=fresh(),completed=structuredClone(s.completed);let p=s.mapVillains;
 for(let n=1;n<=3;n++){const r=hitVillain(p,'river');assert.equal(r.remaining,3-n);assert.equal(r.defeated,n===3);assert.equal(p.hits.river,n-1);p=r.progress;}
 assert.equal(hitVillain(p,'river'),null);assert.equal(hitVillain(p,'unknown'),null);assert.equal(defeatedVillains(p),1);assert.deepEqual(s.completed,completed);assert.equal(canEnter(1,s),false);
});
test('old progress, partial hits and all clears survive supported save migration',()=>{
 const old={version:3,started:true,completed:['river'],residentStamps:['river'],records:{river:{summary:'keep'}},drafts:{},mapNode:6};
 const state=sanitize(old);assert.equal(defeatedVillains(state.mapVillains),0);state.mapVillains=hitVillain(state.mapVillains,'river').progress;
 const restored=sanitize(JSON.parse(JSON.stringify(state)));assert.equal(restored.mapVillains.hits.river,1);assert.deepEqual(restored.records,state.records);assert.deepEqual(restored.residentStamps,['river']);
 for(const v of MAP_VILLAINS)restored.mapVillains.hits[v.id]=3;
 const done=sanitize(restored);assert.equal(defeatedVillains(done.mapVillains),5);assert.deepEqual(done.completed,['river']);assert.equal(canEnter(2,done),false);
});
test('malformed map combat fields cannot introduce unknown IDs or invalid hit counts',()=>{
 for(const value of [null,[],true,'bad'])assert.equal(defeatedVillains(normalizeVillains(value)),0);
 const p=normalizeVillains({hits:{river:99,volcano:-1,rocks:1.5,city:'3',safety:NaN,unknown:3}});
 assert.deepEqual(p.hits,{river:3,volcano:0,rocks:0,city:0,safety:0});assert.equal(Object.keys(p.hits).length,5);
});

import {createCombat,stepCombat,attackCombat,restartCombat,COMBAT,villainCellSize,riverCombatFrame} from '../src/map-combat-engine.js';
test('contact costs one heart with invulnerability; knockout and restart preserve defeats',()=>{
 const g=createCombat({hits:{river:3}},0),e=g.enemies[1],h={x:e.x,y:e.y};
 assert.equal(stepCombat(g,h,33,1201)[0].health,2);assert.deepEqual(stepCombat(g,h,33,1300),[]);
 e.x=h.x;e.y=h.y;assert.equal(stepCombat(g,h,33,3100)[0].health,1);
 e.x=h.x;e.y=h.y;assert.equal(stepCombat(g,h,33,5000)[0].type,'knockout');assert.equal(g.progress.health,0);
 assert.equal(attackCombat(g,h,6000),null);restartCombat(g,6100);assert.equal(g.progress.health,3);assert.equal(g.progress.hits.river,3);assert.equal(g.invulnerableUntil,9100);
});
test('attacks require proximity, cool down, play distinct hurt and defeat frames',()=>{
 const g=createCombat(null,0),e=g.enemies[0];assert.equal(attackCombat(g,{x:0,y:0},1000).type,'miss');assert.equal(attackCombat(g,{x:e.x,y:e.y},1100),null);
 assert.equal(attackCombat(g,{x:e.x+COMBAT.attackRange+1,y:e.y},1600).type,'miss');
 assert.equal(attackCombat(g,e,2200).remaining,2);assert.equal(e.frame,4);assert.equal(attackCombat(g,e,2800).remaining,1);assert.equal(attackCombat(g,e,3400).type,'defeat');assert.equal(e.frame,5);assert.equal(g.progress.hits.river,3);
});
test('enemy movement is bounded after long background frame and health survives migration',()=>{
 const g=createCombat(null,0),e=g.enemies[0],start={x:e.x,y:e.y};stepCombat(g,{x:e.x+100,y:e.y},999999,1);
 assert.ok(Math.hypot(e.x-start.x,e.y-start.y)<=COMBAT.speed*.05);assert.equal(sanitize({...fresh(),mapVillains:{health:0}}).mapVillains.health,0);
 assert.equal(normalizeVillains({health:-2}).health,3);assert.equal(normalizeVillains({health:90}).health,3);
});

test('starting camp and learning doorways are safe while children read',()=>{
 for(const [x,y]of [[.18,.75],[.16,.38],[.29,.205],[.65,.205],[.77,.46],[.70,.70]]){
  const g=createCombat(null,0),h={x:x*1200,y:y*675};for(let t=0;t<30000;t+=40)stepCombat(g,h,40,t);assert.equal(g.progress.health,3,`safe reading point ${x},${y}`);
 }
});

test('villain artwork is exactly half size while combat frame choices are valid',()=>{
 for(const s of [.2,.5,1,2,4])assert.equal(villainCellSize(s),Math.max(64,Math.min(190,112*s))/2);
 for(const pose of [1,2,3])for(const elapsed of [0,100,200,350,600])assert.ok(riverCombatFrame(pose,elapsed)>=0&&riverCombatFrame(pose,elapsed)<=7);
 assert.deepEqual([0,100,200,350].map(t=>riverCombatFrame(1,t)),[0,1,2,3]);
});
test('targeted strikes hit only that nearby enemy and give brief contact protection',()=>{
 const g=createCombat(null,0),e=g.enemies[0],h={x:e.x-50,y:e.y};
 assert.equal(attackCombat(g,h,2000,'volcano').type,'miss');
 assert.equal(g.progress.hits.river,0);
 assert.equal(attackCombat(g,h,2600,'river').type,'hit');
 const before=g.progress.health;e.x=h.x;e.y=h.y;
 assert.deepEqual(stepCombat(g,h,16,2700),[]);assert.equal(g.progress.health,before);
});

test('map encounter contact is visual and legacy knockout never blocks movement',()=>{
 const g=createCombat({health:0,hits:{river:1}},0,{visualOnly:true}),e=g.enemies[0],h={x:e.x,y:e.y};
 assert.equal(stepCombat(g,h,33,1201)[0].type,'hurt');
 assert.equal(g.heroPose,2);
 assert.equal(g.progress.health,3);
 assert.equal(g.progress.hits.river,1);
 assert.deepEqual(stepCombat(g,h,33,1300),[]);
 assert.equal(attackCombat(g,h,2000).remaining,1);
});
