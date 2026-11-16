// Trims and encodes the 2026-11-16 record tower art. Originals stay in image/generated-20261116-record-tower/.
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat,rm} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const SRC='image/generated-20261116-record-tower/',OUT='public/assets/art/tower/';
// name: [max width, max height, opaque]
const ART={
 wall:[1344,752,true],frame:[448,560],hook:[120,120],rail:[1200,60],'lamp-on':[96,96],'lamp-off':[96,96],
 'sketch-river':[640,480,true],'sketch-volcano':[640,480,true],'sketch-rocks':[640,480,true],'sketch-city':[640,480,true],'sketch-safety':[640,480,true]
};
async function bbox(file,threshold){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
// The frame comes with a soft white haze; keep only the solid wood and brass so the 9-slice edges stay crisp.
async function solidFrame(file){
 const box=await bbox(file,200);
 const {data,info}=await sharp(file).extract(box).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4)if(data[i+3]<200)data[i+3]=0;
 return sharp(data,{raw:info}).png().toBuffer();
}
await mkdir(OUT,{recursive:true});
const manifest=[];
for(const [name,[w,h,opaque]] of Object.entries(ART)){
 const file=SRC+name+'.png';
 try{await stat(file);}catch{console.log('skip (no source):',name);continue;}
 const input=opaque?file:name==='frame'?await solidFrame(file):await sharp(file).extract(await bbox(file,24)).png().toBuffer();
 const out=OUT+name+'.webp';
 const info=await sharp(input).resize(w,h,{fit:'inside',withoutEnlargement:true}).webp(opaque?{quality:80}:{quality:88,alphaQuality:90}).toFile(out);
 manifest.push({key:'art/tower/'+name,file:out.replace('public/',''),width:info.width,height:info.height,bytes:info.size,original:file});
 console.log(name,info.width+'x'+info.height,Math.round(info.size/1024)+'KB');
}
// One rivet period cut from the middle of the rail, so the rod can repeat across wrapped rows.
const tile=await sharp(OUT+'rail.webp').extract({left:305,top:0,width:83,height:39}).webp({quality:88,alphaQuality:90}).toFile(OUT+'rail-tile.webp');
await rm(OUT+'rail.webp');manifest.splice(manifest.findIndex(a=>a.key==='art/tower/rail'),1); // only the tile ships
manifest.push({key:'art/tower/rail-tile',file:'assets/art/tower/rail-tile.webp',width:tile.width,height:tile.height,bytes:tile.size,original:SRC+'rail.png'});
await writeFile(OUT+'manifest.json',JSON.stringify({date:'2026-11-16',generator:'Higgsfield gpt_image_2_6 (medium, 1k)',assets:manifest},null,2));
