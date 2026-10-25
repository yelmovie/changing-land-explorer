import {riverArt,pin,cityArt,routeArt,modelArt} from './visuals.js';
import {safetyRouteConfig,CITY_SITES,FIELD_POINTS} from './learning-model.js';
import {$,$$,escapeHTML,icon} from './ui.js';
import {backgroundForAsset} from './stage-art.js';
export const A='/assets/';
export const esc=escapeHTML;
export const btn=(label,id,cls='secondary')=>`<button class="${cls}" id="${id}">${label}</button>`;
export const pill=(label,selected=false,attrs='')=>`<button class="chip ${selected?'selected':''}" aria-pressed="${selected}" ${attrs}>${label}</button>`;
export const svgText=(s,x,y,size=22,fill='#243e36',anchor='middle')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="Malgun Gothic,sans-serif">${esc(s)}</text>`;
export function svgFrame(content,label='관찰 그림',viewBox='0 0 1000 500'){return `<svg class="scene-svg" viewBox="${viewBox}" role="img" aria-label="${esc(label)}">${content}</svg>`;}
export function svgPoint(svg,event){const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:p.x,y:p.y};}
export function pointerSurface(el,handlers){let pointer=null;const down=e=>{if(pointer!==null||e.button>0||document.querySelector('dialog[open]'))return;pointer=e.pointerId;el.setPointerCapture(pointer);handlers.down?.(svgPoint(el,e),e);};const move=e=>{if(pointer===e.pointerId)handlers.move?.(svgPoint(el,e),e);};const end=e=>{if(pointer!==e.pointerId)return;pointer=null;if(e.type==='pointercancel')handlers.cancel?.();else handlers.up?.(svgPoint(el,e),e);};el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);};}
export function ticker(fn){let frame,last=0,closed=false;function tick(t){if(closed)return;const dt=Math.min((t-last)/1000,.04);last=t;if(!document.hidden&&!document.querySelector('dialog[open]'))fn(dt,t);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);return()=>{closed=true;cancelAnimationFrame(frame);};}
export function capture(ctx,item){ctx.data.evidence??={};ctx.data.evidence[item.id]={...item,activity:ctx.step,stage:ctx.s.id,revision:(ctx.data.evidence[item.id]?.revision||0)+1};ctx.save();ctx.chime();ctx.update();}
export function bindChoices(root,attr,callback){$$(`[${attr}]`,root).forEach(b=>b.onclick=()=>callback(b.getAttribute(attr)));}
export function ensureData(d,defaults){for(const [key,value]of Object.entries(defaults))if(d[key]===undefined||d[key]===null)d[key]=structuredClone(value);return d;}
export function imageEvidence(e){
 let art='',viewBox='0 0 1000 500';
 if(e.kind==='river')art=riverArt(e.time,e.water)+pin(e.point,'✓','#267360');
 else if(e.kind==='model')art=modelArt(e.time)+(e.point?pin(e.point,'✓'): '');
 else if(e.kind==='route')art=routeArt(e.config||safetyRouteConfig(e.outside),e.outside)+'<polyline points="'+(e.points||[]).map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="#28765c" stroke-width="9" stroke-linecap="round"/>';
 else if(e.kind==='city'||e.kind==='notice'){const site=CITY_SITES.find(s=>s.id===e.site)||CITY_SITES[0];const box=[site.x-150,site.y-120,300,240].join(' ');art=[0,1].map((t)=>'<svg x="'+(t*510)+'" y="45" width="490" height="450" viewBox="'+box+'">'+cityArt(t)+'</svg>').join('')+svgText('분출 당시 → 오랜 시간 뒤',500,35,26);}
 else if(e.asset){
  const field=e.kind==='field'?FIELD_POINTS.find(p=>p.id===e.id):null;
  const point=field?{x:field.x/1000,y:field.y/560}:e.point;
  const z=Math.min(3,Math.max(1,Number(e.zoom)||1)),x=point?.x??.5,y=point?.y??.5;
  if(e.kind==='rock'){viewBox='0 60 400 280';art='<image href="'+A+esc(e.asset)+'.webp" x="'+(200-x*400*z)+'" y="'+(200-y*400*z)+'" width="'+(400*z)+'" height="'+(400*z)+'"/>'+(e.annotations?.length?'<polyline points="'+e.annotations.map(p=>p.x*400+','+p.y*400).join(' ')+'" fill="none" stroke="#edaa35" stroke-width="5"/>':'');}
  else {art='<g transform="translate('+((1-z)*x*1000)+' '+((1-z)*y*500)+') scale('+z+')"><image href="'+A+esc(backgroundForAsset(e.asset))+'.webp" width="1000" height="500" preserveAspectRatio="none"/></g>'+(point?pin(point,'✓'):'');}
 }
 if(art)return '<div class="evidence-image">'+svgFrame(art,e.label,viewBox)+'</div>';
 return '<div class="evidence-symbol">'+icon('book',40)+'</div>';
}
export function evidenceCard(e,action=''){return `<article class="saved-evidence">${imageEvidence(e)}<div><strong>${esc(e.label)}</strong><p>${esc(e.text||'')}</p>${action}</div></article>`;}
export function showEvidence(ctx){const entries=Object.values(ctx.data.evidence||{});ctx.modal('내 관찰 수첩',entries.length?`<div class="evidence-list">${entries.map(e=>evidenceCard(e,`<button class="secondary" data-revisit="${esc(e.id)}">다시 보기</button>`)).join('')}</div>`:'<p>그림을 살펴보고 관찰 기록을 남겨 봐.</p>',(dialog,close)=>{$$('[data-revisit]',dialog).forEach(b=>b.onclick=()=>{const ev=ctx.data.evidence[b.dataset.revisit];ctx.data.revisit=ev.id;ctx.save();close();ctx.go(ev.activity);});});}
export function pauseMessage(ctx){ctx.say('수첩을 닫으면 보던 장면에서 계속할 수 있어.');}
