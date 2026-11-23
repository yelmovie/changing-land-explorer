export const BRIDGE_ART='/assets/art/river-footbridge-v1.webp';
export const BRIDGE_SITES={
 checked:{label:'점검한 양쪽 받침',ends:[[322,128],[902,150]]},
 bank:{label:'깎이는 물가',ends:[[121,271],[701,294]]},
 sand:{label:'새로 쌓인 모래',ends:[[99,352],[840,333]]}
};
const flow=[
 'M922 58 C730 78 478 95 332 228 S324 399 560 480 S776 523 970 551',
 'M901 78 C694 100 526 117 391 227 S371 384 594 454 S850 500 983 527',
 'M895 100 C708 119 559 138 451 231 S439 359 619 425 S851 480 984 500'
];
function layout(site){
 const [[x,y],[right,bottom]]=site.ends,dx=right-x,dy=bottom-y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
 // Align the masonry feet in the image with the two ground points for this site.
 const width=length/.88,height=Math.min(118,width*.21);
 return {x,y,dx,dy,length,angle,width,height,transform:`translate(${x} ${y}) rotate(${angle*180/Math.PI})`};
}
function bridge(site,state){
 const {transform,width,height}=layout(site);
 return `<g transform="${transform}"><image class="bridge-model" data-bridge-model="${state}" href="${BRIDGE_ART}" x="${-.06*width}" y="${-.98*height}" width="${width}" height="${height}" preserveAspectRatio="none"/></g>`;
}
function slot(id,site,occupied){
 const {length,transform}=layout(site);
 return `<g transform="${transform}"><rect class="bridge-drop-zone" data-bridge-drop="${id}" data-occupied="${occupied}" x="0" y="-85" width="${length}" height="38" rx="19"/></g>`;
}
function grip(site){
 if(!site)return `<button type="button" class="bridge-grip bridge-tray" aria-label="다리 놓기"><img src="${BRIDGE_ART}" alt="" draggable="false"></button>`;
 const {x,y,dx,dy,width,height}=layout(site);
 return `<button type="button" class="bridge-grip bridge-on-river" aria-label="놓은 다리 옮기기" style="--grip-x:${(x-width*.06)/10}%;--grip-y:${(y+Math.min(0,dy)-height)*100/562}%;--grip-w:${(dx+width*.12)/10}%;--grip-h:${(height+Math.abs(dy))*100/562}%"></button>`;
}
export function bridgeExperiment(choice,phase,tested,testControl){
 const site=BRIDGE_SITES[choice||tested],locked=phase==='running'||phase==='held';
 const slots=Object.entries(BRIDGE_SITES).map(([id,value])=>slot(id,value,id===choice)).join('');
 return '<div class="bridge-map" data-bridge-phase="'+(phase||'ready')+'" data-bridge-choice="'+(choice||'')+'"><figure class="bridge-photo"><img src="/assets/art/river-field-clues-v3.webp" alt="왼쪽의 깎이는 물가에서 물길이 굽어 오른쪽 모래톱을 지나 흘러가요.">'
  +'<svg class="bridge-overlay" viewBox="0 0 1000 562" aria-hidden="true"><g class="bridge-current">'+flow.map(d=>'<path d="'+d+'" pathLength="100"/>').join('')+'</g>'
  +(!locked?slots:'')+(site?bridge(site,phase||'placed'):'')+'</svg>'+(!locked&&choice?grip(site):'')+'</figure></div>'
  +'<div class="bridge-tools">'+(!locked&&!choice?grip(): '')+testControl+'<span id="bridge-instructions" class="bridge-sr">화살표로 점선 자리를 살펴보고 엔터로 다리를 놓을 수 있어요.</span><span class="bridge-sr" data-bridge-status role="status"></span></div>';
}

export function bindBridgePlacement(board,{place,miss}){
 const map=board.querySelector('.bridge-map'),handle=board.querySelector('.bridge-grip');
 if(!map||!handle)return;
 const svg=map.querySelector('svg'),status=board.querySelector('[data-bridge-status]');
 const targets=[...map.querySelectorAll('[data-bridge-drop]')];
 handle.setAttribute('aria-describedby','bridge-instructions');
 let gesture,ghost,active=-1;
 function highlight(index){
  if(active===index)return;
  active=index;
  targets.forEach((el,i)=>el.classList.toggle('is-target',i===index));
  status.textContent=index<0?'':BRIDGE_SITES[targets[index].dataset.bridgeDrop].label;
 }
 function nearest(x,y){
  const matrix=svg.getScreenCTM(),bounds=svg.getBoundingClientRect();
  if(!matrix||x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)return -1;
  const range=Math.max(25,Math.min(55,22/matrix.a));
  let best=range,index=-1;
  targets.forEach((target,i)=>{
   const g=target.parentNode.getScreenCTM();
   if(!g)return;
   const p=new DOMPoint(x,y).matrixTransform(g.inverse()),length=Number(target.getAttribute('width'));
   const distance=Math.hypot(p.x-Math.max(0,Math.min(length,p.x)),p.y+66);
   if(distance<best){best=distance;index=i;}
  });
  return index;
 }
 function reset(){
  gesture=null;ghost?.remove();ghost=null;delete board.dataset.bridgeDragging;highlight(-1);
 }
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0||gesture)return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
  handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener('pointermove',e=>{
  if(gesture?.id!==e.pointerId)return;
  if(!gesture.moved&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<6)return;
  if(!gesture.moved){
   gesture.moved=true;board.dataset.bridgeDragging='';
   ghost=new Image();ghost.src=BRIDGE_ART;ghost.alt='';ghost.className='bridge-drag-image';board.append(ghost);
  }
  ghost.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
  highlight(nearest(e.clientX,e.clientY));
 });
 handle.addEventListener('pointerup',e=>{
  if(gesture?.id!==e.pointerId)return;
  const moved=gesture.moved,index=moved?nearest(e.clientX,e.clientY):-1;
  reset();
  if(index>=0)place(targets[index].dataset.bridgeDrop);
  else if(moved)miss();
 });
 for(const event of ['pointercancel','lostpointercapture'])handle.addEventListener(event,reset);
 handle.addEventListener('keydown',e=>{
  if(!targets.length||gesture)return;
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'||e.key==='ArrowDown'||e.key==='ArrowRight'){
   e.preventDefault();const delta=e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1;
   highlight(active<0?(delta<0?targets.length-1:0):(active+delta+targets.length)%targets.length);
  }else if(e.key==='Escape')highlight(-1);
 });
 handle.addEventListener('click',e=>{
  if(e.detail!==0||!targets.length)return;
  if(active<0)highlight(0);else place(targets[active].dataset.bridgeDrop);
 });
 handle.addEventListener('blur',()=>{if(!gesture)highlight(-1);});
}

// Step 3 continues on the same photo: River walks over the checked bridge and, from the deck,
// sees the three traces again (erosion, transport, deposit) before reaching the survey flag.
const CROSSING_PATH=[[255,84],[338,80],[880,101],[940,124]];
export const CROSSING_STOPS=[
 {id:'erosion',x:430,name:'침식',text:'다리 아래 물가 흙이 깎여 나갔어.',at:[352,300]},
 {id:'transport',x:625,name:'운반',text:'흙탕물이 깎인 흙을 옮기고 있어.',at:[600,350]},
 {id:'deposit',x:815,name:'퇴적',text:'느려진 물이 모래를 쌓아 두었어.',at:[845,372]}
];
const segments=CROSSING_PATH.slice(1).map(([x,y],i)=>{const [a,b]=CROSSING_PATH[i];return {a,b,dx:x-a,dy:y-b,length:Math.hypot(x-a,y-b)};});
const pathLength=segments.reduce((n,s)=>n+s.length,0);
export function crossingPoint(t){
 let d=Math.max(0,Math.min(1,t))*pathLength;
 for(const s of segments){if(d<=s.length||s===segments.at(-1)){const k=Math.min(1,d/s.length);return [s.a+s.dx*k,s.b+s.dy*k];}d-=s.length;}
}
export function crossingProject(x,y){
 let best=Infinity,t=0,start=0;
 for(const s of segments){
  const k=Math.max(0,Math.min(1,((x-s.a)*s.dx+(y-s.b)*s.dy)/(s.length**2))),d=Math.hypot(s.a+s.dx*k-x,s.b+s.dy*k-y);
  if(d<best){best=d;t=(start+k*s.length)/pathLength;}
  start+=s.length;
 }
 return t;
}
const stopT=CROSSING_STOPS.map(s=>crossingProject(s.x,90));
export function bridgeCrossing(){
 const [fx,fy]=CROSSING_PATH.at(-1),[sx,sy]=crossingPoint(0);
 const markers=CROSSING_STOPS.map(s=>`<g class="crossing-marker" data-crossing-marker="${s.id}"><circle cx="${s.at[0]}" cy="${s.at[1]}" r="20"/><circle cx="${s.at[0]}" cy="${s.at[1]}" r="7"/></g>`).join('');
 const callouts=CROSSING_STOPS.map(s=>`<div class="crossing-callout" data-crossing-callout="${s.id}" style="left:${s.at[0]/10}%;top:${(s.at[1]-34)/5.62}%"><b>${s.name}</b><span>${s.text}</span></div>`).join('');
 const chips=CROSSING_STOPS.map(s=>`<span class="crossing-chip" data-crossing-chip="${s.id}">${s.name}</span>`).join('<i aria-hidden="true">→</i>');
 return '<div class="bridge-map" data-bridge-phase="crossing" data-bridge-choice="checked"><figure class="bridge-photo crossing-view"><div class="crossing-zoom">'
  +'<img src="/assets/art/river-field-clues-v3.webp" alt="점검한 다리가 놓인 강. 왼쪽 깎인 물가, 가운데 흙탕물, 오른쪽 모래톱이 보여요.">'
  +'<svg class="bridge-overlay" viewBox="0 0 1000 562" aria-hidden="true"><g class="bridge-current">'+flow.map(d=>'<path d="'+d+'" pathLength="100"/>').join('')+'</g>'
  +bridge(BRIDGE_SITES.checked,'held')+markers
  +`<g class="crossing-start"><ellipse cx="${sx}" cy="${sy+4}" rx="34" ry="9"/></g>`
  +`<g class="crossing-goal"><ellipse cx="${fx}" cy="${fy+4}" rx="36" ry="10"/><image href="/assets/tool-flag.webp" x="${fx-30}" y="${fy-74}" width="62" height="66"/></g></svg>`
  +callouts
  +`<div class="crossing-hint" style="left:${(sx+48)/10}%;top:${(sy-30)/5.62}%">리버를 끌어 봐 →</div>`
  +'<button type="button" class="crossing-river" aria-label="리버. 끌거나 오른쪽 화살표를 눌러 다리를 건너요" aria-describedby="crossing-help"></button>'
  +'</div></figure></div>'
  +`<div class="bridge-tools crossing-tools"><div class="crossing-clues" aria-label="다리 위에서 다시 본 흔적">${chips}</div><button type="button" class="operation-action primary" data-crossing-step>리버 걷기 →</button><span id="crossing-help" class="bridge-sr">리버를 끌거나 리버 걷기 버튼, 오른쪽 화살표로 다리를 건너요.</span></div>`;
}
const WALK_ROW_EAST=6,WALK_ROWS=8,WALK_COLS=4;
export function bindBridgeCrossing(board,{say,arrive,reduced}){
 const zoom=board.querySelector('.crossing-zoom'),river=board.querySelector('.crossing-river'),step=board.querySelector('[data-crossing-step]');
 if(!zoom||!river)return()=>{};
 const speed=170/pathLength; // photo units per second, as a share of the walk
 let t=0,target=0,pause=0,stride=0,raf=0,last=0,pointer=null,arrived=false,facing=1;
 const reached=new Set();
 function draw(walking){
  const [x,y]=crossingPoint(t);
  river.style.left=x/10+'%';river.style.top=y/5.62+'%';
  const col=walking&&!reduced?Math.floor(stride/20)%WALK_COLS:1;
  river.style.setProperty('--frame',`${col*100/(WALK_COLS-1)}% ${WALK_ROW_EAST*100/(WALK_ROWS-1)}%`);
  river.classList.toggle('is-walking',walking);river.classList.toggle('is-back',facing<0);
 }
 function reach(i){
  const s=CROSSING_STOPS[i];reached.add(i);pause=reduced?250:1100;
  // Earlier bubbles shrink to their name so the newest one stays readable.
  board.querySelectorAll('.crossing-callout.is-shown').forEach(el=>el.classList.add('is-past'));
  board.querySelector(`[data-crossing-callout="${s.id}"]`)?.classList.add('is-shown');
  board.querySelector(`[data-crossing-marker="${s.id}"]`)?.classList.add('is-seen');
  board.querySelector(`[data-crossing-chip="${s.id}"]`)?.classList.add('is-seen');
  say(`${s.name}: ${s.text}`);
 }
 function tick(now){
  raf=0;const dt=last?Math.min(80,now-last):16;last=now;
  if(arrived)return;
  if(pause>0){pause-=dt;draw(false);raf=requestAnimationFrame(tick);return;}
  if(target===t){draw(false);last=0;return;}
  const dir=Math.sign(target-t);facing=dir;
  const advance=speed*dt/1000;
  let next=Math.abs(target-t)<=advance?target:t+dir*advance;
  // River always stops at the next unseen trace before walking on.
  const stop=stopT.findIndex((st,i)=>!reached.has(i)&&dir>0&&t<st&&next>=st);
  stride+=Math.abs(next-t)*pathLength;
  if(stop>=0){next=stopT[stop];t=next;draw(true);reach(stop);}
  else t=next;
  if(t>=1&&reached.size===CROSSING_STOPS.length){arrived=true;draw(false);river.classList.add('is-arrived');if(step)step.disabled=true;board.querySelector('.crossing-goal')?.classList.add('is-reached');arrive();return;}
  draw(true);raf=requestAnimationFrame(tick);
 }
 function go(value){
  if(arrived)return;
  // Pointing at the flag end counts as the flag itself.
  target=value>.95?1:Math.max(0,Math.min(1,value));
  board.querySelector('.crossing-view')?.classList.add('is-started');
  if(!raf){last=0;raf=requestAnimationFrame(tick);}
 }
 const toPhoto=e=>{const r=zoom.getBoundingClientRect();return [(e.clientX-r.left)/r.width*1000,(e.clientY-r.top)/r.height*562];};
 const down=e=>{if(arrived||e.button>0||document.querySelector('dialog[open]'))return;pointer=e.pointerId;zoom.setPointerCapture?.(e.pointerId);go(crossingProject(...toPhoto(e)));board.dataset.crossingDragging='';};
 const move=e=>{if(pointer===e.pointerId)go(crossingProject(...toPhoto(e)));};
 const up=e=>{if(pointer===e.pointerId){pointer=null;delete board.dataset.crossingDragging;}};
 zoom.addEventListener('pointerdown',down);zoom.addEventListener('pointermove',move);zoom.addEventListener('pointerup',up);zoom.addEventListener('pointercancel',up);
 const nextStop=()=>{const i=stopT.findIndex((st,k)=>!reached.has(k)&&st>t-1e-4);return i<0?1:stopT[i];};
 step?.addEventListener('click',()=>go(nextStop()));
 const key=e=>{
  if(arrived||e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||e.target.matches?.('input,textarea,select'))return;
  if(e.key==='ArrowRight'){e.preventDefault();go(Math.min(nextStop(),t+.12));}
  else if(e.key==='ArrowLeft'){e.preventDefault();go(t-.12);}
  else if((e.key==='Enter'||e.key===' ')&&e.target===river){e.preventDefault();go(nextStop());}
 };
 window.addEventListener('keydown',key);
 draw(false);
 return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',key);};
}
