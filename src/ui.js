import {clamp} from './model.js';
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={home:'M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10',back:'m14 5-7 7 7 7M7 12h14',sound:'M11 4 5 9H2v6h3l6 5zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',mute:'M11 4 5 9H2v6h3l6 5zM16 9l6 6m0-6-6 6',settings:'m9 3 1-2h4l1 2 3 2 2 1v4l-2 2-1 3-1 3h-4l-2-2-3-1-3-1v-4l2-2 1-3zM15 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0',bag:'M5 8h14l2 13H3zM8 8V5a4 4 0 0 1 8 0v3M8 14h8',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',check:'m4 12 5 5L20 6',lock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4',leaf:'M20 3C6 1 1 10 7 16s15-1 13-13ZM6 20 16 8',lens:'M16 16l6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',camera:'M3 6h4l2-3h6l2 3h4v15H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',box:'m2 7 10-5 10 5v12l-10 4-10-4zM2 7l10 5 10-5M12 12v11',compass:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M16 6l-3 7-7 3 3-7z',flag:'M4 22V2m0 2c6-5 10 5 16 0v10c-6 5-10-5-16 0',close:'m5 5 14 14M19 5 5 19',play:'m8 4 13 8-13 8z',reset:'M4 9a9 9 0 1 1 0 8M4 2v7h7',arrow:'M3 12h17m-6-6 6 6-6 6',book:'M3 3h7l2 2 2-2h7v17h-7l-2 2-2-2H3zM12 5v17',water:'M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0'};
export function icon(name,size=24){return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.star}"/></svg>`;}
export function button(label,cls='primary',id=''){return `<button ${id?`id="${id}"`:''} class="${cls}">${label}</button>`;}
export const imageCache=new Map();
export function getImage(src){if(!imageCache.has(src)){const im=new Image();im.src=src;imageCache.set(src,im);}return imageCache.get(src);}
export function fitImage(c,src,x,y,w,h,cover=false){const im=getImage(src);if(!im.complete||!im.naturalWidth)return;const scale=cover?Math.max(w/im.width,h/im.height):Math.min(w/im.width,h/im.height);const dw=im.width*scale,dh=im.height*scale;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);c.restore();}
export function roundRect(c,x,y,w,h,r=14,fill='#fff',stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
export function text(c,value,x,y,size=24,color='#203e38',align='left'){c.font=`700 ${size}px "GeoSans", "Malgun Gothic", sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(value,x,y);}
export function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}}
export function line(c,points,color='#4daba1',width=8){if(!points.length)return;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.lineCap=c.lineJoin='round';c.stroke();}
export function makeCanvas(root,label,draw,handlers={}){
 root.innerHTML=`<canvas class="activity-canvas" width="1000" height="560" role="img" aria-label="${escapeHTML(label)}"></canvas>`;
 const el=$('canvas',root),c=el.getContext('2d');let frame,disposed=false,down=false,last=0;
 const point=e=>{const r=el.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width)*1000,y:clamp((e.clientY-r.top)/r.height)*560};};
 el.addEventListener('pointerdown',e=>{if(document.querySelector('dialog[open]'))return;down=true;el.setPointerCapture(e.pointerId);handlers.down?.(point(e),e);});
 el.addEventListener('pointermove',e=>{if(document.querySelector('dialog[open]'))return;handlers.move?.(point(e),down,e);});
 el.addEventListener('pointerup',e=>{if(!down)return;down=false;handlers.up?.(point(e),e);});
 el.addEventListener('pointercancel',()=>{down=false;handlers.cancel?.();});
 function tick(t){if(disposed)return;const dt=Math.min((t-last)/1000,.04);last=t;if(!document.hidden&&!document.querySelector('dialog[open]')){c.clearRect(0,0,1000,560);draw(c,t,dt);}frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);return {el,c,dispose(){disposed=true;cancelAnimationFrame(frame);}};
}
export function dragBoard(root,{items,zones,placements,onChange,background,extra=''}){
 root.innerHTML=`<div class="drag-board" ${background?`style="--board-bg:url('${background}')"`:''}><div class="board-zones">${zones.map(z=>`<div class="drop-zone" data-zone="${z.id}"><h3>${z.label}</h3><p>${z.description||''}</p><div class="zone-items"></div></div>`).join('')}</div><div class="item-tray" aria-label="옮길 자료">${items.map(i=>`<button class="drag-item" data-item="${i.id}" aria-label="${escapeHTML(i.label)} 옮기기">${i.image?`<img src="${i.image}" alt="">`:''}<span>${i.label}</span></button>`).join('')}</div>${extra}<p class="drag-tip">${icon('arrow',18)} 자료를 끌어서 놓아 봐. 누른 뒤 놓을 곳을 눌러도 돼.</p></div>`;
 let selected=null,dragged=false,start=null;
 const select=(id)=>{$$('.drag-item',root).forEach(el=>el.classList.toggle('selected',el.dataset.item===id));selected=id;};
 const place=(id,zone)=>{placements[id]=zone;const el=$(`[data-item="${id}"]`,root);$(`[data-zone="${zone}"] .zone-items`,root).append(el);el.classList.remove('dragging');el.style.transform='';select(null);onChange(id,zone);};
 for(const el of $$('.drag-item',root)){
  const id=el.dataset.item;
  el.addEventListener('pointerdown',e=>{select(id);start={x:e.clientX,y:e.clientY};dragged=false;el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(!start||selected!==id||!el.hasPointerCapture(e.pointerId))return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>7){dragged=true;el.classList.add('dragging');el.style.transform=`translate(${dx}px,${dy}px)`;}});
  el.addEventListener('pointerup',e=>{el.classList.remove('dragging');el.style.transform='';if(dragged){const zone=$$('.drop-zone',root).find(z=>{const r=z.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});if(zone)place(id,zone.dataset.zone);}start=null;});
  el.addEventListener('pointercancel',()=>{el.style.transform='';el.classList.remove('dragging');start=null;});
  el.addEventListener('click',()=>{if(!dragged)select(id);});
  if(placements[id]&&$(`[data-zone="${placements[id]}"]`,root))$(`[data-zone="${placements[id]}"] .zone-items`,root).append(el);
 }
 for(const el of $$('.drop-zone',root)){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',el.querySelector('h3').textContent+'에 놓기');el.addEventListener('click',e=>{if(e.target.closest('.drag-item'))return;if(selected)place(selected,el.dataset.zone);});el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&selected){e.preventDefault();place(selected,el.dataset.zone);}});}
 return {place};
}
export function checklist(root,rows){root.innerHTML=rows.map(([name,done])=>`<li class="${done?'done':''}"><span>${done?icon('check',15):''}</span>${name}</li>`).join('');}
