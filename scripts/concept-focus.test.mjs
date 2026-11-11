import test from 'node:test';
import assert from 'node:assert/strict';
import {emphasizeConcept,bindConceptFocus} from '../src/concept-focus.js';
import {readFileSync} from 'node:fs';
test('concept render command preserves the current fifteen-second film pipeline',()=>{
 const packageJSON=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(packageJSON.scripts['concepts:render'],'node films/concepts/render.mjs');
 const manifest=JSON.parse(readFileSync(new URL('../public/assets/concepts/manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.length,10);
 assert.ok(manifest.every(film=>film.seconds===15));
});
test('concept highlighting escapes text, including terms',()=>{assert.equal(emphasizeConcept('<img onerror="x"> 자석',['자석']),'&lt;img onerror=&quot;x&quot;&gt; <mark class="science-keyword">자석</mark>');});
test('long phrases win without nested marks',()=>{assert.equal(emphasizeConcept('같은 힘, 힘',['힘','같은 힘']),( '<mark class="science-keyword">같은 힘</mark>, <mark class="science-keyword">힘</mark>'));});
test('water does not highlight the word plant',()=>{assert.equal(emphasizeConcept('식물은 물을 받아.',['물']),'식물은 <mark class="science-keyword">물</mark>을 받아.');});
test('regular expression characters are literal',()=>{assert.equal(emphasizeConcept('N+S / NXS',['N+S']),'<mark class="science-keyword">N+S</mark> / NXS');});
test('server and missing DOM hosts are safe',()=>{assert.equal(typeof bindConceptFocus(null,null,{steps:[],terms:[]}), 'function');});
