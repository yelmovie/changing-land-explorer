import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from '../src/adventure/safety.js';
import {SCHOOL_PATH,OUTSIDE_PATH,inspectRoute,SCHOOL_CONFIG,OUTSIDE_CONFIG} from '../src/learning-model.js';
function activity(phase=0,completed=false,data={}){
 const objects=[],handlers={},actions={};let finishes=0,clock=0;
 const object=(x=0,y=0)=>{const t={x,y};const p=new Proxy(t,{get:(t,k)=>k in t?t[k]:(...args)=>{if(k==='setPosition'){t.x=args[0];t.y=args[1];}if(k==='setText')t.text=args[0];return p;}});objects.push(p);return p;};
 const scene={add:new Proxy({},{get:()=>object}),make:new Proxy({},{get:()=>object}),textures:{exists:()=>false},input:{on:(e,f)=>handlers[e]=f,off(){}},time:{now:0}};
 const api={step:1,phase,data,completed,work:{},image:object,hero:object,panel:object,text:(t,x,y)=>object(x,y),card:object,task(){},say(){},save(){},counter(){},spark(){},record(){},listenCleanup(){},setToolHandler(){},actions:list=>list.forEach(a=>actions[a.id]=a.onClick),finish:()=>finishes++};
 const hooks=setup(scene,api),tick=ms=>{for(let n=0;n<ms;n+=20)hooks.update(clock+=20,20);};
 const walk=(p,ms=4000)=>{handlers.pointerdown({x:p.x+100,y:p.y+80});tick(ms);};
 return {api,data,objects,actions,hooks,tick,walk,finishes:()=>finishes};
}
for(const phase of [0,1,2])test('direct movement reaches the valid destination in phase '+phase,()=>{
 const h=activity(phase),path=phase===2?OUTSIDE_PATH:SCHOOL_PATH;
 for(const p of path.slice(1))h.walk(p);
 assert.equal(h.finishes(),1);const key=phase===2?'outsideRoute':'schoolRoute';assert.ok(inspectRoute(h.data[key],phase===2?OUTSIDE_CONFIG:SCHOOL_CONFIG).ok);if(phase)assert.equal(h.data[key+'Done'],true);
 const before=JSON.stringify(h.data);h.actions['route-reset']();for(const p of path.slice(1))h.walk(p);assert.equal(h.finishes(),1);assert.equal(JSON.stringify(h.data),before);
});
test('hazards stop movement without exhausting safety practice attempts',()=>{
 const h=activity();for(let i=0;i<4;i++)h.walk({x:140,y:230});assert.ok(h.objects.some(o=>typeof o.text==='string'&&o.text.includes('다시 시도 가능')));assert.equal(h.finishes(),0);h.actions['route-reset']();for(const p of SCHOOL_PATH.slice(1))h.walk(p);assert.equal(h.finishes(),1);
});
test('pause cancels pending movement until a new learner action',()=>{
 const h=activity();h.walk({x:280,y:100},100);h.hooks.pause();const before=h.objects.map(o=>[o.x,o.y]);h.tick(3000);assert.deepEqual(h.objects.map(o=>[o.x,o.y]),before);assert.equal(h.finishes(),0);
});
