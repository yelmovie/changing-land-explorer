import {escapeHTML} from '../ui.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const near=(x,y,p,r=75)=>Math.hypot(x-p.x,y-p.y)<r;
import {observationTour} from './observation-tour.js';
import {eruptionMotion,stageArt} from '../volcano-motion.js';
import {hasModel,openModel3D} from '../rock3d.js';
import {MODEL_MOUTH as MOUTH,MODEL_FLOW as FLOW,modelScene,paintScene,drawShapes,modelEvidence} from '../observation-scenes.js';
const OUTPUTS=[
  {id:'lava',label:'용암',x:385,y:395,text:'땅속의 마그마가 땅 위로 나온 것을 용암이라고 해.'},
  {id:'gas',label:'화산 기체',x:610,y:80,text:'수증기 같은 기체도 나와. 보이지 않는 기체는 설명 표시로 나타냈어.'},
  {id:'ash',label:'화산재',x:260,y:115,text:'화산이 분출할 때 나오는 아주 작은 고체 알갱이야. 바람을 타고 멀리 날아가기도 해.'},
  {id:'rock',label:'암석 조각',x:670,y:245,text:'큰 고체 암석 조각도 밖으로 나올 수 있어.'}
];


// Equivalent, readable controls share the very same placement/observation functions.
// They remain available at every viewport, including keyboard-only use.
function choicePanel(api,title,intro,items,choose){
  api.modal(title,`<p>${escapeHTML(intro)}</p><div style="display:grid;gap:8px">${items.map((item,i)=>`<button class="secondary" data-volcano-choice="${i}" style="min-height:48px;font-size:20px;white-space:normal;text-align:left" ${item.disabled?'disabled':''}>${escapeHTML(item.label)}</button>`).join('')}</div><p data-volcano-status role="status"></p>`,(dialog,close)=>{
    dialog.querySelectorAll('[data-volcano-choice]').forEach(button=>button.onclick=()=>{
      const result=choose(items[Number(button.dataset.volcanoChoice)],close);
      if(typeof result==='string')dialog.querySelector('[data-volcano-status]').textContent=result;
    });
  });
}

function lens(scene,api,x,y,label='돋보기'){
  if(scene.textures.exists('tool-lens'))return scene.add.container(x,y,[api.image('tool-lens',0,0,112,112),api.text(label,0,83,20)]).setSize(135,165);
  const g=scene.add.graphics().lineStyle(10,0x436b60).strokeCircle(0,0,37);
  g.fillStyle(0xdbf7ff,.3).fillCircle(0,0,32);
  g.lineStyle(13,0xb89055).lineBetween(27,27,61,61);
  return scene.add.container(x,y,[g,api.text(label,0,83,20)]).setSize(125,155);
}

function model(scene,api){
  const root=scene.add.container(0,0),liquid=scene.add.graphics(),waterLight=scene.add.graphics();let art,key='';
  function draw(parts,amount=0,motion=0){
    const next=parts.join(',');
    if(next!==key||!art){key=next;art?.destroy(true);art=paintScene(scene,api,modelScene(parts,0),{background:false});root.add(art);root.add(liquid);root.add(waterLight);root.bringToTop(liquid);root.bringToTop(waterLight);}
    drawShapes(liquid,modelScene([],amount).layers);
    waterLight.clear();
    if(amount<=0)return;
    const at=t=>{const n=clamp(t)*4,i=Math.min(3,Math.floor(n)),f=n-i,a=FLOW[i],b=FLOW[i+1];return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};};
    // Pale, broken reflections belong to dyed water. No glow, smoke or sparks
    // are added to the classroom model; the real volcano uses those separately.
    for(let i=0;i<7;i++){
      const f=((motion*.00016+i/7)%1)*amount,a=at(f),b=at(Math.min(amount,f+.014));
      waterLight.lineStyle(1.7,0xffded1,.6).lineBetween(a.x-2,a.y,b.x-2,b.y);
    }
    waterLight.lineStyle(1.1,0xffd5c2,.48).strokeEllipse(MOUTH.x,MOUTH.y,39,8);
    if(amount>.8){const k=(motion*.00045+.35)%1,spread=(amount-.8)*320;waterLight.lineStyle(1,0xffd6c6,(1-k)*.38).strokeEllipse(FLOW.at(-1).x,FLOW.at(-1).y,spread*(.45+k*.5),4+k*8);}
  }
  draw([]);return {draw};
}

function part(scene,api,id,x,y){
  const [key,w,h]={tray:['volcano-tray',155,48],mountain:['volcano-mountain',140,100],water:['volcano-syringe',48,112]}[id];
  const caption=api.text({tray:'쟁반',mountain:'산 모형',water:'붉은 물 주사기'}[id],0,76,22).setBackgroundColor('#fff8e8').setPadding(8,5);
  return scene.add.container(x,y,[api.image('art/'+key,0,0,w,h),caption]).setSize(165,165);
}

export function setup(scene,api){
  const d=api.data;d.evidence??={};d.assembly??=[];d.comparisons??={};
  if(api.step===1)return api.phase===0?observeOutputs(scene,api):compare(scene,api);
  api.image('volcano-lab',600,320,1200,640);
  api.hero(1120,525,140,'river-pose-1');
  api.text('가상 모형 · 붉은 물은 용암이 아니야',600,54,23).setBackgroundColor('#fff8e8').setPadding(10,5);
  if(api.phase===0)return assemble(scene,api);
  if(api.phase===1)return inject(scene,api);
  return trace(scene,api);
}

function assemble(scene,api){
  const d=api.data,w=api.work;w.parts??=[];let parts=w.parts,finished=false,completed=!!api.completed;
  const art=model(scene,api);
  const order=['tray','mountain','water'];
  const spots={tray:{x:580,y:492},mountain:{x:580,y:351},water:{x:957,y:350}};
  const glow=scene.add.graphics().fillStyle(0xffd567,.12).fillEllipse(0,12,146,50).fillStyle(0xffefb4,.2).fillEllipse(0,12,104,30);
  const stars=[[0,0,29],[-47,17,12],[42,-27,15]].map(([x,y,size],i)=>{
    const star=scene.add.graphics({x,y});
    const points=[{x:0,y:-size*1.4},{x:size*.24,y:-size*.24},{x:size,y:0},{x:size*.24,y:size*.24},{x:0,y:size*1.4},{x:-size*.24,y:size*.24},{x:-size,y:0},{x:-size*.24,y:-size*.24}];
    star.fillStyle(0xfff8d7).fillPoints(points,true).lineStyle(2,0xd29432,.95).strokePoints(points,true);
    star.fillStyle(0xffffff,.9).fillCircle(0,0,size*.17);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)scene.tweens.add({targets:star,alpha:.5,scaleX:.76,scaleY:.76,duration:760+i*130,delay:i*220,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    return star;
  });
  const target=scene.add.container(0,0,[glow,...stars]).setName('volcano-assembly-target');
  const objects={};
  function show(){
    art.draw(parts);
    const next=order[parts.length];
    target.setVisible(!!next);
    if(next){const p=spots[next];target.setPosition(p.x,p.y);}
    const title=['쟁반을 작업대에 놓아 줘','쟁반 위에 산 모형을 올려 줘','붉은 물 주사기를 관에 연결해 줘'][parts.length];
    api.task(title||'모형을 조립했어','반짝이는 자리에 재료를 끌어 놓아 줘.');
    api.counter(parts.length,3,'모형 조립');
  }
  function place(id){
    if(finished||parts.includes(id))return true;
    if(order[parts.length]!==id){api.say('쟁반, 산 모형, 붉은 물 주사기 순서로 놓아 줘.');return false;}
    parts.push(id);if(!completed&&!d.assembly.includes(id))d.assembly.push(id);
    objects[id].setVisible(false);api.spark(spots[id].x,spots[id].y);show();if(!completed)api.save();
    if(parts.length===3){finished=true;if(completed)api.stopAutoplay();else{completed=true;api.finish('실험 준비 완료! 주사기의 붉은 물이 어느 곳으로 나올지 살펴보자.');}}
    return true;
  }
  order.forEach((id,i)=>{
    const obj=objects[id]=part(scene,api,id,135,170+i*175);
    obj.setVisible(!parts.includes(id));
    api.drag(obj,{onDrop(o,x,y){if(!near(x,y,spots[id],115)){api.say('반짝이는 자리에 놓아 줘.');return false;}return place(id);}});
  });
  api.autoplay({label:'실험 모형 차례로 조립',interval:1500,allowWhenComplete:true,ready:()=>true,advance(){if(finished||parts.length===3){parts=[];finished=false;order.forEach(id=>objects[id].setVisible(true));show();}const id=order[parts.length];if(id)place(id);}});
  show();
  api.actions([{id:'volcano-build-choice',label:'재료 골라 놓기',onClick(){
    choicePanel(api,'어떤 재료를 놓을까?','작업대의 반짝이는 자리를 보고 놓을 재료를 골라 줘.',order.map(id=>({id,label:{tray:'쟁반',mountain:'산 모형',water:'붉은 물 주사기'}[id],disabled:parts.includes(id)})),(item,close)=>{if(place(item.id))close();else return '먼저 놓을 재료를 다시 생각해 봐.';});
  }}]);
  if(parts.length===3)api.actions([{id:'assembly-saved',label:'조립한 모형 확인',onClick(){if(!finished){finished=true;api.finish('모형 준비를 마쳤어. 이제 손잡이를 밀어 보자.');}},primary:true}]);
  return {};
}

function inject(scene,api){
  const d=api.data,w=api.work;w.push=clamp(w.push||0);w.flow=clamp(w.flow||0);
  let finished=!!api.completed,active=false,replay=null,flowClock=0;
  const art=model(scene,api),stem=scene.add.graphics();
  api.task('주사기 손잡이를 천천히 아래로 밀어 봐','손잡이를 밀거나 자동 재생으로 꼭대기와 경사면을 살펴봐.');
  // Flat fallback until the painted push knob loads; the arrow stays as the drag cue.
  const cap=scene.add.graphics().fillStyle(0x284f44,.22).fillRoundedRect(-49,-15,102,38,16)
    .fillStyle(0x3a8975).fillRoundedRect(-52,-22,104,35,15).lineStyle(2,0x245b50,.9).strokeRoundedRect(-52,-22,104,35,15)
    .lineStyle(2,0x88beaa,.8).lineBetween(-37,-16,35,-16);
  const arrow=scene.add.graphics().lineStyle(3,0xf6fff4,.95).beginPath().moveTo(0,-11).lineTo(0,5).lineTo(-6,-1).moveTo(0,5).lineTo(6,-1).strokePath();
  const handle=scene.add.container(957,185+w.push*145,[cap,arrow]).setSize(115,64);
  stageArt(scene,'plunger',key=>{
    if(!handle.scene)return;
    const knob=scene.add.image(0,8,key).setDisplaySize(112,68);
    const shade=scene.add.ellipse(1,-4,96,30,0x123b35,.18);
    cap.destroy();handle.addAt(knob,0);handle.addAt(shade,0);
    arrow.clear().lineStyle(5,0x17463f,.35).beginPath().moveTo(1,-14).lineTo(1,4).lineTo(-6,-3).moveTo(1,4).lineTo(8,-3).strokePath()
      .lineStyle(3.5,0xf6fff4,.98).beginPath().moveTo(0,-15).lineTo(0,3).lineTo(-7,-4).moveTo(0,3).lineTo(7,-4).strokePath();
  });
  const watch=api.text('붉은 물이 어디로 갈까?',560,535,24).setBackgroundColor('#fff8e8').setPadding(10,6);
  const view=()=>replay||w;
  function draw(){
    const v=view();handle.setPosition(957,185+v.push*145);
    art.draw(['tray','mountain','water'],v.flow,active?flowClock:0);
    // Rod colours follow the painted teal plunger.
    stem.clear().lineStyle(14,0x1f625a).lineBetween(957,handle.y+13,957,300+v.push*110)
      .lineStyle(9,0x2f8a7c).lineBetween(957,handle.y+14,957,300+v.push*110)
      .lineStyle(3,0xa9dccd,.8).lineBetween(954,handle.y+16,954,298+v.push*110);
    watch.setText(v.flow>.7?'붉은 물이 경사면을 따라 아래로 흘러.':v.flow>.1?'꼭대기 구멍에서 나오는 물을 봐!':'붉은 물이 어디로 갈까?');
    api.counter(Math.round(v.flow*100),100,'붉은 물 관찰');
  }
  function push(value){
    if(finished&&(!replay||replay.flow>=1))replay={push:0,flow:0};
    const v=view(),amount=clamp(value);v.push=Math.max(v.push,amount>=.95?1:amount);active=true;
    if(!finished){d.injected=v.push;api.save();}
    draw();
  }
  const stop=()=>{active=false;};
  api.drag(handle,{onMove(obj,x,y){push((y-185)/145);},onDrop(obj,x,y){push((y-185)/145);return true;}});
  api.autoplay({label:'붉은 물 분출 관찰',interval:650,allowWhenComplete:true,ready:()=>true,stop,
    advance(){push(finished&&(!replay||replay.flow>=1)?.16:view().push+.16);}
  });
  function finish(){
    if(finished)return;
    finished=true;active=false;w.flow=1;w.push=1;d.injected=1;d.modelTime=1;api.save();draw();
    api.finish('붉은 물이 꼭대기 구멍으로 나와 경사면을 따라 흘렀어.');
  }
  draw();
  api.range('주사기 손잡이 밀기',Math.round(w.push*100),0,100,value=>{api.stopAutoplay();push(Number(value)/100);});
  if(!finished&&w.push>=.98&&w.flow>=.98)api.actions([{id:'model-run-saved',label:'분출 관찰 확인',onClick:finish,primary:true}]);
  return {update(time,delta){
    if(!active)return;
    flowClock+=Math.min(delta,60);
    const v=view();v.flow=Math.min(v.push,v.flow+Math.min(delta,60)/4200);
    if(!finished)d.modelTime=v.flow;
    draw();
    if(v.flow>=.999&&v.push>=.999){
      if(finished){v.flow=1;active=false;api.stopAutoplay();api.say('다시 관찰했어. 실험 기록은 그대로야.');}
      else finish();
    }
  },pause:stop,destroy:stop};
}

function trace(scene,api){
  const d=api.data,w=api.work,parts=['tray','mountain','water'];
  w.path=w.mouth?Math.min(FLOW.length,Math.max(0,Math.floor(Number(w.path)||0))):0;
  const art=model(scene,api),scope=lens(scene,api,180,470,'나온 곳 찾기');
  const guide=scene.add.graphics(),sources=[{x:957,y:362},{...MOUTH},{x:425,y:510}];
  const sourceMarkers=sources.map((p,i)=>api.text(String(i+1),p.x,p.y,19).setDepth(2));
  const marks=FLOW.map((p,i)=>api.text(String(i+1),p.x,p.y,19).setDepth(2));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flowTarget=()=>w.mouth?Math.max(.035,(w.path-1)/(FLOW.length-1)):0;
  let visual=flowTarget(),finished=!!api.completed,drawing=false,down=null;
  const closest=(list,x,y)=>{
    let match=-1,limit=43;
    list.forEach((p,i)=>{const distance=Math.hypot(x-p.x,y-p.y);if(distance<limit){match=i;limit=distance;}});
    return match;
  };
  function guideDraw(){
    guide.clear();
    const showingPath=!!w.mouth,showingDots=showingPath&&w.path<FLOW.length;
    scope.setVisible(!showingPath);
    sourceMarkers.forEach((marker,i)=>{
      marker.setVisible(!showingPath);
      if(!showingPath){const {x,y}=sources[i];guide.fillStyle(0xfff4d3,.88).fillCircle(x,y,20).lineStyle(2,0x6d6039,.94).strokeCircle(x,y,20);}
    });
    marks.forEach((marker,i)=>{
      marker.setVisible(showingDots&&i>=w.path);
      if(!showingDots||i<w.path)return;
      const {x,y}=FLOW[i],active=i===w.path;
      guide.fillStyle(active?0xffdfa0:0xfff6db,active?1:.77).fillCircle(x,y,active?23:17);
      guide.lineStyle(active?3:2,active?0x784936:0x876f56,.94).strokeCircle(x,y,active?23:17);
    });
    api.task(showingPath?'물이 흐른 길을 이어 봐':'붉은 물이 나온 곳을 찾아 봐',showingPath?'꼭대기 1번부터 차례로 누르거나, 손가락으로 점을 이어 봐.':'그림에서 붉은 물이 밖으로 나온 곳의 번호를 눌러 봐.');
    api.counter(Number(showingPath)+w.path,6,'물길 연결');
    canvas?.setAttribute('aria-label',showingPath?'물길 잇기. 꼭대기부터 숫자 1, 2, 3, 4, 5를 차례로 눌러.':'물의 출구 찾기. 1번 주사기, 2번 꼭대기 구멍, 3번 쟁반.');
  }
  function chooseSource(index){
    if(w.mouth||index<0)return false;
    if(index!==1){api.say(index===0?'주사기는 물을 밀어 넣는 곳이야. 물이 밖으로 나온 곳을 찾아 봐.':'쟁반은 흐른 물이 모인 곳이야. 물이 처음 나온 곳을 찾아 봐.');return false;}
    w.mouth=true;
    api.record({id:'model-mouth',kind:'model',...modelEvidence(d),asset:'volcano-lab',label:'물이 나온 입구',point:{x:MOUTH.x/1200,y:MOUTH.y/640},time:1,claim:'mouth',text:'붉은 물이 꼭대기의 구멍으로 나왔어.'});
    guideDraw();api.say('꼭대기 구멍에서 나왔어. 이제 1번부터 경사면의 점을 이어 봐.',true);api.save();return true;
  }
  function link(index,feedback=false){
    if(!w.mouth||w.path===FLOW.length||index<0)return false;
    if(index!==w.path){if(feedback&&index>w.path)api.say((w.path+1)+'번부터 이어 봐. 물은 높은 곳에서 낮은 곳으로 흘러.');return false;}
    w.path++;guideDraw();api.save();
    if(w.path===FLOW.length){
      d.modelTime=1;
      api.record({id:'model-flow',kind:'model',...modelEvidence(d),asset:'volcano-lab',label:'경사면을 흐른 붉은 물',point:{x:700/1200,y:398/640},time:1,claim:'flow',text:'붉은 물이 모형의 경사면을 따라 흘렀어.'});
    }
    return true;
  }
  function check(){if(!finished&&w.mouth&&w.path===FLOW.length&&visual>=1){finished=true;api.finish('꼭대기에서 나온 붉은 물이 네가 이은 길을 따라 쟁반까지 흘렀어.');}}
  const world=p=>scene.cameras.main.getWorldPoint(p.x,p.y);
  scene.input.on('pointerdown',p=>{
    if(document.querySelector('dialog[open]'))return;
    const {x,y}=world(p);down={x,y};
    if(w.mouth){
      const index=closest(FLOW,x,y);
      drawing=index>=0&&(index===w.path-1||index===w.path);
      link(index,true);
    }
  });
  scene.input.on('pointermove',p=>{if(p.isDown&&drawing){const {x,y}=world(p);link(closest(FLOW,x,y));}});
  scene.input.on('pointerup',p=>{
    drawing=false;
    if(!w.mouth&&down){const {x,y}=world(p);if(Math.hypot(x-down.x,y-down.y)<25)chooseSource(closest(sources,x,y));}
    down=null;
  });
  scene.input.on('pointerupoutside',()=>{drawing=false;down=null;});
  api.drag(scope,{onDrop(_obj,x,y){return chooseSource(closest(sources,x,y));}});
  const canvas=scene.game?.canvas;
  if(canvas){
    const original=canvas.getAttribute('aria-label');canvas.tabIndex=0;
    const onKey=event=>{
      if(event.repeat||document.querySelector('dialog[open]'))return;
      const i=['1','2','3','4','5'].indexOf(event.key);
      if(i<0)return;
      event.preventDefault();if(w.mouth)link(i,true);else if(i<sources.length)chooseSource(i);
    };
    canvas.addEventListener('keydown',onKey);
    api.listenCleanup(()=>{canvas.removeEventListener('keydown',onKey);canvas.removeAttribute('tabindex');if(original)canvas.setAttribute('aria-label',original);});
  }
  art.draw(parts,visual);guideDraw();check();
  return {update(time,delta){
    const target=flowTarget();
    if(visual<target){visual=reduced?target:Math.min(target,visual+Math.min(delta,50)/620);art.draw(parts,visual,time);}
    check();
  },destroy(){api.save();}};
}

function observeOutputs(scene,api){
  const d=api.data,w=api.work;w.found??=[];let selected=OUTPUTS[0],finished=!!api.completed;
  const motion=eruptionMotion(scene,api);api.image('volcano-eruption',600,320,1200,640);motion.show();
  api.task('분출물을 눌러 직접 살펴보자','숫자가 있는 곳을 누르면 설명을 읽고 관찰 수첩에 바로 기록해.');
  const markers=new Map(),world=p=>({x:p.x*1.2,y:p.y*640/560});
  const recorded=p=>w.found.includes(p.id)&&d.evidence['output-'+p.id]?.kind==='volcano'&&d.evidence['output-'+p.id]?.claim===p.id;
  function check(){if(!finished&&OUTPUTS.every(recorded)){finished=true;api.finish(selected.label+' · '+selected.text+' 네 가지 분출물을 모두 찾았어!');}}
  function redraw(){for(const p of OUTPUTS)markers.get(p.id)?.(recorded(p));api.counter(OUTPUTS.filter(recorded).length,4,'분출물 기록');}
  function inspect(p,record=false){
    selected=p;motion.play(p.id);api.say(p.label+' · '+p.text);
    if(!record)return;
    if(recorded(p)){check();return;}
    if(!w.found.includes(p.id))w.found.push(p.id);
    api.record({id:'output-'+p.id,kind:'volcano',label:p.label,asset:'volcano-eruption',claim:p.id,point:{x:p.x/1000,y:p.y/560},zoom:1.5,text:p.text});
    const q=world(p);api.spark(q.x,q.y);redraw();api.save();
    check();
  }
  OUTPUTS.forEach((p,index)=>{const q=world(p);markers.set(p.id,api.marker(q.x,q.y,index+1,()=>inspect(p,true)));});
  // The lens opens a responsive DOM close-up, keeping marker coordinates and text unzoomed.
  api.setToolHandler?.('lens',()=>{
    const p=selected;api.modal(p.label+' 자세히 보기',`<div class="volcano-closeup"><img src="/assets/art/volcano-caldera-v2.webp" alt="${p.label} 관찰" style="transform-origin:${p.x/10}% ${p.y/5.6}%"></div><p>${p.text}</p>`);
  });
  api.actions([{id:'volcano-output-choice',label:'분출물 골라 관찰',onClick(){
    choicePanel(api,'분출물 관찰','그림의 네 가지 분출물 중 자세히 살펴볼 대상을 골라 줘.',OUTPUTS.map(p=>({...p,label:p.label+(recorded(p)?' · 기록함':'')})),(item,close)=>{inspect(OUTPUTS.find(p=>p.id===item.id),true);close();});
  }}]);
  api.autoplay(observationTour(api,{label:'분출물 네 가지 관찰',items:OUTPUTS,interval:4100,visit(p){inspect(p);},stop:motion.pause}));
  redraw();check();return {update:motion.update,pause:motion.pause,destroy:motion.destroy};
}

function compare(scene,api){
  const d=api.data,w=api.work;w.links??=[];let finished=false;
  const same=api.phase===1;
  api.image('volcano-field',600,320,1200,640);
  api.panel(600,289,1060,542,0xfff8e6,.68);
  api.hero(1140,525,100,'hero-cheer');
  api.task(same?'모형과 실제 화산의 같은 모습을 연결해 봐':'모형으로 모두 나타낼 수 없는 점을 찾아 봐',same?'네 모형 기록과 화산 설명을 알맞은 관찰 자리에 끌어 놓아 줘.':'붉은 물과 실제 분출물은 어떻게 다른지, 카드 두 쌍을 완성해 줘.');
  const rows=same?[
    {id:'opening',title:'나오는 곳',source:'model-mouth',left:'꼭대기의 구멍으로 붉은 물이 나와.',right:'화산의 구멍으로 분출물이 나와.'},
    {id:'downhill',title:'흐르는 길',source:'model-flow',left:'붉은 물이 경사면을 따라 아래로 흘러.',right:'용암이 경사면을 따라 아래로 흘러.'}
  ]:[
    {id:'material',title:'흐르는 물질',source:'model-flow',left:'차가운 붉은 물을 사용했어.',right:'땅속에서 나온 뜨거운 용암이 흘러.'},
    {id:'extra',title:'함께 나오는 것',source:'model-mouth',left:'붉은 물만 나왔어.',right:'화산재·화산 기체·암석 조각도 나와.'}
  ];
  api.text('내 모형',400,54,26);api.text('실제 화산',835,54,26);
  const smallModel=paintScene(scene,api,modelScene(d.assembly,d.modelTime??1),{x:226,y:74,scale:.29});
  const smallReal=api.image('volcano-eruption',835,167,348,186);
  // Both evidence pictures have the same size and corner treatment.
  if(scene.make?.graphics){for(const [picture,x]of [[smallModel,226],[smallReal,661]]){const clip=scene.make.graphics({x:0,y:0,add:false});clip.fillStyle(0xffffff).fillRoundedRect(x,74,348,186,20);picture.setMask(clip.createGeometryMask());api.listenCleanup(()=>clip.destroy());}}
  const cells=[],placements=new Map();
  rows.forEach((row,r)=>{
    const y=335+r*135;
    api.text(row.title,147,y,22,'#49684b',112);
    for(const side of ['left','right']){
      const x=side==='left'?400:835;
      api.panel(x,y,340,116,0xe7eedc,.55);
      api.text(side==='left'?'모형 기록 놓기':'화산 설명 놓기',x,y,21,'#69775e');
      cells.push({row,side,x,y,id:row.id+'-'+side});
    }
  });
  // Alternate cards so placement requires matching the observed feature, not a left-to-right tap sequence.
  const order=[cells[3],cells[0],cells[2],cells[1]];
  order.forEach((cell,i)=>{
    const text=cell.row[cell.side];
    const card=api.card(text,165+i*290,584,270,104,20);
    const fitScale=Math.min(1,108/card.height);card.setScale(fitScale);
    function place(){
      if(!d.evidence[cell.row.source]){api.say('모형 활동에서 네 관찰 기록을 먼저 남겨 줘.');return false;}
      if(!w.links.includes(cell.id))w.links.push(cell.id);
      card.setPosition(cell.x,cell.y).setScale(fitScale);
      const both=['left','right'].every(side=>w.links.includes(cell.row.id+'-'+side));
      if(both){
        d.comparisons[cell.row.id]=same?'same':'different';
        api.record({id:'compare-'+cell.row.id,...modelEvidence(d),label:cell.row.title,kind:'comparison',claim:cell.row.id,observations:[cell.row.left,cell.row.right],text:cell.row.left+' '+cell.row.right});
      }
      api.counter(w.links.length,4,same?'같은 점 연결':'다른 점 연결');api.say(cell.row.title+' 기록을 연결했어. 같은 주제의 모형과 실제 화산 기록을 짝지어 줘.');api.save();check();return true;
    }
    placements.set(cell.id,place);
    api.drag(card,{onDrop(obj,x,y){
      if(!near(x,y,cell,125)){api.say(cell.side==='left'?'내 모형에서 직접 본 모습을 알맞은 줄에 놓아 줘.':'실제 화산의 설명을 같은 주제의 줄에 놓아 줘.');return false;}
      return place();
    }});
    if(w.links.includes(cell.id))card.setPosition(cell.x,cell.y).setScale(fitScale);
  });
  function check(){if(!finished&&w.links.length===4){finished=true;api.finish(same?'모형과 실제 화산은 구멍으로 물질이 나오고, 경사면을 따라 흐르는 모습이 닮았어.':'붉은 물은 용암이 아니야. 실제 화산에서는 뜨거운 용암과 여러 분출물이 나와.');}}
  api.counter(w.links.length,4,same?'같은 점 연결':'다른 점 연결');
  const chooseAction={id:'volcano-compare-choice',label:'비교 카드 골라 연결',onClick(){
    choicePanel(api,'연결할 관찰 카드','카드를 읽고 하나를 골라 줘. 다음 화면에서 놓을 자리를 선택해.',order.map(cell=>({id:cell.id,label:cell.row[cell.side],disabled:w.links.includes(cell.id)})),(item,close)=>{
      close();
      choicePanel(api,'어느 관찰 자리에 놓을까?',order.find(cell=>cell.id===item.id).row[order.find(cell=>cell.id===item.id).side],cells.map(cell=>({id:cell.id,label:cell.row.title+' · '+(cell.side==='left'?'내 모형':'실제 화산')})),(target,done)=>{
        if(target.id!==item.id)return '카드의 내용과 관찰 주제를 다시 비교해 봐.';
        if(placements.get(item.id)())done();else return '모형 활동의 관찰 기록을 먼저 남겨 줘.';
      });
    });
  }};
  api.actions([chooseAction]);
  if(w.links.length===4)api.actions([{id:'compare-saved',label:'연결한 기록 확인',onClick:check,primary:true}]);
  // Turning the real volcano shows its crater and slopes, the two features matched on this card.
  else if(same)hasModel('volcano-real').then(ok=>{if(ok&&scene.sys.isActive()&&!finished)api.actions([chooseAction,{id:'volcano-3d',label:'실제 화산 돌려 보기',onClick:()=>openModel3D(api.modal,'volcano-real','실제 화산')}]);});
  return {destroy(){api.save();}};
}
