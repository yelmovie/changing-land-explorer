import {effectsVolume, setEffectsVolume, voiceVolume, setVoiceVolume} from './sound.js';

export function audioSettingsHTML() {
  return [['effects', '효과음 크기', effectsVolume()], ['voice', '주민 목소리 크기', voiceVolume()]].map(([kind, label, value]) => `<label class="setting-row music-setting" for="${kind}-volume">${label}<span><input id="${kind}-volume" type="range" min="0" max="100" step="5" value="${value}" aria-valuetext="${value === 0 ? '음소거' : value + '%'}"><output for="${kind}-volume">${value === 0 ? '음소거' : value + '%'}</output></span></label>`).join('') + '<p class="settings-note">0으로 맞추면 해당 소리만 꺼져요. 전체 소리를 끄면 모든 소리가 멈춰요.</p>';
}

export function bindAudioSettings(root) {
  for (const [kind, setter] of [['effects', setEffectsVolume], ['voice', setVoiceVolume]]) {
    const input = root.querySelector(`#${kind}-volume`);
    if (!input) continue;
    input.oninput = () => {
      setter(input.value);
      const text = Number(input.value) === 0 ? '음소거' : `${input.value}%`;
      input.setAttribute('aria-valuetext', text);
      const output = root.querySelector(`output[for="${kind}-volume"]`);
      if (output) output.textContent = text;
    };
  }
}
