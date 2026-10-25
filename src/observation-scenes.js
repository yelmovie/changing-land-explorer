import {backgroundForAsset} from './stage-art.js';
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
export function riverScene(time=0,water=1){
 const t=Math.max(0,Math.min(1,time)),px=v=>150+v*900,py=v=>120+v*400;
 const layers=[image('art/river-sand-model',600,320,900,400)];
 if(t>0){
  const route=[[.19,.25],[.27,.38],[.53,.55],[.82,.72]],count=Math.min(1,t*1.5)*3,path=[{x:px(route[0][0]),y:py(route[0][1])}];
  for(let i=0;i<Math.ceil(count);i++){const a=route[i],b=route[i+1],f=Math.min(1,count-i);path.push({x:px(a[0]+(b[0]-a[0])*f),y:py(a[1]+(b[1]-a[1])*f)});}
  layers.push(line(path,7+water*4,'#72c8e5',.8),ellipse(px(.27),py(.38),t*water*30,t*water*12,'#725130',.8));
  const settled=Math.max(0,Math.min(1,(t-.62)/.38));layers.push(ellipse(px(.82),py(.72),settled*water*48,settled*water*19,'#e1bd76'));
  for(let i=0;i<26*water;i++){const f=Math.max(0,Math.min(1,t*1.4-i*.024));if(f>0)layers.push(ellipse(px(.27+f*.55)+(i%3-1)*5,py(.38+f*.34)+(i%4-2)*3,5.6,5.6,i%2?'#8a6036':'#b5874e'));}
 }
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
  layers.push(line(path,19,'#d85e50'),ellipse(560,195,56,17,'#e37161'));
  if(amount>.8)layers.push(ellipse(754,464,(amount-.8)*320,18,'#d85e50'));
 }
 return {width:1200,height:640,background:'volcano-lab',layers};
}
export function cityScene(index,later=false){
 const layers=[],p=CITY_POINTS[index];
 if(!later){
  layers.push({type:'rect',x:0,y:0,w:1200,h:510,color:'#7b7770',alpha:.28});
  for(let i=0;i<10;i++)layers.push(ellipse(570+i*43,66+Math.sin(i)*15,170,75,'#646466',.65));
  layers.push(line([{x:720,y:90},{x:755,y:125},{x:780,y:165}],12,'#cb6e4d',.9));
  for(let i=0;i<70;i++)layers.push(ellipse(70+i*79%1080,150+i*47%210,(2+i%3)*2,(2+i%3)*2,'#656360',.9));
  layers.push(ellipse(540,277,360,90,'#807668',.7));
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
  else if(p.stroke)g.lineStyle(p.stroke,color(p.color),p.alpha??1).strokeRect(p.x,p.y,p.w,p.h);
  else if(p.type==='ellipse'||p.type==='rect'){g.fillStyle(color(p.color),p.alpha??1);if(p.type==='ellipse')g.fillEllipse(p.x,p.y,p.w,p.h);else g.fillRect(p.x,p.y,p.w,p.h);}
 }
}
export function paintScene(scene,api,description,{background=true,x=0,y=0,scale=1}={}){
 const container=scene.add.container(x,y).setScale(scale);
 if(background)container.add(api.image(description.background,600,320,1200,640));
 for(const p of description.layers){
  if(p.type==='image'){container.add(api.image(p.asset,p.x,p.y,p.w,p.h));continue;}
  if(p.type==='label'){container.add(api.text(p.text,p.x,p.y,24,'#ffffff').setBackgroundColor(p.color).setPadding(12,9));continue;}
  const g=scene.add.graphics();container.add(g);
  drawShapes(g,[p]);
 }
 return container;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sceneSVG(description){
 const picture=(asset,x,y,w,h)=>`<image href="/assets/${esc(backgroundForAsset(asset))}.webp" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
 return picture(description.background,0,0,1200,640)+description.layers.map(p=>{
  if(p.type==='image')return picture(p.asset,p.x-p.w/2,p.y-p.h/2,p.w,p.h);
  if(p.type==='label')return `<rect x="${p.x-155}" y="${p.y-24}" width="310" height="48" rx="5" fill="${p.color}"/><text x="${p.x}" y="${p.y+8}" text-anchor="middle" fill="white" font-size="24">${esc(p.text)}</text>`;
  if(p.type==='line')return `<polyline points="${p.points.map(q=>q.x+','+q.y).join(' ')}" fill="none" stroke="${p.color}" stroke-width="${p.width}" opacity="${p.alpha??1}"/>`;
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
