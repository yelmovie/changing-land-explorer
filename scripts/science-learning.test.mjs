import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCIENCE_LEARNING, scienceText} from '../src/science-learning.js';
import {PHASES} from '../src/adventure/rules.js';
import {freshOperation, operate} from '../src/field-operation-model.js';

test('all 30 discoveries have a curriculum-linked, short science focus', () => {
  let count = 0;
  for (const [id, chapters] of Object.entries(PHASES)) {
    const science = SCIENCE_LEARNING[id];
    assert.match(science.standard, /^4과11-0[1-4]$/);
    assert.equal(science.focus.length, chapters.length);
    chapters.forEach((phases, chapter) => {
      assert.equal(science.focus[chapter].length, phases.length);
      science.focus[chapter].forEach(focus => {
        assert.ok(focus.length >= 10 && focus.length <= 45);
        count++;
      });
    });
  }
  assert.equal(count, 30);
});

test('science emphasis preserves spoken text and escapes markup in saved evidence', () => {
  const text = '침식으로 깎인 흙을 운반하고 퇴적해.';
  const highlighted = scienceText(text, 'river');
  assert.equal(highlighted.replace(/<[^>]+>/g, ''), text);
  assert.equal((highlighted.match(/<mark /g) || []).length, 3);
  assert.equal(scienceText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('handoff labels match the concept then field-operation destination', () => {
  const activity = readFileSync(new URL('../src/adventure/index.js', import.meta.url), 'utf8');
  const concepts = readFileSync(new URL('../src/concepts.js', import.meta.url), 'utf8');
  assert.ok(activity.includes("phase<2?'다음 발견':'개념 정리'"));
  assert.ok(concepts.includes("ctx.step===0?'다음 활동으로':'현장 임무로'"));
  assert.equal(PHASES.volcano[0][1], '붉은 물 흐름');
});

test('volcano transfer requires distinguishing the model from real ejecta', () => {
  let state = freshOperation();
  state = operate('volcano', state, 'signed').state;
  state = operate('volcano', state, 'shelter').state;
  const wrong = operate('volcano', state, 'crater');
  assert.equal(wrong.state.step, 2);
  assert.equal(wrong.state.done, false);
  assert.match(wrong.message, /모형.*실제/);
  const correct = operate('volcano', wrong.state, 'station');
  assert.equal(correct.state.done, true);
  assert.match(correct.message, /용암.*기체.*화산재.*암석 조각/);
});

test('a bridge test without a placement asks for a choice before judging the evidence', () => {
  const result = operate('river', {...freshOperation(), step: 1}, 'test');
  assert.equal(result.state.step, 1);
  assert.match(result.message, /먼저 골라/);
});
