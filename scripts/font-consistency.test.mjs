import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
async function sources(dir) {
  const items = await readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(items.filter(e => !e.name.startsWith('._')).map(async e => {
    const file = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    return e.isDirectory() ? sources(file) : /\.(css|js|ts)$/.test(e.name) ? [[file.pathname, await readFile(file, 'utf8')]] : [];
  }));
  return groups.flat();
}
test('font shorthand keeps NanumSquareNeo for dynamic and activity labels', async () => {
  for (const [file, source] of await sources(new URL('../src/', import.meta.url))) {
    for (const [font] of source.matchAll(/\bfont\s*:[^;}]+/g)) {
      if (/sans-serif|system-ui|Malgun|Georgia|serif/.test(font)) {
        assert.match(font, /NanumSquareNeo|var\(--font/, file + ': ' + font);
      }
    }
  }
});
