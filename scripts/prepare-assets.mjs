import {createRequire} from 'node:module';
import {mkdir,copyFile,readdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require('D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
await mkdir('public/assets/fonts',{recursive:true});
const files=await readdir('image');
const scenes=['river-lab','river-field','volcano-lab','volcano-field','rocks-lab','rocks-table','city-before','city-eruption','classroom','school'];
for(let i=0;i<10;i++){const f=files.find(f=>f.includes('09_38_')&&f.endsWith(`-${i+1}.png`));await sharp('image/'+f).resize(1600,1000,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(`public/assets/${scenes[i]}.webp`);}
await sharp('public/assets/map-original.png').webp({quality:92}).toFile('public/assets/map.webp');
await sharp('C:/Users/bongb/.codex/generated_images/01a0d89f-abb4-7e81-92d4-8b424b8c3d98/exec-66fdaa83-fd42-44bd-8750-96c43a7d8ac4.png').trim().resize({height:700}).webp({quality:90}).toFile('public/assets/river-hero.webp');
for(const f of ['jua-korean-400.woff2','jua-latin-400.woff2','Jua-OFL.txt'])await copyFile('D:/iscreammedia_sc34/1udangtangtang/public/assets/fonts/'+f,'public/assets/fonts/'+f);
console.log('Optimized scene illustrations and explorer portrait ready.');
