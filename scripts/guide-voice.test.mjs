import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,statSync}from'node:fs';
import{createHash}from'node:crypto';
import{guideRecordings}from'../src/guide-recordings.js';
import{STAGES}from'../src/model.js';
import{createDialogueText}from'../src/dialogue-text.js';
import{RESIDENTS,residentVoice}from'../src/residents.js';
globalThis.localStorage={getItem:()=>null};globalThis.document={hidden:false,querySelector:()=>null,addEventListener(){}};
const clips=[];globalThis.Audio=class{constructor(src){this.src=src;this.paused=true;this.currentTime=0;clips.push(this)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}addEventListener(){}};
const{guideFileForText,playGuideText}=await import('../src/guide-voice.js');
test('every guide recording maps exact visible text to a real file',()=>{assert.ok(Object.keys(guideRecordings).length>=27);for(const line of Object.values(guideRecordings)){assert.equal(guideFileForText(line.text),line.file);assert.equal(guideFileForText('  '+line.text+'\n'),line.file);assert.ok(statSync(new URL('../public/assets/voices/'+line.file,import.meta.url)).size>1000);}});
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

test('each resident reward reads thanks then stamp in that resident\'s own ElevenLabs voice',()=>{
 const production=new URL('../public/assets/voices/',import.meta.url);
 const {lines}=JSON.parse(readFileSync(new URL('../docs/VOICE-FILL-20261118.json',import.meta.url),'utf8'));
 const npc=JSON.parse(readFileSync(new URL('npc-elevenlabs/manifest.json',production),'utf8')).lines;
 for(const[id,resident]of Object.entries(RESIDENTS)){
  const row=lines.find(line=>line.key===`${id}-thanks`);
  const file=residentVoice(id,'thanks');
  assert.equal(row.speaker,resident.name);
  assert.equal(row.text,resident.thanks);
  assert.equal(row.file,'public/assets/voices/'+file);
  assert.equal(row.voiceId,npc.find(line=>line.key===`${id}-stamp`).voice);
  const bytes=readFileSync(new URL(file,production));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.ok(statSync(new URL(residentVoice(id,'stamp'),production)).size>1000);
 }
});

test('reward popups read the village change and each villain line has its own shipped recording',async()=>{
 const{MAP_VILLAINS}=await import('../src/map-villain-rules.js');
 const{lines}=JSON.parse(readFileSync(new URL('../docs/VOICE-FILL-20261118.json',import.meta.url),'utf8'));
 for(const stage of STAGES){const file=guideFileForText(stage.change);assert.ok(file,'no recording for: '+stage.change);assert.ok(statSync(new URL('../public/assets/voices/'+file,import.meta.url)).size>1000);}
 const voices=new Set();
 for(const v of MAP_VILLAINS){
  const parts=[...v.lines.map((t,i)=>['line'+i,t]),...v.hit.map((t,i)=>['hit'+i,t]),['finish',v.finish]];
  for(const[kind,text]of parts){
   const file=`villain/${v.id}-${kind}.mp3`,row=lines.find(line=>line.file==='public/assets/voices/'+file);
   assert.ok(row,'no provenance for '+file);assert.equal(row.text,text);voices.add(row.voiceId);
   assert.equal(createHash('sha256').update(readFileSync(new URL('../public/assets/voices/'+file,import.meta.url))).digest('hex'),row.sha256);
  }
 }
 assert.equal(voices.size,1);
});

test('intro, concept, tower and hint popups point at shipped recordings of their exact text',async()=>{
 const{HINTS}=await import('../src/adventure/hints.js');
 const{OPERATIONS}=await import('../src/field-operation-model.js');
 const ending=readFileSync(new URL('../src/ending.js',import.meta.url),'utf8');
 const scenes=Function('return '+ending.slice(ending.indexOf('const KEY_SCENES=')+17,ending.indexOf('};',ending.indexOf('const KEY_SCENES='))+1))();
 const concepts=readFileSync(new URL('../src/concepts.js',import.meta.url),'utf8');
 const CONCEPTS=Function('return '+concepts.slice(concepts.indexOf('export const CONCEPTS = ')+24,concepts.indexOf('\n};',concepts.indexOf('export const CONCEPTS = '))+3))();
 const lines=[...STAGES.map(s=>s.intro),...Object.values(OPERATIONS).map(o=>o.goal),
  ...Object.values(HINTS).flat(3),
  ...Object.values(scenes).map(k=>k.points.map(([term,text])=>term+' — '+text).join(' ')),
  ...Object.values(CONCEPTS).flat().flatMap(c=>[...c.cues,c.summary])];
 const pending=new Set();
 for(const text of lines){
  if(pending.has(text))continue;
  const file=guideFileForText(text);
  assert.ok(file,'no recording for: '+text);
  assert.ok(statSync(new URL('../public/assets/voices/'+file,import.meta.url)).size>1000);
 }
});
