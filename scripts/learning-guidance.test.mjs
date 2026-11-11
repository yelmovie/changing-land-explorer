import test from 'node:test';
import assert from 'node:assert/strict';
import {HINTS,HINT_KINDS,recordHint} from '../src/adventure/hints.js';
import {LEARNING_GUIDE,learningGuideHTML} from '../src/learning-guide.js';
import {fresh,sanitize,STAGES} from '../src/model.js';
test('all 90 hints classify observation, gesture and answer independently',()=>{
 let count=0;
 for(const [stage,steps] of Object.entries(HINTS))steps.forEach((phases,step)=>phases.forEach((cues,phase)=>cues.forEach((_,index)=>{
  const w={},kind=HINT_KINDS[stage][step][phase][index];assert.ok(['o','g','a'].includes(kind));assert.equal(recordHint(w,stage,step,phase,index),true);assert.equal(w.answerHint===true,kind==='a');count++;
 })));
 assert.equal(count,90);
});
test('observation and gesture help do not mark a learner as receiving the answer',()=>{
 const w={};recordHint(w,'rocks',0,1,0);assert.equal(w.observationHint,true);assert.equal(w.answerHint,undefined);
 recordHint(w,'rocks',0,1,1);assert.equal(w.operationHelp,true);assert.equal(w.answerHint,undefined);assert.equal(w.hintLevel,2);
});
test('a disclosed answer persists through later general help and save restore',()=>{
 const s=fresh(),w={answerHint:true};recordHint(w,'river',0,2,2);recordHint(w,'river',0,2,0);
 s.drafts.river={step:0,data:{adventure:{version:1,chapters:{0:{work:{2:w}}}}}};
 const copy=sanitize(JSON.parse(JSON.stringify(s))).drafts.river.data.adventure.chapters[0].work[2];
 assert.equal(copy.answerHint,true);assert.equal(copy.hintLevel,3);assert.equal(copy.operationHelp,true);
});
test('legacy answer flags remain intact and unknown cues do not mutate records',()=>{
 const w={answerHint:true};recordHint(w,'rocks',0,1,0);assert.equal(w.answerHint,true);const raw=JSON.stringify(w);assert.equal(recordHint(w,'unknown',0,0,0),false);assert.equal(JSON.stringify(w),raw);
});
test('ten learning activities map to standards, evidence and distinct stage actions',()=>{
 assert.deepEqual(LEARNING_GUIDE.map(s=>s.id),STAGES.map(s=>s.id));
 for(const stage of LEARNING_GUIDE){assert.equal(stage.standard,STAGES.find(s=>s.id===stage.id).standard);assert.equal(stage.activities.length,2);assert.match(stage.source,/^https:\/\//);assert.ok(stage.transfer&&stage.caution);for(const a of stage.activities)assert.ok(a.goal&&a.action&&a.evidence);}
 assert.match(learningGuideHTML(),/완료와 보상은 활동을 마쳤다는 뜻/);assert.match(learningGuideHTML(),/같은 표본의 방향/);
});


test('current hints guide observation and operation while preserving learner choices',()=>{
 assert.equal(Object.values(HINT_KINDS).flat(3).includes('a'),false);
 assert.match(HINTS.volcano[1][1][1],/비교/);
 assert.match(HINTS.safety[0][1][1],/튼튼한 곳/);
});
