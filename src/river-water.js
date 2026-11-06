// Stable soil-surface coordinates shared by the experiment and saved observations.
const clamp=v=>Math.max(0,Math.min(1,v));
const route=[[.19,.28],[.23,.32],[.27,.38],[.32,.405],[.38,.46],[.46,.49],[.53,.55],[.62,.60],[.71,.64],[.78,.68],[.82,.72]];
function spline(list,progress){
  const n=clamp(progress)*(list.length-1),i=Math.min(list.length-2,Math.floor(n)),f=n-i;
  const a=list[Math.max(0,i-1)],b=list[i],c=list[i+1],d=list[Math.min(list.length-1,i+2)];
  const at=k=>.5*(2*b[k]+(c[k]-a[k])*f+(2*a[k]-5*b[k]+4*c[k]-d[k])*f*f+(3*b[k]-a[k]-3*c[k]+d[k])*f*f*f);
  return {x:150+at(0)*900,y:120+at(1)*400};
}
export const riverFlowPoint=progress=>spline(route,progress);
const ellipse=(x,y,w,h,color,alpha=1)=>({type:'ellipse',x,y,w,h,color,alpha});
const line=(points,width,color,alpha=1)=>({type:'line',points,width,color,alpha});
const poly=(points,color,alpha=1)=>({type:'poly',points,color,alpha});
const grains=(points,color,alpha=1)=>({type:'grains',points,color,alpha});
const seed=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const mix=(a,b,f)=>a+(b-a)*f;
export const wetSoilAlpha=(time,water)=>clamp((time-.08)/.72)*(water===1?.58:1);

// Water runs fast down the slope and slows on the flat, so it reaches the foot
// halfway through and the second half of a run belongs to the growing deposit.
const ARRIVE=.52;
const reach=t=>1-(1-clamp(t/ARRIVE))**1.5;
const reachedAt=f=>ARRIVE*(1-(1-clamp(f))**(1/1.5));
const settledAt=t=>clamp((t-ARRIVE)/(1-ARRIVE));
const course=f=>{const p=riverFlowPoint(f);return {x:p.x,y:p.y+Math.sin(f*23+1)*3.2*Math.sin(f*Math.PI)};};
const sample=(fn,from,to,count)=>Array.from({length:count+1},(_,i)=>fn(from+(to-from)*i/count));

// A strip of varying width around a centre line; `half` gives both side widths.
function ribbon(centre,half){
  const near=[],far=[];
  centre.forEach((p,i)=>{
    const a=centre[Math.max(0,i-1)],b=centre[Math.min(centre.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
    const [front,back]=half(i/Math.max(1,centre.length-1));
    near.push({x:p.x-dy/l*front,y:p.y+dx/l*front});far.unshift({x:p.x+dy/l*back,y:p.y-dx/l*back});
  });
  return near.concat(far);
}

// Top edge of the soil art: cuts stay inside the hill instead of spilling over the sky.
const CREST=[[.1,.153],[.15,.207],[.2,.261],[.25,.31],[.3,.35],[.35,.39],[.4,.431],[.45,.468],[.5,.51],[.55,.539],[.6,.563],[.65,.587],[.7,.606],[.75,.615],[.8,.619],[.85,.621],[.9,.627],[.95,.668]];
function crestY(x){
  const fx=(x-150)/900,i=Math.max(0,Math.min(CREST.length-2,Math.floor((fx-.1)/.05))),[a,b]=[CREST[i],CREST[i+1]];
  return 120+400*mix(a[1],b[1],clamp((fx-a[0])/.05));
}
const inside=points=>points.map(p=>({x:p.x,y:Math.max(p.y,crestY(p.x)+3)}));
const blob=(x,y,w,h,n)=>Array.from({length:11},(_,i)=>{
  const a=i/11*Math.PI*2,r=.72+seed(n+i*3)*.42;
  return {x:x+Math.cos(a)*w/2*r,y:y+Math.sin(a)*h/2*r};
});

const PILE={1:{height:106,left:178,right:132,tiers:5},2:{height:152,left:250,right:152,tiers:7}};
const LAYERS=['#c8955a','#e2c088','#ad7a47','#ecd09a','#b98a52','#dab27a','#a5713f'];
const pileCentre=()=>{const end=riverFlowPoint(1);return {x:end.x+8,y:end.y+36};};
const pileBase=(x,c)=>c.y-Math.max(0,c.x-x)*.11;
const pileShape=(u,k=0)=>Math.cos(u*Math.PI/2)**1.25*(1+.035*Math.sin(u*7+k*1.7)+.02*Math.sin(u*17+k*2.9));
// The pile outline after `level` (0-1) of its material has arrived.
function pileEdge(water,level,k=0,count=26){
  const p=PILE[water],c=pileCentre(),spread=.34+.66*Math.sqrt(level);
  return sample(u=>{
    const x=c.x+u*(u<0?p.left:p.right)*spread;
    return {x,y:pileBase(x,c)-p.height*level**.82*pileShape(u,k)};
  },-1,1,count);
}
const pileFloor=(water,level)=>{
  const c=pileCentre(),p=PILE[water],spread=.34+.66*Math.sqrt(level);
  return sample(u=>{const x=c.x+u*(u<0?p.left:p.right)*spread;return {x,y:pileBase(x,c)+7*(1-u*u)};},1,-1,10);
};

export function riverDeposit(time,water=1){
  const settled=settledAt(time),p=PILE[water],c=pileCentre(),size=Math.sqrt(settled);
  return {type:'image',asset:'art/river-sediment-fan-v1',x:c.x+(p.right-p.left)/2,y:c.y-1,w:(p.left+p.right)*1.08*size,h:p.height*.2*size,alpha:Math.min(.8,settled*4)};
}

function depositLayers(layers,settled,water,motion,flowing){
  const p=PILE[water],c=pileCentre(),level=settled*p.tiers,active=Math.min(p.tiers-1,Math.floor(level));
  const outer=settled;
  layers.push(ellipse(c.x+(p.right-p.left)/2,c.y+7,(p.left+p.right)*(.4+.72*Math.sqrt(outer)),18+p.height*.2*outer,'#5b3c22',.3));
  layers.push(riverDeposit(ARRIVE+(1-ARRIVE)*settled,water));
  // Newest material is the outer skin, so older tiers show as bands inside it.
  for(let k=active;k>=0;k--){
    const amount=Math.min(p.tiers,k+1,level)/p.tiers,edge=pileEdge(water,amount,k);
    layers.push(poly(edge.concat(pileFloor(water,amount)),LAYERS[k%LAYERS.length]));
    layers.push(line(edge,k===active?3:1.6,k===active?'#f6e2b8':'#8a5c33',k===active?.85:.5));
  }
  const top=pileEdge(water,outer,active,40),sets=[[],[],[]],count=Math.floor(outer*(water===1?230:400));
  for(let i=0;i<count;i++){
    const q=top[Math.floor(seed(i+500)*top.length)],down=seed(i+540)**.7,floor=pileBase(q.x,c)+4;
    sets[i%3].push([q.x+(seed(i+580)-.5)*9,mix(q.y+2,floor,down),1.5+seed(i+620)*2.3]);
  }
  layers.push(grains(sets[0],'#7a5230',.7),grains(sets[1],'#f2dcae',.8),grains(sets[2],'#9a6a3c',.75));
  for(let i=0;i<Math.floor(outer*(water===1?7:12));i++){
    const q=top[Math.floor(seed(i+700)*top.length)],y=mix(q.y+5,pileBase(q.x,c),seed(i+730)*.8),s=seed(i+760);
    layers.push(ellipse(q.x+1,y+1.5,6+s*7,4+s*4,'#4e3522',.45),ellipse(q.x,y,5+s*6,3.4+s*3.4,i%2?'#8d8173':'#b27b4c'));
  }
  if(flowing&&settled<1){
    for(let i=0;i<4+water*3;i++){
      const puff=(motion*.0009+seed(i+800))%1,q=top[Math.floor(seed(i+830)*top.length)];
      layers.push(ellipse(q.x,q.y+1-puff*7,8+puff*30,3+puff*9,'#ecd8ae',(1-puff)*.5));
    }
  }
}

// Side channels leave the main stream only after its water has reached them.
const SIDE=[
  {from:.3,water:1,width:.62,route:[[.34,.42],[.385,.52],[.455,.585],[.55,.635],[.655,.675],[.75,.712]]},
  {from:.5,water:1,width:.5,route:[[.49,.505],[.565,.56],[.645,.588],[.72,.615],[.78,.655]]},
  {from:.18,water:2,width:.6,route:[[.258,.365],[.292,.475],[.355,.575],[.45,.65],[.565,.7],[.68,.735]]},
  {from:.64,water:2,width:.46,route:[[.6,.585],[.67,.602],[.735,.624],[.8,.645],[.85,.668]]}
];
const FAN=[[.92,.78],[.72,.8],[.45,.81],[.1,.79],[.3,.74]];
const sideCourse=branch=>f=>spline(branch.route,f);

// Flat water: a wet margin, one body colour and a sheen on the far side only, so
// the stream lies on the soil instead of reading as a shaded tube.
function streamLayers(layers,centre,half,tone=1){
  layers.push(poly(inside(ribbon(centre,f=>half(f).map(v=>v+3))),'#3a2717',.34*tone));
  layers.push(poly(inside(ribbon(centre,half)),'#5a97a2',.86*tone));
  layers.push(poly(inside(ribbon(centre,f=>{const [a,b]=half(f);return [-a*.12,b*.8];})),'#8cc8cb',.58*tone));
}

// Layered water, a widening cut and deterministic grains avoid a flat blue line.
// The two runs share soil, route and duration; only the amount of water differs.
export function riverSurface(time,water=1,motion=0,flowing=false) {
  const t=clamp(time),layers=[];
  if(t<=0)return layers;
  const front=reach(t),settled=settledAt(t),big=water===1?1:1.62,tone=flowing||t<1?1:.74;
  const shimmer=flowing?motion*.006:0;
  const age=f=>clamp((t-reachedAt(f))/.34);
  // Scour is strongest on the steep upper slope and fades out on the flat foot.
  const slope=f=>mix(1,.3,clamp((f-.42)/.5));
  const cut=f=>(17*big*slope(f)*(.58+.42*t)+Math.sin(f*41)*2.2+Math.sin(f*97)*1.2)*age(f)**.65;
  const stream=f=>{const w=(4.6+6.4*f)*big*Math.min(1,.45+age(f)*2.2);return w+Math.sin(f*34-shimmer)*.9;};
  const main=sample(course,0,front,44),along=u=>u*front;

  layers.push(ellipse(riverFlowPoint(0).x,riverFlowPoint(0).y+2,(26+t*30)*big,(10+t*12)*big,'#4b3020',.72));
  layers.push(poly(inside(ribbon(main,u=>{const v=cut(along(u));return [v+3.5,v*.62];})),'#efd19c',.7));
  layers.push(poly(inside(ribbon(main,u=>{const v=cut(along(u));return [v,v*.62];})),'#59391f',.82));
  layers.push(poly(inside(ribbon(main,u=>{const v=cut(along(u));return [v*.66,v*.42];})),'#3f2916',.72));

  // Bank collapses bite into the near rim and leave scars that stay after the run.
  const falling=[];
  for(let i=0;i<6+water*5;i++){
    const f=.05+seed(i+20)*.55,start=reachedAt(f)+.05+seed(i+40)*.38,fall=(t-start)/.09;
    if(fall<0)continue;
    const p=course(f),edge=cut(f)+2,size=(9+seed(i+60)*11)*big**.6,settle=clamp(fall);
    layers.push(poly(inside(blob(p.x+edge*.32,p.y+edge*.92,size*1.7*settle,size*.9*settle,i*13)),'#5a3a20',.78));
    if(fall<1)falling.push({x:p.x+edge*.6*(1-fall),y:p.y+edge*(1.5-fall*1.5)-Math.sin(fall*Math.PI)*6,size:size*.8});
  }
  const exposed=[];
  for(let i=0;i<46;i++){
    const f=.04+seed(i)*.6;if(f>front)continue;
    const p=course(f),side=i%2?-.72:1,edge=cut(f)+2+seed(i+30)*5;
    exposed.push([p.x+side*edge*.34,p.y+side*edge,1.5+seed(i+60)*2.6]);
  }
  layers.push(grains(exposed,'#3e2817',.8));

  // Sand bars drop out where the channel slows, before the foot starts to fill.
  for(let i=0;i<(water===1?4:6);i++){
    const f=.58+i*.066,grow=clamp((t-reachedAt(f)-.06)/.3);
    if(grow<=0)continue;
    const p=course(f),side=i%2?1:-.8,w=(46+seed(i+70)*34)*big*grow,h=(11+seed(i+90)*8)*big*grow;
    const y=p.y+side*(stream(f)+h*.3);
    layers.push(poly(inside(blob(p.x+2,y+3,w,h,i*7+1)),'#7a5430',.5));
    layers.push(poly(inside(blob(p.x,y,w*.92,h*.8,i*7+2)),i%2?'#dcb97f':'#c99d62'));
    layers.push(ellipse(p.x-w*.1,y-h*.16,w*.46,h*.22,'#f0dcae',.7));
  }

  for(const branch of SIDE){
    if(branch.water>water)continue;
    const grow=clamp((t-reachedAt(branch.from)-.04)/.34);if(grow<=0)continue;
    const path=sample(sideCourse(branch),0,grow,22),width=u=>(2.2+6*u*grow)*branch.width*big*Math.min(1,grow*3);
    layers.push(poly(inside(ribbon(path,u=>{const v=width(u)*1.9;return [v,v*.7];})),'#59391f',.5));
    streamLayers(layers,path,u=>{const v=width(u);return [v,v*.8];},tone);
  }
  streamLayers(layers,main,u=>{const v=stream(along(u));return [v,v*.9];},tone);

  // The growing pile buries the channel mouth; thin sheets then run over the new soil.
  if(settled>0){
    depositLayers(layers,settled,water,motion,flowing);
    const top=pileEdge(water,settled,0,30),height=PILE[water].height*settled;
    for(let i=0;i<(water===1?2:4);i++){
      const grow=clamp(settled*2.4-i*.36);if(grow<=0)continue;
      const from=4+i*2,to=from+Math.floor((11+i*3)*grow),depth=(.14+i*.17)*height;
      const path=top.slice(from,to).map((q,j)=>({x:q.x,y:q.y+depth+Math.sin(j*.9+i*2)*2.2}));
      if(path.length>2)layers.push(poly(ribbon(path,u=>{const v=Math.sin(u*Math.PI)*2.4*big+.4;return [v,v*.7];}),'#6f7f74',.5),poly(ribbon(path,u=>{const v=Math.sin(u*Math.PI)*1.5*big+.2;return [v*.2,v];}),'#c3e2df',.72*tone));
    }
  }

  // The leading edge is a dirty tongue with foam, not a line growing at a fixed width.
  if(t<ARRIVE){
    const tip=course(front),w=stream(front)*2.6;
    layers.push(ellipse(tip.x+3,tip.y+2,w*2.3,w*1.1,'#59391f',.6),ellipse(tip.x+2,tip.y,w*1.8,w*.8,'#7b6a55',.95));
    for(let i=0;i<7;i++){
      const a=seed(i+880)*6.28+shimmer*.4,r=w*(.45+seed(i+900)*.6);
      layers.push(ellipse(tip.x+Math.cos(a)*r,tip.y+Math.sin(a)*r*.45,4+seed(i+920)*6,2.4+seed(i+940)*3,'#f3f6e6',.85));
    }
  }

  if(flowing&&t<1){
    const load=[[],[],[]],travel=f=>(1-(1-f)**1.4)*(1-settled*.1);
    const carried=30+water*34;
    for(let i=0;i<carried;i++){
      const f=travel((motion*(.00014+seed(i+12)*.00009)+seed(i+150))%1);if(f>front)continue;
      const p=course(f),s=seed(i+12),w=stream(f)*.92;
      load[i%3].push([p.x+(s-.5)*5,p.y+(seed(i+45)-.5)*2*w+Math.sin(motion*.008+i)*1.4,1.8+s*2.6]);
    }
    for(const branch of SIDE){
      if(branch.water>water||t<reachedAt(branch.from)+.1)continue;
      for(let i=0;i<14;i++){
        const f=travel((motion*.00019+seed(i+branch.from*90))%1),p=sideCourse(branch)(f);
        load[i%3].push([p.x,p.y+(seed(i+55)-.5)*4,1.6+seed(i+66)*1.8]);
      }
    }
    layers.push(grains(load[0],'#6e4a2a',.95),grains(load[1],'#c79a5c',.95),grains(load[2],'#e4c58a',.95));
    for(let i=0;i<7+water*4;i++){
      const f=travel((motion*.00011+seed(i+300))%1);if(f>front)continue;
      const p=course(f),roll=motion*.012+i,s=(5+seed(i+320)*6)*big**.5;
      layers.push(ellipse(p.x,p.y+Math.sin(roll)*2-1,s*1.5,s,'#5a3d25',.92),ellipse(p.x-1,p.y+Math.sin(roll)*2-2,s*.8,s*.46,'#a87c4b',.9));
    }
    for(let i=0;i<16+water*7;i++){
      const f=(motion*(.00024+seed(i+340)*.00012)+seed(i+360))%1;if(f>front)continue;
      const a=course(f),b=course(Math.min(front,f+.02+seed(i+380)*.03)),off=(seed(i+400)-.5)*stream(f)*1.3;
      layers.push(line([{x:a.x,y:a.y+off},{x:b.x,y:b.y+off}],1.2+seed(i+420)*.9,'#f2fffd',.72));
    }
  }
  for(const piece of falling)layers.push(ellipse(piece.x,piece.y,piece.size,piece.size*.72,'#5b3d27'),ellipse(piece.x-1,piece.y-1.5,piece.size*.55,piece.size*.3,'#a9794a'));
  return layers;
}

// Fine separated jets fall from the tilted spout, then splash against the soil.
export function drawRiverSpray(g,can,time,water=1){
  g.clear();
  const from={x:can.x-70,y:can.y+1},hit=riverFlowPoint(0),jets=10+water*4;
  for(let i=0;i<jets;i++){
    const end={x:hit.x+(i-(jets-1)/2)*2.6,y:hit.y+Math.sin(i)*3};
    const at=f=>({x:from.x+(end.x-from.x)*f,y:from.y+(end.y-from.y)*f*f});
    const points=Array.from({length:9},(_,j)=>at(j/8));
    for(const [width,color,alpha] of [[3.8,0x77b7bc,.34],[1.4,0xe4ffff,.72]]){
      g.lineStyle(width,color,alpha).beginPath().moveTo(points[0].x,points[0].y);
      for(const p of points.slice(1))g.lineTo(p.x,p.y);
      g.strokePath();
    }
    const f=(time*.0013+i*.137)%1,p=at(f);
    g.fillStyle(0xe0ffff,.85).fillEllipse(p.x,p.y,2.4,4.5+f*3);
    const splash=(time*.002+i*.19)%1,side=i%2?1:-1,reach=14+seed(i+980)*22;
    g.fillStyle(0xd2f1ed,(1-splash)*.7).fillEllipse(end.x+side*splash*reach,end.y-Math.sin(splash*Math.PI)*(12+seed(i+990)*10),2.6,3.2);
  }
  for(let i=0;i<3;i++){
    const ring=(time*.0016+i/3)%1;
    g.lineStyle(1.6,0xd4efeb,(1-ring)*.7).strokeEllipse(hit.x,hit.y+1,(18+ring*46)*(water===1?1:1.3),(6+ring*15)*(water===1?1:1.3));
  }
}
