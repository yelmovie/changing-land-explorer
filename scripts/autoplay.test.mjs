import test from 'node:test';
import assert from 'node:assert/strict';
import {setup as volcano} from '../src/adventure/volcano.js';
import {setup as rocks} from '../src/adventure/rocks.js';
import {setup as city} from '../src/adventure/city.js';
import {setup as safety} from '../src/adventure/safety.js';
import {setup as river} from '../src/adventure/river.js';
import {ROCKS,FIELD_POINTS,CITY_SITES,SCHOOL_PATH,OUTSIDE_PATH,routeSignature} from '../src/learning-model.js';
globalThis.matchMedia=()=>({matches:false});globalThis.fetch=async()=>({ok:false});
function harness(setup,step,phase,{data={},work={},completed=false}={}){
 const objects=[],drags=[],actions={},events={},cleanups=[];let auto,records=0,finishes=0,saves=0,stops=0,playing=false,elapsed=0,time=0;
 function object(x=0,y=0,list=[]){const t={x,y,list,active:true,visible:true,scale:1};const p=new Proxy(t,{get:(t,k)=>k in t?t[k]:(...a)=>{if(k==='setPosition'){t.x=a[0];t.y=a[1];}if(k==='setVisible')t.visible=a[0];if(k==='setText')t.text=a[0];if(k==='setAlpha')t.alpha=a[0];if(k==='setScale')t.scale=a[0];if(k==='add')t.list.push(a[0]);if(k==='destroy')t.active=false;return p;}});objects.push(p);return p;}
 const add=new Proxy({container:(x=0,y=0,list=[])=>object(x,y,list)},{get:(t,k)=>k in t?t[k]:(...a)=>object(a[0],a[1])});
 const scene={add,make:add,textures:{exists:()=>true},sys:{isActive:()=>true},input:{on:(e,f)=>(events[e]??=[]).push(f),off(){}},children:{list:objects,bringToTop(){}},tweens:{add(){}},time:{now:0}};
 function stop(){if(!playing)return;playing=false;elapsed=0;stops++;auto?.stop?.();}
 const api={step,phase,data,work,completed,admin:false,image:(k,x,y)=>{const o=object(x,y);o.asset=k;return o;},hero:(x,y)=>object(x,y),text:(t,x,y)=>{const o=object(x,y);o.text=t;return o;},panel:object,card:(t,x,y)=>object(x,y,[object()]),paper:object,target:object,task(){},say(){},counter(){},spark(){},sound(){},save(){saves++;},record(item){records++;data.evidence[item.id]=item;},finish(){finishes++;stop();},actions(list){for(const k of Object.keys(actions))delete actions[k];for(const a of list)actions[a.id]=a.onClick;},drag:(o,h)=>drags.push({o,h}),listenCleanup:f=>cleanups.push(f),setToolHandler(){},marker:()=>()=>{},range:()=>({value:0}),autoplay:c=>auto=c,stopAutoplay:stop};
 const hooks=setup(scene,api)||{};
 const tick=(ms=16000)=>{for(let n=0;n<ms;n+=20){time+=20;scene.time.now=time;hooks.update?.(time,20);if(playing){if(!auto.ready()){stop();continue;}elapsed+=20;if(elapsed>=auto.interval){elapsed=0;auto.advance();}}}};
 const press=()=>{if(playing){stop();return;}if(!auto?.ready())return;playing=true;elapsed=0;auto.advance();};
 return {data,work,api,hooks,objects,drags,actions,events,press,stop,tick,get auto(){return auto;},get playing(){return playing;},counts:()=>({records,finishes,saves,stops}),snapshot:()=>JSON.stringify({data,work}),destroy:()=>{stop();hooks.destroy?.();cleanups.forEach(f=>f());}};
}

const STAGES={river,volcano,rocks,city,safety};
const allowed={river:[[0,0],[0,1],[0,2],[1,0],[1,1]],volcano:[[0,0],[0,1],[1,0]],rocks:[[0,0],[0,1],[0,2],[1,1],[1,2]],city:[[0,0],[0,1],[0,2]],safety:[[1,1],[1,2]]};
test('all 30 phases expose autoplay only for the 18 permitted observation or operation phases',()=>{
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
for(const [phase,key,path]of [[1,'schoolRoute',SCHOOL_PATH],[2,'outsideRoute',OUTSIDE_PATH]]){
 test('safety '+phase+' only walks the learner route, pauses and replays without rewriting it',()=>{
  const empty=harness(safety,1,phase);empty.press();empty.tick(3000);assert.equal(empty.auto.ready(),false);assert.deepEqual(empty.data[key],[]);assert.equal(empty.counts().finishes,0);
  const h=harness(safety,1,phase,{data:{[key]:structuredClone(path)}});h.press();h.tick(500);h.stop();const paused=JSON.stringify(h.objects.map(o=>[o.x,o.y]));h.tick(2000);assert.equal(JSON.stringify(h.objects.map(o=>[o.x,o.y])),paused);
  h.press();h.tick(20000);assert.equal(h.counts().finishes,1);assert.deepEqual(h.data[key],path);
  const before=h.snapshot(),saved=h.counts().saves;h.press();h.tick(20000);assert.equal(h.snapshot(),before);assert.equal(h.counts().finishes,1);assert.equal(h.counts().saves,saved);
 });
}
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
