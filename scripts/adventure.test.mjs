import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from '../src/adventure/safety.js';
import {SCHOOL_PATH,inspectRoute,SCHOOL_CONFIG} from '../src/learning-model.js';

// Rendering is stubbed; the real activity input handlers and route rules run.
function routeActivity(){
 const object=()=>{const target={x:0,y:0};const proxy=new Proxy(target,{get:(t,k)=>k in t?t[k]:(...args)=>proxy});return proxy;};
 const handlers={},assists={},actions={};let finished=false;
 const scene={add:new Proxy({},{get:()=>object}),input:{on:(event,fn)=>handlers[event]=fn,off(){}},time:{now:0}};
 const data={},api={step:1,phase:0,data,work:{},image:object,hero:object,panel:object,text:object,
  task(){},say(){},save(){},counter(){},spark(){},record(){},listenCleanup(){},setToolHandler(){},
  assist:(label,fn)=>assists[label]=fn,actions:list=>list.forEach(a=>actions[a.id]=a.onClick),finish:()=>finished=true};
 setup(scene,api);return {data,handlers,assists,actions,finished:()=>finished};
}

test('closing a help dialog cannot add pointer coordinates to an assisted route',()=>{
 const {data,handlers,assists}=routeActivity();
 assists['→ 오른쪽으로 한 칸 잇기']();
 handlers.pointermove({x:0,y:0});handlers.pointerupoutside({x:0,y:0});
 assists['그린 길 저장']();
 assert.deepEqual(data.schoolRoute,[SCHOOL_CONFIG.start,{x:160,y:100}]);
});

test('accessible waypoints pass the same school collision checks as drawn paths',()=>{
 const route=routeActivity();
 for(const [label,count]of [['→ 오른쪽',7],['↓ 아래쪽',9],['→ 오른쪽',11],['↓ 아래쪽',5],['→ 오른쪽',19],['↓ 아래쪽',2]]){
  for(let i=0;i<count;i++){
   route.assists[label+'으로 한 칸 잇기']();
   route.handlers.pointerupoutside({x:0,y:0});
  }
 }
 route.assists['그린 길 저장']();
 assert.equal(route.finished(),false);
 assert.equal(inspectRoute(route.data.schoolRoute,SCHOOL_CONFIG).ok,true);
 route.actions['route-check']();assert.equal(route.finished(),true);
});

test('physical pointer drawing still stores and validates the entire school path',()=>{
 const route=routeActivity(),screen=p=>({x:p.x+100,y:p.y+80});
 route.handlers.pointerdown(screen(SCHOOL_PATH[0]));
 for(const point of SCHOOL_PATH.slice(1,-1))route.handlers.pointermove(screen(point));
 route.handlers.pointerup(screen(SCHOOL_PATH.at(-1)));
 assert.deepEqual(route.data.schoolRoute,SCHOOL_PATH);
 route.actions['route-check']();assert.equal(route.finished(),true);
});

test('tap waypoints validate the same safe route as continuous drawing',()=>{
 const route=routeActivity();route.actions['route-input']();
 for(const point of SCHOOL_PATH)route.handlers.pointerdown({x:point.x+100,y:point.y+80});
 assert.deepEqual(route.data.schoolRoute,SCHOOL_PATH);
 route.actions['route-check']();assert.equal(route.finished(),true);
});

test('tap waypoints cannot skip through a hazard or start away from River',()=>{
 const route=routeActivity();route.actions['route-input']();
 route.handlers.pointerdown({x:700,y:500});
 assert.deepEqual(route.data.schoolRoute,[]);
 route.handlers.pointerdown({x:SCHOOL_CONFIG.start.x+100,y:SCHOOL_CONFIG.start.y+80});
 route.handlers.pointerdown({x:SCHOOL_CONFIG.goal.x+100,y:SCHOOL_CONFIG.goal.y+80});
 route.actions['route-check']();assert.equal(route.finished(),false);
 assert.equal(inspectRoute(route.data.schoolRoute,SCHOOL_CONFIG).ok,false);
});
