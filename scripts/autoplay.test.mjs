import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayback} from '../src/adventure/playback.js';
import {setup as volcano} from '../src/adventure/volcano.js';
import {setup as rocks} from '../src/adventure/rocks.js';
import {setup as city} from '../src/adventure/city.js';
import {setup as safety} from '../src/adventure/safety.js';
import {setup as river} from '../src/adventure/river.js';
import {ROCKS,FIELD_POINTS,CITY_SITES,SCHOOL_PATH,OUTSIDE_PATH,routeSignature} from '../src/learning-model.js';
globalThis.matchMedia=()=>({matches:false});globalThis.fetch=async()=>({ok:false});
function harness(setup,step,phase,{data={},work={},completed=false}={}){
 const objects=[],drags=[],actions={},events={},cleanups=[],markers=[];let auto,records=0,finishes=0,saves=0,stops=0,time=0;const playback=createPlayback();
 function object(x=0,y=0,list=[]){const t={x,y,list,active:true,visible:true,scale:1};const p=new Proxy(t,{get:(t,k)=>k in t?t[k]:(...a)=>{if(k==='setPosition'){t.x=a[0];t.y=a[1];}if(k==='setVisible')t.visible=a[0];if(k==='setText')t.text=a[0];if(k==='setAlpha')t.alpha=a[0];if(k==='setScale')t.scale=a[0];if(k==='add')t.list.push(a[0]);if(k==='destroy')t.active=false;return p;}});objects.push(p);return p;}
 const add=new Proxy({container:(x=0,y=0,list=[])=>object(x,y,list)},{get:(t,k)=>k in t?t[k]:(...a)=>object(a[0],a[1])});
 const scene={add,make:add,textures:{exists:()=>true,get:()=>({getSourceImage:()=>({width:500,height:500})})},sys:{isActive:()=>true},input:{on:(e,f)=>(events[e]??=[]).push(f),off(){}},children:{list:objects,bringToTop(){}},tweens:{add(){}},time:{now:0}};
 function stop(){playback.stop();}
 const api={step,phase,data,work,completed,admin:false,image:(k,x,y)=>{const o=object(x,y);o.asset=k;return o;},hero:(x,y)=>object(x,y),text:(t,x,y)=>{const o=object(x,y);o.text=t;return o;},panel:object,card:(t,x,y)=>object(x,y,[object()]),paper:object,target:object,task(){},say(){},counter(){},spark(){},sound(){},save(){saves++;},record(item){records++;data.evidence[item.id]=item;},finish(){finishes++;stop();},actions(list){for(const k of Object.keys(actions))delete actions[k];for(const a of list)actions[a.id]=a.onClick;},drag:(o,h)=>drags.push({o,h}),listenCleanup:f=>cleanups.push(f),setToolHandler(){},marker:(x,y,n,click)=>{markers.push({x,y,n,click});return()=>{};},range:()=>({value:0}),autoplay:c=>{auto=c;playback.configure({...c,stop(){stops++;c.stop?.();}});},stopAutoplay:stop};
 const hooks=setup(scene,api)||{};
 const tick=(ms=16000)=>{for(let n=0;n<ms;n+=20){time+=20;scene.time.now=time;playback.update(20,(clock,delta)=>hooks.update?.(clock,delta));}};
 const press=()=>{if(playback.playing)stop();else playback.start();};
 return {data,work,api,hooks,objects,drags,actions,markers,events,press,stop,tick,get auto(){return auto;},get playing(){return playback.playing;},setSpeed:value=>playback.setSpeed(value),counts:()=>({records,finishes,saves,stops}),snapshot:()=>JSON.stringify({data,work}),destroy:()=>{stop();hooks.destroy?.();cleanups.forEach(f=>f());}};
}

const STAGES={river,volcano,rocks,city,safety};
const allowed={river:[[0,0],[0,1],[0,2],[1,0],[1,1]],volcano:[[0,0],[0,1],[1,0]],rocks:[[0,0],[0,1],[0,2],[1,1],[1,2]],city:[[0,0],[0,1],[0,2]],safety:[]};
test('all 30 phases expose autoplay only for the 16 permitted observation or operation phases',()=>{
 for(const [name,setup]of Object.entries(STAGES))for(let step=0;step<2;step++)for(let phase=0;phase<3;phase++){
  const h=harness(setup,step,phase);
  assert.equal(!!h.auto,allowed[name].some(p=>p[0]===step&&p[1]===phase),name+' '+step+'/'+phase);
  h.destroy();
 }
});
for(const [name,setup,step,phase] of [['assembly',volcano,0,0],['brush',rocks,0,0],['red water',volcano,0,1]]){
 test(name+' completes once, pauses and replays without changing saved progress',()=>{
  const h=harness(setup,step,phase);h.press();h.tick(18000);
  assert.equal(h.counts().finishes,1);
  const before=h.snapshot(),counts=h.counts();
  h.press();h.tick(500);h.stop();const paused=h.snapshot();h.tick(3000);assert.equal(h.snapshot(),paused);
  h.press();h.tick(18000);
  assert.equal(h.snapshot(),before);assert.equal(h.counts().finishes,counts.finishes);assert.equal(h.counts().saves,counts.saves);assert.equal(h.counts().records,counts.records);
 });
}
test('pausing red-water injection freezes unfinished flow, and scene pause does too',()=>{
 const h=harness(volcano,0,1);h.press();h.tick(250);h.stop();const at=h.work.flow;h.tick(3000);assert.equal(h.work.flow,at);
 h.press();h.tick(250);h.stop();h.hooks.pause();const next=h.work.flow;h.tick(3000);assert.equal(h.work.flow,next);
 h.press();h.tick(10000);assert.equal(h.work.flow,1);assert.equal(h.counts().finishes,1);
});
test('manual syringe endpoint snaps 97 percent to completion, keeps 90 percent unfinished and replays without duplicate saves',()=>{
 for(const method of ['onMove','onDrop']){
  const h=harness(volcano,0,1),{o,h:handle}=h.drags[0];
  handle[method](o,957,185+.9*145);h.tick(6000);
  assert.equal(h.work.push,.9,method+' must preserve an unfinished stroke');
  assert.equal(h.work.flow,.9);assert.equal(h.counts().finishes,0);
  handle[method](o,957,185+.97*145);h.tick(6000);
  assert.equal(h.work.push,1);assert.equal(h.work.flow,1);assert.equal(h.data.injected,1);assert.equal(h.data.modelTime,1);
  assert.equal(h.counts().finishes,1,method+' reaches the physical endpoint despite the initial drag threshold');
  const saved=h.snapshot(),counts=h.counts();
  for(let i=0;i<2;i++){handle[method](o,957,185+.97*145);h.tick(6000);}
  assert.equal(h.snapshot(),saved);assert.equal(h.counts().saves,counts.saves);assert.equal(h.counts().finishes,counts.finishes);assert.equal(h.counts().records,counts.records);
  h.destroy();
 }
});
for(const [step,phase]of [[0,1],[0,2],[1,1],[1,2]]){
 test('rock '+step+'/'+phase+' resumes the interrupted lens target and never chooses evidence or a name',()=>{
  const h=harness(rocks,step,phase);h.press();h.tick(200);h.stop();const objects=JSON.stringify(h.objects.map(o=>[o.x,o.y]));h.tick(1000);assert.equal(JSON.stringify(h.objects.map(o=>[o.x,o.y])),objects);
  h.press();h.tick(12000);assert.deepEqual(h.work.scanned,[0,4,5]);assert.deepEqual(h.work.proofs,[]);assert.deepEqual(h.data.rockNames,{});
  assert.equal(h.counts().finishes,0);assert.equal(h.counts().records,0);
 });
 test('completed rock '+step+'/'+phase+' replay preserves data and does not repeat completion',()=>{
  const sample=step===0?phase-1:phase+1,r=ROCKS[sample],h=harness(rocks,step,phase,{completed:true,data:{rockNames:{[sample]:r.type},rockProofs:{[sample]:[r.color,r.grain]}},work:{scanned:[0,4,5],proofs:[r.color,r.grain],lens:{x:248,y:220},classified:step===1}});
  const before=h.snapshot(),saved=h.counts().saves;h.press();h.tick(15000);
  assert.equal(h.snapshot(),before);assert.equal(h.counts().saves,saved);assert.equal(h.counts().finishes,0);assert.equal(h.counts().records,0);
 });
}
for(let phase=0;phase<3;phase++){
 test('city '+phase+' resumes an interrupted view and leaves record cards for the learner',()=>{
  const h=harness(city,0,phase);h.press();h.tick(200);h.stop();h.tick(1000);h.press();h.tick(10000);
  assert.deepEqual(h.work.seen,{before:true,after:true});assert.deepEqual(h.work.pairs,[]);assert.equal(h.counts().finishes,0);assert.equal(h.counts().records,0);
  const before=h.snapshot(),saved=h.counts().saves;h.press();h.tick(10000);assert.equal(h.snapshot(),before);assert.equal(h.counts().saves,saved);
 });
}
test('volcano tour observes four outputs without pinning or completing the learner task',()=>{
 const h=harness(volcano,1,0);h.press();h.tick(20000);assert.equal(h.playing,false);assert.deepEqual(h.work.found,[]);assert.equal(h.counts().records,0);assert.equal(h.counts().finishes,0);
 h.press();assert.equal(h.playing,true);
});
test('clicking each volcano output records it once without a separate pin action',()=>{
 const h=harness(volcano,1,0);assert.equal(h.actions['volcano-output-pin'],undefined);
 h.markers[0].click();h.markers[0].click();assert.equal(h.counts().records,1);
 h.markers.slice(1).forEach(m=>m.click());assert.equal(h.counts().records,4);assert.equal(h.counts().finishes,1);
});
// Evidence can be saved just before the phase-complete save if a browser closes.
// Resume must recover from those real observations, not from found flags alone.
const observedScenes=[
 {name:'volcano outputs',setup:volcano,phase:0,kind:'volcano',points:['lava','gas','ash','rock'].map(id=>({id,key:'output-'+id,claim:id}))},
 ...[0,1].map(phase=>({name:phase?'lower river':'upper river',setup:river,phase,kind:'field',points:FIELD_POINTS.filter(p=>p.side===(phase?'lower':'upper')).map(p=>({...p,key:p.id}))}))
];
for(const spec of observedScenes){
 const saved=()=>({work:{found:spec.points.map(p=>p.id)},data:{evidence:Object.fromEntries(spec.points.map(p=>[p.key,{id:p.key,kind:spec.kind,claim:p.claim,point:{x:.5,y:.5}}]))}});
 test(spec.name+' recovers completion from saved observations before the task save',()=>{
  const h=harness(spec.setup,1,spec.phase,saved());
  assert.equal(h.counts().finishes,1,'saved genuine evidence completes the interrupted phase');
  assert.equal(h.counts().records,0,'recovery does not invent or re-record evidence');
  h.markers.forEach(m=>m.click());h.markers.forEach(m=>m.click());
  assert.equal(h.counts().finishes,1);assert.equal(h.counts().records,0);
 });
 test(spec.name+' rejects stale found flags and restores missing or invalid evidence by clicking',()=>{
  const fixture=saved();
  fixture.data.evidence[spec.points[0].key].kind='unrelated';
  for(const p of spec.points.slice(1))fixture.data.evidence[p.key].claim='unrelated';
  const h=harness(spec.setup,1,spec.phase,fixture);
  assert.equal(h.counts().finishes,0,'flags and wrong evidence must not award completion');
  h.markers.slice(0,-1).forEach(m=>m.click());assert.equal(h.counts().finishes,0);
  h.markers.at(-1).click();assert.equal(h.counts().finishes,1);
  assert.equal(h.counts().records,spec.points.length);
  assert.equal(h.work.found.length,spec.points.length,'restored flags are not duplicated');
  for(const p of spec.points){assert.equal(h.data.evidence[p.key].kind,spec.kind);assert.equal(h.data.evidence[p.key].claim,p.claim);}
  h.markers.forEach(m=>m.click());assert.equal(h.counts().records,spec.points.length);assert.equal(h.counts().finishes,1);
 });
 test(spec.name+' completed replay does not repeat completion or change saved observations',()=>{
  const h=harness(spec.setup,1,spec.phase,{...saved(),completed:true}),before=h.snapshot(),counts=h.counts();
  h.markers.forEach(m=>m.click());h.press();h.tick(20000);
  assert.equal(h.snapshot(),before);assert.equal(h.counts().finishes,counts.finishes);assert.equal(h.counts().records,counts.records);assert.equal(h.counts().saves,counts.saves);
 });
}
test('rock orders reuse prior evidence without attaching the same feature cards again',()=>{
 const evidence=Object.fromEntries(ROCKS.slice(0,2).flatMap(r=>[r.color,r.grain].map(claim=>[`rock-${r.id}-${claim}`,{claim}])));
 const h=harness(rocks,1,0,{data:{evidence}});assert.equal(h.drags.length,0);
 h.actions['rock-ship-0']();assert.deepEqual(h.work.sorted,[],'the first order is granite');
 h.actions['rock-ship-1']();assert.deepEqual(h.work.sorted,[1]);
 h.actions['rock-ship-0']();assert.deepEqual(h.work.sorted,[1,0]);assert.equal(h.counts().finishes,1);
 assert.deepEqual(h.data.rockProofs[0],['dark','fine']);assert.deepEqual(h.data.rockProofs[1],['light','coarse']);
});
for(const phase of [0,1,2])test('safety '+phase+' requires direct movement instead of autoplay',()=>{
 const h=harness(safety,1,phase);assert.equal(h.auto,undefined);h.press();h.tick(3000);assert.equal(h.counts().finishes,0);h.destroy();
});
test('completed river field starts a replay on the first press without new evidence',()=>{
 const h=harness(river,1,0);h.press();h.tick(10000);const before=h.snapshot(),count=h.counts().records;
 h.press();assert.equal(h.playing,true);h.tick(10000);assert.equal(h.snapshot(),before);assert.equal(h.counts().records,count);
});

test('red-water animation reuses scene objects instead of rebuilding the apparatus every frame',()=>{
 const h=harness(volcano,0,1),count=h.objects.length;h.press();h.tick(10000);assert.equal(h.objects.length,count);
});
test('reduced-motion mode keeps observation controls functional without travel tweens',()=>{
 globalThis.matchMedia=()=>({matches:true});
 try{const r=harness(rocks,0,1);r.press();r.tick(10000);assert.deepEqual(r.work.scanned,[0,4,5]);const c=harness(city,0,0);c.press();c.tick(10000);assert.deepEqual(c.work.seen,{before:true,after:true});}finally{globalThis.matchMedia=()=>({matches:false});}
});

for(const [name,setup,step,phase] of [['river',river,0,0],['red water',volcano,0,1]]){
 test(name+' playback speed changes simulation and visit timing without skipping completion',()=>{
  const normal=harness(setup,step,phase),fast=harness(setup,step,phase),slow=harness(setup,step,phase);
  fast.setSpeed(3);slow.setSpeed(.5);
  for(const h of [normal,fast,slow]){h.press();h.tick(1000);}
  const progress=h=>name==='river'?h.work.pour:h.work.flow;
  assert.ok(progress(fast)>progress(normal)*2.5);assert.ok(progress(slow)<progress(normal)*.6);
  const before=progress(normal);normal.setSpeed(3);normal.tick(500);assert.ok(progress(normal)>before);
  normal.stop();const paused=normal.snapshot();normal.setSpeed(.5);normal.tick(2000);assert.equal(normal.snapshot(),paused);
  normal.press();normal.setSpeed(3);normal.tick(18000);assert.equal(normal.counts().finishes,1);
  for(const h of [normal,fast,slow])h.destroy();
 });
}
test('speed changes preserve a city tour and leave its answer cards unselected',()=>{
 const h=harness(city,0,0);h.press();h.tick(250);h.setSpeed(3);h.tick(2500);
 assert.equal(h.playing,false);assert.deepEqual(h.work.seen,{before:true,after:true});
 assert.deepEqual(h.work.pairs,[]);assert.equal(h.counts().finishes,0);assert.equal(h.counts().records,0);
 h.destroy();
});
