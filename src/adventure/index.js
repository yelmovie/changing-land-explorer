import {$, $$, icon, escapeHTML} from '../ui.js';
import {capture,evidenceCard} from '../explore-ui.js';
import {PHASES,TOOL_ASSETS,revisitPhase,completePhase,discoveryCount} from './rules.js';
import {setup as river} from './river.js';
import {setup as volcano} from './volcano.js';
import {setup as rocks} from './rocks.js';
import {setup as city} from './city.js';
import {setup as safety} from './safety.js';
import {HINTS} from './hints.js';
import {destroyGame} from '../phaser-lifecycle.js';
import {backgroundForAsset,STAGE_BACKGROUNDS} from '../stage-art.js';

const SETUP={river,volcano,rocks,city,safety};
const ASSETS={
  river:['river-lab','river-field','art/river-sand-model'],volcano:['volcano-lab','volcano-field','volcano-eruption','art/volcano-mountain','art/volcano-tray','art/volcano-syringe'],
  rocks:['rocks-lab','art/rocks-quarry-atelier-v2','rock-0','rock-1','rock-2','rock-3','art/geologist-brush'],
  city:['city-before','city-eruption','city-calm','art/city-message-square-v2'],safety:['classroom','school','art/safety-cushion','art/hero-hold-leg-v1']
};
const COMMON=['river-hero','river-pose-0','river-pose-1','river-pose-2','river-pose-3','hero-lens','hero-brush','hero-cheer','hero-protect','tool-water',...Object.values(TOOL_ASSETS)];
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
  ctx.root.closest('.adventure-page')?.style.setProperty('--activity-backdrop',backdrop);
  let game,closed=false,hooks,activeScene,phaseDone=false,toolHandler=null,zoomed=false;
  let sceneCleanups=[], assistActions=[];
  let hintIndex=0,initialHint='';
  ctx.root.innerHTML='<div class="phaser-stage" id="phaser-stage"></div><div class="stage-loader" role="status">리버가 탐험 도구를 꺼내고 있어…</div><div class="quest-meter" id="quest-meter" aria-live="polite"></div><div class="discovery-pop" id="discovery-pop" role="status" hidden></div>';
  const next=$('#next');
  function updateStepNav(){
    const phase=chapter.phase, names=PHASES[ctx.s.id][ctx.step];
    $('#phase-path').innerHTML=names.map((name,i)=>`<button class="phase-node ${i===phase?'current':''} ${chapter.tasks[i]?.done?'done':''}" data-phase="${i}" ${i>phase&&!chapter.tasks[i-1]?.done&&!ctx.admin?'disabled':''} aria-label="${i+1}단계 ${escapeHTML(name)}${chapter.tasks[i]?.done?' 완료':''}" ${i===phase?'aria-current="step"':''}><span>${chapter.tasks[i]?.done?icon('check',16):i+1}</span><b>${name}</b></button>`).join('');
    $$('[data-phase]').forEach(button=>button.onclick=()=>{
      const target=Number(button.dataset.phase);
      if(target===chapter.phase)return;
      chapter.phase=target;ctx.save();restart();
    });
    $('#journey-count').textContent=String(discoveryCount(ctx.state));
    phaseDone=chapter.tasks[phase]?.done===true;
    next.disabled=!phaseDone;
    next.innerHTML=(phase<2?'다음 발견':ctx.step===0?'현장으로 출발':'도구 받기')+icon('arrow',22);
    next.classList.toggle('ready',phaseDone);
    $('#river-status').textContent=phaseDone?'발견 완료 · 오른쪽에서 계속하기':'리버의 길잡이 · 막히면 나를 눌러 줘';
  }
  function restart(){
    if(closed)return;
    $('#discovery-pop').hidden=true;
    if(activeScene)activeScene.scene.restart();
  }
  next.onclick=()=>{
    if(!phaseDone)return;
    ctx.chime();
    if(chapter.phase<2){chapter.phase++;ctx.save();restart();}
    else ctx.finishActivity();
  };

  const helpButton=$('#gesture-help');
  function showHint(){
    const cues=HINTS[ctx.s.id]?.[ctx.step]?.[chapter.phase]||[initialHint];
    ctx.sound('hint',{force:true});
    ctx.modal('리버의 탐구 힌트',`<div class="hint-card"><img src="/assets/hero-lens.webp" alt="힌트를 주는 리버"><div><span class="eyebrow">${escapeHTML(PHASES[ctx.s.id][ctx.step][chapter.phase])}</span><p id="hint-copy">${escapeHTML(cues[hintIndex%cues.length])}</p><span id="hint-progress">힌트 ${hintIndex%cues.length+1} / ${cues.length}</span></div></div><div class="hint-actions"><button class="secondary" id="hint-more">한 걸음 더</button><button class="primary" id="hint-return">직접 해 볼게</button><button class="text-button" id="hint-assist">버튼으로 조작하기</button></div>`,(dialog,close)=>{
      workHint();
      function workHint(){const w=chapter.work[chapter.phase]??={};w.answerHint=true;ctx.save();}
      $('#hint-more',dialog).onclick=()=>{hintIndex=(hintIndex+1)%cues.length;$('#hint-copy',dialog).textContent=cues[hintIndex];$('#hint-progress',dialog).textContent=`힌트 ${hintIndex+1} / ${cues.length}`;};
      $('#hint-return',dialog).onclick=close;
      $('#hint-assist',dialog).onclick=()=>{close();helpButton.click();};
    });
  }
  $('#river-hint').onclick=showHint;
  helpButton.onclick=()=>ctx.modal('끌기 대신 버튼으로 조작',
    '<p>도구와 대상을 직접 골라 조작해 봐. 조작 도움을 써도 보상은 같아. 정답 힌트를 펼친 연습은 수첩에 따로 표시해.</p><div class="assist-grid">'+assistActions.map((a,i)=>`<button class="secondary" data-assist="${i}">${escapeHTML(a.label)}</button>`).join('')+'</div><p class="assist-feedback" role="status"></p><button class="primary" id="assist-return">탐구로 돌아가기</button>',(dialog,close)=>{
      $$('[data-assist]',dialog).forEach(button=>button.onclick=()=>{const action=assistActions[Number(button.dataset.assist)];if(action?.closeOnUse)close();const w=chapter.work[chapter.phase]??={};w.operationHelp=true;ctx.save();action?.callback();$('.assist-feedback',dialog).textContent=$('#speech').textContent;});
      $('#assist-return',dialog).onclick=close;
    });
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
      for(const key of [...new Set([...COMMON,...ASSETS[ctx.s.id]])])if(!this.textures.exists(key))this.load.image(key,`/assets/${backgroundForAsset(key)}.webp`);
      this.load.on('loaderror',file=>{console.error('Game asset unavailable:',file.key);});
    }
    create(){
      if(closed)return;
      activeScene=this;hooks=null;toolHandler=null;zoomed=false;sceneCleanups=[];assistActions=[];
      hintIndex=0;
      ctx.controls.innerHTML='';$('#quest-meter').textContent='';
      $('.stage-loader',ctx.root)?.remove();
      updateStepNav();
      const phase=chapter.phase;
      const work=chapter.work[phase]??={};
      const scene=this;
      let selected=null,pressed=null,pressPoint=null,gestureMoved=false;
      const tapRing=scene.add.graphics().setDepth(195);
      const draggables=new Map();
      const clearSelection=()=>{selected=null;tapRing.clear();};
      const select=object=>{scene.tweens.killTweensOf(object);selected=object;tapRing.clear().lineStyle(5,0xffd36b,1).strokeCircle(object.x,object.y,Math.min(110,Math.max(45,object.displayWidth/2+10)));ctx.say('도착할 곳을 눌러 줘. 손가락으로 끌어도 돼.');ctx.sound('pickup');};
      scene.input.on('pointerdown',(p)=>{pressPoint={x:p.x,y:p.y};gestureMoved=false;});
      scene.input.on('pointerup',(p)=>{
        if(document.querySelector('dialog[open]'))return;
        const moved=gestureMoved||!pressPoint||Math.hypot(p.x-pressPoint.x,p.y-pressPoint.y)>12;
        if(!moved&&pressed){select(pressed);}
        else if(!moved&&selected){
          const object=selected,config=draggables.get(object),home={x:object.x,y:object.y};clearSelection();
          if(config&&object.active){scene.tweens.killTweensOf(object);object.setPosition(p.x,p.y);config.onMove?.(object,p.x,p.y);const accepted=(config.onTap||config.onDrop)?.(object,object.x,object.y)===true;if(!accepted&&object.active)object.setPosition(home.x,home.y);ctx.sound(accepted?'place':'move');}
        }
        pressed=null;
      });
      scene.input.on('pointerupoutside',()=>{pressed=null;clearSelection();});
      scene.input.on('gameout',()=>{pressed=null;});
      const api={
        stage:ctx.s.id,step:ctx.step,phase,data:ctx.data,work,state:ctx.state,
        save:ctx.save,
        task(title,hint){ctx.instruction(title);ctx.say(hint);initialHint=hint;},
        say(text,success=false){ctx.say(text);if(success)ctx.chime();},
        counter(done,total,label){$('#quest-meter').innerHTML=`<span>${escapeHTML(label)}</span><strong>${Math.min(done,total)} <small>/ ${total}</small></strong>`;},
        record(item){capture(ctx,{...item,phase,operationHelp:!!work.operationHelp,answerHint:!!work.answerHint}); next.disabled=!phaseDone;},
        sound:ctx.sound,
        finish(summary,details={}){
          details={...details,operationHelp:!!work.operationHelp,answerHint:!!work.answerHint};
          const fresh=completePhase(ctx.data,ctx.step,phase,summary,details);
          // Admin may inspect later scenes without writing fictional earlier evidence.
          if(ctx.admin)chapter.phase=phase;
          if(ctx.admin&&!chapter.tasks[phase]?.done)chapter.tasks[phase]={done:true,summary,details};
          phaseDone=chapter.tasks[phase]?.done===true;
          if(!phaseDone)return;
          ctx.save();ctx.update();updateStepNav();ctx.say(summary);
          if(fresh){
            ctx.chime();
            const pop=$('#discovery-pop');
            pop.innerHTML=`<img src="/assets/hero-cheer.webp" alt="기뻐하는 리버"><div><b>발견했어!</b><span>${escapeHTML(PHASES[ctx.s.id][ctx.step][phase])} 완료</span></div>`;
            pop.hidden=false;scene.time.delayedCall(reduced?600:2400,()=>{if(pop.isConnected)pop.hidden=true;});
            api.spark(600,100);
          }
        },
        image(key,x,y,w,h){
          if(x===600&&y===320&&w===1200&&h===640)ctx.root.style.setProperty('--activity-backdrop',`url('/assets/${backgroundForAsset(key)}.webp')`);
          return scene.add.image(x,y,key).setDisplaySize(w,h);
        },
        hero(x,y,size=110,pose='river-hero'){
          if(!scene.textures.exists(pose))pose='river-hero';
          const img=scene.add.image(x,y,pose);img.setScale(size/img.height);return img;
        },
        text(text,x,y,size=24,color='#294239',wrapWidth){
          const rect=ctx.root.getBoundingClientRect(),scale=Math.min(rect.width/1200,rect.height/640);
          if(size>=18)size=Math.max(size,Math.min(29,19/Math.max(.5,scale)));
          return scene.add.text(x,y,String(text),{fontFamily:'GeoDisplay, Malgun Gothic, sans-serif',fontSize:size+'px',color,align:'center',padding:{x:3,y:3},...(wrapWidth?{wordWrap:{width:wrapWidth,useAdvancedWrap:true}}:{})}).setOrigin(.5);
        },
        panel(x,y,w,h,color=0xfff7df,alpha=.94){return scene.add.rectangle(x,y,w,h,color,alpha).setStrokeStyle(2,0xcdbb8c,.6);},
        target(x,y,w,h,label){
          const area=scene.add.rectangle(x,y,w,h,0xfff5ce,.4).setStrokeStyle(3,0x987a36,.8);
          api.text(label,x,y,23,'#294239',w-20);return area;
        },
        drag(object,{onDrop,onMove,onStart,onTap}={}){
          const home={x:object.x,y:object.y},depth=object.depth;
          let dragging=false;
          if(!object.input)object.setInteractive({useHandCursor:true});
          scene.input.setDraggable(object);
          draggables.set(object,{onDrop,onMove,onStart,onTap});
          object.on('pointerdown',()=>{if(!document.querySelector('dialog[open]'))pressed=object;});
          object.on('dragstart',()=>{if(document.querySelector('dialog[open]'))return;scene.tweens.killTweensOf(object);dragging=true;clearSelection();gestureMoved=true;ctx.sound('pickup');object.setDepth(200);onStart?.(object);});
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
          let buttons=$('.action-buttons',ctx.controls);
          if(!buttons){buttons=document.createElement('div');buttons.className='action-buttons';ctx.controls.prepend(buttons);}
          buttons.innerHTML=actions.map(a=>`<button class="${a.primary?'primary':'secondary'}" id="${escapeHTML(a.id)}">${escapeHTML(a.label)}</button>`).join('');
          actions.forEach(a=>$('#'+CSS.escape(a.id),ctx.controls).onclick=a.onClick);
        },
        range(label,value,min,max,onChange){
          const row=document.createElement('div');row.className='adventure-range';
          const span=document.createElement('span');span.textContent=label;
          const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=(max-min<=1)?.01:1;input.value=value;input.setAttribute('aria-label',label);
          input.oninput=()=>onChange(Number(input.value));input.onchange=ctx.save;
          const jump=(label,value)=>{const b=document.createElement('button');b.className='range-jump secondary';b.textContent=label;b.type='button';b.onclick=()=>{input.value=value;onChange(value);ctx.save();};return b;};
          row.append(span,jump('처음',min),input,jump('끝',max));ctx.controls.append(row);return input;
        },
        assist(label,callback,options={}){assistActions.push({label,callback,...options});},
        // Students choose both the object and the destination. This runs the
        // physical drop handler, including its original learning validation.
        assistPlacement(items,targets){
          let chosen=null;
          for(const item of items)api.assist('도구 선택 · '+item.label,()=>{chosen=item;api.say(item.label+' 선택. 놓을 대상을 골라 줘.');});
          for(const target of targets)api.assist('대상 선택 · '+target.label,()=>{
            if(!chosen){api.say('먼저 옮길 도구나 카드를 골라 줘.');return;}
            const object=chosen.object,config=draggables.get(object);if(!config||!object.active)return;
            const home={x:object.x,y:object.y};object.setPosition(target.x,target.y);config.onMove?.(object,target.x,target.y);
            const ok=(config.onTap||config.onDrop)?.(object,target.x,target.y)===true;
            if(!ok&&object.active)object.setPosition(home.x,home.y);
          });
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
      this.events.once('shutdown',()=>{
        hooks?.destroy?.();hooks=null;
        for(const clean of sceneCleanups)clean();sceneCleanups=[];
      });
      // The navigation button always reflects saved phase completion, not incidental captures.
      next.disabled=!phaseDone;
    }
    update(time,delta){
      if(!closed&&!document.hidden&&!document.querySelector('dialog[open]'))hooks?.update?.(time,delta);
    }
  }
  function syncPause(){
    if(!game||!activeScene||closed)return;
    const pause=document.hidden||!!document.querySelector('dialog[open]');
    if(pause)hooks?.pause?.();
    if(pause&&game.scene.isActive('Activity'))game.scene.pause('Activity');
    else if(!pause&&game.scene.isPaused('Activity'))game.scene.resume('Activity');
  }
  const observer=new MutationObserver(syncPause);
  const resizeObserver=new ResizeObserver(()=>{if(game&&!closed)game.scale.setParentSize(ctx.root.clientWidth,ctx.root.clientHeight);});
  resizeObserver.observe(ctx.root);
  observer.observe($('#overlay'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',syncPause);
  document.fonts.ready.then(()=>{
    if(closed)return;
    game=new window.Phaser.Game({
      type:window.Phaser.AUTO,parent:'phaser-stage',width:1200,height:640,
      backgroundColor:'#e5ead9',transparent:false,antialias:true,
      scale:{mode:window.Phaser.Scale.FIT,autoCenter:window.Phaser.Scale.CENTER_BOTH},
      input:{activePointers:2,dragDistanceThreshold:4},
      audio:{noAudio:true},fps:{target:60,forceSetTimeOut:false},scene:Activity,
      callbacks:{postBoot(game){game.canvas.setAttribute('aria-label',`${ctx.s.place} · 손으로 도구를 움직이는 탐구 장면`);game.canvas.setAttribute('role','img');}}
    });
  });
  return()=>{closed=true;observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',syncPause);destroyGame(game);ctx.save();};
}
