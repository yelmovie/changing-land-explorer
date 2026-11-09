import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from '../src/adventure/city.js';
import {CITY_SITES} from '../src/learning-model.js';
globalThis.matchMedia=()=>({matches:true});
function harness(phase,work={},step=0){
 const objects=[],drags=[],actions={};let change,records=0,finished=0;
 const object=(x=0,y=0,list=[])=>{const t={x,y,list,scale:1,height:64,visible:true};const p=new Proxy(t,{get:(t,k)=>k in t?t[k]:(...a)=>{if(k==='add')t.list.push(a[0]);if(k==='setText')t.text=a[0];if(k==='setTexture')t.asset=a[0];if(k==='setVisible')t.visible=a[0];if(k==='setPosition'){t.x=a[0];t.y=a[1];}return p;}});objects.push(p);return p;};
 const add=new Proxy({container:object},{get:(t,k)=>t[k]||object}),data=step===1?{evidence:{['city-'+CITY_SITES[phase].id]:{pair:true}}}:{};
 const api={step,phase,data,work,completed:false,task(){},say(){},save(){},spark(){},counter(){},autoplay(){},listenCleanup(){},image:(key,x,y)=>object(x,y),hero:(x,y,size,asset)=>{const o=object(x,y);o.asset=asset;return o;},paper:object,panel:object,text:(text,x,y)=>{const o=object(x,y);o.text=text;return o;},card:(label,x,y)=>object(x,y,[object()]),target:object,drag:(o,h)=>drags.push({o,h}),range:(label,value,min,max,fn)=>{change=fn;return {value};},record(item){data.evidence[item.id]=item;records++;},finish(){finished++;},actions(list){for(const a of list)actions[a.id]=a;}};
 setup({add,make:add,children:{list:objects},tweens:{add(){}},textures:{exists:()=>true}},api);
 return {data,work,objects,actions,drags,counts:()=>({records,finished}),observe:()=>{change(3);change(97)},drop:(card,slot)=>drags[card].h.onDrop(drags[card].o,slot?670:265,531)};
}
for(let phase=0;phase<3;phase++){
 test('city '+phase+' requires both views and correct learner records exactly once',()=>{
  const h=harness(phase);h.drop(0,0);assert.deepEqual(h.work.pairs,[]);
  h.observe();assert.deepEqual(h.work.seen,{before:true,after:true});assert.deepEqual(h.work.pairs,[]);
  h.drop(2,1);h.drop(0,1);assert.deepEqual(h.work.pairs,[]);
  h.drop(0,0);h.drop(0,0);assert.deepEqual(h.work.pairs,[0]);assert.equal(h.counts().records,0);
  h.drop(1,1);assert.deepEqual(h.counts(),{records:1,finished:1});
  const s=CITY_SITES[phase],record=h.data.evidence['city-'+s.id];assert.equal(record.claim,s.claim);assert.equal(record.pair,true);assert.equal(record.site,s.id);
  h.drop(1,1);h.observe();assert.deepEqual(h.counts(),{records:1,finished:1});
 });
 test('city '+phase+' resumes completed comparison without inventing extra records',()=>{
  const work={wipe:.03,seen:{before:true,after:true},pairs:[0]};
  const h=harness(phase,work);assert.equal(h.actions['city-choose-record'].disabled,false);h.drop(1,1);assert.deepEqual(h.counts(),{records:1,finished:1});
 });
}

test('mask completion uses the fully drawn character and hides the separate mask',()=>{
 const h=harness(0,{board:{picture:true,reason:true,action:true},ashWindow:true},1),mask=h.drags.at(-1);
 mask.h.onDrop(mask.o,985,375);
 assert.equal(h.work.ashMask,true);assert.equal(mask.o.visible,false);
 assert.ok(h.objects.some(o=>o.asset==='hero-protect-mask'));
 assert.deepEqual(h.data.ashSafety,{indoor:true,window:true,mask:true});
});
test('restored mask completion keeps the integrated masked character without a second overlay',()=>{
 const h=harness(0,{board:{picture:true,reason:true,action:true},ashWindow:true,ashMask:true},1);
 assert.ok(h.objects.some(o=>o.asset==='hero-protect-mask'));
 assert.equal(h.drags.at(-1).o.visible,false);
});
