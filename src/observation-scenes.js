import {backgroundForAsset} from './stage-art.js';
import {riverSurface,wetSoilAlpha} from './river-water.js';
// Serializable scene conditions. Activities, notebooks, selected records and
// endings all render these same assets, coordinates, overlays and time labels.
export const MODEL_MOUTH={x:560,y:195};
export const MODEL_FLOW=[MODEL_MOUTH,{x:595,y:255},{x:642,y:325},{x:700,y:398},{x:755,y:465}];
export const CITY_POINTS=[{x:210,y:282},{x:530,y:280},{x:1030,y:330}];
export const cityMarker=index=>({...CITY_POINTS[index],y:CITY_POINTS[index].y+5,w:index===1?350:220,h:145});
export const CITY_OBSERVATIONS=[['비행 중단','안전 확인 뒤 운항','화산재 속에서도 운항'],['농작물 피해','오랜 시간 뒤 토양 변화','분출하자마자 풍년'],['위험할 때 출입 금지','안전 확인 뒤 이용','분출 중에도 온천 이용']];
export const cityTimeLabel=index=>index===1?'아주 오랜 시간 뒤':'복구 · 안전 확인 뒤';
const image=(asset,x,y,w,h)=>({type:'image',asset,x,y,w,h});
const ellipse=(x,y,w,h,color,alpha=1)=>({type:'ellipse',x,y,w,h,color,alpha});
const line=(points,width,color,alpha=1)=>({type:'line',points,width,color,alpha});
const poly=(points,color,alpha=1)=>({type:'poly',points,color,alpha});
export function riverScene(time=0,water=1,motion=0,flowing=false){
 const layers=[image('art/river-sand-model',600,320,900,400)];
 const alpha=wetSoilAlpha(time,water);
 if(alpha>0)layers.push({...image('art/river-sand-wet-v1',600,320,900,400),alpha});
 layers.push(...riverSurface(time,water,motion,flowing));
 return {width:1200,height:640,background:'river-lab',layers};
}
export function modelScene(parts=['tray','mountain','water'],amount=1){
 const layers=[];
 if(parts.includes('water'))layers.push(line([{x:955,y:425},{x:850,y:425},{x:560,y:433},{x:560,y:215}],14,'#bcae98'),line([{x:955,y:425},{x:850,y:425},{x:560,y:433},{x:560,y:215}],7,'#e5d7bd'));
 const assets={tray:['art/volcano-tray',582,485,545,90],mountain:['art/volcano-mountain',560,326,470,310],water:['art/volcano-syringe',957,343,100,231]};
 for(const id of parts)if(assets[id])layers.push(image(...assets[id]));
 if(amount>0){
  const count=Math.min(1,amount)*4,path=[MODEL_FLOW[0]];
  for(let i=0;i<Math.ceil(count);i++){const a=MODEL_FLOW[i],b=MODEL_FLOW[i+1],f=Math.min(1,count-i);path.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f});}
  const stream=[path[0]];
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];for(let j=1;j<=8;j++){const f=j/8;stream.push({x:a.x+(b.x-a.x)*f+Math.sin(f*Math.PI)*Math.sin(i*3+j)*2.3,y:a.y+(b.y-a.y)*f});}}
  layers.push(line(stream,25,'#7d4636',.17),line(stream,15,'#d85e50',.86),ellipse(560,195,50,14,'#d85e50',.85));
  // Broken reflections and uneven margins read as shallow coloured water, not a pipe.
  for(let i=1;i<stream.length;i+=3){const p=stream[i];layers.push(ellipse(p.x-2,p.y,4+(i%4),7,'#ffd0b5',.38));}
  if(amount>.8){const spread=(amount-.8)*320;layers.push(ellipse(754,466,spread*1.1,20,'#855142',.18),ellipse(754,464,spread,15,'#d85e50',.76),ellipse(743,465,spread*.65,18,'#d85e50',.5),ellipse(748,461,spread*.35,3,'#f4b29c',.55));}
 }
 return {width:1200,height:640,background:'volcano-lab',layers};
}
export function cityScene(index,later=false){
 const layers=[],p=CITY_POINTS[index];
 if(!later){
  layers.push({type:'rect',x:0,y:0,w:1200,h:510,color:'#7b7770',alpha:.28});
  // Reuse verified transparent ash art in both live observations and saved evidence.
  for(const [x,y,w,h,key] of [[640,92,210,160,1],[790,88,250,180,2],[945,103,270,170,1]])layers.push({...image('art/volcano-ash-puff-'+key+'-v1',x,y,w,h),alpha:.82});
  layers.push(line([{x:720,y:90},{x:755,y:125},{x:780,y:165}],12,'#cb6e4d',.9));
  for(let i=0;i<70;i++)layers.push(ellipse(70+i*79%1080,150+i*47%210,(2+i%3)*2,(2+i%3)*2,'#656360',.9));
  layers.push(poly([{x:397,y:232},{x:491,y:215},{x:558,y:236},{x:468,y:261}],'#817660',.48),poly([{x:462,y:254},{x:560,y:230},{x:651,y:255},{x:552,y:282}],'#817660',.48),poly([{x:527,y:286},{x:618,y:260},{x:691,y:277},{x:607,y:307}],'#817660',.48));
  for(const [x,y] of [[210,300],[1030,360]])layers.push({type:'rect',x:x-80,y:y-23,w:160,h:46,color:'#b75836',stroke:10},line([{x:x-67,y:y-17},{x:x+67,y:y+17}],10,'#b75836'),line([{x:x-67,y:y+17},{x:x+67,y:y-17}],10,'#b75836'));
 }
 layers.push({type:'label',x:p.x,y:p.y-55,text:CITY_OBSERVATIONS[index][later?1:0],color:later?'#376a4b':'#705446'});
 return {width:1200,height:640,background:'city-calm',layers};
}
const color=s=>parseInt(s.slice(1),16);
export function drawShapes(g,layers){
 g.clear();
 for(const p of layers){
  if(p.type==='line'){g.lineStyle(p.width,color(p.color),p.alpha??1).beginPath().moveTo(p.points[0].x,p.points[0].y);p.points.slice(1).forEach(q=>g.lineTo(q.x,q.y));g.strokePath();}
  else if(p.type==='poly'){if(p.points.length>2)g.fillStyle(color(p.color),p.alpha??1).fillPoints(p.points,true);}
  else if(p.type==='grains'){g.fillStyle(color(p.color),p.alpha??1);for(const [x,y,s] of p.points)g.fillRect(x-s/2,y-s/2,s,s);}
  else if(p.stroke)g.lineStyle(p.stroke,color(p.color),p.alpha??1).strokeRect(p.x,p.y,p.w,p.h);
  else if(p.type==='ellipse'||p.type==='rect'){g.fillStyle(color(p.color),p.alpha??1);if(p.type==='ellipse')g.fillEllipse(p.x,p.y,p.w,p.h);else g.fillRect(p.x,p.y,p.w,p.h);}
 }
}
// The experiment and notebook share material descriptions; the live scene uploads
// one small canvas instead of allocating sprites for every ripple and sand grain.
export function drawCanvasShapes(ctx,layers,source,patterns=new Map()){
 for(const p of layers){
  ctx.globalAlpha=p.alpha??1;
  if(p.type==='image'){
   const img=source(p.asset);if(img)ctx.drawImage(img,p.x-p.w/2,p.y-p.h/2,p.w,p.h);
   continue;
  }
  ctx.fillStyle=p.color||'#ffffff';
  if(p.texture){
   const img=source(p.texture);
   if(img&&!patterns.has(p.texture))patterns.set(p.texture,ctx.createPattern(img,'repeat'));
   const pattern=patterns.get(p.texture);
   if(pattern){pattern.setTransform(new DOMMatrix().translate(p.offsetX||0,p.offsetY||0).scale(p.textureScale||1));ctx.fillStyle=pattern;}
  }
  if(p.type==='poly'||p.type==='line'){
   if(!p.points.length)continue;
   ctx.beginPath();ctx.moveTo(p.points[0].x,p.points[0].y);
   for(const point of p.points.slice(1))ctx.lineTo(point.x,point.y);
   if(p.type==='poly'){ctx.closePath();ctx.fill();}
   else{ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  }else if(p.type==='grains'){
   for(const [x,y,s]of p.points)ctx.fillRect(x-s/2,y-s/2,s,s);
  }else if(p.type==='ellipse'){
   ctx.beginPath();ctx.ellipse(p.x,p.y,p.w/2,p.h/2,0,0,Math.PI*2);ctx.fill();
  }else if(p.type==='rect')ctx.fillRect(p.x,p.y,p.w,p.h);
 }
 ctx.globalAlpha=1;
}
export function paintScene(scene,api,description,{background=true,x=0,y=0,scale=1}={}){
 const container=scene.add.container(x,y).setScale(scale);
 if(background)container.add(api.image(description.background,600,320,1200,640,{sceneBackground:false}));
 for(const p of description.layers){
  if(p.type==='image'){container.add(api.image(p.asset,p.x,p.y,p.w,p.h).setAlpha(p.alpha??1));continue;}
  if(p.type==='label'){container.add(api.text(p.text,p.x,p.y,24,'#ffffff').setBackgroundColor(p.color).setPadding(12,9));continue;}
  const g=scene.add.graphics();container.add(g);
  drawShapes(g,[p]);
 }
 return container;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sceneSVG(description){
 const picture=(asset,x,y,w,h,alpha=1)=>`<image href="/assets/${esc(backgroundForAsset(asset))}.webp" x="${x}" y="${y}" width="${w}" height="${h}" opacity="${alpha}" preserveAspectRatio="none"/>`;
 return picture(description.background,0,0,1200,640)+description.layers.map(p=>{
  if(p.type==='image')return picture(p.asset,p.x-p.w/2,p.y-p.h/2,p.w,p.h,p.alpha??1);
  if(p.type==='label')return `<rect x="${p.x-155}" y="${p.y-24}" width="310" height="48" rx="5" fill="${p.color}"/><text x="${p.x}" y="${p.y+8}" text-anchor="middle" fill="white" font-size="24">${esc(p.text)}</text>`;
  if(p.type==='line')return `<polyline points="${p.points.map(q=>q.x+','+q.y).join(' ')}" fill="none" stroke="${p.color}" stroke-width="${p.width}" opacity="${p.alpha??1}"/>`;
  if(p.type==='poly'){
   const id='material-'+description.layers.indexOf(p),size=512*(p.textureScale||1);
   const material=p.texture?`<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}" patternTransform="translate(${p.offsetX||0} ${p.offsetY||0})">${picture(p.texture,0,0,size,size)}</pattern></defs>`:'';
   return material+`<polygon points="${p.points.map(q=>q.x+','+q.y).join(' ')}" fill="${p.texture?'url(#'+id+')':p.color}" opacity="${p.alpha??1}"/>`;
  }
  if(p.type==='grains')return `<path d="${p.points.map(([x,y,s])=>`M${x-s/2} ${y-s/2}h${s}v${s}h${-s}z`).join('')}" fill="${p.color}" opacity="${p.alpha??1}"/>`;
  if(p.type==='ellipse')return `<ellipse cx="${p.x}" cy="${p.y}" rx="${p.w/2}" ry="${p.h/2}" fill="${p.color}" opacity="${p.alpha??1}"/>`;
  return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" ${p.stroke?`fill="none" stroke="${p.color}" stroke-width="${p.stroke}"`:`fill="${p.color}"`} opacity="${p.alpha??1}"/>`;
 }).join('');
}
export function modelEvidence(d){return {sceneVersion:1,parts:[...(d.assembly||[])],time:d.modelTime??1,studentMark:true};}
export function cityEvidence(index){return {sceneVersion:1,siteIndex:index,afterLabel:cityTimeLabel(index),observations:CITY_OBSERVATIONS[index].slice(0,2),studentMark:true};}
export function cityPairSVG(index){
 const p=CITY_POINTS[index],crop=[Math.max(0,Math.min(780,p.x-210)),Math.max(0,p.y-145),420,300].join(' ');
 const m=cityMarker(index);
 return [false,true].map((later,i)=>`<svg x="${i*610}" y="70" width="590" height="540" viewBox="${crop}">${sceneSVG(cityScene(index,later))}<ellipse cx="${m.x}" cy="${m.y}" rx="${m.w/2}" ry="${m.h/2}" fill="none" stroke="#ffdc75" stroke-width="5"/></svg><text x="${i*610+295}" y="42" text-anchor="middle" font-size="26" fill="#294239">${later?cityTimeLabel(index):'분출 당시'}</text>`).join('');
}
