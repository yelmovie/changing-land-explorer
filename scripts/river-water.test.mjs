import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from '../src/adventure/river.js';
import {riverScene,sceneSVG} from '../src/observation-scenes.js';
import {riverFlowPoint,riverSurface} from '../src/river-water.js';

function experiment({prediction=true,completed=false,phase=0}={}){
  const drags=[],records=[],actions={},assists={};let auto,finishCount=0,saves=0,stops=0;
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
    drag:(o,handlers)=>drags.push({o,handlers}),assistPlacement(){},
    assist:(label,fn)=>assists[label]=fn,actions:list=>{for(const key of Object.keys(actions))delete actions[key];for(const a of list)actions[a.id]=a.onClick;},
    autoplay:config=>auto=config,stopAutoplay:()=>{stops++;auto.stop();},
    record:item=>records.push(item),finish:()=>{finishCount++;auto.stop();}
  };
  const hooks=setup(scene,api);
  const advance=frames=>{for(let i=0;i<frames;i++)hooks.update(i*16,16);};
  return {data,work,auto,hooks,drags,actions,assists,records,advance,counts:()=>({finishCount,saves,stops})};
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
