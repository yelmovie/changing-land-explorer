import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,statSync}from'node:fs';
import{createHash}from'node:crypto';
import{guideRecordings}from'../src/guide-recordings.js';
import{STAGES}from'../src/model.js';
import{createDialogueText}from'../src/dialogue-text.js';
import{RESIDENTS,residentVoice}from'../src/residents.js';
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

test('dialogue first activation reveals text and second can advance',()=>{
 const node={textContent:''};let complete=0;
 const writer=createDialogueText(node,()=>complete++);
 writer.show('나루와 함께 물방울 💧');
 assert.equal(node.textContent,'');assert.equal(writer.typing,true);
 assert.equal(writer.finish(),true);assert.equal(node.textContent,'나루와 함께 물방울 💧');
 assert.equal(writer.typing,false);assert.equal(writer.finish(),false);
 assert.equal(complete,2);writer.stop();
});

test('new dialogue and close cancel the old reveal timer',async()=>{
 const node={textContent:''};const writer=createDialogueText(node,()=>{});
 writer.show('이전 대사');writer.show('새 대사',true);
 await new Promise(resolve=>setTimeout(resolve,55));
 assert.equal(node.textContent,'새 대사');assert.equal(writer.typing,false);
 writer.show('닫힌 뒤에 표시되면 안 되는 대사');writer.stop();
 await new Promise(resolve=>setTimeout(resolve,55));
 assert.equal(node.textContent,'');
});


test('each resident uses its own four complete dialogue recordings and three prepared portraits',()=>{
 const base=new URL('../public/assets/',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('voices/npc-elevenlabs/manifest.json',base),'utf8'));
 assert.equal(manifest.lines.length,20);
 const lines=new Map(manifest.lines.map(line=>[line.key,line]));
 const voices=new Set();
 for(const[id,resident]of Object.entries(RESIDENTS)){
  const tracks=[['hello',resident.hello],['chat0',resident.chat[0][1]],['chat1',resident.chat[1][1]],['stamp',resident.stampLine]];
  const residentVoices=new Set();
  for(const[key,text]of tracks){
   const row=lines.get(`${id}-${key}`),src='voices/'+residentVoice(id,key);
   assert.equal(row.text,text);
   assert.equal(row.src,'/assets/'+src);
   const file=readFileSync(new URL(src,base));
   assert.equal(createHash('sha256').update(file).digest('hex'),row.sha256);
   residentVoices.add(row.voice);
  }
  assert.equal(residentVoices.size,1);
  voices.add([...residentVoices][0]);
  for(const frame of ['neutral','think','happy'])assert.ok(statSync(new URL(`npc-expressions/${id}-${frame}.webp`,base)).size>1000);
 }
 assert.equal(voices.size,5);
});
