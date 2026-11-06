import {$,icon} from './ui.js';

const STEPS=[
 {name:'깎여요',term:'침식',detail:'물이 흙을 깎아, 흙 알갱이가 언덕에서 떨어져요.',color:'#9e512d',shape:'M5 5h6l-2 5h4l-5 9m7-14 4 4-4 4'},
 {name:'옮겨져요',term:'운반',detail:'떨어진 흙 알갱이가 물에 실려 아래로 이동해요.',color:'#256878',shape:'M3 8h13m-4-4 4 4-4 4M8 16h13m-4-4 4 4-4 4'},
 {name:'쌓여요',term:'퇴적',detail:'낮고 평평한 곳에서 물이 느려지면, 흘러온 흙의 일부가 쌓여요.',color:'#6f5427',shape:'M3 19h18M6 14h12m-9-5h6'}
];
const symbol=step=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${step.shape}"/></svg>`;
const FLOW='M44 108h50q30 0 65 25L390 226q63 27 126 27h215';
const SOIL_BEFORE='M0 116h92q30 0 67 24L390 234q63 27 126 27h244v62H0Z';
const SOIL='M0 116h92q24 0 42 10l11 12 14 2L390 234q63 27 126 27h244v62H0Z';
const DETACH=1.45, CARRY=2.65, FLAT=5.9, SETTLE=8.2, END=10.4;
const STILLS=[2.3,4.35,END];
const FIRST={x:137,y:137}, RELEASE_POINT=.19, FLAT_POINT=.65, DEPOSIT_POINT=.77;
const unit=value=>Math.max(0,Math.min(1,value));
const mix=(a,b,p)=>a+(b-a)*p;
// The front and moving streaks use the same path, with a slower pace on the flat.
const waterPosition=time=>time<4.55?FLAT_POINT*unit(time/4.55):mix(FLAT_POINT,1,unit((time-4.55)/4.35));

function diagram(){
 return `<svg class="grain-diagram" viewBox="0 0 760 323" role="img" aria-label="옆에서 본 흙 언덕">
 <rect width="760" height="323" rx="16" fill="#e2eee1"/>
 <path d="M0 74q64-25 144 4t156 1q68-16 143 18t166 3q66-22 151-13v200H0Z" fill="#d1e5d4"/>
 <path d="${SOIL_BEFORE}" class="grain-bank" fill="#d6a46f" stroke="#885c37" stroke-width="4" stroke-linejoin="round"/>
 <path d="${SOIL}" class="grain-bank-cut" fill="#d6a46f" stroke="#885c37" stroke-width="4" stroke-linejoin="round" opacity="0"/>
 <path d="M0 186q110-14 208 36t185 54q145 28 367 8v39H0Z" fill="#bc8759"/>
 <path d="M0 232q109-7 185 34t194 57H0Z" fill="#a97650"/>
 <path d="M0 186q110-14 208 36t185 54q145 28 367 8M0 232q109-7 185 34t194 57" fill="none" stroke="#815735" stroke-opacity=".42" stroke-width="3"/>
 <path class="grain-water" pathLength="100" d="${FLOW}" fill="none" stroke="#428fa2" stroke-width="16" stroke-linecap="round" opacity="0"/>
 <path class="grain-water" pathLength="100" d="${FLOW}" fill="none" stroke="#a6d7dd" stroke-width="8" stroke-linecap="round" opacity="0"/>
 <g class="grain-ripples" fill="none" stroke="#f4fffa" stroke-width="3" stroke-linecap="round">${Array.from({length:12},()=>'<line opacity="0"/>').join('')}</g>
 <g class="grain-sediment" fill="#94613d" stroke="#f4ddba" stroke-width="1.5">${Array.from({length:9},(_,i)=>`<circle r="${3+i%3}" opacity="0"/>`).join('')}</g>
 <g class="grain-deposit" opacity="0"><path d="M-70 4q29-8 46-17t44 0q23 11 54 17q-76 13-144 0Z" fill="#e1b57b" stroke="#916337" stroke-width="3"/><path d="M-51 3q46-11 104 0" stroke="#a87949" stroke-width="3" fill="none"/><g fill="#9b6944"><circle cx="-37" cy="1" r="4"/><circle cx="-24" cy="-5" r="3"/><circle cx="28" cy="-5" r="4"/><circle cx="49" cy="1" r="4"/></g></g>
 <g class="grain-figure" transform="translate(${FIRST.x} ${FIRST.y})"><circle r="19" fill="#fff6df" fill-opacity=".94" stroke="#9c592b" stroke-width="4"/><path d="m-7-8 10-2 8 7-2 10-9 3-9-5Z" fill="#99623c" stroke="#70432b" stroke-width="2"/></g>
 </svg>`;
}

export function showRiverGrainGuide(modal){
 modal('물은 흙을 어떻게 바꿀까요?',`<section class="grain-guide"><figure class="grain-board"><figcaption><span>높은 곳</span><span>낮고 평평한 곳</span></figcaption>${diagram()}<small>옆에서 본 흙 언덕 · 동그라미 속 흙 한 알을 따라가요.</small></figure><div class="grain-lesson"><ol class="grain-steps" aria-label="흙 알갱이의 세 가지 변화">${STEPS.map(step=>`<li>${symbol(step)}<span>${step.name}</span></li>`).join('')}</ol><div class="grain-explanation" role="status"><h3></h3><p></p></div><div class="grain-actions"><progress class="grain-progress" max="${END}" value="0" aria-label="관찰 진행"></progress><button class="secondary" id="grain-secondary" type="button" hidden></button><button class="primary" id="grain-play" type="button"></button></div></div></section>`,(dialog,close)=>{
  dialog.classList.add('grain-dialog');
  const lesson=$('.grain-guide',dialog),svg=$('.grain-diagram',dialog),play=$('#grain-play',dialog),secondary=$('#grain-secondary',dialog);
  const grain=$('.grain-figure',svg),pile=$('.grain-deposit',svg),bank=$('.grain-bank',svg),cut=$('.grain-bank-cut',svg);
  const water=svg.querySelectorAll('.grain-water'),ripples=svg.querySelectorAll('.grain-ripples line'),sediment=svg.querySelectorAll('.grain-sediment circle');
  const items=dialog.querySelectorAll('.grain-steps li'),progress=$('.grain-progress',dialog);
  const heading=$('.grain-explanation h3',dialog),detail=$('.grain-explanation p',dialog);
  const length=water[0].getTotalLength(),point=f=>water[0].getPointAtLength(length*f);
  const release=point(RELEASE_POINT),landing=point(DEPOSIT_POINT);
  let time=0,last=0,frame=0,playing=false,shown=null,still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function describe(index){
   if(shown===index)return;
   shown=index;
   const step=STEPS[index];
   const copy=step?.detail??'물을 흘려 보고 동그라미로 표시한 흙 알갱이를 따라가요.';
   lesson.style.setProperty('--grain-accent',step?.color??'#315f4a');
   for(const [i,item] of items.entries()){
    if(i===index)item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
   }
   heading.textContent=step?step.name+' · '+step.term:'흙 한 알을 찾아요';
   detail.textContent=copy;
   svg.setAttribute('aria-label','옆에서 본 흙 언덕. '+copy);
  }
  function draw(t){
   const front=waterPosition(t),wear=unit((t-DETACH)/(CARRY-DETACH)),accumulated=unit((t-SETTLE)/1.65);
   bank.setAttribute('opacity',1-wear);cut.setAttribute('opacity',wear);
   for(const stroke of water){
    stroke.setAttribute('opacity',front>0?1:0);
    stroke.setAttribute('stroke-dasharray',`${front*100} 100`);
   }
   for(const [i,line] of ripples.entries()){
    const age=t-(i+1)*.54;
    const f=age>=0?waterPosition(age%8.9):0;
    const visible=f>.015&&f<front-.01;
    line.setAttribute('opacity',visible?.9:0);
    if(visible){
     const a=point(f-.014),b=point(Math.min(front,f+.018));
     line.setAttribute('x1',a.x);line.setAttribute('y1',a.y-2);
     line.setAttribute('x2',b.x);line.setAttribute('y2',b.y-2);
    }
   }
   for(const [i,dot] of sediment.entries()){
    const age=t-DETACH-.42-i*.38,f=.16+waterPosition(age*.85);
    const visible=age>0&&f<Math.min(front,.97);
    dot.setAttribute('opacity',visible?.86:0);
    if(visible){const p=point(f);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y+2+(i%3-1)*3);}
   }
   // One SVG grain throughout: in the bank, into the water, then gently
   // decelerating on the flat before coming to rest in the growing pile.
   const settling=unit((t-FLAT)/(SETTLE-FLAT));
   let p;
   if(t<CARRY){p={x:mix(FIRST.x,release.x,wear),y:mix(FIRST.y,release.y,wear)};}
   else if(t<FLAT){p=point(mix(RELEASE_POINT,FLAT_POINT,unit((t-CARRY)/(FLAT-CARRY))));}
   else{p=point(mix(FLAT_POINT,DEPOSIT_POINT,1-(1-settling)**2));p.y+=10*settling;}
   const angle=Math.max(0,Math.min(t,SETTLE)-DETACH)*34;
   grain.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${angle})`);
   pile.setAttribute('opacity',accumulated>0?1:0);
   pile.setAttribute('transform',`translate(${landing.x} ${landing.y+12}) scale(${.22+.78*accumulated} ${.06+.94*accumulated})`);
   progress.value=t;
   describe(t<DETACH?-1:t<CARRY?0:t<FLAT?1:2);
  }
  function controls(){
   const pauseIcon='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 5v14m6-14v14"/></svg>';
   const end=time>=END;
   const label=still?(time===0?'물이 흙에 닿은 모습':time<STILLS[1]?'흙이 옮겨진 모습':end?'처음 장면 다시 보기':'흙이 쌓인 모습'):playing?'잠깐 멈추기':end?'다시 보기':time>0?'이어서 보기':'물 흘려 보기';
   play.innerHTML=(playing?pauseIcon:icon(end?'reset':'play',20))+label;
   secondary.hidden=!still&&time===0;
   secondary.textContent=still?'움직이며 보기':end?'실험으로 돌아가기':'처음부터';
  }
  function stop(){
   playing=false;last=0;
   cancelAnimationFrame(frame);
  }
  function advance(now){
   if(!playing||!dialog.open)return;
   if(last)time=Math.min(END,time+Math.min(.08,(now-last)/1000));
   last=now;draw(time);
   if(time>=END){stop();controls();}else frame=requestAnimationFrame(advance);
  }
  function start(restart=false){
   if(restart||time>=END){time=0;draw(time);}
   stop();playing=true;controls();frame=requestAnimationFrame(advance);
  }
  play.onclick=()=>{
   if(still){time=STILLS.find(t=>t>time)??0;draw(time);controls();return;}
   if(playing){stop();controls();}else start();
  };
  secondary.onclick=()=>{
   if(still){still=false;start(true);play.focus({preventScroll:true});}
   else if(time>=END)close();
   else{start(true);play.focus({preventScroll:true});}
  };
  const pauseHidden=()=>{if(document.hidden&&playing){stop();controls();}};
  document.addEventListener('visibilitychange',pauseHidden);
  dialog.addEventListener('close',()=>{stop();document.removeEventListener('visibilitychange',pauseHidden);},{once:true});
  draw(time);controls();play.focus({preventScroll:true});
 });
}
