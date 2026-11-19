import test from 'node:test';
import assert from 'node:assert/strict';
const stored = new Map([['moving-geovalley-effects-volume','70'], ['moving-geovalley-voice-volume','80']]);
globalThis.localStorage = {getItem:key=>stored.get(key)??null, setItem:(key,value)=>stored.set(key,value)};
const events = new Map();
globalThis.document = {hidden:false, querySelector:()=>null, addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);}};
const players=[];
let rejectNextVoice = false;
globalThis.Audio=class {
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;players.push(this);}
  canPlayType(){return 'probably';}
  play(){this.paused=false;if(rejectNextVoice && this.src?.includes('/voices/')){rejectNextVoice=false;return Promise.reject(Error('autoplay blocked'));}return Promise.resolve();}
  pause(){this.paused=true;}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  listeners={};
};
const audio=await import('../src/sound.js');
const ui=await import('../src/audio-settings.js');
const music=await import('../src/music.js');
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
// Music level changes glide for 180 ms.
const settle=()=>new Promise(resolve=>setTimeout(resolve,260));
const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-6,`${label??'level'}: ${actual} is not ${expected}`);
const MAIN='/assets/audio/main-theme.mp3',FINAL='/assets/audio/final-theme.mp3';
test('audio preferences, live gain, cancellation and UI integration',async()=>{
  assert.equal(audio.effectsVolume(),70);assert.equal(audio.voiceVolume(),80);
  audio.playSound('click',{force:true});const effect=players.at(-1);
  assert.ok(Math.abs(effect.volume-.21)<1e-8);
  audio.setEffectsVolume(50);assert.equal(effect.volume,.15);
  audio.playVoice('momo.mp3');const firstVoice=players.at(-1);
  audio.setVoiceVolume(50);assert.equal(firstVoice.volume,.45);
  audio.playVoice('momo-next.mp3');assert.equal(firstVoice.paused,true);
  const voice=players.at(-1);audio.stopVoice();assert.equal(voice.paused,true);
  audio.playCue('stamp');await tick();const cue=players.at(-1);
  audio.setEffectsVolume(25);assert.equal(cue.volume,.105);
  const count=players.length;audio.playCue('festival',50);audio.stopAllSounds();
  await new Promise(resolve=>setTimeout(resolve,65));assert.equal(players.length,count);assert.equal(cue.paused,true);
  audio.setEffectsVolume(0);audio.playSound('complete',{force:true});audio.playCue('stamp');await tick();assert.equal(players.length,count);
  audio.setVoiceVolume(0);audio.playVoice('momo.mp3');assert.equal(players.length,count);
  audio.setEffectsVolume(100);audio.setVoiceVolume(100);audio.setSoundEnabled(false);
  audio.playSound('click',{force:true});audio.playVoice('momo.mp3');audio.playCue('stamp');await tick();assert.equal(players.length,count);
  audio.setSoundEnabled(true);audio.playVoice('momo.mp3');const hiddenVoice=players.at(-1);audio.playCue('stamp',50);
  document.hidden=true;events.get('visibilitychange').forEach(fn=>fn());assert.equal(hiddenVoice.paused,true);
  const hiddenCount=players.length;await new Promise(resolve=>setTimeout(resolve,65));assert.equal(players.length,hiddenCount);
  document.hidden=false;assert.equal(hiddenVoice.paused,true);
  assert.equal(music.musicVolume(),30);
  audio.setEffectsVolume(-5);assert.equal(audio.effectsVolume(),0);audio.setVoiceVolume(200);assert.equal(audio.voiceVolume(),100);
  assert.equal(stored.get('moving-geovalley-effects-volume'),'0');assert.equal(stored.get('moving-geovalley-voice-volume'),'100');
  assert.equal(stored.size,2);
  assert.match(ui.audioSettingsHTML(),/효과음 크기/);assert.match(ui.audioSettingsHTML(),/주민 목소리 크기/);assert.match(ui.audioSettingsHTML(),/음소거/);
  // The voice slider covers River, the residents and the villains; the note says so and the slider points to it.
  assert.match(ui.audioSettingsHTML(),/id="voice-volume"[^>]*aria-describedby="voice-volume-note"/);assert.match(ui.audioSettingsHTML(),/id="voice-volume-note">주민 목소리 크기는 리버와 주민, 악당의 말소리/);
  const input={value:'35',setAttribute(key,value){this[key]=value;}},output={};
  ui.bindAudioSettings({querySelector:selector=>selector==='#effects-volume'?input:selector==='output[for="effects-volume"]'?output:null});
  input.oninput();assert.equal(audio.effectsVolume(),35);assert.equal(output.textContent,'35%');assert.equal(input['aria-valuetext'],'35%');
  localStorage.setItem=()=>{throw Error('blocked');};assert.doesNotThrow(()=>audio.setEffectsVolume(60));
  audio.stopAllSounds();
});

test('a voice line turns the BGM down to a quarter without stopping it and every tag is returned', async()=>{
  audio.setSoundEnabled(true);audio.setVoiceVolume(100);document.hidden=false;
  for(const type of ['pointerdown','pointerup','keydown','click'])assert.ok(events.get(type)?.length,type+' can start the music');
  events.get('pointerdown').forEach(fn=>fn({isTrusted:false}));
  assert.equal(players.some(player=>player.src===MAIN),false,'scripted input does not start the music');
  events.get('pointerdown').forEach(fn=>fn({isTrusted:true}));
  const bgm=players.find(player=>player.src===MAIN);
  assert.ok(bgm);assert.equal(bgm.paused,false);near(bgm.volume,.3,'normal');
  audio.playVoice('first.mp3');const first=players.at(-1);const oldEnd=first.onended;
  assert.equal(bgm.paused,false,'a line never stops the music');
  assert.ok(bgm.volume>.075,'the level glides instead of jumping');await settle();near(bgm.volume,.075,'under a line');
  audio.playVoice('second.mp3');const second=players.at(-1);
  oldEnd();await settle();near(bgm.volume,.075,'a replaced line cannot release the newer tag');assert.equal(second.paused,false);
  second.onended();assert.equal(bgm.paused,false);await settle();near(bgm.volume,.3,'after the line');
  oldEnd();audio.stopVoice();await settle();near(bgm.volume,.3);
  audio.playVoice('error.mp3');players.at(-1).onerror();await settle();near(bgm.volume,.3,'a broken clip returns its tag');
  rejectNextVoice=true;audio.playVoice('reject.mp3');await settle();near(bgm.volume,.3,'a refused clip returns its tag');
  // An old rejected promise must not release a newer voice's tag.
  rejectNextVoice=true;audio.playVoice('stale-reject.mp3');audio.playVoice('new.mp3');
  await settle();near(bgm.volume,.075);assert.equal(bgm.paused,false);
  audio.setVoiceVolume(0);const count=players.length;await settle();near(bgm.volume,.3,'muting the voice returns its tag');
  audio.setVoiceVolume(100);assert.equal(players.length,count);
  audio.playVoice('muted.mp3');audio.setSoundEnabled(false);assert.equal(bgm.paused,true,'the master switch still stops the music');
  audio.setSoundEnabled(true);assert.equal(bgm.paused,false);near(bgm.volume,.3,'the line was stopped with the switch');
  audio.playVoice('hidden.mp3');document.hidden=true;events.get('visibilitychange').forEach(fn=>fn());assert.equal(bgm.paused,true);
  document.hidden=false;events.get('visibilitychange').forEach(fn=>fn());assert.equal(bgm.paused,false);near(bgm.volume,.3);
  // Tags are separate: an open concept film keeps the music low after a line inside it ends, and they do not stack.
  const releaseConcept=music.duckMusic('concept');audio.playVoice('caption.mp3');await settle();near(bgm.volume,.075,'two reasons, one level');
  audio.stopVoice();await settle();near(bgm.volume,.075,'the concept film still holds its tag');assert.equal(bgm.paused,false);
  releaseConcept();releaseConcept();await settle();near(bgm.volume,.3,'all tags returned');
  const extra=music.duckMusic('voice');await settle();near(bgm.volume,.075,'a second release of an old tag removed nothing else');
  extra();await settle();near(bgm.volume,.3);
  audio.stopAllSounds();audio.setSoundEnabled(false);
});

test('the map finale plays the final theme while its dialog is open and hands the main theme back', async()=>{
  audio.setSoundEnabled(true);audio.setVoiceVolume(100);document.hidden=false;
  const bgm=players.find(player=>player.listeners.ended);
  const finale=open=>events.get('map-finale').forEach(fn=>fn({detail:{open}}));
  assert.equal(bgm.src,MAIN);bgm.readyState=4;bgm.currentTime=40;
  finale(true);
  assert.equal(bgm.src,FINAL);assert.equal(bgm.loop,false);assert.equal(bgm.currentTime,0,'the final theme starts from the top');
  assert.equal(bgm.paused,false);near(bgm.volume,.3,'final theme');
  audio.playVoice('villain/safety-exit.mp3');await settle();near(bgm.volume,.075,'a line over the final theme');
  audio.stopVoice();await settle();near(bgm.volume,.3);
  bgm.currentTime=6;finale(false);
  assert.equal(bgm.src,MAIN);assert.equal(bgm.loop,true);assert.equal(bgm.currentTime,40,'the main theme returns where it left off');near(bgm.volume,.3);
  // The final theme is 24 s. When it runs out the main theme carries on quietly until the dialog closes.
  finale(true);finale(true);bgm.currentTime=24;bgm.listeners.ended.forEach(fn=>fn());
  assert.equal(bgm.src,MAIN);assert.equal(bgm.loop,true);assert.equal(bgm.paused,false);near(bgm.volume,.135,'after the final theme');
  finale(false);assert.equal(bgm.src,MAIN);await settle();near(bgm.volume,.3,'back on the map');
  // Ending screens: the same hand-over, and moving between them does not restart the finished theme.
  music.musicScene('final');assert.equal(bgm.src,FINAL);near(bgm.volume,.3);
  bgm.listeners.ended.forEach(fn=>fn());assert.equal(bgm.src,MAIN);near(bgm.volume,.135);
  music.musicScene('final');assert.equal(bgm.src,MAIN);
  music.musicScene('main');await settle();assert.equal(bgm.src,MAIN);near(bgm.volume,.3);
  music.musicScene('final');assert.equal(bgm.src,FINAL);music.musicScene('main');assert.equal(bgm.src,MAIN);
  audio.stopAllSounds();audio.setSoundEnabled(false);
});

test('where element volume cannot change, a spoken line still pauses the music', async()=>{
  const Settable=globalThis.Audio,before=events.get('pointerdown').length;
  globalThis.Audio=class extends Settable{get volume(){return 1;}set volume(value){}};
  const fixed=await import('../src/music.js?fixed-volume');
  events.get('pointerdown').slice(before).forEach(fn=>fn({isTrusted:true}));
  globalThis.Audio=Settable;
  const bgm=players.at(-1);assert.equal(bgm.src,MAIN);assert.equal(bgm.paused,false);
  const release=fixed.duckMusic('voice');assert.equal(bgm.paused,true);
  release();assert.equal(bgm.paused,false);
  fixed.setMusicMaster(false);assert.equal(bgm.paused,true);
});

test('field effects duck under NPC speech and restore after it ends', async()=>{
 audio.setSoundEnabled(true);audio.setEffectsVolume(100);audio.setVoiceVolume(100);document.hidden=false;
 audio.playSound('water',{force:true});const effect=players.at(-1);assert.equal(effect.volume,.24);
 audio.playVoice('resident.m4a');assert.equal(effect.volume,.24*.3);
 audio.setEffectsVolume(50);assert.equal(effect.volume,.24*.5*.3);
 audio.playCue('stamp');await tick();const cue=players.at(-1);assert.equal(cue.volume,.42*.5*.3);
 audio.stopVoice();assert.equal(effect.volume,.24*.5);assert.equal(cue.volume,.42*.5);
 audio.stopAllSounds();audio.setSoundEnabled(false);
});

test('map fight cues keep playing at 80% or more while a villain or River line plays', async()=>{
 audio.setSoundEnabled(true);audio.setEffectsVolume(100);audio.setVoiceVolume(100);document.hidden=false;
 audio.playCue('attack-swing');await tick();const swing=players.at(-1);
 assert.equal(swing.paused,false);assert.equal(swing.volume,.55);
 audio.playVoice('villain/volcano-hit0.mp3');
 assert.equal(swing.paused,false,'a voice never stops a fight cue');assert.ok(swing.volume>=.55*.7);
 audio.playCue('hit-light');audio.playCue('villain-exit',20);await tick();await tick();
 const [hit,exit]=players.slice(-2);
 for(const [cue,base] of [[hit,.9],[exit,.5]]){assert.equal(cue.paused,false);assert.ok(cue.volume>0&&cue.volume>=base*.7,cue.src+' '+cue.volume);}
 // Card and interface sounds still duck to 30% under a voice.
 audio.playCue('card-reveal');await tick();assert.equal(players.at(-1).volume,.5*.3);
 audio.stopVoice();assert.equal(swing.volume,.55);
 audio.stopAllSounds();audio.setSoundEnabled(false);
});

test('resident motion follows playing events and clears on interruption', async()=>{
 audio.setSoundEnabled(true);audio.setVoiceVolume(100);document.hidden=false;
 const states=[];
 audio.playVoice('first.m4a',{onState:playing=>states.push(playing)});
 const first=players.at(-1),stalePlaying=first.onplaying;
 assert.deepEqual(states,[],'a play request alone does not start portrait motion');
 first.onplaying();assert.deepEqual(states,[true]);
 first.onwaiting();assert.equal(states.at(-1),false);
 first.onplaying();assert.equal(states.at(-1),true);
 const nextStates=[];
 audio.playVoice('second.m4a',{onState:playing=>nextStates.push(playing)});
 assert.equal(states.at(-1),false);
 stalePlaying();assert.equal(states.at(-1),false,'replaced audio cannot restart its portrait');
 const second=players.at(-1);second.onplaying();assert.equal(nextStates.at(-1),true);
 second.onended();assert.equal(nextStates.at(-1),false);
 audio.playVoice('muted.m4a',{onState:playing=>nextStates.push(playing)});
 players.at(-1).onplaying();audio.setVoiceVolume(0);assert.equal(nextStates.at(-1),false);
 audio.setVoiceVolume(100);
 audio.playVoice('hidden.m4a',{onState:playing=>nextStates.push(playing)});
 players.at(-1).onplaying();document.hidden=true;events.get('visibilitychange').forEach(fn=>fn());
 assert.equal(nextStates.at(-1),false);
 document.hidden=false;
 rejectNextVoice=true;audio.playVoice('rejected.m4a',{onState:playing=>nextStates.push(playing)});
 await tick();assert.equal(nextStates.at(-1),false);
 audio.stopAllSounds();audio.setSoundEnabled(false);
});

test('achievement effects use the rising synthesized clips and climb on a streak', async()=>{
 const {existsSync}=await import('node:fs');
 audio.setSoundEnabled(true);audio.setEffectsVolume(100);document.hidden=false;
 const files={complete:'success',place:'good',pickup:'lift',retry:'retry','tool-reward':'reward','village-wake':'village-rise',festival:'fanfare',stamp:'stamp-ding',hit:'hit',defeat:'defeat',alert:'alert',coin:'coin',hint:'twinkle',observe:'capture','attack-swing':'map-swing','hit-light':'map-hit-1','hit-light-2':'map-hit-2','hit-heavy':'map-hit-heavy','villain-exit':'map-exit','villain-appear':'map-appear','hurt-bump':'map-bump','victory-jingle':'map-victory'};
 for(const [name,file] of Object.entries(files)){
  audio.playSound(name,{force:true});const src=players.at(-1).src;
  assert.equal(src,`/assets/audio/${file}.mp3`,name);assert.ok(existsSync('public'+src),src);
 }
 assert.ok(players.some(p=>p.src==='/assets/audio/click.mp3'),'button clicks keep the short click');
 const rates=[];for(let i=0;i<9;i++){audio.playSound('coin',{force:true});rates.push(players.find(p=>p.src.endsWith('/coin.mp3')).playbackRate);}
 assert.ok(rates[1]>rates[0]&&rates[2]>rates[1],'each quick repeat climbs');
 assert.equal(rates[8],rates[7],'the climb stops at a fifth');assert.ok(Math.abs(rates[8]-2**(7/12))<1e-9);
 audio.playSound('retry',{force:true});audio.playSound('coin',{force:true});assert.equal(players.find(p=>p.src.endsWith('/coin.mp3')).playbackRate,1,'a retry resets the combo');
 audio.stopAllSounds();audio.setSoundEnabled(false);
});

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// The walker calls playStep() on every frame it really moves.
const walk=async ms=>{const end=performance.now()+ms;while(performance.now()<end){audio.playStep();await pause(15);}};
test('footsteps come about every 0.3 s while walking, never cut or get cut by other sounds, and follow the switches', async()=>{
 audio.setSoundEnabled(true);audio.setEffectsVolume(100);audio.setVoiceVolume(100);document.hidden=false;
 const proto=globalThis.Audio.prototype,own=Object.hasOwn(proto,'play'),play=proto.play,stamps=[];
 proto.play=function(){if(this.src.includes('trail-step'))stamps.push(performance.now());return play.call(this);};
 try{
  audio.playSound('click',{force:true});const click=players.find(p=>p.src.endsWith('/click.mp3'));assert.equal(click.paused,false);
  audio.playCue('hit-heavy');await tick();const hit=players.at(-1);
  const before=players.length;
  await walk(950);
  assert.equal(stamps.length,4,'steps at 0, 290, 580 and 870 ms');
  for(let i=1;i<stamps.length;i++){const gap=stamps[i]-stamps[i-1];assert.ok(gap>=280&&gap<=320,'gap '+gap);}
  assert.equal(players.length,before+2,'a left and a right step player');const [left,right]=players.slice(-2);
  assert.equal(left.src,'/assets/audio/trail-step.ogg');assert.equal(left.volume,.16);
  assert.ok(left.playbackRate>=.94&&left.playbackRate<=1,'left foot '+left.playbackRate);assert.ok(right.playbackRate>=1&&right.playbackRate<=1.06,'right foot '+right.playbackRate);
  assert.equal(click.paused,false,'steps leave the interface sound alone');assert.equal(hit.paused,false,'steps leave the fight cue alone');
  await pause(450);assert.equal(stamps.length,4,'no step once the walk has stopped');
  audio.playSound('retry',{force:true});assert.equal(click.paused,true,'interface sounds replace each other');
  assert.equal(right.paused,false,'an interface sound never cuts a step');assert.equal(hit.paused,false,'an interface sound never cuts a fight cue');
  audio.playVoice('guide.mp3');assert.equal(right.volume,.08,'half under a voice');
  await walk(100);assert.equal(stamps.length,5);assert.equal(players.filter(p=>p.src.includes('trail-step')).length,2,'the two step players are reused');assert.equal(left.volume,.08);
  audio.stopVoice();assert.equal(left.volume,.16);
  await pause(350);const open=document.querySelector;document.querySelector=()=>({});
  await walk(350);assert.equal(stamps.length,5,'no steps behind a dialog');document.querySelector=open;
  audio.setEffectsVolume(0);assert.equal(left.paused,true);await walk(350);assert.equal(stamps.length,5,'effects volume 0');
  audio.setEffectsVolume(100);audio.setSoundEnabled(false);await walk(350);assert.equal(stamps.length,5,'sound off');
  audio.setSoundEnabled(true);document.hidden=true;await walk(350);assert.equal(stamps.length,5,'hidden tab');document.hidden=false;
  await walk(100);assert.equal(stamps.length,6);audio.stopAllSounds();assert.equal(left.paused&&right.paused,true);
  await pause(350);assert.equal(stamps.length,6,'stopping everything also ends the pacing');
 }finally{if(own)proto.play=play;else delete proto.play;audio.setSoundEnabled(false);}
});

test('River\'s map line waits up to 2 s for a villain line that has already started', async()=>{
 audio.setSoundEnabled(true);audio.setVoiceVolume(100);document.hidden=false;
 audio.playVoice('villain/river-line0.mp3',{reaction:true});const villain=players.at(-1);
 assert.equal(audio.reactionBusy(),true);
 const count=players.length;
 audio.playVoiceAfterReaction('guide-a.mp3');
 assert.equal(players.length,count);assert.equal(villain.paused,false,'the villain keeps talking');assert.equal(audio.voiceWaiting(),true);
 audio.playVoiceAfterReaction('');
 assert.equal(villain.paused,false,'unrecorded text leaves the villain line alone');assert.equal(audio.voiceWaiting(),false);
 audio.playVoiceAfterReaction('guide-b.mp3');villain.onended();
 await pause(130);const guide=players.at(-1);
 assert.equal(guide.src,'/assets/voices/guide-b.mp3');assert.equal(guide.paused,false);assert.equal(audio.reactionBusy(),false);assert.equal(audio.voiceWaiting(),false);
 audio.playVoiceAfterReaction('guide-c.mp3');assert.equal(guide.paused,true,'an ordinary line is replaced at once');assert.equal(players.at(-1).src,'/assets/voices/guide-c.mp3');
 audio.playVoiceAfterReaction('');assert.equal(players.at(-1).paused,true,'unrecorded text still ends River\'s previous line');
 audio.playVoice('villain/river-hit0.mp3',{reaction:true});const long=players.at(-1);
 audio.playVoiceAfterReaction('guide-d.mp3');
 await pause(1800);assert.equal(long.paused,false);
 await pause(450);assert.equal(long.paused,true,'after 2 s River speaks anyway');assert.equal(players.at(-1).src,'/assets/voices/guide-d.mp3');
 // A line that replaces the waiting one does not restart the 2 s.
 audio.playVoice('villain/river-line1.mp3',{reaction:true});const steady=players.at(-1);
 audio.playVoiceAfterReaction('guide-f.mp3');await pause(1200);audio.playVoiceAfterReaction('guide-g.mp3');
 await pause(500);assert.equal(steady.paused,false);
 await pause(550);assert.equal(steady.paused,true,'2 s count from the first wait');assert.equal(players.at(-1).src,'/assets/voices/guide-g.mp3');
 audio.playVoice('villain/river-hit1.mp3',{reaction:true});audio.playVoiceAfterReaction('guide-e.mp3');
 const last=players.length;audio.stopAllSounds();await pause(130);assert.equal(players.length,last,'leaving drops the waiting line');
 audio.setSoundEnabled(false);
});

test('a celebration jingle reports itself until it ends and interface sounds do not cut it', async()=>{
 audio.setSoundEnabled(true);audio.setEffectsVolume(100);document.hidden=false;
 assert.equal(audio.cueBusy('card-complete'),false);
 audio.playCue('card-complete');assert.equal(audio.cueBusy('card-complete'),true,'queued counts');
 await tick();const jingle=players.at(-1);assert.equal(jingle.src,'/assets/audio/card-complete.mp3');
 assert.equal(audio.cueBusy('card-complete'),true);assert.equal(audio.cueBusy('victory-jingle'),false);
 audio.playSound('click',{force:true});await walk(100);assert.equal(jingle.paused,false);
 jingle.onended();assert.equal(audio.cueBusy('card-complete'),false);
 const stop=audio.playCue('victory-jingle',30);stop();assert.equal(audio.cueBusy('victory-jingle'),false);
 audio.stopAllSounds();audio.setSoundEnabled(false);
});

test('every field sound has an existing MP3 for browsers without Ogg Vorbis', async()=>{
 const {existsSync}=await import('node:fs');
 audio.setSoundEnabled(true);audio.setEffectsVolume(100);document.hidden=false;
 const Plain=globalThis.Audio;globalThis.Audio=class extends Plain{canPlayType(){return '';}};
 for(const name of ['trail-step','notebook-open','notebook-page','workplace-open','lamp-light','resident-pop','letter-open']){
  audio.playCue(name);await tick();const src=players.at(-1).src;
  assert.match(src,/\.mp3$/,name);assert.ok(existsSync('public'+src),name+' -> '+src);
 }
 globalThis.Audio=Plain;audio.stopAllSounds();audio.setSoundEnabled(false);
});
