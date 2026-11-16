// Trims and encodes the 2026-11-16 city stage art. Originals stay in image/generated-20261116-city/.
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const SRC='image/generated-20261116-city/',OUT='public/assets/art/stages/city/';
// name: [max width, max height, opaque, trim]
const ART={
 barricade:[360,240,false,true],
 'ash-fall':[640,430,false,false],
 'ash-field':[768,430,true,false]
};
async function bbox(file,threshold){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
// The ash overlay comes with a faint full-frame haze; drop it so only flakes and streaks remain (keeps the file small).
async function clearHaze(file,threshold){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)data[i]=data[i]<threshold?0:Math.round((data[i]-threshold)*255/(255-threshold));
 return sharp(data,{raw:info}).png().toBuffer();
}
await mkdir(OUT,{recursive:true});
const manifest=[];
for(const [name,[w,h,opaque,trim]] of Object.entries(ART)){
 const file=SRC+name+'.png';
 try{await stat(file);}catch{console.log('skip (no source):',name);continue;}
 const input=name==='ash-fall'?await clearHaze(file,40):trim?await sharp(file).extract(await bbox(file,24)).png().toBuffer():file;
 const out=OUT+name+'.webp';
 const info=await sharp(input).resize(w,h,{fit:'inside',withoutEnlargement:true}).webp(opaque?{quality:80}:name==='ash-fall'?{quality:70,alphaQuality:60}:{quality:88,alphaQuality:90}).toFile(out);
 manifest.push({key:'art/stages/city/'+name,file:out.replace('public/',''),width:info.width,height:info.height,bytes:info.size,original:file});
 console.log(name,info.width+'x'+info.height,Math.round(info.size/1024)+'KB');
}
await writeFile(OUT+'manifest.json',JSON.stringify({date:'2026-11-16',generator:'Higgsfield gpt_image_2_6 (low)',assets:manifest},null,2));
