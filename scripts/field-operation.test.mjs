import test from 'node:test';import assert from 'node:assert/strict';import {OPERATIONS,freshOperation,operationState,operate} from '../src/field-operation-model.js';import {fresh,sanitize} from '../src/model.js';
const paths={river:['observe:erosion','observe:transport','observe:deposit','bridge:checked','test','cross'],volcano:['signed','shelter','station'],city:['close','inside','notice'],safety:['cover','hold','stopped','assembly']};
for(const id of Object.keys(OPERATIONS))test(id+' applies observation to a complete field operation and preserves completed state',()=>{let s=freshOperation();for(const a of paths[id])s=operate(id,s,a).state;assert.equal(s.done,true);assert.equal(s.step,OPERATIONS[id].steps);assert.equal(operate(id,s,'wrong').state.done,true);});
test('wrong bridge testing retains observations and allows repair without resetting progress',()=>{let s=freshOperation();for(const a of paths.river.slice(0,3))s=operate('river',s,a).state;s=operate('river',s,'bridge:bank').state;const r=operate('river',s,'test');assert.equal(r.ok,false);assert.equal(r.state.step,1);assert.equal(r.state.attempts,1);s=operate('river',r.state,'bridge:checked').state;assert.equal(operate('river',s,'test').state.step,2);});
test('earthquake move cannot bypass protection',()=>{const r=operate('safety',freshOperation(),'assembly');assert.equal(r.ok,false);assert.equal(r.state.step,0);});
test('legacy records stay completed; new operation progress and resume survive sanitize',()=>{let s=fresh();s.completed=['river'];s.drafts.river={step:1,passed:[],data:{fieldOperation:{...freshOperation(),step:1}}};s.location={type:'operation',arg:{index:0}};s=sanitize(s);assert.deepEqual(s.completed,['river']);assert.equal(s.location.type,'operation');assert.equal(s.drafts.river.data.fieldOperation.step,1);});
test('corrupt progress is bounded for each operation',()=>{assert.equal(operationState({version:1,step:99},'river').step,2);assert.deepEqual(operationState(null),freshOperation());});

test('river crossing finishes only when the walk over the checked bridge reports arrival',()=>{const s={...freshOperation(),step:2};for(const a of ['move:east','test','bridge:checked']){const r=operate('river',s,a);assert.equal(r.changed,false);assert.equal(r.state.step,2);assert.equal(r.state.attempts,0);}const r=operate('river',s,'cross');assert.equal(r.ok,true);assert.equal(r.state.done,true);});


test('malformed operation checkpoints cannot index outside a scene or fabricate observations',()=>{
 const malformed={...freshOperation(),step:1.7,attempts:Infinity,observed:['color','color','erosion','unknown']};
 assert.equal(operationState(malformed,'volcano').step,1);
 assert.equal(operationState({...malformed,step:Infinity},'volcano').step,0);
 assert.equal(operationState(malformed,'river').attempts,0);
 assert.deepEqual(operationState(malformed,'river').observed,['erosion']);
 const result=operate('river',{...malformed,step:0},'observe:deposit');
 assert.equal(result.state.step,0);
 assert.deepEqual(result.state.observed,['erosion','deposit']);
});

import {bindBridgeCrossing,crossingProject,CROSSING_STOPS} from '../src/bridge-experiment.js';
for(const reduced of [false,true])test(`a tiny final walking step still observes the third trace and reaches the flag (${reduced?'reduced':'normal'} motion)`,()=>{
 const previous=Object.fromEntries(['window','document','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,globalThis[key]]));
 const make=()=>({events:{},style:{setProperty(key,value){this[key]=value;}},classList:{values:new Set(),add(...names){names.forEach(n=>this.values.add(n));},remove(...names){names.forEach(n=>this.values.delete(n));},toggle(name,on){on?this.values.add(name):this.values.delete(name);}},addEventListener(name,fn){this.events[name]=fn;}});
 const elements=new Map(),board={dataset:{},querySelector(selector){if(!elements.has(selector))elements.set(selector,make());return elements.get(selector);},querySelectorAll(){return [...elements.entries()].filter(([selector,el])=>selector.startsWith('[data-crossing-callout=')&&el.classList.values.has('is-shown')).map(([,el])=>el);}};
 const frames=new Map(),lines=[];let frameId=0,now=100,arrivals=0,cleanup;
 globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.document={querySelector:()=>null};
 globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 const frame=(elapsed=50)=>{const next=frames.entries().next().value;if(!next)return false;frames.delete(next[0]);now+=elapsed;next[1](now);return true;};
 const drain=()=>{for(let i=0;i<1000&&frames.size;i++)frame();assert.equal(frames.size,0,'walk settles');};
 try{
  cleanup=bindBridgeCrossing(board,{reduced,say:line=>lines.push(line),arrive:()=>arrivals++});
  const river=board.querySelector('.crossing-river'),step=board.querySelector('[data-crossing-step]');
  const position=()=>crossingProject(parseFloat(river.style.left)*10,parseFloat(river.style.top)*5.62);
  step.events.click();frame();const speed=position()/.016;drain();
  step.events.click();drain();assert.equal(lines.length,2);
  const stop=crossingProject(CROSSING_STOPS[2].x,90),epsilon=1e-5;
  step.events.click();frame();
  while(stop-position()>speed*.08+epsilon)frame();
  frame((stop-position()-epsilon)/speed*1000);
  assert.ok(stop-position()>0&&stop-position()<1e-4,'frame lands just before the third observation');
  drain();
  assert.deepEqual(lines,CROSSING_STOPS.map(s=>`${s.name}: ${s.text}`));
  step.events.click();drain();assert.equal(arrivals,1);assert.equal(step.disabled,true);assert.equal(position(),1);
  step.events.click();drain();assert.equal(arrivals,1,'arrival is not repeated');
 }finally{cleanup?.();for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
