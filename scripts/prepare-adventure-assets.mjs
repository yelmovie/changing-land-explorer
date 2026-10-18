import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require('D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const source='C:/Users/bongb/.codex/generated_images/01a14f11-237a-7481-8445-dae3d74f8298/';
const originals='image/generated-20261018/';
await mkdir(originals,{recursive:true});
const inputs={map:'exec-40fb4351-a687-47ff-88ee-207262e010dd.png',tools:'exec-d5d48854-bdee-4626-9581-527ca3da59d1.png',poses:'exec-f630f33f-7159-4d33-9a4a-aaafb9b63793.png'};
for(const [key,file]of Object.entries(inputs))await copyFile(source+file,originals+key+'.png');
await sharp(originals+'map.png').webp({quality:90}).toFile('public/assets/map-adventure.webp');
// Extract individual assets from the generated atlas without changing their artwork.
async function extractRow(file,top,height,names){
 const meta=await sharp(file).metadata();
 const {data,info}=await sharp(file).extract({left:0,top,width:meta.width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const occupied=Array.from({length:info.width},(_,x)=>{let count=0;for(let y=0;y<height;y++)if(data[(y*info.width+x)*4+3]>90)count++;return count>2;});
 const spans=[];let start=null;
 for(let x=0;x<=info.width;x++){if(occupied[x]&&start===null)start=x;if(!occupied[x]&&start!==null){if(x-start>25)spans.push([start,x]);start=null;}}
 // Transparent gaps separate every sprite; tiny isolated antialiasing islands are ignored.
 const groups=[];
 for(const span of spans){if(groups.length&&span[0]-groups.at(-1)[1]<12)groups.at(-1)[1]=span[1];else groups.push(span);}
 if(groups.length!==names.length)throw Error(`Atlas ${file}: expected ${names.length} silhouettes; found ${JSON.stringify(groups)}`);
 for(let i=0;i<names.length;i++){
  const left=Math.max(0,groups[i][0]-3),right=Math.min(info.width,groups[i][1]+3);
  const cropped=await sharp(file).extract({left,top,width:right-left,height}).png().toBuffer();
  await sharp(cropped).trim({threshold:8}).resize({height:480,withoutEnlargement:true}).webp({quality:90,alphaQuality:100}).toFile('public/assets/'+names[i]+'.webp');
 }
}
await extractRow(originals+'tools.png',0,490,['tool-water','tool-lens','tool-camera']);
await extractRow(originals+'tools.png',490,534,['tool-box','tool-compass','tool-flag']);
await extractRow(originals+'poses.png',0,724,['hero-lens','hero-brush','hero-cheer','hero-protect']);
await writeFile('public/assets/generated-manifest.json',JSON.stringify({date:'2026-10-18',method:'OpenAI image generation',originals,files:['map-adventure',...['water','lens','camera','box','compass','flag'].map(k=>'tool-'+k),...['lens','brush','cheer','protect'].map(k=>'hero-'+k)],notes:'Map based on project map; poses preserve River identity. Props and characters retain alpha. Educational diagrams are illustrative, not photographs.'},null,2));
console.log('Prepared map, six illustrated tools, and four River poses.');
