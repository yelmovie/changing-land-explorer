import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from '../src/adventure/river.js';
import {riverScene,sceneSVG} from '../src/observation-scenes.js';
import {riverFlowPoint,riverSurface} from '../src/river-water.js';

function experiment({prediction=true,completed=false,phase=0}={}){
  const drags=[],records=[],actions={};let auto,finishCount=0,saves=0,stops=0;
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
  const scene={add:{graphics:()=>object(),container:(x,y)=>object(x,y)},textures:{exists:()=>false},sys:{isActive:()=>true}};
  const data={evidence:{},runs:[],...(prediction?{prediction:{x:.75,y:.65}}:{})},work={pour:completed?1:0,sweeps:[]};
  const api={step:0,phase,data,work,completed,
    image:(_key,x,y)=>object(x,y),hero:object,text:(_text,x,y)=>object(x,y),
    save:()=>saves++,task(){},say(){},counter(){},sound(){},
    drag:(o,handlers)=>drags.push({o,handlers}),
    actions:list=>{for(const key of Object.keys(actions))delete actions[key];for(const a of list)actions[a.id]=a.onClick;},
    autoplay:config=>auto=config,stopAutoplay:()=>{stops++;auto.stop();},
    record:item=>records.push(item),finish:()=>{finishCount++;auto.stop();}
  };
  const hooks=setup(scene,api);
  const advance=frames=>{for(let i=0;i<frames;i++)hooks.update(i*16,16);};
  return {data,work,auto,hooks,drags,actions,records,advance,counts:()=>({finishCount,saves,stops})};
}

test('automatic water observation cannot choose a prediction or answer',()=>{
  const e=experiment({prediction:false});
  assert.equal(e.auto.ready(),false);e.auto.advance();e.advance(650);
  assert.equal(e.work.pour,0);assert.equal(e.data.prediction,undefined);assert.equal(e.records.length,0);
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
const PILE_COLORS=['#c8955a','#e2c088','#ad7a47','#ecd09a','#b98a52','#dab27a','#a5713f'];
const pileTop=layers=>Math.min(...layers.filter(p=>p.type==='poly'&&PILE_COLORS.includes(p.color)).flatMap(p=>p.points.map(q=>q.y)));

test('water reaches the foot by mid-run so the deposit keeps growing through the second half',()=>{
  assert.equal(riverSurface(.5,1).some(p=>p.color==='#c8955a'),false);
  const tops=[.6,.75,.9,1].map(t=>pileTop(riverSurface(t,1)));
  for(let i=1;i<tops.length;i++)assert.ok(tops[i]<tops[i-1],'pile rises at '+i);
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
  assert.match(html,/<polygon /);assert.match(html,/<path d="M/);assert.doesNotMatch(html,/NaN/);
});
