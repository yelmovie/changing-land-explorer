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
  addEventListener(){}
};
const audio=await import('../src/sound.js');
const ui=await import('../src/audio-settings.js');
const music=await import('../src/music.js');
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
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
  const input={value:'35',setAttribute(key,value){this[key]=value;}},output={};
  ui.bindAudioSettings({querySelector:selector=>selector==='#effects-volume'?input:selector==='output[for="effects-volume"]'?output:null});
  input.oninput();assert.equal(audio.effectsVolume(),35);assert.equal(output.textContent,'35%');assert.equal(input['aria-valuetext'],'35%');
  localStorage.setItem=()=>{throw Error('blocked');};assert.doesNotThrow(()=>audio.setEffectsVolume(60));
  audio.stopAllSounds();
});

test('voice holds BGM and releases exactly once without stale playback', async()=>{
  audio.setSoundEnabled(true);audio.setVoiceVolume(100);document.hidden=false;
  events.get('click').forEach(fn=>fn({isTrusted:true}));
  const bgm=players.find(player=>player.src==='/assets/audio/main-theme.mp3');
  assert.ok(bgm);assert.equal(bgm.paused,false);
  audio.playVoice('first.mp3');const first=players.at(-1);const oldEnd=first.onended;
  assert.equal(bgm.paused,true);
  audio.playVoice('second.mp3');const second=players.at(-1);
  oldEnd();assert.equal(bgm.paused,true);assert.equal(second.paused,false);
  second.onended();assert.equal(bgm.paused,false);
  oldEnd();audio.stopVoice();assert.equal(bgm.paused,false);
  audio.playVoice('error.mp3');players.at(-1).onerror();assert.equal(bgm.paused,false);
  rejectNextVoice=true;audio.playVoice('reject.mp3');assert.equal(bgm.paused,true);
  await tick();assert.equal(bgm.paused,false);
  // An old rejected promise must not release a newer voice's music hold.
  rejectNextVoice=true;audio.playVoice('stale-reject.mp3');audio.playVoice('new.mp3');
  await tick();assert.equal(bgm.paused,true);
  audio.setVoiceVolume(0);const count=players.length;assert.equal(bgm.paused,false);
  audio.setVoiceVolume(100);assert.equal(players.length,count);assert.equal(bgm.paused,false);
  audio.playVoice('muted.mp3');audio.setSoundEnabled(false);assert.equal(bgm.paused,true);
  audio.setSoundEnabled(true);assert.equal(bgm.paused,false);
  audio.playVoice('hidden.mp3');document.hidden=true;events.get('visibilitychange').forEach(fn=>fn());assert.equal(bgm.paused,true);
  document.hidden=false;events.get('visibilitychange').forEach(fn=>fn());assert.equal(bgm.paused,false);
  const releaseExternal=music.holdMusic();audio.playVoice('external.mp3');audio.stopVoice();assert.equal(bgm.paused,true);
  releaseExternal();assert.equal(bgm.paused,false);
  audio.stopAllSounds();audio.setSoundEnabled(false);
});
