import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const dir='C:/Users/bongb/.codex/generated_images/01a0d89f-abb4-7e81-92d4-8b424b8c3d98/';
const source=dir+'exec-488db5a6-fff8-4be1-afe0-7e862a03ed58.png';
const {width,height}=await sharp(source).metadata();
for(let i=0;i<4;i++)await sharp(source).extract({left:(i%2)*width/2,top:Math.floor(i/2)*height/2,width:width/2,height:height/2}).resize({width:700}).webp({quality:93}).toFile(`public/assets/rock-${i}.webp`);
const sprite=dir+'exec-622cc2ac-772b-41cf-b115-ef07fedaf7a0.png';
const m=await sharp(sprite).metadata();
for(let i=0;i<4;i++){const crop=await sharp(sprite).extract({left:i%2*m.width/2,top:Math.floor(i/2)*m.height/2,width:m.width/2,height:m.height/2}).toBuffer();await sharp(crop).trim().resize({height:180}).webp({quality:90}).toFile(`public/assets/river-pose-${i}.webp`);}
console.log('Four rock specimens and four River poses ready.');
