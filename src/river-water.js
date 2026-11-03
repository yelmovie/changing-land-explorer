// Stable soil-surface coordinates shared by the experiment and saved observations.
const clamp=v=>Math.max(0,Math.min(1,v));
const route=[[.19,.28],[.23,.32],[.27,.38],[.32,.405],[.38,.46],[.46,.49],[.53,.55],[.62,.60],[.71,.64],[.78,.68],[.82,.72]];
export function riverFlowPoint(progress) {
  const n=clamp(progress)*(route.length-1),i=Math.min(route.length-2,Math.floor(n)),f=n-i;
  return {x:150+(route[i][0]+(route[i+1][0]-route[i][0])*f)*900,y:120+(route[i][1]+(route[i+1][1]-route[i][1])*f)*400};
}
const ellipse=(x,y,w,h,color,alpha=1)=>({type:'ellipse',x,y,w,h,color,alpha});
const line=(points,width,color,alpha=1)=>({type:'line',points,width,color,alpha});
const seed=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const wetSoilAlpha=(time,water)=>clamp((time-.48)/.52)*(water===1?.58:1);

export function riverDeposit(time,water=1){
  const settled=clamp((time-.66)/.34),end=riverFlowPoint(1);
  return {type:'image',asset:'art/river-sediment-fan-v1',x:end.x+12,y:end.y+1,w:(water===1?98:158)*Math.sqrt(settled),h:(water===1?20:32)*Math.sqrt(settled),alpha:Math.min(1,settled*4)};
}

// Layered thin water, wet banks and deterministically positioned grains avoid a
// flat blue arrow. The two runs share soil, route and duration; only water differs.
export function riverSurface(time,water=1,motion=0,flowing=false) {
  const t=clamp(time),layers=[];
  if(t<=0)return layers;
  const front=clamp(t/.66),path=[];
  for(let i=0;i<=40;i++)path.push(riverFlowPoint(front*i/40));
  layers.push(line(path,15+water*5,'#67452e',.18),line(path,9+water*3,'#7f613e',.42));
  layers.push(line(path,5+water*2,'#729694',.48),line(path,1.3+water*.5,'#d8eeea',.56));
  // Erosion begins at the upper channel; a few dark grains expose its shallow cut.
  const cut=clamp(t*2);
  for(let i=0;i<22;i++){
    const p=riverFlowPoint(.08+seed(i)*.22),side=i%2?-1:1;
    layers.push(ellipse(p.x+side*(4+seed(i+30)*5),p.y+side*2,2+seed(i+60)*3,1.2+seed(i+90)*2,'#5b3e27',cut*.62));
  }
  if(flowing&&t<1){
    for(let i=0;i<12+water*9;i++){
      const f=(motion*.00018+i*.037)%1;if(f>front)continue;
      const p=riverFlowPoint(f),s=seed(i+12);
      layers.push(ellipse(p.x+(s-.5)*8,p.y+(seed(i+45)-.5)*5,2+s*3,1.4+s*1.4,i%3?'#a57a45':'#d1ac6a',.86));
    }
    for(let i=0;i<9;i++){
      const f=(motion*.00012+i*.107)%1;if(f>front)continue;
      const a=riverFlowPoint(f),b=riverFlowPoint(Math.min(front,f+.016));
      layers.push(line([a,b],.9,'#f0ffff',.58));
    }
  }
  // A low sediment fan accumulates only after transported material reaches the foot.
  const settled=clamp((t-.66)/.34),end=riverFlowPoint(1);
  if(settled>0){
    const width=(water===1?68:112)*Math.sqrt(settled),height=(water===1?19:30)*Math.sqrt(settled);
    layers.push(ellipse(end.x+width*.12,end.y+4,width,height,'#775635',.32));
    layers.push(riverDeposit(t,water));
    for(let i=0;i<Math.floor(settled*(water===1?24:42));i++){
      const angle=seed(i+180)*Math.PI*2,r=Math.sqrt(seed(i+210)),s=seed(i+240);
      const x=end.x+width*.1+Math.cos(angle)*r*width*.47,y=end.y+Math.sin(angle)*r*height*.43;
      layers.push(ellipse(x,y+.7,1.8+s*3,1.1+s*1.4,'#735332',.65),ellipse(x-.35,y-.2,1.4+s*2.4,.8+s*1.1,i%3?'#d9b778':'#ae8249',.95));
    }
    for(let i=0;i<3;i++){
      const a={x:end.x-14,y:end.y-3+i*2},b={x:end.x+width*(.15+i*.12),y:end.y+height*(i-1)*.18};
      layers.push(line([a,b],.8,'#e4efdf',.36));
    }
  }
  return layers;
}

// Fine separated jets fall from the tilted spout, then splash against the soil.
export function drawRiverSpray(g,can,time,water=1){
  g.clear();
  const from={x:can.x-70,y:can.y+1},hit=riverFlowPoint(0),jets=7+water*3;
  for(let i=0;i<jets;i++){
    const end={x:hit.x+(i-(jets-1)/2)*1.8,y:hit.y+Math.sin(i)*2};
    const at=f=>({x:from.x+(end.x-from.x)*f,y:from.y+(end.y-from.y)*f*f});
    const points=Array.from({length:9},(_,j)=>at(j/8));
    for(const [width,color,alpha] of [[2.8,0x77b7bc,.28],[1,0xe4ffff,.65]]){
      g.lineStyle(width,color,alpha).beginPath().moveTo(points[0].x,points[0].y);
      for(const p of points.slice(1))g.lineTo(p.x,p.y);
      g.strokePath();
    }
    const f=(time*.0013+i*.137)%1,p=at(f);
    g.fillStyle(0xe0ffff,.8).fillEllipse(p.x,p.y,1.8,3.5+f*2);
    const splash=(time*.002+i*.19)%1,side=i%2?1:-1;
    g.fillStyle(0xd2f1ed,(1-splash)*.55).fillEllipse(end.x+side*splash*12,end.y-Math.sin(splash*Math.PI)*9,1.8,2.4);
  }
  g.lineStyle(1,0xd4efeb,.4).strokeEllipse(hit.x,hit.y+1,19+water*4,6);
}
