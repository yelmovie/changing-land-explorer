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
