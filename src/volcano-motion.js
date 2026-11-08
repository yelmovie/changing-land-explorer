// Reused material sprites and graphics aligned with the illustrated caldera.
// Motion communicates the processes; particle speeds are not eruption measurements.
export function eruptionMotion(scene,api){
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const root=scene.add.container(0,0),g=scene.add.graphics();root.add(g);
 const ash=Array.from({length:10},(_,i)=>{const p=api.image('art/volcano-ash-puff-'+i%3+'-v1',560,218,100,100);root.add(p);return p;});
 const gas=Array.from({length:6},()=>{const p=api.image('art/volcano-ash-puff-2-v1',574,218,80,80).setTint(0xfff5e4);root.add(p);return p;});
 const seed=n=>{const v=Math.sin(n*127.1+43.7)*43758.5453;return v-Math.floor(v);};
 const path=[[574,252],[556,284],[532,322],[500,348],[467,375],[454,419],[426,445],[360,465],[307,487],[220,504]];
 // Reuse both scene objects and the particle geometry. No new point arrays are
 // allocated in the frame loop, even for spinning blocks and cooling crust.
 const lava=Array.from({length:25},(_,i)=>({phase:i/25,width:8+seed(i)*5,edge:2+seed(i+30),r:3+seed(i+60)*4,a:{x:0,y:0},b:{x:0,y:0}}));
 const droplets=Array.from({length:26},(_,i)=>({phase:seed(i+100),period:1100+seed(i+90)*900,side:(seed(i+120)-.5)*140,rise:95+seed(i+140)*110,r:1.4+seed(i+160)*2.2}));
 const blocks=Array.from({length:13},(_,i)=>({phase:seed(i+200),period:1900+seed(i+180)*1800,dx:85+seed(i+220)*195,rise:180+seed(i+240)*110,r:3+seed(i+260)*5,spin:i,
   vertices:Array.from({length:5},(_,j)=>({angle:j*Math.PI*.4,radius:.7+seed(i*9+j)*.4})),points:Array.from({length:5},()=>({x:0,y:0}))}));
 const fine=Array.from({length:38},(_,i)=>({phase:seed(i+300),drift:130+seed(i+320)*430,lift:40+seed(i+340)*115,fall:55+seed(i+350)*130,r:1+seed(i+360)*1.5,angle:i}));
 let clock=0,boost=0,focus=null,closed=false;
 function flow(t,p){const n=t*(path.length-1),i=Math.min(path.length-2,Math.floor(n)),f=n-i;p.x=path[i][0]+(path[i+1][0]-path[i][0])*f;p.y=path[i][1]+(path[i+1][1]-path[i][1])*f;return p;}
 const strength=kind=>boost>0?(focus===kind?1:(focus ? .45 : 1)):.7;
 function draw(){
  const force=strength('lava'),pulse=.5+.5*Math.sin(clock*.0022);
  g.clear().fillStyle(0xffa32c,(.12+pulse*.1)*force).fillEllipse(574,253,98+pulse*12,28+pulse*5).fillStyle(0xffd27d,.48*force).fillEllipse(574,250,40+pulse*8,9);
  // The pale rising plume and darker wind-carried ash keep different motion.
  // Invisible volcanic gases themselves are still explained by the narrator.
  gas.forEach((p,i)=>{const t=(clock/5700+i/6)%1,size=42+t*86;p.setPosition(580+t*12+Math.sin(t*5+i)*8,236-t*155).setDisplaySize(size,size*1.25).setAlpha(Math.sin(t*Math.PI)*.18*strength('gas')).setAngle(t*15+i*25);});
  ash.forEach((p,i)=>{const t=(clock/9400+i/10)%1,size=65+t*180;p.setPosition(560-t*410+Math.sin(t*9+i)*12,216-t*145-Math.sin(t*Math.PI)*35).setDisplaySize(size,size*.8).setAlpha(Math.sin(t*Math.PI)*.34*strength('ash')).setAngle(-t*30+i*19);});
  // Dark surface rafts drift with slow, viscous lava. Its hot edges stay narrow
  // rather than drawing a second bright pipe over the illustrated channel.
  lava.forEach((p,i)=>{
   const t=(clock/15500+p.phase)%1,a=flow(t,p.a),b=flow(Math.min(1,t+.014),p.b);
   g.lineStyle(p.width,0xff621c,.09*force).lineBetween(a.x,a.y,b.x,b.y).lineStyle(p.edge,0xffd56f,(.32+Math.sin(t*Math.PI)*.28)*force).lineBetween(a.x,a.y,b.x,b.y);
   if(i%3===0){const r=p.r;g.fillStyle(0x51352f,.78).fillTriangle(a.x-r,a.y-2,a.x+r,a.y,a.x,a.y+r*.7).lineStyle(1,0xea8d3f,.55*force).lineBetween(a.x-r,a.y-2,a.x,a.y+r*.7);}
  });
  // Hot droplets and solid blocks both rise and fall; only the former glow.
  droplets.forEach(p=>{
   const t=(clock/p.period+p.phase)%1,x=574+p.side*t,y=246-p.rise*t+230*t*t;
   if(y>273)return;
   g.fillStyle(0xff8830,(1-t)*.7*force).fillEllipse(x,y,p.r*2,p.r*3).fillStyle(0xffe2a0,(1-t)*.7*force).fillCircle(x,y,p.r*.55);
  });
  blocks.forEach(p=>{
   const t=(clock/p.period+p.phase)%1,x=581+p.dx*t,y=243-p.rise*t+365*t*t,angle=clock*.001+p.spin;
   for(let j=0;j<5;j++){const v=p.vertices[j],q=p.points[j],a=angle+v.angle;q.x=x+Math.cos(a)*p.r*v.radius;q.y=y+Math.sin(a)*p.r*v.radius;}
   const a=p.points[0],b=p.points[1];g.fillStyle(0x493c32,Math.sin(t*Math.PI)*.95*strength('rock')).fillPoints(p.points,true).lineStyle(1,0xc28d58,.6*strength('rock')).lineBetween(a.x,a.y,b.x,b.y);
  });
  // Fine ash rises with the plume, then settles downwind under gravity.
  for(const p of fine){
   const t=(clock/7600+p.phase)%1,x=550-t*p.drift,y=210-Math.sin(t*Math.PI)*p.lift+t*t*p.fall+Math.sin(t*8+p.angle)*5;
   g.fillStyle(0x514d45,Math.sin(t*Math.PI)*.55*strength('ash')).fillCircle(x,y,p.r);
  }
 }
 function pause(){boost=0;focus=null;}
 draw();
 return {show(){scene.children.bringToTop(root);},play(kind){if(!closed){boost=6000;focus=kind||null;}},pause,
  update(time,delta){if(closed||reduced)return;const dt=Math.min(delta,60);boost=Math.max(0,boost-dt);clock+=dt;draw();},
  destroy(){closed=true;pause();root.destroy(true);}
 };
}
