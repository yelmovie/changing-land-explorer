// Trims and encodes the 2026-11-16 rocks stage props. Originals stay in image/generated-20261116-rocks/.
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const SRC='image/generated-20261116-rocks/',OUT='public/assets/art/stages/rocks/';
// name: [max width, max height, glass] — glass is the lens disc in source pixels (cx, cy, r) whose
// alpha is capped so the rock under the magnifier stays visible.
const ART={
 magnifier:[320,320,{cx:297,cy:309,r:246,cap:64}],
 'loupe-ring':[420,420],
 'order-tag':[520,360]
};
async function bbox(data,info,threshold){
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
await mkdir(OUT,{recursive:true});
const manifest=[];
for(const [name,[w,h,glass]] of Object.entries(ART)){
 const file=SRC+name+'.png';
 try{await stat(file);}catch{console.log('skip (no source):',name);continue;}
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(glass)for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const d=Math.hypot(x-glass.cx,y-glass.cy);if(d>=glass.r)continue;
  const i=(y*info.width+x)*4+3,edge=Math.max(0,(d-(glass.r-14))/14);
  data[i]=Math.min(data[i],Math.round(glass.cap+(data[i]-glass.cap)*Math.max(0,edge)));
 }
 const box=await bbox(data,info,24);
 const out=OUT+name+'.webp';
 const result=await sharp(data,{raw:info}).extract(box).resize(w,h,{fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:90}).toFile(out);
 const entry={key:'rocks-stage/'+name,file:out.replace('public/',''),width:result.width,height:result.height,bytes:result.size,original:file};
 // The magnifier's origin is its lens centre, so the game can keep the old drag point.
 if(glass)Object.assign(entry,{originX:+((glass.cx-box.left)/box.width).toFixed(4),originY:+((glass.cy-box.top)/box.height).toFixed(4),lensRadius:+((glass.r+50)/box.width).toFixed(4)});
 manifest.push(entry);
 console.log(name,result.width+'x'+result.height,Math.round(result.size/1024)+'KB',glass?`origin ${entry.originX},${entry.originY} r ${entry.lensRadius}`:'');
}
await writeFile(OUT+'manifest.json',JSON.stringify({date:'2026-11-16',generator:'Higgsfield gpt_image_2_6 (low, transparent)',assets:manifest},null,2));
