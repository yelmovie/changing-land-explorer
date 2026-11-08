import test from 'node:test';
import assert from 'node:assert/strict';
import {cityScene,sceneSVG} from '../src/observation-scenes.js';
import {STAGE_ASSETS} from '../src/stage-art.js';
import {existsSync} from 'node:fs';
test('city ash illustration is loaded and shared by notebook and activity',()=>{
 for(let index=0;index<3;index++){
  const scene=cityScene(index,false),ash=scene.layers.filter(p=>p.type==='image'&&p.asset.includes('ash-puff'));
  assert.equal(ash.length,3);
  for(const p of ash){assert.ok(STAGE_ASSETS.city.includes(p.asset));assert.ok(existsSync(new URL('../public/assets/'+p.asset+'.webp',import.meta.url)));assert.ok(sceneSVG(scene).includes(p.asset));}
  assert.equal(cityScene(index,true).layers.filter(p=>p.type==='image').length,0);
 }
});
