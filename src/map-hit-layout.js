// Keep map control hit regions disjoint from fixed chrome and one another.
// Reposition only visible labels; panning still reveals off-screen destinations.
const layouts=new WeakMap();
export function syncMapHitLayout(page,world){
 const shown=e=>e&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
 const intersect=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>-4&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>-4;
 const hud=[...document.querySelectorAll('.topbar button,.preview-banner,.map-view-tools,.map-dpad button,.map-combat-hud,.combat-guide,.atlas-footer > :not(.map-destination,[hidden]),.map-destination > #stage-shortcuts')].filter(shown).map(e=>e.getBoundingClientRect());
 const bounds=page.getBoundingClientRect(),overview=page.classList.contains('map-overview');
 const residents=[...world.querySelectorAll('.map-resident')],foes=[...world.querySelectorAll('.map-villain')].filter(e=>!e.hidden);
 // Residents stay at their map coordinates: moving their whole button also moved the
 // portrait away from the position combat uses to keep its walking lane clear.
 if(!overview)for(const e of residents){e.style.translate='0px 0px';e.classList.remove('map-target-obscured');}
 const residentSpace=overview?[]:residents.flatMap(e=>[e.querySelector('img'),e.querySelector('.resident-tag')]).filter(shown).map(e=>e.getBoundingClientRect());
 // Signs yield to actors. Reserve a little room around every visible foe, so changing
 // focus from the foe to Attack never hides it or puts a sign over the encounter.
 for(const e of foes){const r=e.getBoundingClientRect();hud.push({left:r.left-12,top:r.top-12,right:r.right+12,bottom:r.bottom+12});e.classList.remove('map-target-obscured');}
 let occupied=[...residentSpace];
 const nodes=[...world.querySelectorAll('.atlas-pin,.atlas-core'),...(overview?residents:[])];
 const key=JSON.stringify([world.style.transform,world.clientWidth,world.clientHeight,bounds.width,bounds.height,overview,hud.map(r=>[r.left,r.top,r.right,r.bottom].map(v=>Math.round(v/8))),residentSpace.map(r=>[r.x,r.y,r.width,r.height]),nodes.map(e=>[e.offsetWidth,e.offsetHeight])]);
 const cached=layouts.get(page);
 if(cached?.key===key)occupied=cached.occupied;
 else {
 for(const e of nodes){
  e.style.translate='0px 0px';
  const r=e.getBoundingClientRect();
  let candidate=null;
  if(overview||r.right>=bounds.left&&r.left<=bounds.right&&r.bottom>=bounds.top&&r.top<=bounds.bottom){
   const clear=q=>q.left>=bounds.left+6&&q.right<=bounds.right-6&&q.top>=bounds.top+6&&q.bottom<=bounds.bottom-6&&!hud.some(h=>intersect(q,h))&&!occupied.some(h=>intersect(q,h));
   if(clear(r))candidate=r;
   else {
    let best=Infinity;
    for(let y=bounds.top+8;y+r.height<=bounds.bottom-8;y+=16)for(let x=bounds.left+8;x+r.width<=bounds.right-8;x+=16){
     const q={left:x,top:y,right:x+r.width,bottom:y+r.height},d=(x-r.left)**2+(y-r.top)**2;
     if(d<best&&clear(q)){best=d;candidate=q;}
    }
   }
  }
  e.classList.toggle('map-target-obscured',!candidate);
  if(candidate){e.style.translate=`${candidate.left-r.left}px ${candidate.top-r.top}px`;occupied.push(candidate);}
 }
 layouts.set(page,{key,occupied});
 }
}
