import {SCIENCE_LEARNING,scienceText} from '../science-learning.js';
import {$, $$, icon, escapeHTML} from '../ui.js';
import {capture,evidenceCard} from '../explore-ui.js';
import {PHASES,TOOL_ASSETS,revisitPhase,completePhase} from './rules.js';
import {setup as river} from './river.js';
import {setup as volcano} from './volcano.js';
import {setup as rocks} from './rocks.js';
import {setup as city} from './city.js';
import {setup as safety} from './safety.js';
import {HINTS,recordHint} from './hints.js';
import {destroyGame} from '../phaser-lifecycle.js';
import {backgroundForAsset,STAGE_BACKGROUNDS,STAGE_ASSETS,SHARED_STAGE_ASSETS} from '../stage-art.js';
import {STAGES} from '../model.js';
import {enter,navigate} from '../main.js';
import {createPlayback,PLAYBACK_SPEEDS} from './playback.js';

const SETUP={river,volcano,rocks,city,safety};
let playbackSpeed=1;
const ACTION_CUES={
 river:[['물 주기나 자동재생을 눌러 봐.','물의 양을 바꿔 같은 언덕을 관찰해 봐.','이름표를 골라 빈 원에 놓아 봐.'],['숫자를 눌러 상류를 관찰해 봐.','숫자를 눌러 하류를 관찰해 봐.','카드를 고른 뒤 상류·하류에 놓아 봐.']],
 volcano:[['빛나는 자리에 재료를 차례로 놓아 봐.','손잡이를 밀거나 자동재생으로 물을 흘려 봐.','돋보기로 나온 곳을 찾고 연필로 길을 따라가 봐.'],['숫자를 눌러 네 분출물을 기록해 봐.','비교 카드를 고른 뒤 놓을 칸을 눌러 봐.','비교 카드를 고른 뒤 놓을 칸을 눌러 봐.']],
 rocks:[['문지르거나 자동재생으로 먼지를 털어 봐.','세 곳을 확대하고 색과 알갱이를 골라 봐.','세 곳을 확대하고 색과 알갱이를 골라 봐.'],['주문의 특징에 맞는 표본을 보내 줘.','세 곳을 확대한 뒤 특징 두 개를 기록해 봐.','세 곳을 확대한 뒤 특징 두 개를 기록해 봐.']],
 city:[['손잡이를 양쪽 끝까지 움직인 뒤 기록을 골라 봐.','손잡이를 양쪽 끝까지 움직인 뒤 기록을 골라 봐.','손잡이를 양쪽 끝까지 움직인 뒤 기록을 골라 봐.'],['안내판에 붙일 카드를 먼저 골라 봐.','안내판에 붙일 카드를 먼저 골라 봐.','안내판에 붙일 카드를 먼저 골라 봐.']],
 safety:[['위험 표식을 알맞은 곳에 놓아 봐.','몸을 보호할 곳을 고르고 머리를 감싸 줘.','잡을 곳을 고르고 흔들림이 멈추면 확인해.'],['가까운 통로를 눌러 리버를 출구와 운동장으로 안내해.','위험 구역을 피해 다시 운동장까지 직접 걸어 봐.','건물·담장·전신주를 피해 공터까지 걸어 봐.']]
};
const UI=name=>'art/ui/'+name;
// Reading surfaces use a quiet, inset outline instead of artwork that competes with text.
const PAPER_COLORS=new Set([0xfff8e8,0xfff7df,0xfff5d9,0xfff8e5,0xf8f0d8,0xfff4d8,0xfff7e2,0xfff8e6]);
const SLICES={'parchment-panel':[52,52,52,52],'paper-card':[36,36,32,40],'glass-pane':[16,16,16,16]};
const TOOLS={
  volcano:{id:'lens',stage:'river',name:'물길 렌즈',label:'크게 보기'},
  rocks:{id:'camera',stage:'volcano',name:'비교 카메라',label:'두 돌 비교'},
  city:{id:'box',stage:'rocks',name:'표본 상자',label:'내 표본 보기'},
  safety:{id:'compass',stage:'city',name:'안전 나침반',label:'위험 둘러보기'}
};

/** Phaser owns scene objects and gestures; DOM owns navigation, narration and keyboard controls. */
export function mount(ctx) {
  const chapter=revisitPhase(ctx.data,ctx.step), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const backdrop=`url('/assets/${backgroundForAsset(STAGE_BACKGROUNDS[ctx.s.id][ctx.step])}.webp')`;
  ctx.root.style.setProperty('--activity-backdrop',backdrop);
  const page=ctx.root.closest('.adventure-page'), heading=$('.adventure-heading',page);
  page.style.setProperty('--activity-backdrop',backdrop);
  page.style.setProperty('--stage-accent',ctx.s.color);
  let game,closed=false,hooks,activeScene,phaseDone=false,toolHandler=null,zoomed=false;
  let restarting=false,focusInstruction=false;
  let sceneCleanups=[];
  let hintIndex=0,initialHint='';
  ctx.root.innerHTML='<div class="phaser-stage" id="phaser-stage"></div><div class="stage-loader" role="status">리버가 탐험 도구를 꺼내고 있어요…</div><div class="quest-meter" id="quest-meter" aria-live="polite"></div>';
  // Progress shares the stage label; guidance only describes the next action.
  $('.stage-kicker',page).append($('#quest-meter',ctx.root));
  const next=$('#next');
  const narration=$('.river-narrator>div',page);
  narration.tabIndex=0; narration.setAttribute('role','region');narration.setAttribute('aria-label','리버의 탐구 안내');
  const toolMenu=$('.activity-tools',page);
  $('.topbar .nav-group',ctx.root.closest('#app')).append(toolMenu);
  const dismissTools=()=>{toolMenu.open=false;toolMenu.querySelector('summary').focus({preventScroll:true});};
  for(const button of toolMenu.querySelectorAll('button'))button.addEventListener('click',dismissTools);
  const closeTools=event=>{if(event.key==='Escape'&&toolMenu.open){toolMenu.open=false;toolMenu.querySelector('summary').focus();}else if(event.type==='pointerdown'&&!toolMenu.contains(event.target))toolMenu.open=false;};
  document.addEventListener('pointerdown',closeTools,true);document.addEventListener('keydown',closeTools,true);
  // A stage exposes only its repeatable observation, never an answer or a transition.
  const playbackBar=document.createElement('div');playbackBar.className='activity-playback';playbackBar.hidden=true;
  const autoButton=document.createElement('button');
  autoButton.id='observation-auto';autoButton.type='button';autoButton.className='secondary';autoButton.hidden=true;
  const speed=document.createElement('select');speed.id='observation-speed';speed.setAttribute('aria-label','자동재생 속도');
  for(const value of PLAYBACK_SPEEDS){const option=document.createElement('option');option.value=value;option.textContent=value+'배속';speed.append(option);}
  speed.value=playbackSpeed;
  playbackBar.append(autoButton,speed);ctx.controls.before(playbackBar);
  let auto=null;
  const playback=createPlayback({onChange:paintAuto});playback.setSpeed(playbackSpeed);
  speed.onchange=()=>{playbackSpeed=Number(speed.value);playback.setSpeed(playbackSpeed);};
  function guideAction(){
    // Direction pads are free choices; never highlight one direction as the next step.
    const candidates=[...ctx.controls.querySelectorAll('.action-buttons button:not(:disabled):not([id^="route-"])')];
    const suggested=phaseDone?next:auto&&playback.ready&&!auto.observed?autoButton:candidates.length===1?candidates[0]:candidates.find(b=>b.classList.contains('primary'));
    for(const button of [autoButton,next,...ctx.controls.querySelectorAll('.action-buttons button')]){
      const on=button===suggested; if(button.classList.contains('suggested')!==on)button.classList.toggle('suggested',on);
    }
  }
  function paintAuto(){
    if(!auto||(phaseDone&&!auto.allowWhenComplete)||!playback.ready){
      if(playback.playing)stopAuto();
      playbackBar.hidden=true;
      if(!autoButton.hidden)autoButton.hidden=true;
      if(autoButton.getAttribute('aria-pressed')==='true')autoButton.setAttribute('aria-pressed','false');
      guideAction();
      return;
    }
    playbackBar.hidden=false;
    if(autoButton.hidden)autoButton.hidden=false;
    if(autoButton.disabled===playback.ready)autoButton.disabled=!playback.ready;
    const label=playback.playing?'직접 해보기':'자동재생';
    guideAction();
    if(autoButton.dataset.state===label&&autoButton.title===auto.label)return;
    autoButton.dataset.state=label;autoButton.title=auto.label;
    autoButton.textContent=(playback.playing?'Ⅱ ':'▶ ')+label;
    autoButton.setAttribute('aria-label',auto.label+' '+label);
    autoButton.setAttribute('aria-pressed',String(playback.playing));
  }
  function stopAuto(){playback.stop();}
  autoButton.onclick=()=>{
    if(playback.playing){stopAuto();return;}
    if(!auto||(phaseDone&&!auto.allowWhenComplete)||!auto.ready()||document.hidden||document.querySelector('dialog[open]'))return;
    const work=chapter.work[chapter.phase];
    if(!phaseDone){work.operationHelp=true;ctx.save();}
    toolMenu.open=false;playback.start();paintAuto();
  };
  function manual(event){if(playback.playing&&!playbackBar.contains(event.target))stopAuto();}
  document.addEventListener('pointerdown',manual,true);
  document.addEventListener('keydown',manual,true);
  document.addEventListener('input',manual,true);
  function updateStepNav(){
    const phase=chapter.phase, names=PHASES[ctx.s.id][ctx.step];
    const path=$('#phase-path'),focused=path.contains(document.activeElement)?document.activeElement.dataset.phase:null;
    path.innerHTML=names.map((name,i)=>{
      const done=chapter.tasks[i]?.done,locked=i>phase&&!chapter.tasks[i-1]?.done&&!ctx.admin;
      const status=done?' 완료':locked?' 잠김':ctx.admin?' 교사 시연 열림':'';
      const badge=done?icon('check',16):locked?icon('lock',16):ctx.admin&&i!==phase?icon('unlock',16):i+1;
      return `<button class="phase-node ${i===phase?'current':''} ${done?'done':''}" data-phase="${i}" ${locked?'disabled':''} aria-label="${i+1}단계 ${escapeHTML(name)}${status}${i===phase?' · 단계 목록 열기':''}" ${i===phase?'aria-current="step" aria-haspopup="dialog"':''}><span>${badge}</span><b>${name}</b>${i===phase?`<i class="phase-menu-cue">${icon('arrow',14)}</i>`:''}</button>`;
    }).join('');
    $$('[data-phase]',path).forEach(button=>button.onclick=event=>{
      const target=Number(button.dataset.phase);
      if(restarting)return;
      if(target===chapter.phase){showPhaseChoices();return;}
      chapter.phase=target;ctx.save();restart(event.detail===0);
    });
    if(focused!==null)$('[data-phase="'+focused+'"]',path)?.focus({preventScroll:true});
    phaseDone=chapter.tasks[phase]?.done===true;
    next.disabled=!phaseDone;
    skipLabel();
    next.innerHTML=(phase<2?'다음 발견':'개념 정리')+icon('arrow',22);
    next.classList.toggle('ready',phaseDone);
    const badge=$('#river-status');
    badge.hidden=false;
    badge.innerHTML=scienceText(SCIENCE_LEARNING[ctx.s.id].focus[ctx.step][phase],ctx.s.id);
    page.classList.toggle('phase-complete',phaseDone);
  }
  function showPhaseChoices(){
    const phase=chapter.phase,names=PHASES[ctx.s.id][ctx.step];
    ctx.modal('이번 활동의 세 가지 발견',`<div class="phase-choices">${names.map((name,i)=>{
      const done=chapter.tasks[i]?.done,locked=i>phase&&!chapter.tasks[i-1]?.done&&!ctx.admin;
      return `<button class="secondary" data-choose-phase="${i}" ${locked?'disabled':''} ${i===phase?'aria-current="step"':''}><span>${done?icon('check',22):locked?icon('lock',22):i+1}</span><strong>${escapeHTML(name)}</strong><small>${done?'완료':locked?'앞 발견을 먼저 마쳐 줘':i===phase?'지금 탐구 중':'다시 살펴보기'}</small></button>`;
    }).join('')}</div>`,(dialog,close)=>{
      for(const button of dialog.querySelectorAll('[data-choose-phase]'))button.onclick=()=>{
        const target=Number(button.dataset.choosePhase);close();
        if(restarting||target===chapter.phase)return;
        chapter.phase=target;ctx.save();restart(true);
      };
    });
  }
  function restart(focus=false){
    if(closed||restarting||!activeScene)return;
    restarting=true;focusInstruction=focus;phaseDone=false;next.disabled=true;
    stopAuto();auto=null;playback.configure(null);paintAuto();
    activeScene.scene.restart();
  }
  // 교사 시연: 직접 조작하지 않고 다음 단계 → 다음 활동 → 다음 장소 → 마지막 도전 순서로 넘긴다. 기록은 남기지 않는다.
  const skip=ctx.admin?document.createElement('button'):null;
  function skipLabel(){
    if(!skip)return;
    const label=chapter.phase<2?'다음 단계로':ctx.step===0?'다음 활동으로':STAGES[ctx.index+1]?'다음 장소로':'마지막 도전으로';
    skip.innerHTML=`<small>교사 시연</small><span>${label}</span>${icon('arrow',22)}`;skip.setAttribute('aria-label',`교사 시연: 조작 없이 ${label} 넘기기`);
  }
  if(skip){
    skip.type='button';skip.id='teacher-skip';skip.className='teacher-skip';
    ctx.root.closest('.adventure-page').append(skip);skipLabel();
    skip.onclick=()=>{
      if(restarting||document.querySelector('dialog[open]'))return;
      if(chapter.phase<2){chapter.phase++;ctx.save();restart();}
      else if(ctx.step===0)ctx.go(1);
      else if(STAGES[ctx.index+1])enter(ctx.index+1,0);
      else navigate('final','assembly');
    };
  }
  next.onclick=event=>{
    if(!phaseDone||restarting||document.querySelector('dialog[open]'))return;
    // The success chime already played when the phase was solved; moving on keeps the plain click.
    if(chapter.phase<2){chapter.phase++;ctx.save();restart(event.detail===0);}
    else ctx.finishActivity();
  };

  function showHint(){
    const cues=HINTS[ctx.s.id]?.[ctx.step]?.[chapter.phase]||[initialHint];
    ctx.sound('hint',{force:true});
    ctx.modal('리버의 탐구 힌트',`<div class="hint-card"><img src="/assets/hero-lens.webp" alt="힌트를 주는 리버"><div><span class="eyebrow">${escapeHTML(PHASES[ctx.s.id][ctx.step][chapter.phase])}</span><p id="hint-copy">${escapeHTML(cues[hintIndex%cues.length])}</p><span id="hint-progress">힌트 ${hintIndex%cues.length+1} / ${cues.length}</span></div></div><div class="hint-actions"><button class="secondary" id="hint-more"${hintIndex>=cues.length-1?' disabled':''}>한 걸음 더</button><button class="primary" id="hint-return">직접 해 볼게</button></div>`,(dialog,close)=>{
      workHint();
      function workHint(){const w=chapter.work[chapter.phase]??={};recordHint(w,ctx.s.id,ctx.step,chapter.phase,hintIndex%cues.length);ctx.save();}
      $('#hint-more',dialog).onclick=()=>{hintIndex=Math.min(cues.length-1,hintIndex+1);workHint();$('#hint-copy',dialog).textContent=cues[hintIndex];$('#hint-more',dialog).disabled=hintIndex===cues.length-1;$('#hint-progress',dialog).textContent=`힌트 ${hintIndex+1} / ${cues.length}`;};
      $('#hint-return',dialog).onclick=close;
    });
  }
  $('#river-hint').onclick=showHint;
  const tool=TOOLS[ctx.s.id],toolButton=$('#earned-tool');
  if(tool&&(ctx.state.completed.includes(tool.stage)||ctx.admin)){
    toolButton.hidden=false;
    toolButton.innerHTML=`<img src="/assets/${TOOL_ASSETS[tool.id]}.webp" alt=""><span>${tool.label}</span>`;
    toolButton.setAttribute('aria-label',`${tool.name} 사용: ${tool.label}`);
    toolButton.onclick=()=>{
      if(toolHandler){toolHandler();return;}
      if(tool.id==='lens'&&activeScene){
        zoomed=!zoomed;activeScene.cameras.main.setZoom(zoomed?1.25:1);
        toolButton.querySelector('span').textContent=zoomed?'원래 크기':'크게 보기';
        ctx.say(zoomed?'강에서 얻은 렌즈야. 중심을 크게 보고, 한 번 더 누르면 돌아가.':'전체 모습으로 돌아왔어.');
      }else{
        const data=tool.id==='camera'?ctx.data:ctx.state.records.rocks?.data;
        const records=Object.values(data?.evidence||{}).filter(e=>e.kind==='rock');
        ctx.modal(tool.name,records.length?'<div class="tool-comparison">'+records.slice(0,4).map(e=>evidenceCard(e)).join('')+'</div>':'<p>표본의 색과 알갱이를 먼저 기록하면 여기서 나란히 꺼내 볼 수 있어.</p>');
      }
    };
  }else toolButton.hidden=true;

  class Activity extends window.Phaser.Scene {
    constructor(){super('Activity');}
    preload(){
      for(const key of [...new Set([...SHARED_STAGE_ASSETS,...STAGE_ASSETS[ctx.s.id]])])if(!this.textures.exists(key))this.load.image(key,`/assets/${backgroundForAsset(key)}.webp`);
      this.load.on('loaderror',file=>{console.error('Game asset unavailable:',file.key);});
    }
    create(){
      if(closed)return;
      activeScene=this;restarting=false;hooks=null;toolHandler=null;zoomed=false;sceneCleanups=[];
      hintIndex=0;initialHint='';
      ctx.controls.innerHTML='';$('#quest-meter').textContent='';
      $('.stage-loader',ctx.root)?.remove();
      updateStepNav();
      const phase=chapter.phase;
      page.classList.toggle('river-observation',ctx.s.id==='river'&&ctx.step===0&&phase===2);
      page.classList.toggle('volcano-observation',ctx.s.id==='volcano'&&ctx.step===1&&phase===0);
      const work=chapter.work[phase]??={};
      const scene=this;
      scene.input.dragDistanceThreshold=8;
      let selected=null,pressed=null,pressPoint=null,gestureMoved=false;
      const tapRing=scene.add.graphics().setDepth(195);
      const draggables=new Map();
      const meter=$('#quest-meter');
      let meterText='',completionShown=false;
      const clearSelection=()=>{selected=null;tapRing.clear();};
      const select=object=>{scene.tweens.killTweensOf(object);selected=object;tapRing.clear().lineStyle(5,0xffd36b,1).strokeCircle(object.x,object.y,Math.min(110,Math.max(45,object.displayWidth/2+10)));ctx.say('도착할 곳을 눌러 줘. 손가락으로 끌어도 돼.');ctx.sound('pickup');};
      scene.input.on('pointerdown',(p)=>{pressPoint={x:p.x,y:p.y};gestureMoved=false;});
      scene.input.on('pointerup',(p)=>{
        if(document.querySelector('dialog[open]'))return;
        const moved=gestureMoved||!pressPoint||Math.hypot(p.x-pressPoint.x,p.y-pressPoint.y)>12;
        if(!moved&&selected&&pressed!==selected){
          const at=scene.cameras.main.getWorldPoint(p.x,p.y);
          const object=selected,config=draggables.get(object),home={x:object.x,y:object.y};clearSelection();
          if(config&&object.active){scene.tweens.killTweensOf(object);object.setPosition(at.x,at.y);config.onMove?.(object,at.x,at.y);const accepted=(config.onTap||config.onDrop)?.(object,object.x,object.y)===true;if(!accepted&&object.active)object.setPosition(home.x,home.y);ctx.sound(accepted?'place':'move');}
        }else if(!moved&&pressed){
          const action=draggables.get(pressed)?.onPick;
          if(action){clearSelection();action();}else select(pressed);
        }
        pressed=null;
      });
      scene.input.on('pointerupoutside',()=>{pressed=null;clearSelection();});
      scene.input.on('gameout',()=>{pressed=null;});
      const api={
        stage:ctx.s.id,step:ctx.step,phase,data:ctx.data,work,state:ctx.state,admin:ctx.admin,
        now:()=>playback.time,
        save:ctx.save,modal:ctx.modal,completed:phaseDone,
        stopAutoplay:stopAuto,
        autoplay(config){auto=config;playback.configure(config);paintAuto();},
        task(title,hint){ctx.instruction(title);ctx.say(initialHint?hint:ACTION_CUES[ctx.s.id][ctx.step][phase]);initialHint=hint;},
        say(text,success=false){ctx.say(text);if(success)ctx.chime();},
        counter(done,total,label){
          const value=Math.min(done,total), key=label+' '+value+'/'+total;
          if(key===meterText)return;
          meterText=key;
          meter.innerHTML=`<span>${escapeHTML(label)}</span><strong>${value} <small>/ ${total}</small></strong>`;
          meter.style.setProperty('--progress',(100*value/total)+'%');
        },
        record(item){capture(ctx,{...item,phase,operationHelp:!!work.operationHelp,observationHint:!!work.observationHint,hintLevel:work.hintLevel||0,answerHint:!!work.answerHint}); next.disabled=!phaseDone;},
        sound:ctx.sound,
        select(object){if(object?.active&&object.input?.enabled&&draggables.has(object)&&!document.querySelector('dialog[open]')){pressed=null;select(object);}},
        finish(summary,details={}){
          stopAuto();
          if(completionShown)return;
          details={...details,operationHelp:!!work.operationHelp,observationHint:!!work.observationHint,hintLevel:work.hintLevel||0,answerHint:!!work.answerHint};
          const fresh=completePhase(ctx.data,ctx.step,phase,summary,details);
          // Admin may inspect later scenes without writing fictional earlier evidence.
          if(ctx.admin)chapter.phase=phase;
          if(ctx.admin&&!chapter.tasks[phase]?.done)chapter.tasks[phase]={done:true,summary,details};
          phaseDone=chapter.tasks[phase]?.done===true;
          if(!phaseDone)return;
          completionShown=true;
          const focusAction=ctx.controls.contains(document.activeElement)&&document.activeElement.closest('.action-buttons');
          ctx.save();ctx.update();updateStepNav();ctx.say(summary);
          if(focusAction)next.focus({preventScroll:true});
          if(fresh){
            ctx.chime();
            if(!reduced)$('#river-status').animate([{transform:'translateY(3px)',opacity:.65},{transform:'translateY(0)',opacity:1}],{duration:240,easing:'ease-out'});
          }
        },
        image(key,x,y,w,h,{sceneBackground=true}={}){
          const background=sceneBackground&&x===600&&y===320&&w===1200&&h===640;
          if(background){
            const value=`url('/assets/${backgroundForAsset(key)}.webp')`;
            ctx.root.style.setProperty('--activity-backdrop',value);
            page.style.setProperty('--activity-backdrop',value);
          }
          return scene.add.image(x,y,key).setDisplaySize(w,h).setVisible(!background);
        },
        hero(x,y,size=110,pose='river-hero'){
          const decorativeBack=pose==='river-pose-1';
          if(!scene.textures.exists(pose))pose='river-hero';
          const img=scene.add.image(x,y,pose);img.setScale(size/img.height);if(decorativeBack)img.setVisible(false);return img;
        },
        text(text,x,y,size=24,color='#294239',wrapWidth){
          const rect=ctx.root.getBoundingClientRect(),scale=Math.min(rect.width/1200,rect.height/640);
          if(size>=18)size=Math.max(size,Math.min(29,19/Math.max(.5,scale)));
          const label=scene.add.text(x,y,String(text),{fontFamily:'NanumSquareNeo, Malgun Gothic, sans-serif',fontSize:size+'px',color,align:'center',padding:{x:3,y:3},...(wrapWidth?{wordWrap:{width:wrapWidth,useAdvancedWrap:true}}:{})}).setOrigin(.5);
          const context=label.context,fillRect=context.fillRect;
          // Phaser paints its text background with fillRect before uploading it.
          context.fillRect=function(left,top,width,height){
            if(left===0&&top===0&&label.style.backgroundColor){this.beginPath();this.roundRect(left,top,width,height,Math.min(16,width/3,height/3));this.fill();}
            else fillRect.call(this,left,top,width,height);
          };
          label.once('destroy',()=>{context.fillRect=fillRect;});
          return label;
        },
        // Text stays inside the usable surface: no decorative corners cross the content.
        paper(name,x,y,w,h){
          if(name==='parchment-panel'||name==='paper-card'){
            const r=Math.min(24,h/3),surface=scene.add.graphics();
            surface.fillStyle(0x163e38,.14).fillRoundedRect(-w/2+2,-h/2+6,w,h,r);
            surface.fillStyle(0xfffbef,.82).fillRoundedRect(-w/2,-h/2,w,h,r);
            surface.lineStyle(1.5,0x8ca894,.72).strokeRoundedRect(-w/2+1,-h/2+1,w-2,h-2,r);
            return scene.add.container(x,y,[surface]).setSize(w,h).setData('readingSurface',{width:w,height:h,padding:18});
          }
          const key=UI(name),[l,r,t,b]=SLICES[name];
          if(!scene.textures.exists(key))return scene.add.rectangle(x,y,w,h,0xfff7df,.96).setStrokeStyle(2,0xcdbb8c,.6);
          const s=Math.min(1,w/(l+r+12),h/(t+b+12));
          return scene.add.nineslice(x,y,key,undefined,w/s,h/s,l,r,t,b).setScale(s);
        },
        panel(x,y,w,h,color=0xfff7df,alpha=.94){
          if(PAPER_COLORS.has(color))return api.paper('parchment-panel',x,y,w,h).setAlpha(Math.max(alpha,.92));
          const surface=scene.add.graphics({x,y}),radius=Math.min(24,h/3);
          surface.width=w;surface.height=h;
          surface.setStrokeStyle=(width=1.5,stroke=0x8ca894,opacity=.7)=>{surface.clear().fillStyle(color,alpha).fillRoundedRect(-w/2,-h/2,w,h,radius).lineStyle(width,stroke,opacity).strokeRoundedRect(-w/2,-h/2,w,h,radius);return surface;};
          return surface.setStrokeStyle();
        },
        marker(x,y,number,onPick){
          const ring=scene.add.circle(0,0,25,0x164c49,.94).setStrokeStyle(4,0xffe5a0);
          const glyph=api.text(number,0,0,26,'#ffffff');
          const button=scene.add.container(x,y,[ring,glyph]).setSize(78,78).setInteractive({useHandCursor:true});
          const canvas=scene.game.canvas;
          const fitHitArea=()=>{
            const width=canvas.getBoundingClientRect().width;
            if(!width)return;
            const size=Math.max(78,Math.ceil(48*scene.scale.gameSize.width/width));
            button.setSize(size,size);button.input.hitArea.setSize(size,size);
          };
          const resizeHitArea=new ResizeObserver(fitHitArea);
          resizeHitArea.observe(canvas);fitHitArea();sceneCleanups.push(()=>resizeHitArea.disconnect());
          button.on('pointerup',()=>{if(!selected&&!pressed&&!gestureMoved&&!document.querySelector('dialog[open]'))onPick();});
          return (done,visible=true)=>{button.setVisible(visible);glyph.setText(done?'✓':String(number));ring.setFillStyle(done?0x38693c:0x164c49,.94);};
        },
        target(x,y,w,h,label){
          const area=scene.add.graphics();
          area.fillStyle(0xfff5ce,.42).fillRoundedRect(x-w/2,y-h/2,w,h,14).lineStyle(3,0x987a36,.85).strokeRoundedRect(x-w/2,y-h/2,w,h,14).lineStyle(2,0xffffff,.6).strokeRoundedRect(x-w/2+5,y-h/2+5,w-10,h-10,10);
          api.text(label,x,y,23,'#294239',w-20);return area;
        },
        card(label,x,y,w,h,size=22,{icon,color='#294239'}={}){
          const hasIcon=icon&&scene.textures.exists(UI(icon)),iconWidth=hasIcon?Math.min(h*.56,w*.22):0,gap=hasIcon?12:0;
          const text=api.text(label,(iconWidth+gap)/2,0,size,color,w-36-iconWidth-gap);
          const height=Math.max(h,text.height+24);
          const c=scene.add.container(x,y,[api.paper('paper-card',0,0,w,height)]);
          if(hasIcon)c.add(scene.add.image(-w/2+18+iconWidth/2,0,UI(icon)).setDisplaySize(iconWidth,h*.56));
          c.add(text);c.setData('learningCard',true);
          return c.setSize(w,height);
        },
        drag(object,{onDrop,onMove,onStart,onTap,onPick}={}){
          let home={x:object.x,y:object.y};
          const depth=object.depth;
          let dragging=false;
          if(!object.input)object.setInteractive({useHandCursor:true});
          scene.input.setDraggable(object);
          draggables.set(object,{onDrop,onMove,onStart,onTap,onPick});
          // Small phones shrink the canvas; keep every draggable at least 48 CSS px wide and tall.
          const area=object.input?.hitArea;
          if(area instanceof window.Phaser.Geom.Rectangle){
            const {x:x0,y:y0,width:w0,height:h0}=area;
            const fitDragArea=()=>{
              const width=scene.game.canvas.getBoundingClientRect().width;
              if(!width||!object.input)return;
              const need=48*scene.scale.gameSize.width/width,W=Math.max(w0,need/(Math.abs(object.scaleX)||1)),H=Math.max(h0,need/(Math.abs(object.scaleY)||1));
              area.setTo(x0+(w0-W)/2,y0+(h0-H)/2,W,H);
            };
            const resizeDragArea=new ResizeObserver(fitDragArea);
            resizeDragArea.observe(scene.game.canvas);fitDragArea();sceneCleanups.push(()=>resizeDragArea.disconnect());
          }
          object.on('pointerdown',()=>{if(!document.querySelector('dialog[open]'))pressed=object;});
          object.on('dragstart',()=>{if(document.querySelector('dialog[open]'))return;scene.tweens.killTweensOf(object);dragging=true;home={x:object.x,y:object.y};clearSelection();gestureMoved=true;ctx.sound('pickup');object.setDepth(200);onStart?.(object);});
          object.on('drag',(_pointer,x,y)=>{object.setPosition(x,y);onMove?.(object,x,y);});
          object.on('dragend',()=>{
            if(!dragging)return;dragging=false;
            let accepted=false;
            try{accepted=onDrop?.(object,object.x,object.y)===true;}finally{object.setDepth(depth);}
            if(accepted)ctx.sound('place');
            if(!accepted&&object.active)scene.tweens.add({targets:object,x:home.x,y:home.y,duration:reduced?0:180,ease:'Sine.easeOut'});
          });
          return object;
        },
        actions(actions){
          const extras=actions.filter(a=>a.id.endsWith('-3d'));
          actions=actions.filter(a=>!a.id.endsWith('-3d'));
          for(const old of toolMenu.querySelectorAll('[data-extra-tool]'))old.remove();
          for(const action of extras){const b=document.createElement('button');b.type='button';b.id=action.id;b.dataset.extraTool='';b.className='secondary';b.textContent=action.label;b.onclick=()=>{dismissTools();action.onClick();};$('.adventure-side-tools',toolMenu).append(b);}
          let buttons=$('.action-buttons',ctx.controls);
          if(!buttons){buttons=document.createElement('div');buttons.className='action-buttons';ctx.controls.prepend(buttons);}
          if(buttons.children.length!==actions.length||actions.some((a,i)=>buttons.children[i].id!==a.id)){
            buttons.replaceChildren(...actions.map(a=>{const b=document.createElement('button');b.type='button';b.id=a.id;return b;}));
          }
          actions.forEach((a,i)=>{const b=buttons.children[i];b.className=a.primary?'primary':'secondary';b.disabled=!!a.disabled;if(b.textContent!==a.label)b.textContent=a.label;b.onclick=a.onClick;});
          guideAction();
        },
        range(label,value,min,max,onChange,ends=['처음','끝']){
          const row=document.createElement('div');row.className='adventure-range';
          const span=document.createElement('span');span.textContent=label;
          const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=(max-min<=1)?.01:1;input.value=value;input.setAttribute('aria-label',label);
          input.oninput=()=>onChange(Number(input.value));input.onchange=ctx.save;
          const jump=(label,value)=>{const b=document.createElement('button');b.className='range-jump secondary';b.textContent=label;b.type='button';b.onclick=()=>{input.value=value;onChange(value);ctx.save();};return b;};
          row.append(span,jump(ends[0],min),input,jump(ends[1],max));ctx.controls.append(row);return input;
        },
        setToolHandler(id,handler){if(tool?.id===id)toolHandler=handler;},
        listenCleanup(fn){sceneCleanups.push(fn);},
        spark(x,y){
          if(reduced)return;
          for(let i=0;i<10;i++){
            const a=i*Math.PI/5,dot=scene.add.circle(x,y,4+i%3,0xffd464).setDepth(300);
            scene.tweens.add({targets:dot,x:x+Math.cos(a)*75,y:y+Math.sin(a)*60,alpha:0,duration:550,onComplete:()=>dot.destroy()});
          }
        }
      };
      hooks=SETUP[ctx.s.id](scene,api);
      if(phaseDone)ctx.say(chapter.tasks[phase]?.summary||'발견을 마쳤어. 다음으로 이어 가자.');
      guideAction();
      if(focusInstruction){focusInstruction=false;$('#instruction').focus({preventScroll:true});}
      this.events.once('shutdown',()=>{
        stopAuto();auto=null;playback.configure(null);paintAuto();hooks?.destroy?.();hooks=null;
        for(const clean of sceneCleanups)clean();sceneCleanups=[];
      });
      // The navigation button always reflects saved phase completion, not incidental captures.
      next.disabled=!phaseDone;
    }
    update(time,delta){
      if(closed||document.hidden||document.querySelector('dialog[open]'))return;
      playback.update(delta,(clock,step)=>hooks?.update?.(clock,step));
      if(!auto)return;
      paintAuto();
    }
  }
  let wasPaused=false;
  function syncPause(){
    if(!game||!activeScene||closed)return;
    const pause=document.hidden||!!document.querySelector('dialog[open]');
    // Dialog contents can change while open; only the first pause may stop motion.
    if(pause&&!wasPaused){stopAuto();hooks?.pause?.();}
    wasPaused=pause;
    if(pause&&game.scene.isActive('Activity'))game.scene.pause('Activity');
    else if(!pause&&game.scene.isPaused('Activity'))game.scene.resume('Activity');
  }
  const observer=new MutationObserver(syncPause);
  const headingObserver=new ResizeObserver(()=>{
    page.style.setProperty('--activity-top',Math.ceil(heading.offsetTop+heading.offsetHeight+8)+'px');
  });
  headingObserver.observe(heading);
  const footer=$('.adventure-footer',page);
  // Longer findings get the full width on a short screen, so neither the
  // explanation nor the operating buttons need a scroll container.
  let fitFrame=0,fitKey='';
  function fitDock(){
    fitFrame=0;if(closed)return;
    const key=[page.clientWidth,page.clientHeight,heading.offsetHeight,heading.offsetTop,footer.clientHeight,$('#river-status').textContent,$('#speech').textContent,ctx.controls.textContent,playbackBar.hidden,next.disabled].join('|');
    if(key===fitKey)return;fitKey=key;
    page.classList.remove('guidance-wide');
    if(!matchMedia('(orientation:landscape) and (max-height:620px)').matches)return;
    const guide=$('.river-narrator',page),toolbar=$('.adventure-toolbar',page);
    if(guide.offsetHeight+toolbar.scrollHeight+6>footer.clientHeight+1){
      page.classList.add('guidance-wide');
      page.style.setProperty('--wide-guidance-height',Math.ceil(guide.offsetHeight)+'px');
    }
  }
  const scheduleFit=()=>{if(!fitFrame)fitFrame=requestAnimationFrame(fitDock);};
  const dockObserver=new MutationObserver(scheduleFit);
  dockObserver.observe(footer,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled']});
  const footerObserver=new ResizeObserver(()=>{
    page.style.setProperty('--footer-height',Math.ceil(footer.offsetHeight+8)+'px');
    scheduleFit();
  });
  for(const target of [footer,heading,page,$('.river-narrator',page),$('.adventure-toolbar',page)])footerObserver.observe(target);
  const resizeObserver=new ResizeObserver(()=>{if(game&&!closed)game.scale.setParentSize(ctx.root.clientWidth,ctx.root.clientHeight);});
  resizeObserver.observe(ctx.root);
  observer.observe($('#overlay'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',syncPause);
  document.fonts.ready.then(()=>{
    if(closed)return;
    game=new window.Phaser.Game({
      type:window.Phaser.AUTO,parent:'phaser-stage',width:1200,height:640,
      transparent:true,antialias:true,
      scale:{mode:window.Phaser.Scale.FIT,autoCenter:window.Phaser.Scale.CENTER_BOTH},
      input:{activePointers:1},
      audio:{noAudio:true},fps:{target:60,forceSetTimeOut:false},scene:Activity,
      callbacks:{postBoot(game){game.canvas.setAttribute('aria-label',`${ctx.s.place} · 손으로 도구를 움직이는 탐구 장면`);game.canvas.setAttribute('role','img');}}
    });
  });
  return()=>{closed=true;stopAuto();auto=null;document.removeEventListener('pointerdown',manual,true);document.removeEventListener('keydown',manual,true);document.removeEventListener('input',manual,true);document.removeEventListener('pointerdown',closeTools,true);document.removeEventListener('keydown',closeTools,true);observer.disconnect();headingObserver.disconnect();footerObserver.disconnect();dockObserver.disconnect();cancelAnimationFrame(fitFrame);resizeObserver.disconnect();document.removeEventListener('visibilitychange',syncPause);destroyGame(game);ctx.save();};
}
