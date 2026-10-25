import {cp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {TOOL_ASSETS} from '../src/adventure/rules.js';
await mkdir('dist',{recursive:true});
for(const p of ['index.html','src'])await cp(p,path.join('dist',p),{recursive:true});
// PNG originals stay in public/ for the asset scripts; the app only loads WebP.
await cp('public/assets','dist/assets',{recursive:true,filter:f=>!f.endsWith('.png')});
// Precache what boot can touch: every module/style, plus static asset URLs in the HTML, boot modules and CSS (Phaser, fonts, title/map art). Videos stay network-only.
const srcFiles=(await readdir('src',{recursive:true})).map(f=>f.split(path.sep).join('/')).filter(f=>/\.(m?js|css)$/.test(f)).map(f=>'/src/'+f);
const refs=(await Promise.all(['index.html','src/main.js','src/map-adventure.js',...srcFiles.filter(f=>f.endsWith('.css')).map(f=>f.slice(1))].map(f=>readFile(f,'utf8')))).join('').match(/\/assets\/[\w./-]+\.(?:webp|png|jpe?g|svg|woff2|js)/g)||[];
const core=[...new Set(['/','/index.html',...srcFiles,...refs,...Object.values(TOOL_ASSETS).map(n=>`/assets/${n}.webp`)])].filter(u=>existsSync(path.join('dist',u)));
const name='geovalley-v3-'+Date.now();
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(name)},CORE=${JSON.stringify(core)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>/^geovalley-v[23]-/.test(k)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r.ok)e.waitUntil(c.put(e.request,r.clone()));return r;}catch(error){const shell=e.request.mode==='navigate'&&await c.match('/index.html');if(shell)return shell;throw error;}}));});`);
const {version}=JSON.parse(await readFile('package.json','utf8'));
let html=await readFile('dist/index.html','utf8');html=html.replace('<html lang="ko">',`<html lang="ko" data-app-version="${version}">`).replace('</body>','<script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));</script></body>');await writeFile('dist/index.html',html);
console.log(`Build ready: dist. ${core.length} boot files are precached; activity art and videos are cached when visited.`);
