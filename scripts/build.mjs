import {cp,mkdir,rm,writeFile,readFile,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {RESIDENTS,residentArt} from '../src/residents.js';
import {TOOL_ASSETS} from '../src/adventure/rules.js';
import {backgroundForAsset,SHARED_STAGE_ASSETS,STAGE_ASSETS} from '../src/stage-art.js';
// macOS writes ._* sidecar files on the exFAT SSD; they must not reach dist or the precache list.
const isSidecar=f=>path.basename(f).startsWith('._');
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const p of ['index.html','src'])await cp(p,path.join('dist',p),{recursive:true,filter:f=>!isSidecar(f)});
// PNG originals stay in public/ for the asset scripts; the app only loads WebP.
await cp('public/assets','dist/assets',{recursive:true,filter:f=>!f.endsWith('.png')&&!isSidecar(f)});
// Precache the shell, playable scenes and video posters. Films and music still stream on demand.
const srcFiles=(await readdir('src',{recursive:true})).map(f=>f.split(path.sep).join('/')).filter(f=>/\.(m?js|css)$/.test(f)&&!isSidecar(f)).map(f=>'/src/'+f);
const refs=(await Promise.all(['index.html',...srcFiles.map(f=>f.slice(1))].map(f=>readFile(f,'utf8')))).join('\n').match(/\/assets\/[\w./-]+\.(?:webp|png|jpe?g|svg|woff2|js)/g)||[];
const textures=[...new Set([...SHARED_STAGE_ASSETS,...Object.values(STAGE_ASSETS).flat()])].map(n=>`/assets/${backgroundForAsset(n)}.webp`);
for(const url of textures)if(!existsSync(path.join('dist',url)))throw new Error(`Missing stage texture: ${url}`);
const posters=[...Object.keys(STAGE_ASSETS).flatMap(id=>[0,1].map(step=>`/assets/concepts/${id}-${step}.webp`)),'/assets/story/intro.webp','/assets/story/final.webp'];
const core=[...new Set(['/','/index.html',...srcFiles,...refs,...textures,...posters,...Object.keys(RESIDENTS).map(residentArt),...Object.values(TOOL_ASSETS).map(n=>`/assets/${n}.webp`)])].filter(u=>existsSync(path.join('dist',u)));
const name='geovalley-v3-'+Date.now();
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(name)},CORE=${JSON.stringify(core)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>/^geovalley-v[23]-/.test(k)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin||e.request.headers.has('range')||/^\\/assets\\/(?:story\\/[^/]+\\.mp4|audio\\/(?:main|final)-theme\\.mp3)$/i.test(new URL(e.request.url).pathname))return;e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r.ok)e.waitUntil(c.put(e.request,r.clone()));return r;}catch(error){const shell=e.request.mode==='navigate'&&await c.match('/index.html');if(shell)return shell;throw error;}}));});`);
const {version}=JSON.parse(await readFile('package.json','utf8'));
let html=await readFile('dist/index.html','utf8');html=html.replace('<html lang="ko">',`<html lang="ko" data-app-version="${version}">`).replace('</body>','<script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));</script></body>');await writeFile('dist/index.html',html);
// Copying onto exFAT recreates sidecars next to the copied files.
for(const f of await readdir('dist',{recursive:true}))if(isSidecar(f))await rm(path.join('dist',f),{force:true});
console.log(`Build ready: dist. ${core.length} shell, activity and poster files are precached; films and themes stream on demand.`);
