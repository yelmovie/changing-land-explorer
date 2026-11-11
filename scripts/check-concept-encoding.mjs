// Check the shipped movie, including the caption band omitted by one Chrome capture path.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, mkdir, writeFile} from 'node:fs/promises';

const manifest = JSON.parse(await readFile('public/assets/concepts/manifest.json', 'utf8'));
const out = process.env.CHECK_OUT || '.work/concept-encoding';
const results = [];
await mkdir(out, {recursive: true});
for (const film of manifest) {
  for (const extension of ['mp4', 'webm']) {
    const file = `public/assets/concepts/${film.key}.${extension}`;
    const metadata = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries',
      'stream=width,height:format=duration', '-of', 'json', file
    ], {encoding: 'utf8'}));
    assert.equal(metadata.streams[0].width, film.width);
    assert.equal(metadata.streams[0].height, film.height);
    assert.ok(Math.abs(Number(metadata.format.duration) - film.seconds) < 0.1);
    const pixels = execFileSync('ffmpeg', [
      '-v', 'error', '-ss', '13', '-i', file, '-frames:v', '1',
      '-vf', 'crop=1280:48:0:672', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1'
    ]);
    let inkPixels = 0;
    for (let i = 0; i < pixels.length; i += 3) {
      if (pixels[i] < 140 && pixels[i + 1] < 150 && pixels[i + 2] < 140) inkPixels++;
    }
    results.push({file, seconds: Number(metadata.format.duration), inkPixels});
  }
}
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2) + '\n');
assert.ok(results.every(result => result.inkPixels > 200), 'The decoded caption band must contain text or its border, not a blank capture strip.');
console.log(`PASS ${results.length} encoded movies, 15-second duration and intact bottom caption band.`);
