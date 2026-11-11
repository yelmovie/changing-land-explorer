// Render the ten GeoValley concept films and replace the app's copies in place.
// Usage (from the repo root): node films/concepts/render.mjs [film ...]
// Needs the hyperframes CLI (0.9.26), ffmpeg on PATH and Playwright (PLAYWRIGHT_PATH=<.../playwright/index.mjs>). Set TMPDIR to external storage.
// Output keeps the app's names: public/assets/concepts/{film}.mp4|webm|webp + manifest.json.
import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync, statSync, readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const out = path.join(repo, 'public/assets/concepts');
const work = path.join(process.env.TMPDIR || path.join(here, '.renders'), 'geovalley-films');
mkdirSync(work, {recursive: true});
const FILMS = ['river-0', 'river-1', 'volcano-0', 'volcano-1', 'rocks-0', 'rocks-1', 'city-0', 'city-1', 'safety-0', 'safety-1'];
const SECONDS = 15;
const postersOnly = process.argv.includes('--posters-only'); // re-encode posters from existing masters
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const posters = [];
// The 0.9.26 static-frame dedup capture path clips the caption band on this
// Chrome build. Capture every frame and verify the decoded output below.
const renderEnv = {...process.env, HYPERFRAMES_NO_TELEMETRY: '1', HF_STATIC_DEDUP: 'false'};
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (process.platform === 'darwin' && !renderEnv.HYPERFRAMES_BROWSER_PATH && existsSync(macChrome)) {
  // HyperFrames treats an override as a headless-shell binary. Explicitly
  // enable headless mode when the available executable is full Chrome.
  const launcher = path.join(work, 'headless-chrome.sh');
  writeFileSync(launcher, `#!/bin/sh\nexec '${macChrome}' --headless=new "$@"\n`, {mode: 0o755});
  renderEnv.HYPERFRAMES_BROWSER_PATH = launcher;
}
const run = (cmd, args) => execFileSync(cmd, args, {stdio: ['ignore', 'pipe', 'inherit'], env: renderEnv});

for (const film of FILMS.filter((f) => !only.length || only.includes(f))) {
  if (postersOnly) { posters.push(film); continue; }
  const master = path.join(work, `${film}-1080.mp4`);
  run('hyperframes', ['render', here, '--variables', JSON.stringify({film}), '--workers', '1', '--no-browser-gpu', '--quality', 'looks', '--output', master, '--quiet']);
  // Reject a clipped master before replacing any playable app assets.
  const band = run('ffmpeg', ['-v', 'error', '-ss', '13', '-i', master, '-frames:v', '1', '-vf', 'scale=1280:720,crop=1280:48:0:672', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1']);
  let inkPixels = 0;
  for (let i = 0; i < band.length; i += 3) {
    if (band[i] < 140 && band[i + 1] < 150 && band[i + 2] < 140) inkPixels++;
  }
  if (inkPixels <= 200) throw new Error(`${film}: decoded caption band is clipped. Inspect the capture output before publishing.`);
  // App copies: 1280×720, H.264 with faststart, VP9 WebM, and the last frame as the poster.
  run('ffmpeg', ['-v', 'error', '-y', '-i', master, '-vf', 'scale=1280:720:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, `${film}.mp4`)]);
  run('ffmpeg', ['-v', 'error', '-y', '-i', master, '-vf', 'scale=1280:720:flags=lanczos', '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', path.join(out, `${film}.webm`)]);
  run('ffmpeg', ['-v', 'error', '-y', '-ss', String(SECONDS - 0.1), '-i', master, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', path.join(work, `${film}.png`)]);
  posters.push(film);
  const size = (ext) => statSync(path.join(out, `${film}.${ext}`)).size;
  console.log(`${film}: mp4 ${size('mp4')} B, webm ${size('webm')} B`);
}
// This ffmpeg build has no WebP encoder, so Chrome (Playwright) encodes the last frames.
if (posters.length) {
  const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_PATH || 'playwright').href);
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const page = await browser.newPage();
  for (const film of posters) {
    const png = readFileSync(path.join(work, `${film}.png`)).toString('base64');
    const webp = await page.evaluate(async (data) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + data; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
      return c.toDataURL('image/webp', 0.82).split(',')[1];
    }, png);
    writeFileSync(path.join(out, `${film}.webp`), Buffer.from(webp, 'base64'));
    console.log(`${film}: poster ${statSync(path.join(out, `${film}.webp`)).size} B`);
  }
  await browser.close();
}
writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(FILMS.map((key) => ({key, seconds: SECONDS, width: 1280, height: 720, muted: true})), null, 2) + '\n');
