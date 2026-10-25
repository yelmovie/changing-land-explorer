// Input limit is shared by both adventure and the final library challenge.
// Saved coordinate arrays are never truncated: older paths remain recoverable.
export const MAX_ROUTE_POINTS=4096;
export function appendRoutePoint(points,p){
 const q={x:Math.max(0,Math.min(1000,p.x)),y:Math.max(0,Math.min(500,p.y))},last=points.at(-1);
 if(last&&Math.hypot(q.x-last.x,q.y-last.y)<=6)return true;
 const a=points.at(-2);
 // Only remove an exactly straight, forward intermediate point. This cannot
 // cut a corner, cross a hazard, or remove the start/end of the route.
 if(a){const dx=last.x-a.x,dy=last.y-a.y,ex=q.x-last.x,ey=q.y-last.y;
  if(Math.abs(dx*ey-dy*ex)<1e-7&&dx*ex+dy*ey>0){points[points.length-1]=q;return true;}
 }
 if(points.length>=MAX_ROUTE_POINTS)return false;
 points.push(q);return true;
}
