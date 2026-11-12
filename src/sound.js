// CC0 source audio and license are bundled in /assets/audio/CREDITS.md.
import {setMusicMaster, holdMusic} from './music.js';
const players = new Map();
// Audio preferences are independent from student progress and BGM preferences.
const effectsKey = 'moving-geovalley-effects-volume';
const voiceKey = 'moving-geovalley-voice-volume';
const clampVolume = value => Math.min(100, Math.max(0, Number(value) || 0));
function readVolume(key) {
  try { const value = localStorage.getItem(key); if (value !== null && Number.isFinite(Number(value))) return clampVolume(value); } catch {}
  return 100;
}
let effectsLevel = readVolume(effectsKey), voiceLevel = readVolume(voiceKey);
const baseVolumes = new WeakMap();
export const effectsVolume = () => effectsLevel;
export const voiceVolume = () => voiceLevel;
function saveVolume(key, value) { try { localStorage.setItem(key, String(value)); } catch {} }
function effectVolume(audio, base) { baseVolumes.set(audio, base); audio.volume = base * effectsLevel / 100 * (voice ? .3 : 1); }
function refreshEffectLevels() {
  if (active) effectVolume(active, baseVolumes.get(active));
  cues.forEach(cue => effectVolume(cue, baseVolumes.get(cue)));
}
export function setEffectsVolume(value) {
  effectsLevel = clampVolume(value); saveVolume(effectsKey, effectsLevel);
  refreshEffectLevels();
  if (!effectsLevel) { stopSounds(); stopCues(); }
}
export function setVoiceVolume(value) {
  voiceLevel = clampVolume(value); saveVolume(voiceKey, voiceLevel);
  if (voice) voice.volume = .9 * voiceLevel / 100;
  if (!voiceLevel) stopVoice();
}
const fieldSounds = {
  'trail-step': {volume:.22, fallback:'move'},
  'notebook-open': {volume:.32, fallback:'observe'},
  'notebook-page': {volume:.28, fallback:'move'},
  'tool-reward': {volume:.32, fallback:'complete'},
  'workplace-open': {volume:.3, fallback:'move'},
  'lamp-light': {volume:.3, fallback:'observe'},
  'village-wake': {volume:.34, fallback:'complete'},
  'resident-pop': {volume:.26, fallback:'pickup'},
  'stamp': {volume:.42, fallback:'place'},
  'festival': {volume:.34, fallback:'complete'},
  'letter-open': {volume:.3, fallback:'notebook-page'}
};
const sourceFor = (name, audio) => {
  const clip = fieldSounds[name];
  return '/assets/audio/' + (clip && audio.canPlayType('audio/ogg; codecs="vorbis"') ? name+'.ogg' : (clip?.fallback ?? name)+'.mp3');
};
let enabled = true, active = null, last = 0;
export function stopSounds() {
  if (active) { active.pause(); active.currentTime = 0; }
  active = null;
}
export function setSoundEnabled(value) { enabled = value; setMusicMaster(value); if (!value) stopAllSounds(); }
export function playSound(name = 'click', {force = false, inDialog = false} = {}) {
  if (!enabled || !effectsLevel || document.hidden || (!inDialog && document.querySelector('dialog[open]'))) return;
  const now = performance.now();
  if (!force && now - last < 100) return;
  last = now;
  stopSounds();
  let sound = players.get(name);
  if (!sound) {
    sound = new Audio();
    sound.preload = 'none';
    sound.src = sourceFor(name, sound);
    players.set(name, sound);
  }
  effectVolume(sound, fieldSounds[name]?.volume ?? (name === 'water' ? .24 : name === 'complete' ? .38 : .3));
  active = sound;
  sound.play().catch(() => {});
}
// 지도 연출처럼 여러 소리가 겹쳐야 할 때 쓴다. 효과음 하나만 남기는 playSound와 달리 앞 소리를 끊지 않는다.
const cues = new Set(),pendingCues = new Set();
export function playCue(name, delay = 0) {
  if (!enabled || !effectsLevel || document.hidden) return () => {};
  let cue;
  const stop = () => {
    clearTimeout(timer);pendingCues.delete(stop);
    if (cue) { cue.pause(); cue.currentTime = 0; cues.delete(cue); }
  };
  const timer = setTimeout(() => {
    pendingCues.delete(stop);
    if (!enabled || !effectsLevel || document.hidden) return;
    cue = new Audio();
    cue.src = sourceFor(name, cue);
    effectVolume(cue, fieldSounds[name]?.volume ?? .3);
    cues.add(cue);
    cue.onended = () => cues.delete(cue);
    cue.play().catch(() => cues.delete(cue));
  }, delay);
  pendingCues.add(stop);
  return stop;
}
// 주민 목소리. 새 대사가 나오면 앞 대사는 멈춘다. 파일이 없으면 조용히 넘어간다.
let voice = null, releaseVoiceMusic = null, voiceState = null;
export function stopVoice() {
  const previous = voice, release = releaseVoiceMusic, notify = voiceState;
  voice = null; releaseVoiceMusic = null; voiceState = null;
  if (previous) {
    previous.onended = null; previous.onerror = null;
    previous.onplaying = previous.onpause = previous.onwaiting = previous.onemptied = null;
    previous.pause(); previous.currentTime = 0;
  }
  refreshEffectLevels();
  release?.();
  notify?.(false);
}
export function playVoice(file, {onState} = {}) {
  if (!enabled || !voiceLevel || document.hidden || !file) { stopVoice(); onState?.(false); return; }
  // Acquire the next hold before releasing the previous one to avoid a BGM blip.
  const release = holdMusic();
  stopVoice();
  const clip = new Audio('/assets/voices/'+file);
  voice = clip; releaseVoiceMusic = release; voiceState = onState;
  refreshEffectLevels();
  clip.volume = .9 * voiceLevel / 100;
  const finish = () => { if (voice === clip) stopVoice(); };
  clip.onended = finish;
  clip.onerror = finish;
  clip.onplaying = () => { if (voice === clip) onState?.(!clip.paused && !document.hidden); };
  clip.onpause = clip.onwaiting = clip.onemptied = () => { if (voice === clip) onState?.(false); };
  try { clip.play().catch(finish); } catch { finish(); }
}
function stopCues() { pendingCues.forEach(stop => stop()); cues.forEach(cue => { cue.pause(); cue.currentTime = 0; }); cues.clear(); }
export function stopAllSounds() { stopSounds(); stopVoice(); stopCues(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAllSounds(); });
