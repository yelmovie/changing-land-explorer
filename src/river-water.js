// Soil-surface coordinates are shared by live water, comparison and saved records.
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
const seed=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const mix=(a,b,f)=>a+(b-a)*f;
const sample=(fn,from,to,count)=>Array.from({length:count+1},(_,i)=>fn(from+(to-from)*i/count));
export const wetSoilAlpha=(time,water)=>clamp((time-.05)/.7)*(water===1?.62:1);
const ARRIVE=.52;
const reach=t=>1-(1-clamp(t/ARRIVE))**1.5;
const reachedAt=f=>ARRIVE*(1-(1-clamp(f))**(1/1.5));
const settledAt=t=>clamp((t-ARRIVE)/(1-ARRIVE));
const course=f=>{const p=riverFlowPoint(f);return {x:p.x,y:p.y+Math.sin(f*23+1)*2.3*Math.sin(f*Math.PI)};};
const CREST=[[.1,.153],[.15,.207],[.2,.261],[.25,.31],[.3,.35],[.35,.39],[.4,.431],[.45,.468],[.5,.51],[.55,.539],[.6,.563],[.65,.587],[.7,.606],[.75,.615],[.8,.619],[.85,.621],[.9,.627],[.95,.668]];
function crestY(x){
  const fx=(x-150)/900,i=Math.max(0,Math.min(CREST.length-2,Math.floor((fx-.1)/.05))),[a,b]=[CREST[i],CREST[i+1]];
  return 120+400*mix(a[1],b[1],clamp((fx-a[0])/.05));
}
const inside=points=>points.map(p=>({x:p.x,y:Math.max(p.y,crestY(p.x)+3)}));
function ribbon(centre,half){
  const near=[],far=[];
  centre.forEach((p,i)=>{
    const a=centre[Math.max(0,i-1)],b=centre[Math.min(centre.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
    const [front,back]=half(i/Math.max(1,centre.length-1));
    near.push({x:p.x-dy/l*front,y:p.y+dx/l*front});far.unshift({x:p.x+dy/l*back,y:p.y-dx/l*back});
  });
  return inside(near.concat(far));
}
const patch=(x,y,w,h,n)=>inside(Array.from({length:10},(_,i)=>{
  const a=i/10*Math.PI*2,r=.68+seed(n+i*3)*.4;
  return {x:x+Math.cos(a)*w/2*r,y:y+Math.sin(a)*h/2*r};
}));
export const riverFlowProfile=water=>water===2?{jets:18,spread:3.6,width:4.6,alpha:.48,speed:.00165,splash:1.25,channel:10.4}:{jets:6,spread:3.2,width:2.1,alpha:.28,speed:.0011,splash:.62,channel:3.6};
const PILE={1:{height:42,left:45,right:120},2:{height:80,left:60,right:150}};
const pileCentre=()=>{const p=riverFlowPoint(1);return {x:p.x+8,y:p.y+18};};
export function riverDeposit(time,water=1){
  const settled=settledAt(clamp(time)),p=PILE[water],c=pileCentre(),size=settled**.72,h=p.height*size;
  return {type:'image',asset:'art/river-sediment-fan-v1',x:c.x+(p.right-p.left)/2*size,y:c.y-h/2,w:(p.left+p.right)*size,h,alpha:Math.min(1,settled*6)};
}

// Small uneven sheets have no parallel outlines or shaded sides. They disappear
// when the water drains, leaving the photographed wet grooves exposed.
function waterSheets(layers,path,width,motion,strength=1){
  for(let i=0;i<path.length-2;i+=3){
    const piece=path.slice(i,Math.min(path.length,i+6)),n=i/Math.max(1,path.length-1);
    layers.push({...poly(ribbon(piece,u=>{
      const spread=(.42+.35*Math.sin((n+u*.13)*41)**2)*width*(.65+.35*u);
      return [spread,spread*(.22+.25*Math.sin(n*63+u*9)**2)];
    }),'#91afa4',(.25+.13*Math.sin(i*1.7)**2)*strength),texture:'art/river-water-current-v2',textureScale:.19,offsetX:motion*.04,offsetY:motion*.015,role:'shallow-water'});
  }
}

// A few readable clods link the three processes: a bank bite, the same grain
// travelling on the wet surface, then that grain resting on the sediment fan.
// Their positions depend on experiment time, so pause and notebook replay agree.
function soilClods(time,water){
  const scars=[],moving=[],settled=[],fan=riverDeposit(time,water),base=pileCentre();
  const count=water===1?5:12,big=water===1?1:1.3;
  for(let i=0;i<count;i++){
    const from=.08+seed(i+690)*.58,birth=reachedAt(from)+.07+seed(i+700)*.08;
    if(time<birth)continue;
    const source=course(from),side=i%2?1:-1,edge=side*(5+seed(i+710)*8),size=(3.6+seed(i+720)*2.7)*big;
    const released=clamp((time-birth)/.055),arrival=Math.max(ARRIVE+.045,birth+.29+seed(i+730)*.10),travel=clamp((time-birth)/(arrival-birth));
    const lip=inside([{x:source.x-size*1.5,y:source.y+edge-size*.15},{x:source.x+size*.8,y:source.y+edge-size*.4},{x:source.x+size*1.65,y:source.y+edge+size*.25}]);
    scars.push({...poly(patch(source.x,source.y+edge,size*3.7,size*1.25,i+750),'#4e3521',.38*released),role:'erosion'},line(lip,1.3,'#e3be84',.55*released));
    const spread=.1+seed(i+770)*.55,target={x:base.x+fan.w*spread,y:base.y-fan.h*(.43-.26*spread)};
    let x,y,alpha=1,scale=1;
    if(travel<1){
      const p=course(from+(1-from)*travel**.83),fall=clamp(travel*7);
      x=p.x;y=p.y+edge*(1-fall)-Math.sin(fall*Math.PI)*5;
      // The final short roll joins the material already spreading below.
      const landing=clamp((travel-.84)/.16);x=mix(x,target.x,landing);y=mix(y,target.y,landing);
    }else{
      x=target.x;y=target.y;scale=.68;alpha=clamp((time-arrival)/.035);
    }
    const shapes=travel<1?moving:settled,r=size*scale;
    shapes.push({...ellipse(x+1.5,y+r*.33,r*1.8,r*.65,'#4b3423',.24*alpha),role:travel<1?'transported-soil':'settled-soil'});
    shapes.push({...poly(inside([{x:x-r,y:y+r*.12},{x:x-r*.65,y:y-r*.58},{x:x+r*.36,y:y-r*.5},{x:x+r,y:y+r*.06},{x:x+r*.35,y:y+r*.5}]),i%2?'#a77c45':'#947044',.96*alpha),role:travel<1?'transported-soil':'settled-soil'});
    shapes.push(line([{x:x-r*.55,y:y-r*.38},{x:x+r*.3,y:y-r*.34}],1,'#e5c18b',.7*alpha));
  }
  return {scars,moving,settled};
}

export function riverSurface(time,water=1,motion=0,flowing=false){
  const t=clamp(time),layers=[];if(t<=0)return layers;
  const front=reach(t),settled=settledAt(t),big=water===1?1:1.8,clock=flowing?motion:0;
  const clods=soilClods(t,water);
  const count=water===1?15:25;
  // Each removed clump leaves an individual bite, rather than a pair of rails.
  for(let i=0;i<count;i++){
    const f=.025+seed(i+20)*.73,birth=reachedAt(f)+.035+seed(i+40)*.12,age=clamp((t-birth)/.24);
    if(!age)continue;
    const p=course(f),side=i%2?1:-1,cut=(6+seed(i+60)*9)*big*age,edge=side*(3+seed(i+80)*5);
    layers.push({...poly(patch(p.x+2,p.y+edge,cut*2.2,cut*.78,i*13),'#59391f',.25+age*.23),role:'erosion'});
    layers.push(poly(patch(p.x+2,p.y+edge+1,cut*1.5,cut*.38,i*13+2),'#99704b',.25));
  }
  layers.push(...clods.scars);
  if(t<1||flowing){
    // Wet edges are irregular stains in the soil, with visible ground beneath.
    for(let i=0;i<20;i++){
      const f=i/19;if(f>front)break;
      const p=course(f),age=clamp((t-reachedAt(f))/.18);
      layers.push(ellipse(p.x,p.y+2,(20+seed(i+140)*20)*big,(5+seed(i+150)*5)*big,'#756749',age*.16));
    }
    const main=sample(course,0,front,52);
    waterSheets(layers,main,riverFlowProfile(water).channel,clock);
    if(water===2){
      const grow=clamp((t-.2)/.36);
      if(grow>0){
        const branch=f=>{const p=course(.24+f*.64);return {x:p.x,y:p.y+Math.sin(f*Math.PI)*(9+seed(43)*6)};};
        waterSheets(layers,sample(branch,0,grow,28),3.5,clock,.72);
      }
    }
    if(flowing){
      // A clump first falls from a cut bank, travels downhill, then joins the fan.
      for(let i=0;i<(water===1?30:100);i++){
        const from=.03+seed(i+200)*.62,birth=reachedAt(from)+.035+seed(i+220)*.2,travel=(t-birth)/(.35+seed(i+240)*.12);
        if(travel<0||travel>=1)continue;
        const f=from+(1-from)*travel**.8,p=course(f),side=i%2?1:-1;
        const edge=side*(8+seed(i+260)*8)*Math.max(0,1-travel*6),size=3+seed(i+280)*4;
        const x=p.x+(seed(i+300)-.5)*5,y=p.y+edge-Math.sin(Math.min(1,travel*6)*Math.PI)*3;
        layers.push({...ellipse(x+1,y+1,size*1.4,size*.6,'#4c3626',.34),role:'transported-soil'});
        layers.push({...ellipse(x,y,size,size*.66,i%2?'#b48b56':'#85603e',.95),role:'transported-soil'});
        layers.push(ellipse(x-size*.15,y-size*.1,size*.35,size*.17,'#dfc28e',.8));
      }
      for(let i=0;i<(water===1?16:48);i++){
        const f=(motion*.00015+seed(i+400))%1;if(f>front)continue;
        const a=course(f),b=course(Math.min(front,f+.009+seed(i+420)*.012)),off=(seed(i+440)-.5)*5;
        layers.push(line([{x:a.x,y:a.y+off},{x:b.x,y:b.y+off}],.7+seed(i+460)*.6,'#edf3df',.35));
      }
    }
  }
  layers.push(...clods.moving);
  if(settled>0){
    const fan=riverDeposit(t,water),c=pileCentre();
    layers.push(ellipse(fan.x,c.y+2,fan.w*.92,6+fan.h*.08,'#5b3c22',.16),fan);
    layers.push(...depositedGrains(t,water));
    if(flowing&&t<1){
      for(let i=0;i<12+water*6;i++){
        const k=(clock*.0007+seed(i+520))%1,x=riverFlowPoint(1).x+4+k*fan.w*.6,y=c.y-fan.h*(.5-.23*k);
        layers.push({...ellipse(x,y,2+seed(i+540)*2,1.6,'#d7b47b',(1-k)*.85),role:'settling-soil'});
      }
    }
    layers.push(...clods.settled);
  }
  return layers;
}

// A seeded granular fan is shared by live views and saved observations.
export function depositedGrains(time,water=1){
  const amount=settledAt(clamp(time));if(!amount)return [];
  const fan=riverDeposit(time,water),layers=[],count=Math.floor(amount*(water===1?100:240));
  for(let i=0;i<count;i++){
    const u=seed(i+1200),v=seed(i+1600),x=fan.x-fan.w*.43+u*fan.w*.86;
    const dome=Math.sin(u*Math.PI)**.7;
    const y=fan.y+fan.h*.46-v*fan.h*.84*dome;
    const r=(.7+seed(i+1900)*1.5)*(1.25-u*.55);
    layers.push({...ellipse(x+.6,y+.7,r*1.9,r*.75,'#62462c',.28),role:'deposited-grain'});
    layers.push({...ellipse(x,y,r*1.7,r*.85,['#a68351','#c4a06c','#d6b985','#90724a'][i%4],.86),role:'deposited-grain'});
    if(i%5===0)layers.push(ellipse(x-r*.2,y-r*.17,r*.65,r*.25,'#eee0ba',.62));
  }
  return layers;
}


// Fine separated jets fall from the tilted spout, then splash against the soil.
export function drawRiverSpray(g,can,time,water=1){
  g.clear();
  const from={x:can.x-70,y:can.y+1},hit=riverFlowPoint(0),profile=riverFlowProfile(water),jets=profile.jets;
  for(let i=0;i<jets;i++){
    const end={x:hit.x+(i-(jets-1)/2)*profile.spread,y:hit.y+Math.sin(i)*3};
    const at=f=>({x:from.x+(end.x-from.x)*f,y:from.y+(end.y-from.y)*f*f});
    const points=Array.from({length:9},(_,j)=>at(j/8));
    for(const [width,color,alpha] of [[profile.width,0x65a9b5,profile.alpha],[water===1?.8:1.6,0xe4ffff,water===1?.48:.8]]){
      g.lineStyle(width,color,alpha).beginPath().moveTo(points[0].x,points[0].y);
      for(const p of points.slice(1))g.lineTo(p.x,p.y);
      g.strokePath();
    }
    const f=(time*profile.speed+i*.137)%1,p=at(f);
    g.fillStyle(0xe0ffff,.85).fillEllipse(p.x,p.y,water===1?1.7:3.1,(4.5+f*3)*(water===1?.75:1.25));
    const splash=(time*.002+i*.19)%1,side=i%2?1:-1,reach=(14+seed(i+980)*22)*profile.splash;
    g.fillStyle(0xd2f1ed,(1-splash)*.7).fillEllipse(end.x+side*splash*reach,end.y-Math.sin(splash*Math.PI)*(12+seed(i+990)*10)*profile.splash,water===1?1.6:3.2,water===1?2:4);
  }
  for(let i=0;i<3;i++){
    const ring=(time*.0016+i/3)%1;
    g.lineStyle(1.6,0xd4efeb,(1-ring)*.7).strokeEllipse(hit.x,hit.y+1,(18+ring*46)*profile.splash,(6+ring*15)*profile.splash);
  }
}
