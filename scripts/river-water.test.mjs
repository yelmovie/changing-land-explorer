import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from '../src/adventure/river.js';
import {riverScene,sceneSVG} from '../src/observation-scenes.js';
import {riverFlowPoint,riverSurface,riverDeposit} from '../src/river-water.js';

function experiment({prediction=true,completed=false,phase=0}={}){
  const drags=[],records=[],actions={},heroes=[];let auto,finishCount=0,saves=0,stops=0;
  const object=(x=0,y=0)=>{
    const state={x,y,active:true,visible:true,artwork:null,caption:null};
    let proxy;
    proxy=new Proxy(state,{get:(t,k)=>{
      if(k in t)return t[k];
      if(k==='setPosition')return(x,y)=>{t.x=x;t.y=y;return proxy;};
      if(k==='setVisible')return v=>{t.visible=v;return proxy;};
      return()=>proxy;
    }});return proxy;
  };
  const scene={add:{graphics:()=>object(),circle:(x,y)=>object(x,y),container:(x,y)=>object(x,y)},textures:{exists:()=>false},sys:{isActive:()=>true}};
  const data={evidence:{},runs:[],...(prediction?{prediction:{x:.75,y:.65}}:{})},work={pour:completed?1:0,sweeps:[]};
  const api={step:0,phase,data,work,completed,
    image:(_key,x,y)=>object(x,y),hero:(...args)=>{heroes.push(args);return object();},text:(_text,x,y)=>object(x,y),
    save:()=>saves++,task(){},say(){},counter(){},sound(){},spark(){},range:()=>({value:100}),
    drag:(o,handlers)=>drags.push({o,handlers}),
    actions:list=>{for(const key of Object.keys(actions))delete actions[key];for(const a of list)actions[a.id]=a.onClick;},
    autoplay:config=>auto=config,stopAutoplay:()=>{stops++;auto.stop();},
    record:item=>records.push(item),finish:()=>{finishCount++;auto.stop();}
  };
  const hooks=setup(scene,api);
  const advance=frames=>{for(let i=0;i<frames;i++)hooks.update(i*16,16);};
  return {data,work,auto,hooks,drags,actions,records,heroes,advance,counts:()=>({finishCount,saves,stops})};
}

test('the first experiment starts without a prediction flag and keeps answers for the learner',()=>{
  const e=experiment({prediction:false});
  assert.equal(e.auto.ready(),true);assert.equal(e.drags.length,1);assert.deepEqual(e.heroes,[]);
  e.auto.advance();e.advance(650);
  assert.equal(e.work.pour,1);assert.equal(e.data.prediction,undefined);assert.equal(e.records.length,1);
  assert.equal(e.data.reflection,undefined);
});

test('pause stops the simulation, and resume completes one recorded experiment',()=>{
  const e=experiment();e.auto.advance();e.advance(100);
  const paused=e.work.pour;assert.ok(paused>0&&paused<1);
  e.auto.stop();e.advance(60);assert.equal(e.work.pour,paused);
  e.auto.advance();e.advance(650);
  assert.equal(e.work.pour,1);assert.equal(e.records.length,1);assert.equal(e.counts().finishCount,1);
  assert.equal(e.auto.allowWhenComplete,true);assert.equal(e.auto.ready(),true);
});

test('completed automatic replay does not change saved evidence or award completion again',()=>{
  const e=experiment();e.auto.advance();e.advance(650);
  const before=JSON.stringify({data:e.data,work:e.work}),counts=e.counts();
  e.auto.advance();e.advance(70);e.auto.stop();e.advance(20);e.auto.advance();e.advance(650);
  assert.equal(JSON.stringify({data:e.data,work:e.work}),before);
  assert.equal(e.records.length,1);assert.equal(e.counts().finishCount,1);
  assert.equal(e.counts().saves,counts.saves);assert.ok(e.counts().stops>0);
});

test('revisiting and manually dragging a completed experiment leaves its records intact',()=>{
  const e=experiment({completed:true}),before=JSON.stringify({data:e.data,work:e.work}),saved=e.counts().saves;
  const {o,handlers}=e.drags.at(-1);
  handlers.onStart();handlers.onMove(o,300,195);e.advance(100);handlers.onDrop(o,o.x,o.y);
  assert.equal(JSON.stringify({data:e.data,work:e.work}),before);
  assert.equal(e.counts().saves,saved);assert.equal(e.records.length,0);assert.equal(e.counts().finishCount,0);
});

test('leaving or opening a modal stops unfinished water motion',()=>{
  for(const method of ['pause','destroy']){
    const e=experiment();e.auto.advance();e.advance(30);e.hooks[method]();
    const before=e.work.pour;e.advance(650);assert.equal(e.work.pour,before);assert.equal(e.records.length,0);
  }
});

test('comparison snapshots use the same wet-soil art and deposition as the live scene',()=>{
  assert.equal(riverScene(0).layers.length,1);
  const end=riverScene(1,2),html=sceneSVG(end);
  assert.ok(end.layers.some(p=>p.asset==='art/river-sand-wet-v1'));
  assert.match(html,/river-sand-wet-v1.webp/);
  const small=riverSurface(1,1),large=riverSurface(1,2);
  const fan=layers=>layers.filter(p=>p.type==='image'&&p.asset==='art/river-sediment-fan-v1');
  assert.equal(fan(riverSurface(.5,2)).length,0);
  assert.ok(fan(large)[0].w>fan(small)[0].w);
  assert.ok(riverFlowPoint(1).y>riverFlowPoint(0).y);
});

const shapes=layers=>layers.filter(p=>p.type==='poly').length;
const pileTop=layers=>Math.min(...layers.filter(p=>p.asset==='art/river-sediment-fan-v1').map(p=>p.y-p.h/2));

test('water reaches the foot by mid-run so the deposit keeps growing through the second half',()=>{
  assert.equal(riverSurface(.5,1).some(p=>p.asset==='art/river-sediment-fan-v1'),false);
  const tops=[.6,.75,.9,1].map(t=>pileTop(riverSurface(t,1)));
  for(let i=1;i<tops.length;i++)assert.ok(tops[i]<tops[i-1],'pile rises at '+i);
  const deposits=[.6,.75,.9,1].map(t=>riverDeposit(t,1));
  for(let i=1;i<deposits.length;i++){
    assert.ok(deposits[i].w>deposits[i-1].w,'deposited material spreads across the foot');
    assert.equal(deposits[i].y+deposits[i].h/2,deposits[0].y+deposits[0].h/2,'deposit rests on the same ground');
  }
});

test('more water cuts more channels and piles soil higher than less water',()=>{
  assert.ok(shapes(riverSurface(1,2))>shapes(riverSurface(1,1)));
  assert.ok(pileTop(riverSurface(1,2))<pileTop(riverSurface(1,1))-30);
});

test('cuts stay inside the hill and every layer has drawable numbers',()=>{
  for(const water of [1,2])for(const t of [.1,.3,.52,.7,1]){
    for(const p of riverSurface(t,water,4321,true)){
      for(const q of p.points||[])assert.ok(Array.isArray(q)?q.every(Number.isFinite):Number.isFinite(q.x)&&Number.isFinite(q.y),`t=${t} ${p.type}`);
      if(p.type==='ellipse')assert.ok([p.x,p.y,p.w,p.h].every(Number.isFinite),`t=${t} ellipse`);
    }
  }
  const start=riverFlowPoint(0);
  const cut=riverSurface(1,2).filter(p=>p.type==='poly'&&p.color==='#59391f').flatMap(p=>p.points);
  assert.ok(cut.every(q=>q.y>=start.y-30),'cut stays below the hill crest near the top');
});

test('saved snapshots render the same run the same way',()=>{
  assert.equal(JSON.stringify(riverSurface(.8,2)),JSON.stringify(riverSurface(.8,2)));
  const html=sceneSVG(riverScene(1,2));
  assert.match(html,/<polygon /);assert.match(html,/river-sediment-bank-v2.webp/);assert.doesNotMatch(html,/NaN/);
});

test('water material scrolls only during flow and saved observations keep its texture',()=>{
  const material=layers=>layers.filter(p=>p.texture);
  const first=material(riverSurface(.75,2,1000,true)),later=material(riverSurface(.75,2,2000,true));
  assert.ok(first.length>0);
  assert.notEqual(first[0].offsetX,later[0].offsetX);
  assert.deepEqual(material(riverSurface(.75,2,1000,false)),material(riverSurface(.75,2,2000,false)));
  assert.match(sceneSVG(riverScene(.7,2)),/river-water-current-v2.webp/);
});

test('shallow flowing sheets drain away and leave erosion with sediment at the foot',()=>{
  const moving=riverSurface(.75,2,1800,true),end=riverSurface(1,2);
  assert.ok(moving.some(p=>p.texture));
  assert.ok(moving.filter(p=>p.texture).every(p=>p.alpha<=.55));
  assert.ok(moving.some(p=>p.role==='transported-soil'));
  assert.equal(end.filter(p=>p.texture).length,0);
  assert.ok(end.some(p=>p.role==='erosion'));
  assert.ok(end.some(p=>p.asset==='art/river-sediment-fan-v1'));
});

test('observation labels snap only to their matching empty circle and require a learner conclusion',()=>{
  const e=experiment({prediction:false,phase:2});
  assert.equal(e.drags.length,3);
  const marks=[{x:.27,y:.38},{x:.53,y:.55},{x:.82,y:.72}];
  const first=e.drags[0];first.o.setPosition(150+marks[1].x*900,120+marks[1].y*400);
  assert.equal(first.handlers.onDrop(first.o,first.o.x,first.o.y),false);
  assert.equal(e.records.length,0);
  for(const [i,{o,handlers}]of e.drags.entries()){
    o.setPosition(150+marks[i].x*900,120+marks[i].y*400);
    assert.equal(handlers.onTap(o,o.x,o.y),true);
  }
  assert.equal(e.records.length,3);assert.equal(e.counts().finishCount,0);
  e.actions['river-reflect-top']();assert.equal(e.counts().finishCount,0);
  e.actions['river-reflect-foot']();assert.equal(e.counts().finishCount,1);assert.equal(e.data.reflection,'foot');
});
