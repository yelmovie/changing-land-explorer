import test from 'node:test';
import assert from 'node:assert/strict';
import {EVAC_PICKUPS,AFTERSHOCKS,solidBlocks} from '../src/adventure/evacuation-3d.js';
import {evacuationCollision} from '../src/adventure/evacuation.js';
import {SCHOOL_CONFIG,OUTSIDE_CONFIG,SCHOOL_PATH,OUTSIDE_PATH} from '../src/learning-model.js';

const inside=(p,r,pad)=>p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
for(const [name,config] of [['school',SCHOOL_CONFIG],['outside',OUTSIDE_CONFIG]])test(`3D ${name} pickups sit on safe floor`,()=>{
 const {medals,rules}=EVAC_PICKUPS[name];
 assert.equal(rules.length,3);assert.ok(medals.length>=6);
 for(const p of [...medals,...rules]){
  assert.ok(config.areas.some(r=>inside(p,r,-12)),`${JSON.stringify(p)} is on walkable floor`);
  assert.ok(!config.hazards.some(r=>inside(p,r,30)),`${JSON.stringify(p)} keeps clear of hazards`);
 }
 for(const r of rules)assert.ok(r.title&&r.text.length>10);
});
test('3D rule boards lie on the reference safe routes',()=>{
 const near=(p,path)=>path.some((a,i)=>{const b=path[i+1];if(!b)return false;const t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/((b.x-a.x)**2+(b.y-a.y)**2)));return Math.hypot(a.x+(b.x-a.x)*t-p.x,a.y+(b.y-a.y)*t-p.y)<46;});
 for(const r of EVAC_PICKUPS.school.rules)assert.ok(near(r,SCHOOL_PATH),r.title);
 for(const r of EVAC_PICKUPS.outside.rules)assert.ok(near(r,OUTSIDE_PATH),r.title);
});
test('3D wall blocks cover exactly the cells outside the walkable areas',()=>{
 for(const config of [SCHOOL_CONFIG,OUTSIDE_CONFIG]){
  const blocks=solidBlocks(config.areas);
  assert.ok(blocks.length<80,'walls are merged into a few boxes');
  for(let y=5;y<530;y+=10)for(let x=5;x<1000;x+=10){
   const open=config.areas.some(r=>inside({x,y},r,0)),walls=blocks.filter(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h).length;
   assert.equal(walls,open?0:1,`cell ${x},${y}`);
  }
  for(const p of [config.start,config.goal])assert.ok(!blocks.some(b=>inside(p,b,0)));
 }
});
test('aftershocks fit inside one walk of the reference route',()=>{
 const walk=path=>path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0)/.17;
 for(const path of [SCHOOL_PATH,OUTSIDE_PATH])assert.ok(AFTERSHOCKS.first+(AFTERSHOCKS.count-1)*AFTERSHOCKS.gap<walk(path));
 for(const [config,path] of [[SCHOOL_CONFIG,SCHOOL_PATH],[OUTSIDE_CONFIG,OUTSIDE_PATH]])for(let i=1;i<path.length;i++)assert.equal(evacuationCollision(path[i-1],path[i],config),null);
});
