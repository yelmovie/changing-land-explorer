// CC0 source audio and license are bundled in /assets/audio/CREDITS.md.
const players = new Map();
let enabled = true, active = null, last = 0;
export function stopSounds() {
  if (active) { active.pause(); active.currentTime = 0; }
  active = null;
}
export function setSoundEnabled(value) { enabled = value; if (!value) stopSounds(); }
export function playSound(name = 'click', {force = false} = {}) {
  if (!enabled || document.hidden || document.querySelector('dialog[open]')) return;
  const now = performance.now();
  if (!force && now - last < 100) return;
  last = now;
  stopSounds();
  let sound = players.get(name);
  if (!sound) { sound = new Audio(`/assets/audio/${name}.mp3`); sound.preload = 'none'; players.set(name, sound); }
  sound.volume = name === 'water' ? .24 : name === 'complete' ? .38 : .3;
  active = sound;
  sound.play().catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSounds(); });
