// Trims and encodes the 2026-11-16 river stage art. Originals stay in image/generated-20261116-river/.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const SRC='image/generated-20261116-river/',OUT='public/assets/art/stages/river/';
async function alpha(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
function bbox({data,info},x0=0,x1=info.width,threshold=24){
 let l=x1,t=info.height,r=-1,b=-1;
 for(let y=0;y<info.height;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>threshold){if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;}
 return {left:l,top:t,width:r-l+1,height:b-t+1};
}
// Splits a row of separate cutouts at fully transparent columns.
function columns({data,info}){
 const runs=[];let start=-1;
 for(let x=0;x<=info.width;x++){
  let solid=false;
  if(x<info.width)for(let y=0;y<info.height;y++)if(data[(y*info.width+x)*4+3]>24){solid=true;break;}
  if(solid&&start<0)start=x;else if(!solid&&start>=0){if(x-start>40)runs.push([start,x]);start=-1;}
 }
 return runs;
}
await mkdir(OUT,{recursive:true});
const manifest=[];
async function save(name,input,w,h,opaque,original){
 const out=OUT+name+'.webp';
 const info=await sharp(input).resize(w,h,{fit:'inside',withoutEnlargement:true}).webp(opaque?{quality:80}:{quality:88,alphaQuality:90}).toFile(out);
 manifest.push({key:'art/stages/river/'+name,file:out.replace('public/',''),width:info.width,height:info.height,bytes:info.size,original});
 console.log(name,info.width+'x'+info.height,Math.round(info.size/1024)+'KB');
}
// Three glazed badge tokens: erosion, transport, deposit (left to right).
const tokens=await alpha(SRC+'tokens.png'),runs=columns(tokens);
if(runs.length!==3)throw new Error('expected 3 tokens, found '+runs.length);
for(const [i,id] of ['erosion','transport','deposit'].entries()){
 const box=bbox(tokens,...runs[i]);
 await save('token-'+id,await sharp(SRC+'tokens.png').extract(box).png().toBuffer(),168,168,false,SRC+'tokens.png');
}
await save('card-slot',await sharp(SRC+'slot.png').extract(bbox(await alpha(SRC+'slot.png'))).png().toBuffer(),420,200,false,SRC+'slot.png');
await save('map-board',SRC+'board.png',1200,672,true,SRC+'board.png');
await writeFile(OUT+'manifest.json',JSON.stringify({date:'2026-11-16',generator:'Higgsfield gpt_image_2_6 (low)',assets:manifest},null,2));
