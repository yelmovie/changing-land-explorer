const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const near=(x,y,p,r=75)=>Math.hypot(x-p.x,y-p.y)<r;
const MOUTH={x:560,y:195};
const FLOW=[MOUTH,{x:595,y:255},{x:642,y:325},{x:700,y:398},{x:755,y:465}];
const OUTPUTS=[
  {id:'lava',label:'용암',x:385,y:395,text:'땅속에서 나온 뜨거운 물질이 땅 위로 흘러.'},
  {id:'gas',label:'화산 기체',x:610,y:80,text:'수증기 같은 기체도 나와. 보이지 않는 기체는 설명 표시로 나타냈어.'},
  {id:'ash',label:'화산재',x:260,y:115,text:'아주 작은 고체 알갱이야. 연기와는 달라.'},
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
  const g=scene.add.graphics();
  function draw(parts,amount=0){
    g.clear();
    if(parts.includes('tray')){
      g.fillStyle(0x789e99).fillRoundedRect(320,460,525,40,16);
      g.lineStyle(5,0x4d7268).strokeRoundedRect(320,460,525,40,16);
    }
    if(parts.includes('mountain')){
      g.fillStyle(0xb89a6c).beginPath().moveTo(350,460).lineTo(525,183).lineTo(593,183).lineTo(815,460).closePath().fillPath();
      g.fillStyle(0x87704e).fillEllipse(MOUTH.x,MOUTH.y,70,25);
      g.lineStyle(3,0xc8ad81).lineBetween(508,240,405,435).lineBetween(612,252,759,431);
    }
    if(parts.includes('water')){
      g.lineStyle(14,0xbcae98).beginPath().moveTo(955,425).lineTo(850,425).lineTo(560,433).lineTo(560,215).strokePath();
      g.fillStyle(0xf6f5e7).fillRoundedRect(925,280,65,170,12);
      g.lineStyle(4,0x7c9b92).strokeRoundedRect(925,280,65,170,12);
      g.fillStyle(0xd75f59).fillRect(933,300+amount*110,49,135-amount*110);
      for(let i=0;i<5;i++)g.lineStyle(2,0x7d9488).lineBetween(925,305+i*23,942,305+i*23);
    }
    if(amount>0){
      g.lineStyle(19,0xd85e50,1);
      const count=amount*(FLOW.length-1);
      for(let i=0;i<Math.ceil(count);i++){
        const a=FLOW[i],b=FLOW[i+1],f=Math.min(1,count-i);
        g.lineBetween(a.x,a.y,a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);
      }
      g.fillStyle(0xe37161).fillEllipse(MOUTH.x,MOUTH.y,56,17);
      if(amount>.8)g.fillStyle(0xd85e50).fillEllipse(754,464,(amount-.8)*320,18);
    }
  }
  draw([]);return {draw};
}

function part(scene,api,id,x,y){
  const g=scene.add.graphics();
  if(id==='tray')g.fillStyle(0x789e99).fillRoundedRect(-65,-10,130,30,12);
  if(id==='mountain'){
    g.fillStyle(0xb89a6c).fillTriangle(-60,25,0,-47,60,25);
    g.fillStyle(0x806b4d).fillEllipse(0,-37,24,10);
  }
  if(id==='water'){
    g.fillStyle(0xf9f6e7).fillRoundedRect(-22,-40,44,75,9);
    g.lineStyle(4,0x75988d).strokeRoundedRect(-22,-40,44,75,9);
    g.fillStyle(0xd96659).fillRect(-16,-5,32,33);
    g.lineStyle(6,0x75988d).lineBetween(0,-40,0,-63);
    g.lineStyle(9,0x75988d).lineBetween(-23,-63,23,-63);
  }
  return scene.add.container(x,y,[g,api.text({tray:'쟁반',mountain:'산 모형',water:'붉은 물 주사기'}[id],0,66,22)]).setSize(165,150);
}

export function setup(scene,api){
  const d=api.data;d.evidence??={};d.assembly??=[];d.comparisons??={};
  if(api.step===1)return api.phase===0?observeOutputs(scene,api):compare(scene,api);
  api.image('volcano-lab',600,320,1200,640).setAlpha(.38);
  api.hero(1120,525,140,'river-pose-1');
  api.text('가상 모형 · 붉은 물은 용암이 아니야',600,54,23);
  if(api.phase===0)return assemble(scene,api);
  if(api.phase===1)return inject(scene,api);
  return trace(scene,api);
}

function assemble(scene,api){
  const d=api.data,w=api.work;w.parts??=[];let finished=false;
  const art=model(scene,api);
  const order=['tray','mountain','water'];
  const spots={tray:{x:580,y:485},mountain:{x:560,y:315},water:{x:957,y:350}};
  const target=scene.add.graphics();
  const objects={};
  function show(){
    art.draw(w.parts);target.clear();
    const next=order[w.parts.length];
    if(next){const p=spots[next];target.lineStyle(4,0xffd567).strokeCircle(p.x,p.y,70);}
    const title=['쟁반을 작업대에 놓아 줘','쟁반 위에 산 모형을 올려 줘','붉은 물 주사기를 관에 연결해 줘'][w.parts.length];
    api.task(title||'모형을 조립했어','반짝이는 자리에 재료를 끌어 놓아 줘.');
    api.counter(w.parts.length,3,'모형 조립');
  }
  function place(id){
    if(finished||w.parts.includes(id))return true;
    if(order[w.parts.length]!==id){api.say('쟁반 → 산 모형 → 붉은 물 주사기 순서로 놓아 줘.');return false;}
    w.parts.push(id);if(!d.assembly.includes(id))d.assembly.push(id);
    objects[id].setVisible(false);api.spark(spots[id].x,spots[id].y);show();api.save();
    if(w.parts.length===3){finished=true;api.finish('실험 준비 완료! 주사기의 붉은 물이 어느 곳으로 나올지 살펴보자.');}
    return true;
  }
  order.forEach((id,i)=>{
    const obj=objects[id]=part(scene,api,id,135,170+i*175);
    obj.setVisible(!w.parts.includes(id));
    api.drag(obj,{onDrop(o,x,y){if(!near(x,y,spots[id],115)){api.say('반짝이는 자리에 놓아 줘.');return false;}return place(id);}});
    api.assist({tray:'쟁반 놓기',mountain:'산 모형 올리기',water:'붉은 물 주사기 연결'}[id],()=>place(id));
  });
  show();
  if(w.parts.length===3)api.actions([{id:'assembly-saved',label:'조립한 모형 확인',onClick(){if(!finished){finished=true;api.finish('모형 준비를 마쳤어. 이제 손잡이를 밀어 보자.');}},primary:true}]);
  return {destroy(){api.save();}};
}

function inject(scene,api){
  const d=api.data,w=api.work;w.push=clamp(w.push||0);w.flow=clamp(w.flow||0);let finished=false;
  const art=model(scene,api);
  api.task('주사기 손잡이를 천천히 아래로 밀어 봐','손잡이를 조금씩 밀면서 꼭대기와 경사면을 살펴봐.');
  const stem=scene.add.graphics();
  const handle=scene.add.container(957,185+w.push*145,[
    scene.add.rectangle(0,0,105,46,0x357d6a).setStrokeStyle(3,0x245443),
    api.text('↓',0,0,35,'#ffffff')
  ]).setSize(115,64);
  const watch=api.text('붉은 물이 어디로 갈까?',560,535,24);
  function push(v){
    if(finished)return;
    w.push=Math.max(w.push,clamp(v));handle.setPosition(957,185+w.push*145);d.injected=w.push;
    if(w.push>.25)watch.setText('꼭대기 구멍에서 나오는 물을 봐!');
    if(w.push>.7)watch.setText('붉은 물이 경사면을 따라 아래로 흘러.');
    api.save();
  }
  api.drag(handle,{onMove(obj,x,y){push((y-185)/145);},onDrop(obj,x,y){push((y-185)/145);return true;}});
  api.assist('손잡이 조금 밀기',()=>push(w.push+.2));
  function draw(){
    art.draw(['tray','mountain','water'],w.flow);
    stem.clear().lineStyle(12,0x3a6b5d).lineBetween(957,handle.y+22,957,300+w.push*110);
    api.counter(Math.round(w.push*100),100,'손잡이 밀기');
  }
  function finish(){
    if(!finished&&w.push>=.98&&w.flow>=.98){finished=true;d.injected=1;d.modelTime=1;api.save();api.finish('붉은 물이 꼭대기 구멍으로 나와 경사면을 따라 흘렀어.');}
  }
  draw();
  if(w.push>=.98&&w.flow>=.98)api.actions([{id:'model-run-saved',label:'분출 관찰 확인',onClick:finish,primary:true}]);
  return {update(time,delta){if(finished)return;w.flow=Math.min(w.push,w.flow+Math.min(delta,60)/2600);d.modelTime=w.flow;draw();finish();},destroy(){api.save();}};
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
    api.record({id:'model-mouth',kind:'model',asset:'volcano-lab',label:'물이 나온 입구',point:{x:.47,y:.25},time:1,claim:'mouth',text:'붉은 물이 꼭대기의 구멍으로 나왔어.'});
    api.say('바로 이 구멍에서 나왔어. 이제 흐른 길을 따라가 보자.',true);guideDraw();api.save();check();return true;
  }
  function advance(x,y){
    if(!w.mouth||w.path>=FLOW.length)return;
    if(near(x,y,FLOW[w.path],47)){w.path++;guideDraw();api.save();if(w.path===FLOW.length){
      api.record({id:'model-flow',kind:'model',asset:'volcano-lab',label:'경사면을 흐른 붉은 물',point:{x:.55,y:.48},time:1,claim:'flow',text:'붉은 물이 모형의 경사면을 따라 흘렀어.'});check();
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
  api.image('volcano-eruption',600,320,1200,640);
  api.hero(1110,540,145,'hero-lens');
  api.task('화산에서 나오는 네 가지를 조사해 봐','돋보기를 반짝이는 곳에 옮겨 설명을 보고, 관찰 핀을 남겨 줘.');
  const scope=lens(scene,api,130,495);
  const rings=scene.add.graphics();
  const panel=api.panel(900,435,460,180,0xfff7e2,.96);
  const title=api.text('어떤 물질이 나올까?',900,390,26);
  const body=api.text('용암뿐 아니라 다른 분출물도 찾아보자.',900,455,22,'#294239',405);
  const world=p=>({x:p.x*1.2,y:p.y*640/560});
  function redraw(){rings.clear();OUTPUTS.forEach(p=>{const q=world(p);rings.lineStyle(4,w.found.includes(p.id)?0x8ddeaa:0xffd975).strokeCircle(q.x,q.y,30);});api.counter(w.found.length,4,'분출물 기록');}
  function inspect(p){selected=p;const q=world(p);scope.setPosition(q.x,q.y);title.setText(p.label);body.setText(p.text);api.say(p.text);return true;}
  function pin(){
    if(!selected){api.say('먼저 돋보기로 분출물을 찾아 줘.');return;}
    const p=selected;if(!w.found.includes(p.id))w.found.push(p.id);
    api.record({id:'output-'+p.id,kind:'volcano',label:p.label,asset:'volcano-eruption',claim:p.id,point:{x:p.x/1000,y:p.y/560},zoom:1.5,text:p.text});
    api.spark(scope.x,scope.y);redraw();api.save();
    if(w.found.length===4&&!finished){finished=true;api.finish('용암·화산재·화산 기체·암석 조각을 찾았어. 모형에 없는 분출물도 있네!');}
  }
  api.drag(scope,{onDrop(obj,x,y){const p=OUTPUTS.find(p=>near(x,y,world(p),85));if(p)return inspect(p);api.say('반짝이는 지점을 가까이 살펴봐.');return false;}});
  api.actions([{id:'volcano-output-pin',label:'관찰 핀 남기기',onClick:pin,primary:true}]);
  OUTPUTS.forEach(p=>api.assist(p.label+' 관찰',()=>inspect(p)));
  redraw();
  if(w.found.length===4){selected=OUTPUTS[3];}
  return {destroy(){api.save();}};
}

function compare(scene,api){
  const d=api.data,w=api.work;w.links??=[];let finished=false;
  const same=api.phase===1;
  api.image('volcano-field',600,320,1200,640).setAlpha(.35);
  api.panel(600,320,1060,560,0xfff8e6,.94);
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
  const smallModel=api.image('volcano-lab',380,135,270,110);
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
  const order=[cells[3],cells[0],cells[2],cells[1]];
  order.forEach((cell,i)=>{
    const text=cell.row[cell.side];
    const backing=scene.add.rectangle(0,0,232,95,cell.side==='left'?0xe2f1e7:0xffedcc).setStrokeStyle(2,0x8fa38c);
    const label=api.text(text,0,0,20,'#294239',210);
    const card=scene.add.container(235+i*247,545,[backing,label]).setSize(235,100);
    function place(){
      if(!d.evidence[cell.row.source]){api.say('모형 활동에서 네 관찰 기록을 먼저 남겨 줘.');return false;}
      if(!w.links.includes(cell.id))w.links.push(cell.id);
      card.setPosition(cell.x,cell.y).setScale(1.12);
      const both=['left','right'].every(side=>w.links.includes(cell.row.id+'-'+side));
      if(both){
        d.comparisons[cell.row.id]=same?'same':'different';
        api.record({id:'compare-'+cell.row.id,label:cell.row.title,kind:'comparison',claim:cell.row.id,text:same?'모형과 실제 화산에서 닮은 모습을 관찰했어.':'모형과 실제 화산의 다른 점을 관찰했어.'});
      }
      api.counter(w.links.length,4,same?'같은 점 연결':'다른 점 연결');api.save();check();return true;
    }
    api.drag(card,{onDrop(obj,x,y){
      if(!near(x,y,cell,125)){api.say(cell.side==='left'?'내 모형에서 직접 본 모습을 알맞은 줄에 놓아 줘.':'실제 화산의 설명을 같은 주제의 줄에 놓아 줘.');return false;}
      return place();
    }});
    api.assist(text+' 연결',place);
    if(w.links.includes(cell.id))card.setPosition(cell.x,cell.y).setScale(1.12);
  });
  function check(){if(!finished&&w.links.length===4){finished=true;api.finish(same?'모형과 실제 화산은 구멍으로 물질이 나오고, 경사면을 따라 흐르는 모습이 닮았어.':'붉은 물은 용암이 아니야. 실제 화산에서는 뜨거운 용암과 여러 분출물이 나와.');}}
  api.counter(w.links.length,4,same?'같은 점 연결':'다른 점 연결');
  if(w.links.length===4)api.actions([{id:'compare-saved',label:'연결한 기록 확인',onClick:check,primary:true}]);
  return {destroy(){api.save();}};
}
