import {pin,routeArt} from './visuals.js';
import {safetyRouteConfig,CITY_SITES,FIELD_POINTS} from './learning-model.js';
import {$,$$,escapeHTML,icon} from './ui.js';
import {backgroundForAsset} from './stage-art.js';
import {modelScene,sceneSVG,cityPairSVG,riverScene,MODEL_MOUTH,cityTimeLabel} from './observation-scenes.js';
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
 if(e.kind==='river'){viewBox='0 0 1200 640';art=sceneSVG(riverScene(e.time,e.water))+`<g transform="translate(150 120) scale(.9 .8)">${pin(e.point,'✓','#267360')}${e.prediction?pin(e.prediction,'내 예상'):''}</g>`;}
 else if(e.kind==='model'){viewBox='0 0 1200 640';const p=e.sceneVersion?e.point:e.claim==='mouth'?{x:MODEL_MOUTH.x/1200,y:MODEL_MOUTH.y/640}:{x:700/1200,y:398/640};art=sceneSVG(modelScene(e.parts,e.time))+(p?`<g transform="scale(1.2 1.28)">${pin(p,'✓')}</g>`:'');}
 else if(e.kind==='comparison'){viewBox='0 0 1200 640';art=`<svg width="590" height="580" y="50" viewBox="0 0 1200 640">${sceneSVG(modelScene(e.parts,e.time))}</svg><image href="${A+backgroundForAsset('volcano-eruption')}.webp" x="610" y="50" width="590" height="580"/><text x="300" y="35" font-size="28" text-anchor="middle">내 모형 · 붉은 물</text><text x="900" y="35" font-size="28" text-anchor="middle">실제 화산 자료</text>`;}
 else if(e.kind==='route')art=routeArt(e.config||safetyRouteConfig(e.outside),e.outside)+'<polyline points="'+(e.points||[]).map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="#28765c" stroke-width="9" stroke-linecap="round"/>';
 else if(e.kind==='city'||e.kind==='notice'){viewBox='0 0 1200 640';art=cityPairSVG(Math.max(0,CITY_SITES.findIndex(s=>s.id===e.site)));}
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
export function evidenceCard(e,action=''){
 const recreated=['river','model','comparison','city','notice'].includes(e.kind),city=['city','notice'].includes(e.kind);
 const after=e.afterLabel||cityTimeLabel(Math.max(0,CITY_SITES.findIndex(s=>s.id===e.site)));
 const time=city?`<p class="evidence-time">분출 당시 → ${esc(after)}</p>`:'';
 return `<article class="saved-evidence">${imageEvidence(e)}<div><strong>${esc(e.label)}</strong>${time}${recreated?'<small class="evidence-caption">활동 조건과 내 표시로 재현한 그림</small>':''}<p>${esc(e.text||'')}</p>${e.answerHint?'<small>정답 힌트를 살펴본 연습</small>':e.operationHelp?'<small>조작 도움 사용 · 보상 동일</small>':''}${action}</div></article>`;
}
export function showEvidence(ctx){const entries=Object.values(ctx.data.evidence||{}),hinted=Object.values(ctx.data.adventure?.chapters||{}).some(c=>Object.values(c.work||{}).some(w=>w.answerHint));ctx.modal('내 관찰 수첩',entries.length?`${hinted?'<p>정답 힌트를 살펴본 활동은 연습으로 남아. 기록탑의 새 상황에서는 내 판단으로 적용해 봐.</p>':''}<div class="evidence-list">${entries.map(e=>evidenceCard(e,`<button class="secondary" data-revisit="${esc(e.id)}">다시 보기</button>`)).join('')}</div>`:'<p>그림을 살펴보고 관찰 기록을 남겨 봐.</p>',(dialog,close)=>{$$('[data-revisit]',dialog).forEach(b=>b.onclick=()=>{const ev=ctx.data.evidence[b.dataset.revisit];ctx.data.revisit=ev.id;ctx.save();close();ctx.go(ev.activity);});});}
export function pauseMessage(ctx){ctx.say('수첩을 닫으면 보던 장면에서 계속할 수 있어.');}
