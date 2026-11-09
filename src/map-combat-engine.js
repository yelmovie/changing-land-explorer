import {MAP_VILLAINS,HERO_HEALTH,VILLAIN_HITS,normalizeVillains,hitVillain} from './map-villain-rules.js';
const REST_POINTS=[[.18,.75],[.16,.38],[.29,.205],[.65,.205],[.77,.46],[.70,.70]].map(([x,y])=>({x:x*1200,y:y*675}));
export const COMBAT={attackRange:128,collisionRadius:31,attackCooldown:560,invulnerable:1800,speed:38};
export function createCombat(progress,now=0){const p=normalizeVillains(progress);return {progress:p,invulnerableUntil:now+1200,attackAt:-Infinity,heroPoseUntil:0,heroPose:0,heroFacing:1,enemies:MAP_VILLAINS.map((v,i)=>({...v,x:v.x*1200,y:v.y*675,home:{x:v.x*1200,y:v.y*675},phase:i*1.4,frame:0,facing:1,poseUntil:0,deadAt:p.hits[v.id]===3?-Infinity:null}))};}
export function stepCombat(game,hero,delta,now){
 if(!hero||game.progress.health===0)return [];
 const resting=REST_POINTS.some(p=>Math.hypot(hero.x-p.x,hero.y-p.y)<28);
 const events=[],dt=Math.max(0,Math.min(delta,50))/1000;
 for(const e of game.enemies){
  if(game.progress.hits[e.id]===VILLAIN_HITS)continue;
  const homeDistance=Math.hypot(hero.x-e.home.x,hero.y-e.home.y),chase=!resting&&homeDistance<120;
  const target=chase?hero:{x:e.home.x+Math.sin(now/1200+e.phase)*18,y:e.home.y+Math.cos(now/1600+e.phase)*10};
  const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy),step=Math.min(d,COMBAT.speed*(chase?1:.35)*dt);
  if(now>=e.poseUntil&&d>2){e.facing=dx<0?-1:1;e.x+=dx/d*step;e.y+=dy/d*step;e.frame=1+Math.floor(now/230)%2;}else if(now>=e.poseUntil)e.frame=0;
  if(!resting&&Math.hypot(hero.x-e.x,hero.y-e.y)<COMBAT.collisionRadius&&now>=game.invulnerableUntil){
   game.progress.health--;game.invulnerableUntil=now+COMBAT.invulnerable;game.heroFacing=e.x<hero.x?-1:1;game.heroPose=2;game.heroPoseUntil=now+600;e.frame=3;e.poseUntil=now+400;
   // Separate bodies after contact, with a grace period instead of per-frame damage.
   const n=Math.hypot(e.x-hero.x,e.y-hero.y)||1;e.x+=(e.x-hero.x||1)/n*24;e.y+=(e.y-hero.y)/n*24;
   events.push({type:game.progress.health?'hurt':'knockout',id:e.id,health:game.progress.health});
   if(!game.progress.health)break;
  }
 }
 return events;
}
export function attackCombat(game,hero,now){
 if(!hero||!game.progress.health||now-game.attackAt<COMBAT.attackCooldown)return null;
 game.attackAt=now;game.heroPose=1;game.heroPoseUntil=now+430;
 const enemy=game.enemies.filter(e=>game.progress.hits[e.id]<VILLAIN_HITS).map(e=>({e,d:Math.hypot(e.x-hero.x,e.y-hero.y)})).filter(v=>v.d<=COMBAT.attackRange).sort((a,b)=>a.d-b.d)[0]?.e;
 if(!enemy)return {type:'miss'};
 game.heroFacing=enemy.x<hero.x?-1:1;
 const hit=hitVillain(game.progress,enemy.id);game.progress=hit.progress;enemy.frame=hit.defeated?5:4;enemy.poseUntil=now+430;if(hit.defeated)enemy.deadAt=now;
 return {type:hit.defeated?'defeat':'hit',id:enemy.id,remaining:hit.remaining};
}
export function restartCombat(game,now){
 const next=createCombat({...game.progress,health:HERO_HEALTH},now);next.invulnerableUntil=now+3000;next.heroPose=3;next.heroPoseUntil=now+550;Object.assign(game,next);return game.progress;
}
