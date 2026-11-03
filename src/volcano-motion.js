// A small, reusable pool of effects aligned with volcano-caldera-v2.
// Motion is illustrative; speeds and sizes are not measurements of an eruption.
export function eruptionMotion(scene,api){
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const root=scene.add.container(0,0),g=scene.add.graphics();root.add(g);
 const puffs=Array.from({length:6},(_,i)=>{
  const p=api.image('art/volcano-ash-puff-'+i%3+'-v1',560,218,100,100);root.add(p);return p;
 });
 let clock=0,remaining=0,closed=false;
 const path=[[574,252],[556,284],[532,322],[500,348],[467,375],[454,419],[426,445],[360,465],[307,487],[220,504]];
 function flow(t){const n=t*(path.length-1),i=Math.min(path.length-2,Math.floor(n)),f=n-i;return [path[i][0]+(path[i+1][0]-path[i][0])*f,path[i][1]+(path[i+1][1]-path[i][1])*f];}
 function draw(){
  g.clear();
  puffs.forEach((p,i)=>{const t=(clock/8500+i/6)%1,size=70+t*115;p.setPosition(560-t*360,213-t*170).setDisplaySize(size,size*.85).setAlpha(Math.sin(t*Math.PI)*.32).setAngle(-t*15);});
  // Short warm ripples follow only the illustrated downhill lava channels.
  for(let i=0;i<15;i++){const t=(clock/17000+i/15)%1,a=flow(t),b=flow(Math.min(1,t+.009));g.lineStyle(2.5,0xffdc70,.28+Math.sin(t*Math.PI)*.22).lineBetween(...a,...b);}
  // Solid fragments follow brief arcs and fall back toward the mountain.
  for(let i=0;i<7;i++){const t=(clock/2600+i/7)%1;g.fillStyle(0x504332,Math.sin(t*Math.PI)*.75).fillCircle(589+t*(95+i*11),245-175*t+240*t*t,2+i%3);}
 }
 function pause(){remaining=0;}
 draw();
 return {show(){scene.children.bringToTop(root);},play(){if(!closed)remaining=4200;},pause,
  update(time,delta){if(closed||!remaining||reduced)return;const dt=Math.min(delta,60);remaining=Math.max(0,remaining-dt);clock+=dt;draw();},
  destroy(){closed=true;pause();root.destroy(true);}
 };
}
