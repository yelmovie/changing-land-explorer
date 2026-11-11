import test from 'node:test';import assert from 'node:assert/strict';import{statSync}from'node:fs';
import{guideRecordings}from'../src/guide-recordings.js';
import{STAGES}from'../src/model.js';
globalThis.localStorage={getItem:()=>null};globalThis.document={hidden:false,querySelector:()=>null,addEventListener(){}};
const clips=[];globalThis.Audio=class{constructor(src){this.src=src;this.paused=true;this.currentTime=0;clips.push(this)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}addEventListener(){}};
const{guideFileForText,playGuideText}=await import('../src/guide-voice.js');
test('all 27 guide recordings map exact visible text to real files',()=>{assert.equal(Object.keys(guideRecordings).length,27);for(const line of Object.values(guideRecordings)){assert.equal(guideFileForText(line.text),line.file);assert.equal(guideFileForText('  '+line.text+'\n'),line.file);assert.ok(statSync(new URL('../public/assets/voices/'+line.file,import.meta.url)).size>1000);}});
test('each stage has a recorded arrival caption independent of its changing mission brief',()=>{
 for(const stage of STAGES){
  const line=guideRecordings[`guide-intro-${stage.id}`];
  assert.ok(line.text);
  assert.equal(guideFileForText(line.text),`guide-intro-${stage.id}.mp3`);
 }
});
test('unknown text never requests a nonexistent voice; next known line replaces the old one',()=>{const lines=Object.values(guideRecordings);assert.equal(playGuideText('unrecorded line'),false);assert.equal(clips.length,0);playGuideText(lines[0].text);const first=clips.at(-1);playGuideText(lines[1].text);assert.equal(first.paused,true);assert.equal(clips.at(-1).src,'/assets/voices/'+lines[1].file);});
