import {FIELD_POINTS, RIVER_MARKS} from '../learning-model.js';

const AREA = {x:150,y:120,w:900,h:400};
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const point = p => ({x:AREA.x+p.x*AREA.w,y:AREA.y+p.y*AREA.h});

function tool(scene,api,type,x,y,label) {
  const key={lens:'tool-lens',can:'tool-water',flag:'tool-flag'}[type];
  if(scene.textures.exists(key)) {
    const picture=api.image(key,0,0,type==='can'?148:112,type==='can'?115:112);
    const caption=api.text(label,0,80,20).setBackgroundColor('#fff8e8').setPadding(8,5);
    return scene.add.container(x,y,[picture,caption]).setSize(150,170);
  }
  const g=scene.add.graphics();
  if(type==='lens') {
    g.lineStyle(11,0x426758).strokeCircle(0,0,43);
    g.fillStyle(0xd8f9fb,.35).fillCircle(0,0,37);
    g.lineStyle(17,0xa37e47).lineBetween(30,30,66,66);
  } else if(type==='can') {
    g.fillStyle(0x3d9c91).fillRoundedRect(-40,-25,75,58,13);
    g.lineStyle(9,0x3d9c91).strokeCircle(-42,-3,22);
    g.lineStyle(15,0x3d9c91).lineBetween(25,0,68,-31);
    g.fillStyle(0xd6eff0).fillEllipse(70,-33,22,12);
  } else {
    g.lineStyle(6,0x755136).lineBetween(0,-39,0,30);
    g.fillStyle(0xffce5a).fillTriangle(0,-39,47,-24,0,-9);
  }
  const caption=api.text(label,0,type==='lens'?88:57,20,'#233e34');
  const obj=scene.add.container(x,y,[g,caption]);
  obj.setSize(125,type==='lens'?165:125);
  return obj;
}

function terrain(scene,api,x=150,y=120,w=900,h=400) {
  const illustrated=scene.textures.exists('art/river-sand-model');
  if(illustrated)api.image('art/river-sand-model',x+w/2,y+h/2,w,h);
  const g=scene.add.graphics();
  function draw(t,water=1) {
    g.clear();
    const px=v=>x+v*w, py=v=>y+v*h;
    if(!illustrated){g.fillStyle(0xc0a16a).beginPath().moveTo(px(.04),py(.22));
    g.lineTo(px(.19),py(.25)).lineTo(px(.31),py(.40+t*.018*water));
    g.lineTo(px(.53),py(.57)).lineTo(px(.73),py(.72));
    g.lineTo(px(.94),py(.76)).lineTo(px(.94),py(.91)).lineTo(px(.04),py(.91)).closePath().fillPath();
    g.lineStyle(9,0x8b744f).lineBetween(px(.04),py(.91),px(.94),py(.91));}
    if(t>0) {
      g.lineStyle(7+water*4,0x72c8e5,.8);
      const route=[[.19,.25],[.27,.38],[.53,.55],[.82,.72]];
      const count=clamp(t*1.5)*3;
      for(let i=0;i<Math.ceil(count);i++) {
        const a=route[i],b=route[i+1],f=Math.min(1,count-i);
        g.lineBetween(px(a[0]),py(a[1]),px(a[0]+(b[0]-a[0])*f),py(a[1]+(b[1]-a[1])*f));
      }
      g.fillStyle(0x725130,.8).fillEllipse(px(.27),py(.38),t*water*30,t*water*12);
      const settled=clamp((t-.62)/.38);
      g.fillStyle(0xe1bd76).fillEllipse(px(.82),py(.72),settled*water*48,settled*water*19);
      // Individual sediment grains move with the water and remain at its lower end.
      for(let i=0;i<26*water;i++) {
        const f=clamp(t*1.4-i*.024), xx=.27+f*.55, yy=.38+f*.34;
        if(f>0) g.fillStyle(i%2?0x8a6036:0xb5874e).fillCircle(px(xx)+(i%3-1)*5,py(yy)+(i%4-2)*3,2.8);
      }
    }
  }
  draw(0); return {draw};
}

export function setup(scene,api) {
  const d=api.data;
  d.evidence??={}; d.runs??=[];
  return api.step===0 ? experiment(scene,api) : field(scene,api);
}

function experiment(scene,api) {
  const d=api.data,w=api.work;
  api.image('river-lab',600,320,1200,640);
  api.hero(1120,510,140,'river-pose-1');
  if(api.phase===2) return markResults(scene,api);
  const water=api.phase===0?1:2;
  const land=terrain(scene,api);
  let dragging=false,finished=false;
  w.pour=clamp(w.pour||0); w.sweeps??=[];
  api.task(water===1?'흙이 어디에 쌓일까? 예상하고 물을 흘려 봐':'같은 언덕에 물을 더 많이 흘려 봐',
    water===1?'깃발을 흙 위에 놓고, 물뿌리개를 언덕 위에서 천천히 옮겨 줘.':'이번에는 물이 두 배야. 언덕 위 세 곳에 고르게 물을 흘려 줘.');
  api.text(water===1?'물 적게 · 첫 실험':'물 많이 · 두 번째 실험',600,62,28).setBackgroundColor('#fff8e8').setPadding(10,5);
  const zone=scene.add.graphics().lineStyle(3,0x57958c,.8);
  zone.strokeRoundedRect(250,145,300,94,25);
  api.text('이곳에서 물뿌리개를 옮겨 줘',400,123,20).setBackgroundColor('#fff8e8').setPadding(8,4);
  const can=tool(scene,api,'can',140,515,'물뿌리개');
  let flag;
  if(water===1) {
    const p=d.prediction?point(d.prediction):{x:340,y:515};
    flag=tool(scene,api,'flag',p.x,p.y,d.prediction?'내 예상':'예상 깃발');
    api.drag(flag,{onDrop(obj,x,y){
      if(w.pour>0) {api.say('물은 이미 흐르기 시작했어. 처음 예상을 남겨 둘게.'); return false;}
      if(x<190||x>1030||y<200||y>485) {api.say('흙이 쌓일 것 같은 곳에 깃발을 놓아 줘.');return false;}
      d.prediction={x:clamp((x-AREA.x)/AREA.w),y:clamp((y-AREA.y)/AREA.h)};
      api.save(); api.say('예상을 남겼어. 이제 물을 흘려 보자!',true);return true;
    }});
    api.assist('아래쪽에 예상 깃발 놓기',()=>{
      if(w.pour>0)return;
      d.prediction={x:.82,y:.72};const p=point(d.prediction);flag.setPosition(p.x,p.y);api.save();
    });
  } else {
    const first=terrain(scene,api,665,52,325,150);first.draw(1,1);
    api.text('첫 실험의 기록',835,41,18);
    if(d.prediction){const p=point(d.prediction);tool(scene,api,'flag',p.x,p.y,'내 예상').setScale(.65);}
  }
  function inZone(x,y) {return x>=250&&x<=550&&y>=140&&y<=250;}
  api.drag(can,{
    onStart(){dragging=true;},
    onMove(obj,x,y){
      if(!d.prediction||!inZone(x,y))return;
      const band=Math.min(2,Math.floor((x-250)/100));
      if(!w.sweeps.includes(band)){w.sweeps.push(band);api.save();}
    },
    onDrop(obj,x,y){dragging=false;api.save();check();return inZone(x,y);}
  });
  api.assist('왼쪽 물주기',()=>assistPour(0));
  api.assist('가운데 물주기',()=>assistPour(1));
  api.assist('오른쪽 물주기',()=>assistPour(2));
  function assistPour(band){
    if(!d.prediction){api.say('예상 깃발을 먼저 놓아 줘.');return;}
    api.sound?.('water');can.setPosition(300+band*100,195);
    if(!w.sweeps.includes(band))w.sweeps.push(band);
    w.pour=clamp(w.pour+1/3);draw();check();api.save();
  }
  const drops=scene.add.graphics();
  function draw(){land.draw(w.pour,water);api.counter(Math.round(w.pour*100),100,'물 흘리기');}
  function check(){
    if(finished||w.pour<.999||w.sweeps.length<3)return;
    finished=true;d.water=water;d.scrub=1;
    d.runs=d.runs.filter(r=>r.water!==water);
    d.runs.push({water,complete:true,version:1});api.save();
    api.finish(water===1?'첫 실험을 기록했어. 같은 언덕에서 물의 양을 바꿔 보자.':'물을 많이 흘리니 흙이 더 많이 깎이고 옮겨졌어.',{water});
  }
  draw();
  if(w.pour>=.999&&w.sweeps.length===3)api.actions([{id:'river-saved',label:'실험 기록 확인',onClick:check,primary:true}]);
  return {update(time,delta){
    drops.clear();
    if(finished||!dragging||!inZone(can.x,can.y))return;
    if(!d.prediction){api.say('깃발로 먼저 예상해 줘.');dragging=false;return;}
    w.pour=clamp(w.pour+Math.min(delta,60)/6500);
    for(let i=0;i<9*water;i++){
      const fall=((time*.15+i*17)%80);
      drops.fillStyle(0x6bbfe2,.85).fillCircle(can.x+65+i%3*7,can.y-25+fall,3);
    }
    draw();check();
  },destroy(){api.save();}};
}

function markResults(scene,api) {
  const d=api.data,w=api.work;w.marks??=[];let finished=false;
  const left=terrain(scene,api,70,100,470,330),right=terrain(scene,api,625,100,470,330);
  api.text('물 적게',300,66,26);api.text('물 많이',865,66,26);
  api.task('두 실험을 되감아 보고, 흙의 변화 이름표를 놓아 줘','시간을 마지막으로 옮겨 오른쪽 그림에서 깎인 곳 → 이동한 길 → 쌓인 곳을 찾아 봐.');
  let time=clamp(w.scrub??1);
  function render(){left.draw(time,1);right.draw(time,2);}
  function setTime(value){time=Number(value)/100;w.scrub=time;d.scrub=time;if(time<.15)w.rewound=true;render();api.save();}
  api.range('실험 시간',Math.round(time*100),0,100,setTime);
  api.assist('두 실험 처음으로 되감기',()=>setTime(0));
  api.assist('두 실험 마지막 모습 보기',()=>setTime(100));
  const short={erosion:'깎여요',transport:'옮겨져요',deposit:'쌓여요'};
  const colors={erosion:0xd17c45,transport:0x3e9ea8,deposit:0xb39544};
  for(const [i,[id,mark]] of Object.entries(RIVER_MARKS).entries()) {
    const pos={x:625+mark.x*470,y:100+mark.y*330};
    const g=scene.add.graphics().fillStyle(colors[id]).fillCircle(0,0,33);
    const symbol=api.text(['↘','→','▰'][i],0,-1,31,'#ffffff');
    const label=api.text(short[id],0,53,22);
    const badge=scene.add.container(270+i*280,525,[g,symbol,label]).setSize(130,135);
    function place(){
      if(!w.rewound){api.say('시간 손잡이를 처음으로 되감아 본 뒤, 마지막 모습과 비교해 줘.');return false;}
      if(time<.99){api.say('시간을 마지막으로 옮겨, 남은 흔적을 확인해 줘.');return false;}
      if(!w.marks.includes(id))w.marks.push(id);
      badge.setPosition(pos.x,pos.y).setScale(.72);
      api.record({id:'river-'+id,kind:'river',label:mark.label,claim:id,point:{x:mark.x,y:mark.y},time:1,water:2,text:'두 물의 양을 비교하며 찾은 '+mark.label+' 흔적이야.'});
      api.spark(pos.x,pos.y);api.counter(w.marks.length,3,'변화 기록');api.save();check();return true;
    }
    api.drag(badge,{onDrop(obj,x,y){if(distance({x,y},pos)>85){api.say('물과 흙이 움직인 길을 따라 다시 살펴봐.');return false;}return place();}});
    api.assist(mark.label+' 흔적에 놓기',place);
    if(w.marks.includes(id))badge.setPosition(pos.x,pos.y).setScale(.72);
  }
  if(d.prediction){
    const p=d.prediction;
    tool(scene,api,'flag',625+p.x*470,100+p.y*330,'내 예상').setScale(.6);
  }
  function check(){
    if(finished||w.marks.length!==3)return;
    api.task('처음 예상과 실제 쌓인 곳을 비교해 봐','깃발과 모래가 쌓인 곳을 보고, 네 관찰을 골라 줘.');
    api.actions(['same','different'].map((answer,i)=>({id:'river-reflect-'+answer,label:i?'내 예상과 달랐어':'내 예상과 같았어',onClick(){
      if(finished)return;finished=true;d.reflection=answer;api.save();
      api.finish('흙은 깎이고, 물과 함께 옮겨져, 아래쪽에 쌓였어. 예상이 달라도 좋은 발견이야.');
    }})));
  }
  render();api.counter(w.marks.length,3,'변화 기록');check();
  return {destroy(){api.save();}};
}

function field(scene,api) {
  const d=api.data,w=api.work;
  api.image('river-field',600,320,1200,640);
  api.hero(1100,535,145,'hero-lens');
  if(api.phase===2)return connectField(scene,api);
  const points=FIELD_POINTS.filter(p=>p.side===(api.phase===0?'upper':'lower'));
  w.found??=[];let finished=false;
  api.task(api.phase===0?'돋보기로 상류의 두 단서를 찾아 봐':'아래쪽으로 와서 하류의 두 단서를 찾아 봐','반짝이는 곳으로 돋보기를 옮긴 뒤 놓으면 가까이 관찰할 수 있어.');
  const lens=tool(scene,api,'lens',600,500,'돋보기');
  const glow=scene.add.graphics();
  for(const p of points){const x=p.x*1.2,y=p.y*640/560;glow.lineStyle(3,0xffe6a0).strokeCircle(x,y,35);}
  api.panel(885,163,440,270,0xfff8e8,.96);
  const mask=scene.make.graphics({x:0,y:0,add:false});
  mask.fillStyle(0xffffff).fillRoundedRect(690,45,390,145,14);
  const zoom=api.image('river-field',885,116,1800,960).setMask(mask.createGeometryMask());
  const name=api.text('가까이 들여다보자',885,220,26);
  const caption=api.text('물길과 알갱이 모양이 단서야.',885,264,21,'#294239',390);
  function focus(x,y){zoom.setPosition(885+(600-x)*1.5,116+(320-y)*1.5);}
  function observe(p){
    lens.setPosition(p.x*1.2,p.y*640/560);
    focus(lens.x,lens.y);
    name.setText(p.label);caption.setText(p.text);
    if(!w.found.includes(p.id))w.found.push(p.id);
    api.record({id:p.id,kind:'field',label:p.label,asset:'river-field',point:{x:p.x/1000,y:p.y/560},zoom:2.5,claim:p.claim,text:p.text});
    api.counter(w.found.length,2,'관찰 단서');api.spark(lens.x,lens.y);api.save();
    if(w.found.length===2&&!finished){finished=true;api.finish(api.phase===0?'상류는 물길이 좁고 경사가 급해. 크고 각진 바위도 찾았어.':'하류는 물길이 넓고 완만해. 모래와 고운 흙도 찾았어.');}
    return true;
  }
  api.drag(lens,{onMove(obj,x,y){focus(x,y);},onDrop(obj,x,y){const p=points.find(p=>distance({x,y},{x:p.x*1.2,y:p.y*640/560})<80);if(p)return observe(p);api.say('반짝이는 물길이나 바위로 돋보기를 옮겨 줘.');return false;}});
  points.forEach(p=>api.assist(p.label+' 가까이 보기',()=>observe(p)));
  api.counter(w.found.length,2,'관찰 단서');
  if(w.found.length===2)api.actions([{id:'field-saved',label:'관찰 기록 확인',onClick:()=>observe(points[1]),primary:true}]);
  return {destroy(){mask.destroy();api.save();}};
}

function connectField(scene,api){
  const d=api.data,w=api.work;w.connected??=[];let finished=false;
  api.task('네가 모은 단서로 강 지도를 완성해 봐','관찰 카드를 상류와 하류에 놓고, 마지막으로 모래가 쌓이는 곳을 연결해 줘.');
  api.panel(600,325,1060,540,0xf8f0d8,.9);
  api.hero(1120,510,120,'hero-lens');
  const g=scene.add.graphics();
  g.lineStyle(45,0x72c5da).beginPath().moveTo(250,190).lineTo(420,255).lineTo(660,300).lineTo(950,365).strokePath();
  g.fillStyle(0xe3c588).fillEllipse(943,375,130,66);
  api.text('상류',300,135,30);api.text('하류',910,260,30);
  const zones={upper:{x:330,y:235},lower:{x:870,y:370}};
  for(const [i,p] of FIELD_POINTS.entries()) {
    const record=d.evidence[p.id];
    const color=record?0xffffff:0xe3ddce;
    const rect=scene.add.rectangle(0,0,205,100,color).setStrokeStyle(2,0xb4ad90);
    const label=api.text(record?.text||p.text,0,0,21,'#294239',180);
    const card=scene.add.container(260+i*235,515,[rect,label]).setSize(210,105);
    function place(){
      if(!record){api.say('앞 활동에서 이 장소를 먼저 관찰해 줘.');return false;}
      if(!w.connected.includes(p.id))w.connected.push(p.id);
      const j=FIELD_POINTS.filter(q=>q.side===p.side).indexOf(p);
      card.setPosition(zones[p.side].x,zones[p.side].y+j*70).setScale(.8);
      api.counter(w.connected.length+(w.deposition?1:0),5,'지도 연결');api.save();check();return true;
    }
    api.drag(card,{onDrop(obj,x,y){if(distance({x,y},zones[p.side])>160){api.say(p.side==='upper'?'산 가까이의 좁고 가파른 물길을 찾아 줘.':'넓고 완만한 아래쪽 물길을 찾아 줘.');return false;}return place();}});
    api.assist(p.label+' 관찰 카드 연결',place);
    if(w.connected.includes(p.id)){const j=FIELD_POINTS.filter(q=>q.side===p.side).indexOf(p);card.setPosition(zones[p.side].x,zones[p.side].y+j*70).setScale(.8);}
  }
  const flag=tool(scene,api,'flag',1025,515,'모래가 쌓여요').setScale(.8);
  function deposit(){
    if(w.connected.length<4){api.say('관찰 카드 네 장을 먼저 지도에 놓아 줘.');return false;}
    w.deposition=true;d.fieldLink='deposit';flag.setPosition(982,377);api.save();check();return true;
  }
  api.drag(flag,{onDrop(obj,x,y){if(distance({x,y},{x:950,y:375})>100){api.say('옮겨 온 모래와 고운 흙이 남은 곳을 찾아 줘.');return false;}return deposit();}});
  api.assist('하류의 모래와 쌓임 연결',deposit);
  function check(){if(!finished&&w.connected.length===4&&w.deposition){finished=true;api.finish('상류와 하류의 모습이 달라. 물이 옮겨 온 모래와 고운 흙은 하류에 쌓여.');}}
  api.counter(w.connected.length+(w.deposition?1:0),5,'지도 연결');
  if(w.deposition)flag.setPosition(982,377);
  if(w.connected.length===4&&w.deposition)api.actions([{id:'field-link-saved',label:'완성한 지도 확인',onClick:check,primary:true}]);
  return {destroy(){api.save();}};
}
