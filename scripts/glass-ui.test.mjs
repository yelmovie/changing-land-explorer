import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/glass-ui.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('scenic glass layer is last and keeps readable surfaces and focus',()=>{
 assert.ok(html.indexOf('/src/glass-ui.css')>html.indexOf('/src/concept-focus.css'));
 assert.match(css,/--glass-control:rgba\(250,255,246,\.78\)/);
 assert.match(css,/#overlay dialog \{background:rgba\(250,255,246,\.9\)/);
 assert.match(css,/prefers-reduced-transparency:reduce/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/(?:^|[;{])\s*opacity\s*:/m);
});
