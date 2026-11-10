import {observationTour} from './observation-tour.js';
import {FIELD_POINTS, RIVER_MARKS} from '../learning-model.js';
import {riverScene,drawShapes,drawCanvasShapes} from '../observation-scenes.js';
import {hasModel,openModel3D} from '../rock3d.js';
import {wetSoilAlpha,drawRiverSpray} from '../river-water.js';
import {showRiverGrainGuide} from '../river-grain-guide.js';

const AREA = {x:150,y:120,w:900,h:400};
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const point = p => ({x:AREA.x+p.x*AREA.w,y:AREA.y+p.y*AREA.h});

function tool(scene,api,type,x,y,label) {
  const key={lens:'tool-lens',can:'tool-water',flag:'tool-flag'}[type];
  if(scene.textures.exists(key)) {
    const picture=api.image(key,0,0,type==='can'?148:112,type==='can'?115:112);
    const caption=api.text(label,0,83,22).setBackgroundColor(type==='lens'?'#174b44':'#fff8e8').setColor(type==='lens'?'#ffffff':'#233e34').setPadding(12,7);
    const backing=type==='lens'?scene.add.graphics().fillStyle(0x173c35,.25).fillCircle(2,7,69).fillStyle(0xfffbec,1).fillCircle(0,0,69).lineStyle(3,0x406b57,1).strokeCircle(0,0,68):null;
    const object=scene.add.container(x,y,[...(backing?[backing]:[]),picture,caption]).setSize(160,190);
    if(type==='lens')object.setName('field-lens');
    object.artwork=picture;object.caption=caption;return object;
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
  const sx=w/900,sy=h/400;
  api.image('art/river-sand-model',x+w/2,y+h/2,w,h);
  const wet=api.image('art/river-sand-wet-v1',x+w/2,y+h/2,w,h).setAlpha(0);
  const texture=scene.textures.createCanvas?.('river-surface-'+scene.sys.settings.key+'-'+x+'-'+y,900,400);
  const patterns=new Map(),source=key=>scene.textures.exists(key)?scene.textures.get(key).getSourceImage():null;
  if(texture){
    scene.add.image(x+w/2,y+h/2,texture.key).setDisplaySize(w,h);
    scene.events.once('shutdown',()=>texture.destroy());
  }
  const g=texture?null:scene.add.graphics().setPosition(x-150*sx,y-120*sy).setScale(sx,sy);
  function draw(t,water=1,motion=0,flowing=false){
    wet.setAlpha(wetSoilAlpha(t,water));
    const layers=riverScene(t,water,motion,flowing).layers.filter(p=>p.asset!=='art/river-sand-model'&&p.asset!=='art/river-sand-wet-v1');
    if(texture){
      const ctx=texture.context;ctx.clearRect(0,0,900,400);ctx.save();ctx.translate(-150,-120);
      drawCanvasShapes(ctx,layers,source,patterns);ctx.restore();texture.refresh();
    }else drawShapes(g,layers);
  }
  draw(0);return {draw};
}

export function setup(scene,api) {
  const d=api.data;
  d.evidence??={}; d.runs??=[];
  return api.step===0 ? experiment(scene,api) : field(scene,api);
}

function experiment(scene,api) {
  const d=api.data,w=api.work;
  api.image('river-lab',600,320,1200,640);
  if(api.phase===2) return markResults(scene,api);
  const water=api.phase===0?1:2;
  const land=terrain(scene,api);
  let pouring=null,replayTime=null;
  w.pour=clamp(w.pour||0); w.sweeps??=[];
  let finished=api.completed===true&&w.pour>=.999;
  api.task(water===1?'물을 흘려 흙의 변화를 살펴보자':'물을 두 배로 주면 흙은 어떻게 될까?','물뿌리개로 물을 주거나, 자동재생을 눌러 물과 흙을 관찰해 봐.');
  api.text(water===1?'물 적게 · 첫 실험':'물 많이 · 두 번째 실험',600,62,28).setBackgroundColor('#fff8e8').setPadding(10,5);
  const zone=scene.add.graphics().fillStyle(0xa8edf4,.24).fillRoundedRect(250,145,300,94,25).lineStyle(5,0x1e747d,1);
  zone.strokeRoundedRect(250,145,300,94,25);
  const waterLabel=api.text('물 주는 곳',400,180,25,'#ffffff').setBackgroundColor('#226568').setPadding(10,5);
  zone.setVisible(!finished);waterLabel.setVisible(!finished);
  const can=tool(scene,api,'can',140,515,'물뿌리개');
  function inZone(x,y) {return x>=250&&x<=550&&y>=140&&y<=250;}
  function stop(){
    pouring=null;drops.clear();
    can.artwork?.setFlipX(false).setRotation(0);can.caption?.setVisible(true);
    zone.setVisible(!finished);waterLabel.setVisible(!finished);
    if(!finished)api.save();
  }
  function start(mode){
    if(finished){if(replayTime===null||replayTime>=1)replayTime=0;}
    else {w.inputModes??=[];if(!w.inputModes.includes(mode))w.inputModes.push(mode);}
    pouring=mode;
    if(inZone(can.x,can.y))can.setPosition(400,140);
    can.artwork?.setFlipX(true).setRotation(-.38);can.caption?.setVisible(false);
    zone.setVisible(!inZone(can.x,can.y)&&!finished);waterLabel.setVisible(!inZone(can.x,can.y)&&!finished);
    api.sound?.('water');api.say(finished?'기록한 실험을 다시 보고 있어. 물을 따라 움직이는 흙을 살펴봐.':'젖은 물길을 따라 흙이 움직여. 아래쪽에 쌓이는 모습도 살펴봐.');return true;
  }
  api.drag(can,{
    onStart(){start('drag');},
    onMove(obj,x,y){
      if(!inZone(x,y))return;
      obj.setPosition(400,140);zone.setVisible(false);waterLabel.setVisible(false);
      const band=Math.min(2,Math.floor((x-250)/100));
      if(!finished&&!w.sweeps.includes(band)){w.sweeps.push(band);api.save();}
    },
    onDrop(obj,x,y){stop();check();return inZone(x,y);},
    onTap(obj,x,y){if(!inZone(x,y)){stop();api.say('테두리 안의 언덕을 눌러 물 줄 위치를 골라 줘.');return false;}return start('tap');}
  });
  api.autoplay({
    label:'언덕에 물 흘리기',interval:1200,allowWhenComplete:true,ready:()=>true,
    advance(){if(pouring!=='auto'){can.setPosition(400,140);start('auto');}},
    stop(){if(pouring==='auto')stop();}
  });
  const drops=scene.add.graphics();
  function draw(motion=0){land.draw(replayTime??w.pour,water,motion,!!pouring);api.counter(Math.round(w.pour*100),100,'물 흘리기');}
  function check(){
    if(finished||w.pour<.999)return;
    finished=true;w.pour=1;stop();can.setPosition(140,515);draw();api.actions([]);d.water=water;d.scrub=1;
    d.runs=d.runs.filter(r=>r.water!==water);
    d.runs.push({water,complete:true,version:1,inputModes:[...(w.inputModes||[])]});
    api.record({id:'river-run-'+water,kind:'river',label:water===1?'물 적게 실험':'물 많이 실험',point:{x:.82,y:.72},time:1,water,text:'같은 흙과 같은 언덕에서 '+(water===1?'적은 양':'두 배의 양')+'의 물을 흘려 깎임·이동·쌓임을 관찰했어.'});api.save();
    api.finish(water===1?'첫 실험을 기록했어. 같은 언덕에서 물의 양을 바꿔 보자.':'물을 많이 흘리니 흙이 더 많이 깎이고 옮겨졌어.',{water});
  }
  draw();
  let modelAvailable=false;
  function controls(){
    const actions=[];
    if(!finished){
      actions.push({id:'river-pour-start',label:'물 주기',primary:true,onClick(){
        if(!inZone(can.x,can.y))can.setPosition(400,140);
        start('button');
      }},{id:'river-pour-stop',label:'물 멈추기',onClick(){stop();api.say('물을 멈췄어. ‘물 주기’를 누르면 이어서 관찰할 수 있어.');}});
    }
    if(modelAvailable&&!finished)actions.push({id:'river-3d',label:'흙 언덕 돌려 보기',onClick:()=>openModel3D(api.modal,'river-hill','흙 언덕')});
    api.actions(actions);
  }
  controls();
  if(water===1)hasModel('river-hill').then(ok=>{if(ok&&scene.sys.isActive()&&can.active&&!finished){modelAvailable=true;controls();}});
  if(w.pour>=.999)check();
  return {update(time,delta){
    drops.clear();
    if(!pouring||!inZone(can.x,can.y))return;
    const advance=Math.min(delta,60)/8500;
    if(finished)replayTime=clamp((replayTime??0)+advance);
    else w.pour=clamp(w.pour+advance);
    drawRiverSpray(drops,can,time,water);
    draw(time);
    if(finished&&replayTime>=1){api.stopAutoplay();stop();can.setPosition(140,515);draw();api.say('다시 관찰했어. 실험 기록은 그대로야.');}
    else if(!finished)check();
  },pause:stop,destroy:stop};
}

function markResults(scene,api) {
  const d=api.data,w=api.work;w.marks??=[];let finished=false;
  const land=terrain(scene,api),caption=api.text('물이 흐른 뒤',600,62,28).setBackgroundColor('#fff8e8').setPadding(16,7);
  let time=clamp(w.scrub??1),timeline,hover=null;
  const targets=Object.fromEntries(Object.entries(RIVER_MARKS).map(([id,mark])=>{
    const pos=point(mark),ring=scene.add.graphics();
    const hit=scene.add.circle(pos.x,pos.y,46,0xffffff,0).setInteractive({useHandCursor:true});
    return [id,{pos,ring,hit}];
  }));
  const badges=[];
  const touchRadius=()=>Math.max(74,24/Math.max(.1,(scene.game?.canvas.getBoundingClientRect().width||1200)/1200));
  function paintTargets(){
    for(const [id,{pos,ring,hit}]of Object.entries(targets)){
      const visible=time>=.95&&!w.marks.includes(id);ring.clear().setVisible(visible);hit.setVisible(visible);
      if(!visible)continue;
      ring.fillStyle(0xfff9e8,hover===id?.35:.16).fillCircle(pos.x,pos.y,46).lineStyle(hover===id?4:2,0x806a45,.85).strokeCircle(pos.x,pos.y,46).lineStyle(hover===id?4:3,0x947548,.95);
      for(let i=0;i<16;i++){const a=i*Math.PI/8;ring.beginPath().arc(pos.x,pos.y,46,a,a+.23,false).strokePath();}
      ring.lineStyle(1,0xfff9e8,.8).strokeCircle(pos.x,pos.y,41);
    }
  }
  function render(){
    land.draw(time,2);caption.setText(time<.05?'물이 흐르기 전':time>.95?'물이 흐른 뒤':'물과 흙의 변화');
    paintTargets();for(const {id,badge}of badges)badge.setAlpha(time>=.95||w.marks.includes(id)?1:.5);
  }
  function timeGuide(){
    if(w.marks.length===3)return;
    api.task('빈 원에 이름표를 놓아 보자',time<.95?'마지막 모습을 누른 뒤, 달라진 곳을 살펴봐.':'이름표를 누른 뒤 원을 눌러 봐. 끌어 놓아도 돼.');
  }
  function setTime(value){time=Number(value)/100;if(timeline)timeline.value=String(value);if(!api.completed&&!finished){w.scrub=time;d.scrub=time;api.save();}render();timeGuide();if(w.marks.length<3)controls();}
  timeGuide();
  function controls(){
    api.actions([
      {id:'river-choose-label',label:'이름표 고르기',disabled:time<.95||w.marks.length===3,onClick(){
        api.modal('어떤 이름표를 놓을까?','<p>이름표를 고른 뒤 언덕의 빈 원을 눌러 줘.</p><div class="river-label-choices">'+badges.map(({id})=>`<button class="secondary" data-river-label="${id}" ${w.marks.includes(id)?'disabled':''}>${short[id]}</button>`).join('')+'</div>',(dialog,close)=>{
          for(const button of dialog.querySelectorAll('[data-river-label]'))button.onclick=()=>{const item=badges.find(item=>item.id===button.dataset.riverLabel);close();api.select(item.badge);};
        });
      }},
      {id:'river-grain-guide',label:'흙 한 알 따라 보기',onClick:()=>showRiverGrainGuide(api.modal)}
    ]);
  }
  timeline=api.range('실험 시간',Math.round(time*100),0,100,setTime,['처음 모습','마지막 모습']);
  api.autoplay(observationTour(api,{label:'처음과 마지막 언덕 관찰',items:[0,100],interval:2800,visit:setTime}));
  const short={erosion:'깎여요',transport:'옮겨져요',deposit:'쌓여요'};
  const colors={erosion:0xd17c45,transport:0x3e9ea8,deposit:0xb39544};
  for(const [i,[id,mark]]of Object.entries(RIVER_MARKS).entries()){
    const pos=targets[id].pos,art=scene.add.graphics().fillStyle(colors[id]).fillCircle(0,0,36).lineStyle(4,0xfffaf0,1);
    // Draw the three symbols with graphics so a missing font cannot hide them.
    if(id==='erosion')art.beginPath().moveTo(-14,-14).lineTo(12,10).lineTo(12,-2).moveTo(12,10).lineTo(0,10).strokePath().fillStyle(0xfffaf0).fillCircle(-10,15,3).fillCircle(0,20,2).fillCircle(10,19,3);
    else if(id==='transport')art.beginPath().moveTo(-17,0).lineTo(17,0).lineTo(6,-11).moveTo(17,0).lineTo(6,11).strokePath();
    else art.fillStyle(0xfffaf0).fillEllipse(0,13,36,7).fillEllipse(0,3,27,7).fillEllipse(0,-7,16,7);
    const label=api.text(short[id],0,59,23).setBackgroundColor('#fff8e8').setPadding(12,5);
    const badge=scene.add.container(275+i*325,535,[art,label]).setSize(144,148).setData('river-mark',id);
    const drop=()=>{
      hover=null;paintTargets();
      if(time<.95){api.say('마지막 모습을 누른 뒤, 달라진 곳의 빈 원에 놓아 줘.');return false;}
      const nearest=Object.entries(targets).find(([,target])=>distance(badge,target.pos)<=touchRadius());
      if(!nearest){api.say('이름표를 흙 위에 보이는 빈 원 안에 놓아 줘.');return false;}
      if(nearest[0]!==id){api.say('그곳에서 어떤 변화가 일어났는지 다시 살펴봐.');return false;}
      badge.setPosition(pos.x,pos.y).setScale(.86);
      if(w.marks.includes(id))return true;
      w.marks.push(id);badge.disableInteractive();paintTargets();
      api.record({id:'river-'+id,kind:'river',label:mark.label,claim:id,point:{x:mark.x,y:mark.y},time:1,water:2,text:'물이 흐르기 전과 뒤를 비교하며 찾은 '+mark.label+' 흔적이야.'});
      api.spark(pos.x,pos.y);api.counter(w.marks.length,3,'변화 기록');api.say(mark.label+' 흔적을 기록했어. 다른 빈 원도 살펴봐.');api.save();controls();check();return true;
    };
    api.drag(badge,{
      onStart(){api.say('이름표를 빈 원에 놓아 줘. 어떤 변화가 일어난 곳인지 살펴봐.');},
      onMove(_object,x,y){hover=Object.entries(targets).find(([,target])=>distance({x,y},target.pos)<=touchRadius())?.[0]??null;paintTargets();},
      onDrop:drop,onTap:drop
    });
    badges.push({id,badge});
    if(w.marks.includes(id))badge.setPosition(pos.x,pos.y).setScale(.86).disableInteractive();
  }
  if(scene.game?.canvas){
    const canvas=scene.game.canvas;
    const fitTargets=()=>{
      const scale=canvas.getBoundingClientRect().width/1200;if(!scale)return;
      for(const {hit}of Object.values(targets)){
        const area=hit.input.hitArea,radius=Math.max(46,24/scale);
        if('radius'in area)area.radius=radius;else area.setTo(46-radius,46-radius,radius*2,radius*2);
      }
      for(const {badge}of badges){const size=Math.max(148,48/scale);badge.setSize(size,size);badge.input.hitArea.setSize(size,size);}
    };
    const resize=new ResizeObserver(fitTargets);resize.observe(canvas);fitTargets();api.listenCleanup(()=>resize.disconnect());
  }
  function check(){
    if(finished||w.marks.length!==3)return;
    api.task('물에 옮겨진 흙은 어디에 쌓였을까?','언덕의 처음과 마지막 모습을 다시 살펴보고 골라 줘.');
    api.actions([
      {id:'river-reflect-foot',label:'언덕 아래쪽',onClick(){if(finished)return;finished=true;d.reflection='foot';api.save();api.finish('흙은 깎이고 물과 함께 옮겨져 언덕 아래쪽에 쌓였어.');}},
      {id:'river-reflect-top',label:'언덕 위쪽',onClick(){api.say('물이 흐른 뒤 흙이 모인 곳을 다시 살펴봐.');}}
    ]);
  }
  render();controls();api.counter(w.marks.length,3,'변화 기록');check();
  return {destroy(){api.save();}};
}

function field(scene,api) {
  const d=api.data,w=api.work;
  const fieldAsset=api.phase===0?'art/river-upper-photo-v1':api.phase===1?'art/river-lower-photo-v1':'river-field';
  api.image(fieldAsset,600,320,1200,640);
  if(api.phase===2)return connectField(scene,api);
  api.text('학습용 실사형 생성 이미지',212,620,16,'#ffffff').setBackgroundColor('#173c35').setPadding(8,4);
  // A subtle scrim separates interactive objects from the detailed landscape.
  scene.add.rectangle(600,320,1200,640,0x173c35,.14);
  const region=api.phase===0?{x:218,y:284,w:302,h:264,label:'상류',lx:218,ly:126}:{x:824,y:505,w:444,h:206,label:'하류',lx:824,ly:602};
  scene.add.graphics().fillStyle(0xfff7d9,.12).fillRoundedRect(region.x-region.w/2,region.y-region.h/2,region.w,region.h,40).lineStyle(9,0x164b44,.75).strokeRoundedRect(region.x-region.w/2,region.y-region.h/2,region.w,region.h,40).lineStyle(4,0xffefb2,1).strokeRoundedRect(region.x-region.w/2,region.y-region.h/2,region.w,region.h,40);
  api.text(region.label,region.lx,region.ly,28,'#ffffff').setBackgroundColor('#174b44').setPadding(20,9).setName('field-region-label');
  // Keep the same character art, with a pale silhouette and a grounded shadow.
  scene.add.ellipse(1110,614,126,25,0x153f35,.34);
  const pose=scene.textures.exists('hero-lens')?'hero-lens':'river-hero',heroHeight=scene.textures.get(pose).getSourceImage().height;
  for(const [dx,dy]of [[-4,0],[4,0],[0,-4],[0,4],[-3,-3],[3,-3],[-3,3],[3,3]])scene.add.image(1110+dx,530+dy,pose).setScale(176/heroHeight).setTintFill(0xfff9df);
  api.hero(1110,530,176,pose).setName('field-companion');
  const points=FIELD_POINTS.filter(p=>p.side===(api.phase===0?'upper':'lower'));
  w.found??=[];let finished=!!api.completed;
  api.task(api.phase===0?'돋보기로 상류의 두 단서를 찾아 봐':'아래쪽으로 와서 하류의 두 단서를 찾아 봐','숫자를 누르거나 ‘자동재생’으로 두 곳을 살펴봐. 돋보기 안의 물길과 돌을 비교해 봐.');
  const lens=tool(scene,api,'lens',600,500,'돋보기');
  const markers=new Map();
  // Retain the enlarged observation image, with a plain reading surface and
  // generous space between the image, heading, and wrapped description.
  const preview={x:840,y:157.5,width:552,height:205};
  api.panel(preview.x,216,656,408,0xfff8e8,1).setName('field-preview-panel');
  const mask=scene.make.graphics({x:0,y:0,add:false});
  mask.fillStyle(0xffffff).fillRoundedRect(preview.x-preview.width/2,preview.y-preview.height/2,preview.width,preview.height,14);
  const zoom=api.image(fieldAsset,preview.x,preview.y,1800,960).setMask(mask.createGeometryMask());
  const name=api.text('가까이 들여다보자',preview.x,292,28).setName('field-preview-title');
  const caption=api.text('물길과 알갱이 모양이 단서야.',preview.x,350,25,'#294239',552).setName('field-preview-caption');
  const recorded=p=>w.found.includes(p.id)&&d.evidence[p.id]?.kind==='field'&&d.evidence[p.id]?.claim===p.claim;
  function check(){if(!finished&&points.every(recorded)){finished=true;api.finish(api.phase===0?'상류는 물길이 좁고 경사가 급해. 크고 각진 바위도 찾았어.':'하류는 물길이 넓고 완만해. 모래와 고운 흙도 찾았어.');}}
  function focus(x,y){zoom.setPosition(preview.x+(600-x)*1.5,preview.y+(320-y)*1.5);}
  function observe(p){
    lens.setPosition(p.x*1.2,p.y*640/560);
    focus(lens.x,lens.y);
    name.setText(p.label);caption.setText(p.text);
    if(recorded(p)){api.say(p.text);check();return true;}
    if(!w.found.includes(p.id))w.found.push(p.id);markers.get(p.id)(true);api.say(p.text+' 남은 숫자도 눌러 봐.');
    api.record({id:p.id,kind:'field',label:p.label,asset:fieldAsset,point:{x:p.x/1000,y:p.y/560},zoom:2.5,claim:p.claim,text:p.text});
    api.counter(points.filter(recorded).length,2,'관찰 단서');api.spark(lens.x,lens.y);api.save();check();
    return true;
  }
  api.drag(lens,{onMove(obj,x,y){focus(x,y);},onDrop(obj,x,y){const p=points.find(p=>distance({x,y},{x:p.x*1.2,y:p.y*640/560})<80);if(p)return observe(p);api.say('반짝이는 물길이나 바위로 돋보기를 옮겨 줘.');return false;}});
  points.forEach((p,index)=>{
    const mx=p.x*1.2,my=p.y*640/560;
    scene.add.circle(mx,my,39,0xfff7d9,1).setStrokeStyle(3,0x174b44,1);
    const paint=api.marker(mx,my,index+1,()=>observe(p));
    markers.set(p.id,paint);paint(recorded(p));
  });
  api.autoplay(observationTour(api,{label:api.phase===0?'상류 두 곳 관찰':'하류 두 곳 관찰',items:points,interval:3200,visit:observe}));
  api.actions([{id:'river-field-observe',label:'관찰 위치 고르기',onClick:()=>api.modal('어디를 확대할까?','<div class="accessible-choices">'+points.map((p,i)=>`<button class="secondary" data-field-point="${i}">${i+1}번 위치 관찰</button>`).join('')+'</div>',(dialog,close)=>{dialog.querySelectorAll('[data-field-point]').forEach(b=>b.onclick=()=>{observe(points[Number(b.dataset.fieldPoint)]);close();});})}]);
  api.counter(points.filter(recorded).length,2,'관찰 단서');check();
  return {destroy(){mask.destroy();api.save();}};
}

function connectField(scene,api){
  const d=api.data,w=api.work;w.connected??=[];let finished=false;
  api.task('네가 모은 단서로 강 지도를 완성해 봐','관찰 카드를 상류와 하류에 놓고, 마지막으로 모래가 쌓이는 곳을 연결해 줘.');
  api.panel(600,325,1060,540,0xf8f0d8,.9);
  api.hero(1150,560,100,'hero-lens');
  // A hand-drawn map river: sandy banks, water, a light ripple line, then the sand bar.
  const g=scene.add.graphics(),bend=[[250,190],[420,255],[660,300],[950,365]];
  const stroke=(w,c,a=1)=>{g.lineStyle(w,c,a).beginPath().moveTo(...bend[0]);bend.slice(1).forEach(p=>g.lineTo(...p));g.strokePath();};
  stroke(74,0xcfb57e,.85);stroke(48,0x4fa9c4);stroke(22,0x7fcbe0);stroke(5,0xd9f3fa,.9);
  g.fillStyle(0xd8b877).fillEllipse(943,378,150,74).fillStyle(0xead29a).fillEllipse(938,372,118,52);
  for(let i=0;i<14;i++)g.fillStyle(0xb8955a,.8).fillCircle(895+(i*29)%100,360+(i*13)%30,2.5);
  api.text('상류',300,135,30);api.text('하류',910,260,30);
  const zones={upper:{x:330,y:235},lower:{x:870,y:370}},placements={};
  for(const [i,p] of FIELD_POINTS.entries()) {
    const record=d.evidence[p.id];
    const card=api.card(record?.text||p.text,190+i*228,515,215,108,21);
    if(!record)card.setAlpha(.7);
    function place(){
      if(!record){api.say('앞 활동에서 이 장소를 먼저 관찰해 줘.');return false;}
      if(!w.connected.includes(p.id))w.connected.push(p.id);
      const j=FIELD_POINTS.filter(q=>q.side===p.side).indexOf(p);
      card.setPosition(zones[p.side].x,zones[p.side].y+j*70).setScale(.8);
      api.counter(w.connected.length+(w.deposition?1:0),5,'지도 연결');api.say('관찰 카드를 연결했어. 남은 카드와 모래 쌓임 깃발을 이어 줘.');api.save();check();return true;
    }
    placements[p.id]=place;
    api.drag(card,{onDrop(obj,x,y){if(distance({x,y},zones[p.side])>160){api.say(p.side==='upper'?'산 가까이의 좁고 가파른 물길을 찾아 줘.':'넓고 완만한 아래쪽 물길을 찾아 줘.');return false;}return place();}});
    if(w.connected.includes(p.id)){const j=FIELD_POINTS.filter(q=>q.side===p.side).indexOf(p);card.setPosition(zones[p.side].x,zones[p.side].y+j*70).setScale(.8);}
  }
  const flag=tool(scene,api,'flag',1068,500,'모래가 쌓여요').setScale(.8);
  function deposit(){
    if(w.connected.length<4){api.say('관찰 카드 네 장을 먼저 지도에 놓아 줘.');return false;}
    w.deposition=true;d.fieldLink='deposit';flag.setPosition(982,377);api.counter(w.connected.length+1,5,'지도 연결');api.save();check();return true;
  }
  api.drag(flag,{onDrop(obj,x,y){if(distance({x,y},{x:950,y:375})>100){api.say('옮겨 온 모래와 고운 흙이 남은 곳을 찾아 줘.');return false;}return deposit();}});
  function check(){if(!finished&&w.connected.length===4&&w.deposition){finished=true;api.finish('상류와 하류의 모습이 달라. 물이 옮겨 온 모래와 고운 흙은 하류에 쌓여.');}}
  api.counter(w.connected.length+(w.deposition?1:0),5,'지도 연결');
  if(w.deposition)flag.setPosition(982,377);
  api.actions([{id:'river-field-connect',label:'관찰 카드 연결',onClick:()=>{
   let selected=null;
   api.modal('관찰로 강 지도 연결하기','<p>관찰 카드나 모래 쌓임 표식을 고른 뒤, 놓을 곳을 직접 골라 줘.</p><div class="accessible-choices">'+FIELD_POINTS.map(p=>`<button class="secondary" data-field-card="${p.id}" ${w.connected.includes(p.id)?'disabled':''}>${p.text}</button>`).join('')+`<button class="secondary" data-field-card="deposit" ${w.connected.length<4||w.deposition?'disabled':''}>모래 쌓임 표식</button></div><p id="field-choice-status" role="status">카드를 먼저 골라 줘.</p><div class="accessible-choices"><button class="secondary" data-field-side="upper" disabled>상류에 놓기</button><button class="secondary" data-field-side="lower" disabled>하류에 놓기</button></div>`,(dialog,close)=>{
    dialog.querySelectorAll('[data-field-card]').forEach(b=>b.onclick=()=>{selected=b.dataset.fieldCard;dialog.querySelectorAll('[data-field-card]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));dialog.querySelectorAll('[data-field-side]').forEach(c=>c.disabled=false);dialog.querySelector('#field-choice-status').textContent='내 관찰을 떠올리며 놓을 곳을 골라 줘.';});
    dialog.querySelectorAll('[data-field-side]').forEach(b=>b.onclick=()=>{
     const correct=selected==='deposit'?'lower':FIELD_POINTS.find(p=>p.id===selected)?.side;
     if(b.dataset.fieldSide!==correct){dialog.querySelector('#field-choice-status').textContent='그곳의 물길과 알갱이가 카드의 관찰과 맞는지 다시 비교해 봐.';return;}
     const okay=selected==='deposit'?deposit():placements[selected]?.();
     if(okay)close();else dialog.querySelector('#field-choice-status').textContent='앞 활동의 관찰 기록부터 확인해 줘.';
    });
   });
  }}]);
  return {destroy(){api.save();}};
}
