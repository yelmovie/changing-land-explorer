import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,saveDecision,seedPreview} from '../src/model.js';
import {hasRockEvidence,FIELD_POINTS,CITY_SITES} from '../src/learning-model.js';
test('a save never overwrites storage another window changed',()=>{
 assert.equal(saveDecision('a','a','b'),'write');assert.equal(saveDecision(null,null,'b'),'write');
 assert.equal(saveDecision('a','c','b'),'conflict');assert.equal(saveDecision(null,'c','b'),'conflict');assert.equal(saveDecision('a',null,'b'),'conflict');
 assert.equal(saveDecision('a','b','b'),'same');
});
test('teacher preview seeds earlier observations without touching the student record',()=>{
 const student=fresh(),mine={id:'rock-0-dark',kind:'rock',claim:'dark',label:'mine'};student.drafts.rocks={step:0,passed:[],data:{evidence:{'rock-0-dark':mine}}};
 const raw=JSON.stringify(student),preview=seedPreview(structuredClone(student)),ev=id=>preview.drafts[id].data.evidence;
 assert.equal(JSON.stringify(student),raw);
 assert.deepEqual(ev('rocks')['rock-0-dark'],mine);
 assert.ok([0,1].every(i=>hasRockEvidence(preview.drafts.rocks.data,i)));
 assert.ok(CITY_SITES.every(s=>ev('city')['city-'+s.id].pair===true));
 assert.ok(FIELD_POINTS.every(p=>ev('river')[p.id].claim===p.claim));
 assert.ok(ev('volcano')['model-mouth']&&ev('volcano')['model-flow']);
 assert.equal(preview.drafts.river.data.prediction.demo,true);
 assert.ok(Object.values(preview.drafts).flatMap(d=>Object.values(d.data.evidence||{})).filter(e=>e!==ev('rocks')['rock-0-dark']).every(e=>e.demo===true));
});
