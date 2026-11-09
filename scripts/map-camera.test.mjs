import test from 'node:test';
import assert from 'node:assert/strict';
import {overviewFrame,clampMapAxis} from '../src/map-camera.js';
for(const [width,height,top,bottom]of [[1280,720,76,620],[1024,768,68,660],[768,1024,64,870],[390,844,64,690],[844,390,52,300]]){
 test(`whole map fits ${width}x${height}`,()=>{const f=overviewFrame(width,top,bottom);assert.ok(f.x>=0&&f.y>=top+64);assert.ok(f.x+f.w<=width);assert.ok(f.y+f.h<=bottom);assert.ok(Math.abs(f.w/f.h-16/9)<1e-9);});
}
test('pan clamps oversized maps and centers smaller maps',()=>{assert.equal(clampMapAxis(50,100,200),0);assert.equal(clampMapAxis(-200,100,200),-100);assert.equal(clampMapAxis(-30,100,200),-30);assert.equal(clampMapAxis(-100,200,100),50);});

import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/map-adventure.js',import.meta.url),'utf8');
// Exercise the exact pointer callbacks from renderMap without starting Phaser or touching a saved game.
function wiredHarness(panEnabled=true,overview=false){
 const handlers={},capture=new Set();
 const world={addEventListener:(type,fn)=>handlers[type]=fn,classList:{add(){},remove(){}},setPointerCapture:id=>capture.add(id),hasPointerCapture:id=>capture.has(id),releasePointerCapture:id=>capture.delete(id)};
 const snippet=source.slice(source.indexOf("  world.addEventListener('pointerdown'"),source.indexOf('  function useFallback'));
 const model=new Function('world','document','cancelAnimationFrame','panEnabled','overview',`let glide=0,grab=null,dragged=false,follow=true;const view={x:0,y:0},page={classList:{add(){}}};function place(x,y){view.x=x;view.y=y;} ${snippet};return {view,state:()=>({grab,dragged,follow})};`)(world,{querySelector:()=>null},()=>{},panEnabled,overview);
 return {...model,handlers,capture};
}
for(const pointerType of ['mouse','touch'])test(`${pointerType} pan moves and cancels without selecting a stage`,()=>{
 const h=wiredHarness(),event={pointerId:5,pointerType,button:0,clientX:100,clientY:100};
 h.handlers.pointerdown(event);h.handlers.pointermove({...event,clientX:160,clientY:145});assert.deepEqual(h.view,{x:60,y:45});assert.equal(h.capture.has(5),true);
 h.handlers.pointercancel(event);assert.equal(h.state().grab,null);assert.equal(h.capture.size,0);
 let stopped=false;h.handlers.click({preventDefault(){},stopPropagation(){stopped=true;}});assert.equal(stopped,true);
});
for(const [enabled,overview]of [[false,false],[true,true]])test(`disabled pan (${enabled}/${overview}) suppresses a drag without moving`,()=>{
 const h=wiredHarness(enabled,overview),event={pointerId:2,button:0,clientX:100,clientY:100};
 h.handlers.pointerdown(event);h.handlers.pointermove({...event,clientX:160});h.handlers.pointerup(event);assert.deepEqual(h.view,{x:0,y:0});
 let stopped=false;h.handlers.click({preventDefault(){},stopPropagation(){stopped=true;}});assert.equal(stopped,true);
});
