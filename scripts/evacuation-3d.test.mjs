import test from 'node:test';
import assert from 'node:assert/strict';
import {EVAC_PICKUPS,AFTERSHOCKS,solidBlocks} from '../src/adventure/evacuation-3d.js';
import {evacuationCollision} from '../src/adventure/evacuation.js';
import {SCHOOL_CONFIG,SCHOOL_DRILL_CONFIG,OUTSIDE_CONFIG,SCHOOL_PATH,SCHOOL_DRILL_PATH,OUTSIDE_PATH,hazardMargin,inspectRoute,activityComplete,routeSignature} from '../src/learning-model.js';

const inside=(p,r,pad)=>p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
const SCENARIOS=[['school',SCHOOL_CONFIG,SCHOOL_PATH],['drill',SCHOOL_DRILL_CONFIG,SCHOOL_DRILL_PATH],['outside',OUTSIDE_CONFIG,OUTSIDE_PATH]];
const near=(p,path)=>path.some((a,i)=>{const b=path[i+1];if(!b)return false;const t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/((b.x-a.x)**2+(b.y-a.y)**2)));return Math.hypot(a.x+(b.x-a.x)*t-p.x,a.y+(b.y-a.y)*t-p.y)<46;});
for(const [name,config,path] of SCENARIOS)test(`3D ${name} pickups sit on safe floor, away from every hazard's keep-away margin`,()=>{
 const {medals,rules}=EVAC_PICKUPS[name];
 assert.equal(rules.length,3);assert.ok(medals.length>=6);
 for(const p of [...medals,...rules]){
  assert.ok(config.areas.some(r=>inside(p,r,-12)),`${name} ${JSON.stringify(p)} is on walkable floor`);
  for(const r of config.hazards)assert.ok(!inside(p,r,hazardMargin(r)+30),`${name} ${JSON.stringify(p)} keeps clear of ${r.label}`);
 }
 for(const r of rules){assert.ok(r.title&&r.text.length>10);assert.ok(near(r,path),`${name} board ${r.title} is on the reference route`);}
 assert.ok(inspectRoute(path,config).ok);
 for(let i=1;i<path.length;i++)assert.equal(evacuationCollision(path[i-1],path[i],config),null);
});
test('the two school walks are different scenes with different rule boards',()=>{
 assert.notDeepEqual(SCHOOL_DRILL_CONFIG.start,SCHOOL_CONFIG.start);
 assert.notDeepEqual(SCHOOL_DRILL_CONFIG.hazards.map(h=>h.x),SCHOOL_CONFIG.hazards.map(h=>h.x));
 const titles=k=>EVAC_PICKUPS[k].rules.map(r=>r.title);
 assert.equal(titles('drill').filter(t=>titles('school').includes(t)).length,0);
 assert.ok(titles('drill').some(t=>t.includes('계단')),'drill boards teach the stairs rule of this phase');
});
test('outside hazards keep a real distance and the outside route keeps it too',()=>{
 for(const r of OUTSIDE_CONFIG.hazards)assert.ok(hazardMargin(r)>=30,r.label);
 const hugging=[{x:120,y:410},{x:120,y:285},{x:540,y:285},{x:540,y:100},{x:880,y:100}];
 assert.equal(inspectRoute(hugging,OUTSIDE_CONFIG).ok,false,'walking right past the building is no longer a safe route');
});
test('routes finished on the earlier school and outside layouts still count as done',()=>{
 const legacyOutside=[{x:120,y:410},{x:180,y:410},{x:180,y:285},{x:550,y:285},{x:550,y:100},{x:880,y:100}];
 const done=(school,outside)=>activityComplete('safety',1,{schoolRoute:school,schoolRouteDone:true,schoolRouteSignature:routeSignature(school),outsideRoute:outside,outsideRouteDone:true,outsideRouteSignature:routeSignature(outside)});
 assert.equal(done(SCHOOL_PATH,legacyOutside),true);
 assert.equal(done(SCHOOL_DRILL_PATH,OUTSIDE_PATH),true);
});
test('3D wall blocks cover exactly the cells outside the walkable areas',()=>{
 for(const config of [SCHOOL_CONFIG,SCHOOL_DRILL_CONFIG,OUTSIDE_CONFIG]){
  const blocks=solidBlocks(config.areas);
  assert.ok(blocks.length<80,'walls are merged into a few boxes');
  for(let y=5;y<530;y+=10)for(let x=5;x<1000;x+=10){
   const open=config.areas.some(r=>inside({x,y},r,0)),walls=blocks.filter(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h).length;
   assert.equal(walls,open?0:1,`cell ${x},${y}`);
  }
  for(const p of [config.start,config.goal])assert.ok(!blocks.some(b=>inside(p,b,0)));
 }
});
test('aftershocks fit inside one walk of each reference route',()=>{
 const walk=path=>path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0)/.17;
 for(const [,,path] of SCENARIOS)assert.ok(AFTERSHOCKS.first+(AFTERSHOCKS.count-1)*AFTERSHOCKS.gap<walk(path));
});
