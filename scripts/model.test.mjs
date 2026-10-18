import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,sanitize,loadProgress,SAVE_KEY,LEGACY_SAVE_KEY,award} from '../src/model.js';
import {activityComplete,riverFrame,RIVER_MARKS,FIELD_POINTS,ROCKS,CITY_SITES,inspectRoute,replaceRouteSection,routeSignature,SCHOOL_CONFIG,OUTSIDE_CONFIG,SCHOOL_PATH,SCHOOL_ALTERNATIVE,OUTSIDE_PATH} from '../src/learning-model.js';
import {chapterState,chapterComplete,completePhase,discoveryCount,stageDiscoveries,revisitPhase} from '../src/adventure/rules.js';
const river=()=>({prediction:{x:.8,y:.7},runs:[1,2].map(w=>({water:w,complete:true,version:1})),reflection:'same',evidence:Object.fromEntries(Object.entries(RIVER_MARKS).map(([k,p])=>['river-'+k,{point:p,time:1}]))});
test('all ten activities reject empty records',()=>{for(const id of ['river','volcano','rocks','city','safety'])for(const step of [0,1])assert.equal(!!activityComplete(id,step,{}),false);});
test('river requires two different completed conditions and prediction',()=>{const d=river();assert.equal(activityComplete('river',0,d),true);d.runs[1].water=1;assert.equal(activityComplete('river',0,d),false);d.runs[1].water=2;delete d.prediction;assert.equal(activityComplete('river',0,d),false);});
test('river rejects incorrect positions and early captures',()=>{const d=river();d.evidence['river-deposit'].time=.1;assert.equal(activityComplete('river',0,d),false);d.evidence['river-deposit']={point:{x:.2,y:.1},time:1};assert.equal(activityComplete('river',0,d),false);});
test('scrubbing reproduces identical frame without accumulated changes',()=>{const before=riverFrame(.7,2);riverFrame(1,2);riverFrame(0,2);assert.deepEqual(riverFrame(.7,2),before);assert.equal(riverFrame(0,1).erosion,0);assert.equal(riverFrame(0,2).erosion,0);});
test('field observation needs four evidence items and process connection',()=>{const d={evidence:Object.fromEntries(FIELD_POINTS.map(p=>[p.id,{claim:p.claim}]))};assert.equal(activityComplete('river',1,d),false);d.fieldLink='deposit';assert.equal(activityComplete('river',1,d),true);});
test('volcano needs assembled model and two observed scenes',()=>{const d={assembly:['tray','mountain','water'],evidence:{'model-mouth':{time:1},'model-flow':{time:.8}}};assert.equal(activityComplete('volcano',0,d),true);delete d.evidence['model-flow'];assert.equal(activityComplete('volcano',0,d),false);});
test('model comparison distinguishes material and missing products',()=>{const d={evidence:Object.fromEntries(['lava','gas','ash','rock'].map(k=>['output-'+k,{claim:k}])),comparisons:{opening:'same',downhill:'same',material:'different',extra:'different'}};assert.equal(activityComplete('volcano',1,d),true);d.comparisons.material='same';assert.equal(activityComplete('volcano',1,d),false);});
const rocks=()=>({evidence:Object.fromEntries(ROCKS.flatMap(r=>[r.color,r.grain].map(f=>['rock-'+r.id+'-'+f,{claim:f}]))),rockNames:Object.fromEntries(ROCKS.map(r=>[r.id,r.type])),rockProofs:Object.fromEntries(ROCKS.map(r=>[r.id,[r.color,r.grain]]))});
test('rock classification needs both distinct evidence types for all samples',()=>{const d=rocks();assert.equal(activityComplete('rocks',1,d),true);d.rockProofs[2]=['dark','dark'];assert.equal(activityComplete('rocks',1,d),false);});
test('rock name alone is insufficient',()=>{const d=rocks();delete d.evidence['rock-3-coarse'];assert.equal(activityComplete('rocks',1,d),false);});
test('city cannot complete without both-time evidence',()=>{const d={evidence:Object.fromEntries(CITY_SITES.map(s=>['city-'+s.id,{claim:s.claim}]))};assert.equal(activityComplete('city',0,d),false);for(const e of Object.values(d.evidence))e.pair=true;assert.equal(activityComplete('city',0,d),true);});
test('resident messages require own matching observations',()=>{const d={notices:Object.fromEntries(CITY_SITES.map(s=>[s.id,s.claim]))};assert.equal(activityComplete('city',1,d),false);d.evidence=Object.fromEntries(CITY_SITES.map(s=>['city-'+s.id,{claim:s.claim}]));assert.equal(activityComplete('city',1,d),true);});
test('protection needs actual stop and explicit confirmation',()=>{const d={evidence:Object.fromEntries(['window','shelf','desk'].map(k=>['safety-'+k,{}])),protect:{under:true,head:true,leg:true,stopped:false,confirmed:false}};assert.equal(activityComplete('safety',0,d),false);d.protect.stopped=true;assert.equal(activityComplete('safety',0,d),false);d.protect.confirmed=true;assert.equal(activityComplete('safety',0,d),true);});
test('two distinct school paths and an outside path are safe',()=>{assert.equal(inspectRoute(SCHOOL_PATH,SCHOOL_CONFIG).ok,true);assert.equal(inspectRoute(SCHOOL_ALTERNATIVE,SCHOOL_CONFIG).ok,true);assert.equal(inspectRoute(OUTSIDE_PATH,OUTSIDE_CONFIG).ok,true);});
test('long segments through hazards are caught before collision',()=>{const points=[SCHOOL_CONFIG.start,{x:500,y:210},SCHOOL_CONFIG.goal],r=inspectRoute(points,SCHOOL_CONFIG);assert.equal(r.ok,false);assert.match(r.message,/화단/);assert.ok(r.point.x<350||r.point.y<145);});
test('walls cannot be crossed by a jump between distant points',()=>{const r=inspectRoute([SCHOOL_CONFIG.start,{x:280,y:100},{x:280,y:280},{x:280,y:420},SCHOOL_CONFIG.goal],SCHOOL_CONFIG);assert.equal(r.ok,false);assert.match(r.message,/벽/);});
test('invalid start, missing goal and nonfinite routes fail',()=>{assert.equal(inspectRoute([{x:400,y:100},SCHOOL_CONFIG.goal],SCHOOL_CONFIG).ok,false);assert.equal(inspectRoute(SCHOOL_PATH.slice(0,-1),SCHOOL_CONFIG).ok,false);assert.equal(inspectRoute([{x:NaN,y:100},SCHOOL_CONFIG.goal],SCHOOL_CONFIG).ok,false);});
test('partial route edits preserve untouched prefix and suffix',()=>{const before=structuredClone(SCHOOL_PATH),middle=[before[1],{x:300,y:120},before[3]],after=replaceRouteSection(before,1,3,middle);assert.deepEqual(after.slice(0,1),before.slice(0,1));assert.deepEqual(after.slice(-2),before.slice(-2));assert.deepEqual(before,SCHOOL_PATH);});
test('modifying verified path invalidates completion until tested again',()=>{const d={schoolRoute:SCHOOL_PATH,outsideRoute:structuredClone(OUTSIDE_PATH),schoolRouteDone:true,outsideRouteDone:true,schoolRouteSignature:routeSignature(SCHOOL_PATH),outsideRouteSignature:routeSignature(OUTSIDE_PATH)};assert.equal(activityComplete('safety',1,d),true);d.outsideRoute[1].x+=40;assert.equal(activityComplete('safety',1,d),false);});
test('v2 migration preserves original achievement without fake evidence',()=>{const d=sanitize({version:2,started:true,completed:['river'],records:{river:{summary:'original'}},drafts:{river:{step:3,data:{oldNote:'keep'}}}});assert.equal(d.version,3);assert.equal(d.records.river.summary,'original');assert.deepEqual(d.drafts.river.data,{});assert.equal(d.drafts.river.legacy.data.oldNote,'keep');});
test('damaged current JSON falls back to v2 without writing',()=>{const storage={getItem:k=>k===SAVE_KEY?'{':JSON.stringify({version:2,completed:['river']}),setItem:()=>assert.fail('read only')};assert.deepEqual(loadProgress(storage).completed,['river']);});
test('unavailable storage returns usable fresh state',()=>assert.deepEqual(loadProgress({getItem(){throw Error('blocked');}}),fresh()));
test('malformed collections and out-of-range indexes are repaired',()=>{const bad={runs:true,assembly:true,citySite:99,fieldIndex:-10,rockProofs:{0:true},evidence:null};const d=sanitize({version:3,drafts:{river:{data:bad},volcano:{data:bad},city:{data:bad}}});assert.equal(activityComplete('river',0,d.drafts.river.data),false);assert.equal(activityComplete('volcano',0,d.drafts.volcano.data),false);assert.equal(d.drafts.city.data.citySite,2);assert.equal(d.drafts.river.data.fieldIndex,0);});
test('new evidence and marks survive save/load exactly',()=>{const state=fresh();const evidence={id:'rock-0-dark',kind:'rock',point:{x:.3,y:.5},zoom:2,annotations:[{x:.2,y:.4}],claim:'dark'};state.drafts.rocks={step:0,data:{evidence:{'rock-0-dark':evidence}}};assert.deepEqual(sanitize(JSON.parse(JSON.stringify(state))).drafts.rocks.data.evidence['rock-0-dark'],evidence);});
test('award does not mutate student state or repeat rewards',()=>{const before=fresh(),after=award(before,'river',{data:river()});assert.deepEqual(before.completed,[]);assert.deepEqual(award(after,'river',{}).completed,['river']);});
test('completed records and final nested states recover from wrong types',()=>{const d=sanitize({version:3,records:{river:{data:{evidence:{bad:null}}}},final:{transferSafety:true,transferRockClaims:true}});assert.deepEqual(d.records.river.data.evidence,{});assert.deepEqual(d.final.transferRockClaims,[]);assert.ok(Array.isArray(d.final.transferSafety.outsideRoute));});
test('deposition begins after water reaches the downstream area',()=>{assert.equal(riverFrame(.6,2).deposit,0);assert.ok(riverFrame(.95,2).deposit>0);});

test('adventure requires ordered discoveries and never counts repeat rewards',()=>{
 const d={};assert.equal(completePhase(d,0,2,'skip'),false);
 for(const phase of [0,1,2])assert.equal(completePhase(d,0,phase,'found'),true);
 assert.equal(chapterComplete(d,0),true);assert.equal(chapterComplete(d,1),false);
 assert.equal(completePhase(d,0,2,'repeat'),false);
 assert.equal(discoveryCount({drafts:{river:{data:d}}}),3);
});

test('legacy evidence cannot bypass unfinished adventure phases',()=>{
 const d=river();chapterState(d,0);
 assert.equal(activityComplete('river',0,d),false);
 for(const phase of [0,1,2])completePhase(d,0,phase,'found');
 assert.equal(activityComplete('river',0,d),true);
 delete d.prediction;assert.equal(activityComplete('river',0,d),false);
});

test('saved phase returns to the first missing discovery',()=>{
 const d={adventure:{version:1,chapters:{0:{phase:2,tasks:{0:{done:true}},work:{1:{pour:.4}}}}}};
 const c=chapterState(d,0);assert.equal(c.phase,1);assert.equal(c.work[1].pour,.4);
 c.tasks={0:{done:'true'},1:{done:true}};c.phase=2;
 assert.equal(chapterState(d,0).phase,0);assert.equal(completePhase(d,0,2,'skip'),false);
});

test('malformed adventure containers recover without crashing',()=>{
 for(const chapters of [true,[],{0:true},{0:{tasks:true,work:{0:true,1:[],2:null}}}]){
  const d={adventure:{version:1,chapters}},c=chapterState(d,0);
  assert.equal(c.phase,0);assert.deepEqual(c.tasks,{});
  for(const phase of [0,1,2])assert.deepEqual(c.work[phase],{});
  assert.equal(chapterComplete(d,0),false);
 }
});

test('all thirty discoveries and intermediate work survive save and reload',()=>{
 const s=fresh();for(const id of ['river','volcano','rocks','city','safety']){
  const d=s.drafts[id]={step:1,data:{}};
  for(const step of [0,1])for(const phase of [0,1,2])completePhase(d.data,step,phase,'found');
  chapterState(d.data,1).work[2].point={x:320,y:180};
 }
 const loaded=loadProgress({getItem:key=>key===SAVE_KEY?JSON.stringify(s):null});
 assert.equal(discoveryCount(loaded),30);assert.equal(stageDiscoveries(loaded,'rocks'),6);
 assert.deepEqual(loaded.drafts.safety.data.adventure.chapters[1].work[2].point,{x:320,y:180});
});

test('notebook returns to the phase where evidence was captured',()=>{
 const d={evidence:{sample:{activity:0,phase:1}},revisit:'sample'};
 for(const phase of [0,1,2])completePhase(d,0,phase,'found');
 chapterState(d,0).phase=2;
 assert.equal(revisitPhase(d,0).phase,1);assert.equal(d.revisit,undefined);
 assert.equal(chapterComplete(d,0),true);
});

test('revisit cannot skip unfinished discoveries or cross activities',()=>{
 const d={evidence:{sample:{activity:0,phase:2}},revisit:'sample'};
 assert.equal(revisitPhase(d,0).phase,0);
 for(const phase of [0,1,2])completePhase(d,0,phase,'found');
 d.revisit='sample';assert.equal(revisitPhase(d,1).phase,0);
});
