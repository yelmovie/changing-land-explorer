import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,saveDecision,seedPreview,loadProgress,SAVE_KEY} from '../src/model.js';
import {hasRockEvidence,FIELD_POINTS,CITY_SITES} from '../src/learning-model.js';
import {imageEvidence} from '../src/explore-ui.js';
import {chapterState,chapterComplete} from '../src/adventure/rules.js';
test('a save never overwrites storage another window changed',()=>{
 assert.equal(saveDecision('a','a','b'),'write');assert.equal(saveDecision(null,null,'b'),'write');
 assert.equal(saveDecision('a','c','b'),'conflict');assert.equal(saveDecision(null,'c','b'),'conflict');assert.equal(saveDecision('a',null,'b'),'conflict');
 assert.equal(saveDecision('a','b','b'),'same');
});
test('teacher preview seeds earlier observations without touching the student record',()=>{
 const student=fresh(),mine={id:'rock-0-dark',kind:'rock',claim:'dark',label:'mine'};student.drafts.rocks={step:0,passed:[],data:{evidence:{'rock-0-dark':mine}}};
 student.drafts.volcano={step:0,passed:[],data:{assembly:['tray']}};
 const raw=JSON.stringify(student),preview=seedPreview(structuredClone(student)),ev=id=>preview.drafts[id].data.evidence;
 assert.equal(JSON.stringify(student),raw);
 assert.deepEqual(ev('rocks')['rock-0-dark'],mine);
 assert.ok([0,1].every(i=>hasRockEvidence(preview.drafts.rocks.data,i)));
 assert.ok(CITY_SITES.every(s=>ev('city')['city-'+s.id].pair===true));
 assert.ok(FIELD_POINTS.every(p=>ev('river')[p.id].claim===p.claim));
 assert.ok(ev('volcano')['model-mouth']&&ev('volcano')['model-flow']);
 assert.equal(preview.drafts.river.data.prediction.demo,true);
 assert.deepEqual(preview.drafts.volcano.data.assembly,['tray','mountain','water']);
 assert.equal(ev('safety')['safety-desk'].demo,true);
 assert.deepEqual(preview.completed,[]);assert.equal(preview.finished,false);
 assert.ok(Object.values(preview.drafts).flatMap(d=>Object.values(d.data.evidence||{})).filter(e=>e!==ev('rocks')['rock-0-dark']).every(e=>e.demo===true));
});

test('damaged nested notebook fields recover without changing the saved original or unrelated progress',()=>{
 const source=fresh();source.completed=['river'];source.residentStamps=['river'];
 source.drafts.river={step:1,passed:[0],data:{runs:[{water:1,complete:true,version:1}],evidence:{}}};
 const valid={id:'output-lava',kind:'volcano',claim:'lava',point:{x:.4,y:.7},label:'내 용암 기록',text:'내 관찰은 유지돼.'};
 const data={assembly:['tray','mountain','water'],evidence:{
  model:{id:'model-mouth',kind:'model',sceneVersion:1,parts:{tray:true},point:{x:.5,y:.3},time:1,label:'모형 입구'},
  comparison:{id:'compare-opening',kind:'comparison',parts:null,time:1,label:'모형 비교'},
  route:{id:'route',kind:'route',points:[null,{x:10,y:20},{x:'30',y:40},{x:100,y:120}],label:'안전길'},
  rock:{id:'rock-0-dark',kind:'rock',asset:'rock-0',point:{x:.5,y:.5},annotations:[null,{x:.2,y:.3},{x:NaN,y:.1}],label:'암석 표시'},
  valid
 }};
 source.drafts.volcano={step:0,passed:[],data};source.records.volcano={summary:'완성한 내 기록',data:structuredClone(data)};
 const raw=JSON.stringify(source),storage=new Map([[SAVE_KEY,raw]]),recovered=loadProgress({getItem:k=>storage.get(k)??null});
 assert.equal(storage.get(SAVE_KEY),raw,'loading does not overwrite the stored original');
 assert.deepEqual(recovered.completed,source.completed);assert.deepEqual(recovered.residentStamps,source.residentStamps);
 assert.deepEqual(recovered.drafts.river.data.runs,source.drafts.river.data.runs);
 for(const repaired of [recovered.drafts.volcano.data,recovered.records.volcano.data]){
  assert.deepEqual(repaired.evidence.model.parts,source.drafts.volcano.data.assembly);
  assert.deepEqual(repaired.evidence.comparison.parts,source.drafts.volcano.data.assembly);
  assert.deepEqual(repaired.evidence.route.points,[{x:10,y:20},{x:100,y:120}]);
  assert.deepEqual(repaired.evidence.rock.annotations,[{x:.2,y:.3}]);
  assert.deepEqual(repaired.evidence.valid,valid);
  for(const e of Object.values(repaired.evidence))assert.doesNotThrow(()=>imageEvidence(e),'the actual notebook renderer accepts every repaired item');
 }
 assert.deepEqual(source.drafts.volcano.data.evidence.model.parts,{tray:true},'input state is not mutated');
 assert.equal(source.drafts.volcano.data.evidence.route.points[0],null);
});

test('damaged intermediate work repairs its own fields without completing discoveries',()=>{
 const data={adventure:{version:1,chapters:{0:{phase:2,tasks:{0:{done:true,summary:'내가 이미 마친 발견'}},work:{
  0:{parts:{tray:true},dust:[null,[0,1,null,30,1]],found:{lava:true},pour:.4},
  1:{scanned:[0,null,5,'4',100,0],proofs:'dark',lens:'broken'},
  2:{marks:{erosion:true},sorted:[null,0,'1',500],links:true,pairs:null,seen:true,board:'broken'}
 }}}}};
 const chapter=chapterState(data,0);
 assert.equal(chapter.phase,1,'cannot jump past unfinished learning actions');assert.equal(chapterComplete(data,0),false);
 assert.deepEqual(chapter.tasks,{0:{done:true,summary:'내가 이미 마친 발견'}});
 assert.deepEqual(chapter.work[0],{parts:[],dust:[[],[0,1]],found:[],pour:.4});
 assert.deepEqual(chapter.work[1],{scanned:[0,5],proofs:[]});
 assert.deepEqual(chapter.work[2],{marks:[],sorted:[0],links:[],pairs:[],seen:{},board:{}});
 assert.doesNotThrow(()=>chapter.work[0].parts.includes('tray'));
 assert.doesNotThrow(()=>chapter.work[0].dust.forEach(cells=>cells.forEach(()=>{})));
 assert.doesNotThrow(()=>chapter.work[2].sorted.some(id=>[{type:'basalt'},{type:'granite'}][id].type==='granite'));
 const once=JSON.stringify(data),scanned=chapter.work[1].scanned,dust=chapter.work[0].dust;
 chapterState(data,0);assert.equal(JSON.stringify(data),once,'valid repaired progress is stable on the next visit');
 assert.equal(chapter.work[1].scanned,scanned,'active scene references to valid work remain usable');assert.equal(chapter.work[0].dust,dust);
});
