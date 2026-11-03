// CC0 source audio and license are bundled in /assets/audio/CREDITS.md.
import {setMusicMaster} from './music.js';
const players = new Map();
const fieldSounds = {
  'trail-step': {volume:.22, fallback:'move'},
  'notebook-open': {volume:.32, fallback:'observe'},
  'notebook-page': {volume:.28, fallback:'move'},
  'tool-reward': {volume:.32, fallback:'complete'}
};
let enabled = true, active = null, last = 0;
export function stopSounds() {
  if (active) { active.pause(); active.currentTime = 0; }
  active = null;
}
export function setSoundEnabled(value) { enabled = value; setMusicMaster(value); if (!value) stopSounds(); }
export function playSound(name = 'click', {force = false, inDialog = false} = {}) {
  if (!enabled || document.hidden || (!inDialog && document.querySelector('dialog[open]'))) return;
  const now = performance.now();
  if (!force && now - last < 100) return;
  last = now;
  stopSounds();
  let sound = players.get(name);
  if (!sound) {
    sound = new Audio();
    const clip = fieldSounds[name];
    sound.preload = 'none';
    const file = clip && sound.canPlayType('audio/ogg; codecs="vorbis"') ? name+'.ogg' : (clip?.fallback ?? name)+'.mp3';
    sound.src = '/assets/audio/'+file;
    players.set(name, sound);
  }
  sound.volume = fieldSounds[name]?.volume ?? (name === 'water' ? .24 : name === 'complete' ? .38 : .3);
  active = sound;
  sound.play().catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSounds(); });
