import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,sanitize} from '../src/model.js';
import {appendRoutePoint,MAX_ROUTE_POINTS} from '../src/route-points.js';
import {inspectRoute,SCHOOL_CONFIG,SCHOOL_PATH} from '../src/learning-model.js';
import {cityPairSVG,cityTimeLabel,modelScene} from '../src/observation-scenes.js';
test('long paths preserve their end, turns, signatures and evidence through all save locations',()=>{
 const route=[SCHOOL_PATH[0],...Array.from({length:760},(_,i)=>({x:150+(i%10)*10,y:100+(i%2)*25})),...SCHOOL_PATH.slice(1)];
 assert.equal(inspectRoute(route,SCHOOL_CONFIG).ok,true);
 const data={schoolRoute:route,evidence:{schoolRoute:{id:'schoolRoute',kind:'route',points:route}},schoolRouteHistory:[route]};
 const s=fresh();s.drafts.safety={step:1,data};s.records.safety={data};s.final.transferSafety={outsideRoute:route};
 const restored=sanitize(JSON.parse(JSON.stringify(s)));
 for(const r of [restored.drafts.safety.data.schoolRoute,restored.records.safety.data.schoolRoute,restored.drafts.safety.data.evidence.schoolRoute.points,restored.drafts.safety.data.schoolRouteHistory[0],restored.final.transferSafety.outsideRoute])assert.deepEqual(r,route);
});
test('input preserves zigzag turns and only simplifies straight forward segments',()=>{
 const route=[];for(let i=0;i<1000;i++)assert.equal(appendRoutePoint(route,{x:140+i%100,y:100+i%2*20}),true);
 assert.equal(route.length,1000);assert.ok(route.length<MAX_ROUTE_POINTS);
 const straight=[];for(const x of [120,140,160,180])appendRoutePoint(straight,{x,y:100});assert.deepEqual(straight,[{x:120,y:100},{x:180,y:100}]);
 appendRoutePoint(straight,{x:180,y:150});assert.equal(straight.length,3);
});
test('airport/spa recovery and farm geological time remain distinct in evidence',()=>{
 for(const i of [0,2]){assert.equal(cityTimeLabel(i),'복구 · 안전 확인 뒤');assert.ok(!cityPairSVG(i).includes('아주 오랜 시간 뒤'));}
 assert.ok(cityPairSVG(1).includes('아주 오랜 시간 뒤'));
});
test('completed model evidence contains the assembled apparatus and the observed red-water flow',()=>{
 const d=modelScene(['tray','mountain','water'],1);
 assert.deepEqual(d.layers.filter(p=>p.type==='image').map(p=>p.asset),['art/volcano-tray','art/volcano-mountain','art/volcano-syringe']);
 assert.ok(d.layers.some(p=>p.type==='line'&&p.color==='#d85e50'&&p.points.at(-1).x===755));
});
