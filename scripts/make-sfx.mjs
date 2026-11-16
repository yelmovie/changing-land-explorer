// 지오밸리 성취 효과음을 코드로 합성해 public/assets/audio/에 MP3로 쓴다.
// 녹음·외부 샘플 없이 계산만 쓰므로 프로젝트 자체 제작물이다. 다시 만들기: node scripts/make-sfx.mjs
// 모든 성공 소리는 C장조로 위로 올라가고, 다시 해 보기 소리는 같은 높이로 짧게 두드려 실패처럼 들리지 않게 한다.
import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync, rmSync} from 'node:fs';
import path from 'node:path';

const SR = 44100;
const N = {C4:261.63,E4:329.63,G4:392,C5:523.25,D5:587.33,E5:659.26,G5:783.99,A5:880,B5:987.77,
  C6:1046.5,D6:1174.66,E6:1318.51,G6:1567.98,A6:1760,C7:2093,D7:2349.32,E7:2637.02};

let seed = 1;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// 감쇠하는 부분음 묶음. list: [배수, 크기, 감쇠 시간(초)]
function partials(out, t0, f, amp, list, attack = .002) {
  const s0 = Math.round(t0 * SR);
  for (const [ratio, gain, tau] of list) {
    const fr = f * ratio; if (fr > SR / 2 - 1000) continue;
    const w = 2 * Math.PI * fr / SR, len = Math.min(out.length - s0, Math.round(tau * 7 * SR));
    for (let i = 0; i < len; i++) { const t = i / SR; out[s0 + i] += amp * gain * Math.min(1, t / attack) * Math.exp(-t / tau) * Math.sin(w * i); }
  }
}
const marimba = (o, t, f, a) => { partials(o, t, f, a, [[1,1,.2],[3.93,.28,.045],[9.2,.07,.012]], .0015); noise(o, t, .004, a * .12, .5); };
const glock = (o, t, f, a, ring = 1) => partials(o, t, f, a, [[1,1,.55*ring],[2.76,.32,.17*ring],[5.4,.13,.06],[8.93,.05,.03]], .001);
const bell = (o, t, f, a) => partials(o, t, f, a, [[1,1,.5],[2,.24,.2],[3,.08,.08],[4.01,.04,.05]], .004);
const harp = (o, t, f, a) => partials(o, t, f, a, [[1,1,.55],[2,.45,.25],[3,.2,.12],[4,.1,.07]], .003);
const wood = (o, t, f, a) => partials(o, t, f, a, [[1,1,.035],[2.32,.3,.018],[4.1,.08,.008]], .0008);

// 높이가 미끄러지는 사인 '뽁' 소리 (f0에서 f1으로)
function pop(out, t0, f0, f1, dur, amp) {
  const s0 = Math.round(t0 * SR), len = Math.min(out.length - s0, Math.round(dur * SR)); let ph = 0;
  for (let i = 0; i < len; i++) {
    const k = i / len; ph += 2 * Math.PI * f0 * Math.pow(f1 / f0, k) / SR;
    out[s0 + i] += amp * Math.min(1, i / (SR * .003)) * (1 - k) ** 2 * Math.sin(ph);
  }
}
// 감쇠하는 잡음. lp(0~1)가 작을수록 둔하고, hp=true면 높은 쪽만 남긴다.
function noise(out, t0, dur, amp, lp = .3, hp = false) {
  const s0 = Math.round(t0 * SR), len = Math.min(out.length - s0, Math.round(dur * SR)); let y = 0;
  for (let i = 0; i < len; i++) { const x = rand() * 2 - 1; y += lp * (x - y); out[s0 + i] += amp * Math.exp(-i / (len / 4)) * (hp ? x - y : y); }
}
// 높은 글로켄 반짝임. 펜타토닉 음을 무작위로 흩뿌리고 점점 작아진다.
function sparkle(out, t0, span, count, amp) {
  const notes = [N.E6, N.G6, N.A6, N.C7, N.D7, N.E7];
  for (let i = 0; i < count; i++) {
    const t = t0 + span * (i / count) + rand() * span / count * .6;
    partials(out, t, notes[Math.floor(rand() * notes.length)], amp * (1 - i / count * .7), [[1,1,.14],[2.76,.2,.05]], .001);
  }
}
// 작은 방 울림 (병렬 콤 4개 + 올패스 2개)
function reverb(dry, wet) {
  const out = Float32Array.from(dry), combs = [.0297,.0371,.0411,.0437].map(d => ({d: Math.round(d * SR), b: new Float32Array(Math.round(d * SR)), i: 0, z: 0}));
  const ap = [.005,.0017].map(d => ({d: Math.round(d * SR), b: new Float32Array(Math.round(d * SR)), i: 0}));
  for (let n = 0; n < dry.length; n++) {
    let s = 0;
    for (const c of combs) { const y = c.b[c.i]; c.z = y * .7 + c.z * .3; c.b[c.i] = dry[n] + c.z * .72; c.i = (c.i + 1) % c.d; s += y; }
    s /= 4;
    for (const a of ap) { const y = a.b[a.i]; const v = s + y * .5; a.b[a.i] = v; s = y - v * .5; a.i = (a.i + 1) % a.d; }
    out[n] += wet * s;
  }
  return out;
}

const SOUNDS = {
  // 정답·단계 성공: 도-미-솔-도 위로 오르는 반짝 화음
  success: [1.1, .2, o => {
    [N.C5, N.E5, N.G5].forEach((f, i) => { marimba(o, i * .07, f, .5); glock(o, i * .07, f, .35); });
    glock(o, .21, N.C6, .8, 1.3); bell(o, .21, N.C6, .35); marimba(o, .21, N.C5, .3);
    sparkle(o, .25, .45, 6, .12);
  }],
  // 맞는 자리에 놓았을 때: 솔-도 '딩동'
  good: [.6, .15, o => { glock(o, 0, N.G5, .55); marimba(o, 0, N.G5, .45); glock(o, .075, N.C6, .8); marimba(o, .075, N.C6, .35); }],
  // 배지·메달 줍기: 짧은 동전 소리
  coin: [.55, .12, o => { glock(o, 0, N.B5, .55, .25); glock(o, .06, N.E6, .85, .9); }],
  // 물건 집어 들기: 위로 올라가는 작은 뽁
  lift: [.16, 0, o => { pop(o, 0, 380, 760, .09, .8); }],
  // 다시 해 보기: 같은 높이로 '톡톡'. 내려가지 않아 실패처럼 들리지 않는다.
  retry: [.38, .08, o => { wood(o, 0, 640, .8); wood(o, .11, 640, .6); }],
  // 장소를 마치고 도구 받기: 빠른 오름 + 큰 화음
  reward: [1.6, .25, o => {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => { marimba(o, i * .06, f, .5); glock(o, i * .06, f, .25); });
    for (const f of [N.C6, N.E6, N.G6]) bell(o, .28, f, .45);
    glock(o, .28, N.C7, .3, 1.4); marimba(o, .28, N.C4, .45);
    sparkle(o, .3, .85, 10, .12);
  }],
  // 도장 다섯 개 축제: 따-따-따-따안 + 색종이 뽁뽁 + 반짝
  fanfare: [2.2, .28, o => {
    [0, .13, .26].forEach(t => { marimba(o, t, N.G5, .55); glock(o, t, N.G5, .25, .4); });
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => harp(o, .42 + i * .015, f, .4));
    for (const f of [N.C6, N.E6, N.G6]) bell(o, .42, f, .35);
    glock(o, .42, N.C7, .35, 1.5); marimba(o, .42, N.C4, .5);
    [.48, .62, .76].forEach((t, i) => pop(o, t, 500 + i * 120, 1000 + i * 200, .07, .35));
    sparkle(o, .48, 1.2, 18, .13);
  }],
  // 마을이 깨어날 때: 하프처럼 위로 쓸어 올리기
  'village-rise': [1.6, .3, o => {
    [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C6, N.E6, N.G6, N.C7].forEach((f, i) => harp(o, i * .055, f, .38 + i * .02));
    bell(o, .56, N.C6, .3); bell(o, .56, N.G6, .22);
    sparkle(o, .55, .6, 6, .08);
  }],
  // 친구 도장: 쿵 찍고 딩
  'stamp-ding': [.75, .15, o => {
    pop(o, 0, 220, 150, .07, .5); noise(o, 0, .04, .3, .25);
    glock(o, .06, N.C6, .5); marimba(o, .06, N.C6, .3); glock(o, .14, N.G6, .6);
  }],
  // 악당 맞히기: 퍽 + 위로 튀는 띵
  hit: [.42, .1, o => { noise(o, 0, .06, .5, .5); pop(o, 0, 260, 900, .12, .7); glock(o, .03, N.E6, .35, .4); }],
  // 악당 퇴치: 펑 + 반짝 오름
  defeat: [1.1, .22, o => {
    noise(o, 0, .28, .5, .15);
    [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => { marimba(o, .08 + i * .06, f, .4); glock(o, .08 + i * .06, f, .35); });
    sparkle(o, .3, .5, 8, .12);
  }],
  // 지진 경고: 낮은 쿵 + 위로 오르는 두 음 반복 (주의를 끌지만 무섭지 않게)
  alert: [.75, .12, o => { pop(o, 0, 90, 50, .25, .45); [[0, N.G4], [.1, N.D5], [.25, N.G4], [.35, N.D5]].forEach(([t, f]) => marimba(o, t, f, .7)); }],
  // 힌트 열기: 작은 요정 반짝
  twinkle: [.7, .3, o => { glock(o, 0, N.E6, .45); glock(o, .08, N.A6, .5); sparkle(o, .14, .3, 4, .08); }],
  // 증거 기록(관찰 수첩에 담기): 찰칵 + 띵
  capture: [.45, .1, o => { noise(o, 0, .015, .5, .6, true); noise(o, .045, .015, .4, .6, true); glock(o, .06, N.A6, .4, .6); }]
};

const root = path.resolve(import.meta.dirname, '..'), work = path.join(root, '.work', 'sfx-build'), outDir = path.join(root, 'public', 'assets', 'audio');
mkdirSync(work, {recursive: true});
for (const [name, [sec, wet, draw]] of Object.entries(SOUNDS)) {
  seed = [...name].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % 2147483647 || 1;
  const dry = new Float32Array(Math.ceil(sec * SR)); draw(dry);
  const mix = wet ? reverb(dry, wet) : dry;
  const fade = Math.round(.03 * SR); for (let i = 0; i < fade; i++) mix[mix.length - 1 - i] *= i / fade;
  const peak = mix.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1, gain = .89 / peak;
  const pcm = Buffer.alloc(44 + mix.length * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + mix.length * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(mix.length * 2, 40);
  mix.forEach((v, i) => pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * gain * 32767))), 44 + i * 2));
  const wav = path.join(work, name + '.wav');
  writeFileSync(wav, pcm);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '3', path.join(outDir, name + '.mp3')]);
  console.log(`${name}.mp3 ${sec}s`);
}
if (!process.argv.includes('--keep-wav')) rmSync(work, {recursive: true, force: true});
