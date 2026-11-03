const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const near=(x,y,p,r=75)=>Math.hypot(x-p.x,y-p.y)<r;
import {observationTour} from './observation-tour.js';
import {eruptionMotion} from '../volcano-motion.js';
import {hasModel,openModel3D} from '../rock3d.js';
import {MODEL_MOUTH as MOUTH,MODEL_FLOW as FLOW,modelScene,paintScene,drawShapes,modelEvidence} from '../observation-scenes.js';
const OUTPUTS=[
  {id:'lava',label:'용암',x:385,y:395,text:'땅속의 마그마가 땅 위로 나온 것을 용암이라고 해.'},
  {id:'gas',label:'화산 기체',x:610,y:80,text:'수증기 같은 기체도 나와. 보이지 않는 기체는 설명 표시로 나타냈어.'},
  {id:'ash',label:'화산재',x:260,y:115,text:'분출할 때 잘게 부서진 암석과 화산 유리 같은 작은 고체 알갱이야.'},
  {id:'rock',label:'암석 조각',x:670,y:245,text:'큰 고체 암석 조각도 밖으로 나올 수 있어.'}
];

function lens(scene,api,x,y,label='돋보기'){
  if(scene.textures.exists('tool-lens'))return scene.add.container(x,y,[api.image('tool-lens',0,0,112,112),api.text(label,0,83,20)]).setSize(135,165);
  const g=scene.add.graphics().lineStyle(10,0x436b60).strokeCircle(0,0,37);
  g.fillStyle(0xdbf7ff,.3).fillCircle(0,0,32);
  g.lineStyle(13,0xb89055).lineBetween(27,27,61,61);
  return scene.add.container(x,y,[g,api.text(label,0,83,20)]).setSize(125,155);
}

function model(scene,api){
  const root=scene.add.container(0,0),liquid=scene.add.graphics();let art,key='';
  function draw(parts,amount=0){
    const next=parts.join(',');
    if(next!==key||!art){key=next;art?.destroy(true);art=paintScene(scene,api,modelScene(parts,0),{background:false});root.add(art);root.add(liquid);root.bringToTop(liquid);}
    drawShapes(liquid,modelScene([],amount).layers);
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
  const spots={tray:{x:580,y:485},mountain:{x:560,y:315},water:{x:957,y:350}};
  const target=scene.add.graphics();
  const objects={};
  function show(){
    art.draw(parts);target.clear();
    const next=order[parts.length];
    if(next){const p=spots[next];target.lineStyle(4,0xffd567).strokeCircle(p.x,p.y,70);}
    const title=['쟁반을 작업대에 놓아 줘','쟁반 위에 산 모형을 올려 줘','붉은 물 주사기를 관에 연결해 줘'][parts.length];
    api.task(title||'모형을 조립했어','반짝이는 자리에 재료를 끌어 놓아 줘.');
    api.counter(parts.length,3,'모형 조립');
  }
  function place(id){
    if(finished||parts.includes(id))return true;
    if(order[parts.length]!==id){api.say('쟁반 → 산 모형 → 붉은 물 주사기 순서로 놓아 줘.');return false;}
    parts.push(id);if(!completed&&!d.assembly.includes(id))d.assembly.push(id);
    objects[id].setVisible(false);api.spark(spots[id].x,spots[id].y);show();if(!completed)api.save();
    if(parts.length===3){finished=true;if(completed)api.stopAutoplay();else{completed=true;api.finish('실험 준비 완료! 주사기의 붉은 물이 어느 곳으로 나올지 살펴보자.');}}
    return true;
  }
  order.forEach((id,i)=>{
    const obj=objects[id]=part(scene,api,id,135,170+i*175);
    obj.setVisible(!parts.includes(id));
    api.drag(obj,{onDrop(o,x,y){if(!near(x,y,spots[id],115)){api.say('반짝이는 자리에 놓아 줘.');return false;}return place(id);}});
    api.assist({tray:'쟁반 놓기',mountain:'산 모형 올리기',water:'붉은 물 주사기 연결'}[id],()=>place(id));
  });
  api.autoplay({label:'실험 모형 차례로 조립',interval:1500,allowWhenComplete:true,ready:()=>true,advance(){if(finished||parts.length===3){parts=[];finished=false;order.forEach(id=>objects[id].setVisible(true));show();}const id=order[parts.length];if(id)place(id);}});
  show();
  if(parts.length===3)api.actions([{id:'assembly-saved',label:'조립한 모형 확인',onClick(){if(!finished){finished=true;api.finish('모형 준비를 마쳤어. 이제 손잡이를 밀어 보자.');}},primary:true}]);
  return {};
}

function inject(scene,api){
  const d=api.data,w=api.work;w.push=clamp(w.push||0);w.flow=clamp(w.flow||0);
  let finished=!!api.completed,active=false,replay=null;
  const art=model(scene,api),stem=scene.add.graphics();
  api.task('주사기 손잡이를 천천히 아래로 밀어 봐','손잡이를 밀거나 자동재생으로 꼭대기와 경사면을 살펴봐.');
  const handle=scene.add.container(957,185+w.push*145,[
    scene.add.rectangle(0,0,105,46,0x357d6a).setStrokeStyle(3,0x245443),api.text('↓',0,0,35,'#ffffff')
  ]).setSize(115,64);
  const watch=api.text('붉은 물이 어디로 갈까?',560,535,24).setBackgroundColor('#fff8e8').setPadding(10,6);
  const view=()=>replay||w;
  function draw(){
    const v=view();handle.setPosition(957,185+v.push*145);
    art.draw(['tray','mountain','water'],v.flow);
    stem.clear().lineStyle(12,0x3a6b5d).lineBetween(957,handle.y+22,957,300+v.push*110);
    watch.setText(v.flow>.7?'붉은 물이 경사면을 따라 아래로 흘러.':v.flow>.1?'꼭대기 구멍에서 나오는 물을 봐!':'붉은 물이 어디로 갈까?');
    api.counter(Math.round(v.flow*100),100,'붉은 물 관찰');
  }
  function push(value){
    if(finished&&(!replay||replay.flow>=1))replay={push:0,flow:0};
    const v=view();v.push=Math.max(v.push,clamp(value));active=true;
    if(!finished){d.injected=v.push;api.save();}
    draw();
  }
  const stop=()=>{active=false;};
  api.drag(handle,{onMove(obj,x,y){push((y-185)/145);},onDrop(obj,x,y){push((y-185)/145);return true;}});
  api.assist('손잡이 조금 밀기',()=>push(finished&&(!replay||replay.flow>=1)?.2:view().push+.2));
  api.autoplay({label:'붉은 물 분출 관찰',interval:650,allowWhenComplete:true,ready:()=>true,stop,
    advance(){push(finished&&(!replay||replay.flow>=1)?.16:view().push+.16);}
  });
  function finish(){
    if(finished)return;
    finished=true;active=false;w.flow=1;w.push=1;d.injected=1;d.modelTime=1;api.save();draw();
    api.finish('붉은 물이 꼭대기 구멍으로 나와 경사면을 따라 흘렀어.');
  }
  draw();
  if(!finished&&w.push>=.98&&w.flow>=.98)api.actions([{id:'model-run-saved',label:'분출 관찰 확인',onClick:finish,primary:true}]);
  return {update(time,delta){
    if(!active)return;
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
  const d=api.data,w=api.work;w.path??=0;let finished=false;
  model(scene,api).draw(['tray','mountain','water'],1);
  const scope=lens(scene,api,175,260,'나온 곳 찾기');
  const pencil=scene.add.container(180,480,[scene.add.circle(0,0,30,0xf2c453),api.text('✎',0,0,35,'#513f29'),api.text('흐른 길 따라가기',0,57,20)]).setSize(160,130);
  const guide=scene.add.graphics();
  function guideDraw(){
    guide.clear();
    FLOW.forEach((p,i)=>guide.lineStyle(3,i<w.path?0xfff1ab:0xf8dd95,.95).strokeCircle(p.x,p.y,i===w.path?22:12));
    if(w.path>1){guide.lineStyle(6,0xffeaa4);for(let i=1;i<w.path;i++)guide.lineBetween(FLOW[i-1].x,FLOW[i-1].y,FLOW[i].x,FLOW[i].y);}
    api.task(w.mouth?'물이 흐른 길을 위에서 아래로 따라 그려 줘':'물이 나온 구멍을 돋보기로 찾아 봐',w.mouth?'노란 연필을 꼭대기에서 시작해 반짝이는 점들을 차례로 지나가 줘.':'붉은 물이 처음 나온 곳에 돋보기를 놓아 줘.');
    api.counter((w.mouth?1:0)+w.path,6,'모형 조사');
  }
  function mouth(){
    w.mouth=true;scope.setPosition(MOUTH.x,MOUTH.y).setScale(.7);
    api.record({id:'model-mouth',kind:'model',...modelEvidence(d),asset:'volcano-lab',label:'물이 나온 입구',point:{x:MOUTH.x/1200,y:MOUTH.y/640},time:1,claim:'mouth',text:'붉은 물이 꼭대기의 구멍으로 나왔어.'});
    api.say('바로 이 구멍에서 나왔어. 이제 흐른 길을 따라가 보자.',true);guideDraw();api.save();check();return true;
  }
  function advance(x,y){
    if(!w.mouth||w.path>=FLOW.length)return;
    if(near(x,y,FLOW[w.path],47)){w.path++;guideDraw();api.save();if(w.path===FLOW.length){
      api.record({id:'model-flow',kind:'model',...modelEvidence(d),asset:'volcano-lab',label:'경사면을 흐른 붉은 물',point:{x:700/1200,y:398/640},time:1,claim:'flow',text:'붉은 물이 모형의 경사면을 따라 흘렀어.'});check();
    }}
  }
  function check(){if(!finished&&w.mouth&&w.path===FLOW.length){finished=true;d.modelTime=1;api.finish('나온 구멍과 흐른 길을 기록했어. 실제 화산과 비교할 단서가 생겼어.');}}
  api.drag(scope,{onDrop(obj,x,y){if(near(x,y,MOUTH,75))return mouth();api.say('붉은 물이 처음 나온 꼭대기를 살펴봐.');return false;}});
  api.drag(pencil,{onMove(obj,x,y){advance(x,y);},onDrop(obj,x,y){advance(x,y);return true;}});
  api.assist('꼭대기 구멍 관찰',mouth);
  api.assist('흐른 길의 다음 점으로 이동',()=>{if(!w.mouth){api.say('물이 나온 곳부터 관찰해 줘.');return;}const p=FLOW[w.path];if(p){pencil.setPosition(p.x,p.y);advance(p.x,p.y);}});
  if(w.mouth)scope.setPosition(MOUTH.x,MOUTH.y).setScale(.7);
  if(w.path>0)pencil.setPosition(FLOW[w.path-1].x,FLOW[w.path-1].y);
  guideDraw();
  if(w.mouth&&w.path===FLOW.length)api.actions([{id:'trace-saved',label:'조사 기록 확인',onClick:check,primary:true}]);
  return {destroy(){api.save();}};
}

function observeOutputs(scene,api){
  const d=api.data,w=api.work;w.found??=[];let selected=null,finished=false;
  const motion=eruptionMotion(scene,api);
  api.image('volcano-eruption',600,320,1200,640);
  motion.show();
  api.hero(1110,540,145,'hero-lens');
  api.task('화산에서 나오는 네 가지를 조사해 봐','숫자를 누르거나 ‘자동재생’으로 모습을 살펴봐. 수첩에 담을 때는 ‘관찰 핀 남기기’를 직접 눌러.');
  const scope=lens(scene,api,130,495);
  const markers=new Map();
  const panel=api.panel(900,435,460,180,0xfff7e2,.96);
  const title=api.text('어떤 물질이 나올까?',900,390,26);
  const body=api.text('용암뿐 아니라 다른 분출물도 찾아보자.',900,455,22,'#294239',405);
  const world=p=>({x:p.x*1.2,y:p.y*640/560});
  function redraw(){for(const p of OUTPUTS)markers.get(p.id)(w.found.includes(p.id));api.counter(w.found.length,4,'분출물 기록');}
  function inspect(p){selected=p;motion.play();const q=world(p);scope.setPosition(q.x,q.y);title.setText(p.label);body.setText(p.text);api.say(w.found.includes(p.id)?'이미 기록한 분출물이야. 다른 숫자를 눌러 봐.':p.label+'을 찾았어. 아래 ‘관찰 핀 남기기’를 눌러 수첩에 담아 봐.');return true;}
  function pin(){
    if(!selected){api.say('먼저 돋보기로 분출물을 찾아 줘.');return;}
    const p=selected;if(w.found.includes(p.id)){api.say('이미 수첩에 있어. 체크가 없는 숫자를 눌러 봐.');return;}
    w.found.push(p.id);api.say('수첩에 담았어. 아직 체크가 없는 숫자를 찾아봐.');
    api.record({id:'output-'+p.id,kind:'volcano',label:p.label,asset:'volcano-eruption',claim:p.id,point:{x:p.x/1000,y:p.y/560},zoom:1.5,text:p.text});
    api.spark(scope.x,scope.y);redraw();api.save();
    if(w.found.length===4&&!finished){finished=true;api.finish('용암·화산재·화산 기체·암석 조각을 찾았어. 모형에 없는 분출물도 있네!');}
  }
  api.drag(scope,{onDrop(obj,x,y){const p=OUTPUTS.find(p=>near(x,y,world(p),85));if(p)return inspect(p);api.say('반짝이는 지점을 가까이 살펴봐.');return false;}});
  api.actions([{id:'volcano-output-pin',label:'관찰 핀 남기기',onClick:pin,primary:true}]);
  OUTPUTS.forEach((p,index)=>{
    const q=world(p);
    markers.set(p.id,api.marker(q.x,q.y,index+1,()=>inspect(p)));
    api.assist(p.label+' 관찰',()=>inspect(p));
  });
  api.autoplay(observationTour(api,{label:'분출물 네 가지 관찰',items:OUTPUTS,interval:4100,
    visit(p){inspect(p);api.say(p.label+' 모습을 살펴봐. 기록할 때는 ‘관찰 핀 남기기’를 직접 눌러.');},stop:motion.pause
  }));
  redraw();
  if(w.found.length===4){selected=OUTPUTS[3];}
  return {update:motion.update,pause:motion.pause,destroy:motion.destroy};
}

function compare(scene,api){
  const d=api.data,w=api.work;w.links??=[];let finished=false;
  const same=api.phase===1;
  api.image('volcano-field',600,320,1200,640);
  api.panel(600,320,1060,560,0xfff8e6,.83);
  api.hero(1138,535,110,'hero-cheer');
  api.task(same?'모형과 실제 화산의 같은 모습을 연결해 봐':'모형으로 모두 나타낼 수 없는 점을 찾아 봐',same?'네 모형 기록과 화산 설명을 알맞은 관찰 자리에 끌어 놓아 줘.':'붉은 물과 실제 분출물은 어떻게 다른지, 카드 두 쌍을 완성해 줘.');
  const rows=same?[
    {id:'opening',title:'나오는 곳',source:'model-mouth',left:'모형: 꼭대기의 구멍으로 붉은 물이 나와.',right:'실제: 화산의 구멍으로 분출물이 나와.'},
    {id:'downhill',title:'흐르는 길',source:'model-flow',left:'모형: 붉은 물이 경사면을 따라 아래로 흘러.',right:'실제: 용암이 경사면을 따라 아래로 흘러.'}
  ]:[
    {id:'material',title:'흐르는 물질',source:'model-flow',left:'모형: 차가운 붉은 물을 사용했어.',right:'실제: 땅속에서 나온 뜨거운 용암이 흘러.'},
    {id:'extra',title:'함께 나오는 것',source:'model-mouth',left:'모형: 붉은 물만 나왔어.',right:'실제: 화산재·화산 기체·암석 조각도 나와.'}
  ];
  api.text('내 모형',380,67,26);api.text('실제 화산',830,67,26);
  const smallModel=paintScene(scene,api,modelScene(d.assembly,d.modelTime??1),{x:278,y:80,scale:.17});
  const smallReal=api.image('volcano-eruption',830,135,270,110);
  const cells=[];
  rows.forEach((row,r)=>{
    const y=255+r*145;
    api.text(row.title,135,y,22,'#49684b',130);
    for(const side of ['left','right']){
      const x=side==='left'?400:835;
      api.panel(x,y,370,110,0xe7eedc,.9).setStrokeStyle(2,0xb8c6a9);
      api.text(side==='left'?'모형 기록 놓기':'화산 설명 놓기',x,y,21,'#69775e');
      cells.push({row,side,x,y,id:row.id+'-'+side});
    }
  });
  // Alternate cards so placement requires matching the observed feature, not a left-to-right tap sequence.
  const order=[cells[3],cells[0],cells[2],cells[1]],items=[];
  order.forEach((cell,i)=>{
    const text=cell.row[cell.side];
    const card=api.card(text,235+i*247,545,236,104,20,{color:cell.side==='left'?'#2d5a49':'#6b4423'});
    function place(){
      if(!d.evidence[cell.row.source]){api.say('모형 활동에서 네 관찰 기록을 먼저 남겨 줘.');return false;}
      if(!w.links.includes(cell.id))w.links.push(cell.id);
      card.setPosition(cell.x,cell.y).setScale(1.12);
      const both=['left','right'].every(side=>w.links.includes(cell.row.id+'-'+side));
      if(both){
        d.comparisons[cell.row.id]=same?'same':'different';
        api.record({id:'compare-'+cell.row.id,...modelEvidence(d),label:cell.row.title,kind:'comparison',claim:cell.row.id,observations:[cell.row.left,cell.row.right],text:cell.row.left+' '+cell.row.right});
      }
      api.counter(w.links.length,4,same?'같은 점 연결':'다른 점 연결');api.say(cell.row.title+' 기록을 연결했어. 같은 주제의 모형과 실제 화산 기록을 짝지어 줘.');api.save();check();return true;
    }
    api.drag(card,{onDrop(obj,x,y){
      if(!near(x,y,cell,125)){api.say(cell.side==='left'?'내 모형에서 직접 본 모습을 알맞은 줄에 놓아 줘.':'실제 화산의 설명을 같은 주제의 줄에 놓아 줘.');return false;}
      return place();
    }});
    items.push({label:text,object:card});
    if(w.links.includes(cell.id))card.setPosition(cell.x,cell.y).setScale(1.12);
  });
  api.assistPlacement(items,cells.map(c=>({label:(c.side==='left'?'내 모형':'실제 화산')+' · '+c.row.title,x:c.x,y:c.y})));
  function check(){if(!finished&&w.links.length===4){finished=true;api.finish(same?'모형과 실제 화산은 구멍으로 물질이 나오고, 경사면을 따라 흐르는 모습이 닮았어.':'붉은 물은 용암이 아니야. 실제 화산에서는 뜨거운 용암과 여러 분출물이 나와.');}}
  api.counter(w.links.length,4,same?'같은 점 연결':'다른 점 연결');
  if(w.links.length===4)api.actions([{id:'compare-saved',label:'연결한 기록 확인',onClick:check,primary:true}]);
  // Turning the real volcano shows its crater and slopes, the two features matched on this card.
  else if(same)hasModel('volcano-real').then(ok=>{if(ok&&scene.sys.isActive()&&!finished)api.actions([{id:'volcano-3d',label:'실제 화산 돌려 보기',onClick:()=>openModel3D(api.modal,'volcano-real','실제 화산')}]);});
  return {destroy(){api.save();}};
}
