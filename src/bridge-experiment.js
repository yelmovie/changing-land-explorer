export const BRIDGE_ART='/assets/art/river-footbridge-v1.webp';
export const BRIDGE_SITES={
 bank:{label:'깎이는 물가',mark:[22,51],ends:[[121,271],[701,294]]},
 checked:{label:'점검한 양쪽 받침',mark:[57,32],ends:[[322,128],[902,150]]},
 sand:{label:'새로 쌓인 모래',mark:[81,66],ends:[[99,352],[840,333]]}
};
const flow=[
 'M922 58 C730 78 478 95 332 228 S324 399 560 480 S776 523 970 551',
 'M901 78 C694 100 526 117 391 227 S371 384 594 454 S850 500 983 527',
 'M895 100 C708 119 559 138 451 231 S439 359 619 425 S851 480 984 500'
];
function bridge(site,state){
 const [[x,y],[right,bottom]]=site.ends,length=Math.hypot(right-x,bottom-y),angle=Math.atan2(bottom-y,right-x)*180/Math.PI;
 // Align the masonry feet in the image with the two ground points for this site.
 const width=length/.88,height=Math.min(118,width*.21);
 return `<g transform="translate(${x} ${y}) rotate(${angle})"><image class="bridge-model" data-bridge-model="${state}" href="${BRIDGE_ART}" x="${-.06*width}" y="${-.98*height}" width="${width}" height="${height}" preserveAspectRatio="none"/></g>`;
}
export function bridgeExperiment(choice,phase,tested){
 const site=BRIDGE_SITES[choice||tested];
 const labels=Object.entries(BRIDGE_SITES);
 const spots=labels.map(([id,{label,mark:[x,y]}],i)=>'<button type="button" class="operation-action bridge-spot" data-operation="bridge:'+id+'" style="--spot-x:'+x+'%;--spot-y:'+y+'%" aria-label="'+(i+1)+'. '+label+'" aria-pressed="'+(choice===id)+'" '+(phase==='running'||phase==='held'?'disabled':'')+'><span>'+(i+1)+'</span></button>').join('');
 return '<div class="bridge-map" data-bridge-phase="'+(phase||'ready')+'"><figure class="bridge-photo"><img src="/assets/art/river-field-clues-v3.webp" alt="왼쪽의 깎이는 물가에서 물길이 굽어 오른쪽 모래톱을 지나 흘러가요.">'
  +'<svg class="bridge-overlay" viewBox="0 0 1000 562" aria-hidden="true"><g class="bridge-current">'+flow.map(d=>'<path d="'+d+'" pathLength="100"/>').join('')+'</g>'
  +(site?bridge(site,phase||'placed'):'')+'</svg>'+spots+'</figure></div>'
  +'<ol class="bridge-legend" aria-label="다리를 놓을 후보">'+labels.map(([id,{label}])=>'<li'+(id===choice?' class="is-selected"':'')+'>'+label+'</li>').join('')+'</ol>';
}
