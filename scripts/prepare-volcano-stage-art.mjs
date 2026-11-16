// Trims and encodes the 2026-11-16 volcano stage art. Originals stay in image/generated-20261116-volcano/.
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const SRC='image/generated-20261116-volcano/',OUT='public/assets/art/stages/volcano/';
// name: [max width, max height, opaque, options]
const ART={
 // The generated knob is mint; pull it toward the painted syringe plunger teal.
 plunger:[256,160,false,{modulate:{saturation:.72,brightness:.9,hue:8}}],
 // Keep only the solid block: the source also paints motion streaks and grit around it.
 rock:[128,128,false,{solidOnly:true}]
};
async function bbox(data,info,threshold){
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
// Largest opaque connected region without the bright orange motion streaks;
// enclosed glowing cracks are restored by filling holes afterwards.
async function largestSolid(file){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,label=new Int32Array(w*h).fill(-1);let best=-1,bestSize=0,id=0;
 const solid=p=>{const r=data[p*4],g=data[p*4+1],b=data[p*4+2];return data[p*4+3]>=230&&!(r>190&&r-b>100&&g>90);};
 for(let start=0;start<w*h;start++){
  if(label[start]>=0||!solid(start))continue;
  const stack=[start];label[start]=id;let size=0;
  while(stack.length){const p=stack.pop();size++;const x=p%w,y=(p-x)/w;
   for(const q of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(q>=0&&label[q]<0&&solid(q)){label[q]=id;stack.push(q);}}
  if(size>bestSize){bestSize=size;best=id;}id++;
 }
 // Fill holes: anything the outside cannot reach without crossing the block belongs to it.
 const outside=new Uint8Array(w*h),queue=[];
 for(let x=0;x<w;x++)for(const y of [0,h-1])queue.push(y*w+x);
 for(let y=0;y<h;y++)for(const x of [0,w-1])queue.push(y*w+x);
 while(queue.length){const p=queue.pop();if(outside[p]||label[p]===best)continue;outside[p]=1;const x=p%w,y=(p-x)/w;if(x>0)queue.push(p-1);if(x<w-1)queue.push(p+1);if(y>0)queue.push(p-w);if(y<h-1)queue.push(p+w);}
 for(let p=0;p<w*h;p++)if(!outside[p]&&label[p]!==best&&data[p*4+3]>0)label[p]=best;
 for(let p=0;p<w*h;p++)if(label[p]!==best)data[p*4+3]=0;
 return sharp(data,{raw:info}).blur(.6).ensureAlpha().raw().toBuffer({resolveWithObject:true}).then(({data:soft,info:si})=>{
  // Blur only to anti-alias the cut; restore colour from the original.
  for(let p=0;p<w*h;p++){soft[p*4]=data[p*4];soft[p*4+1]=data[p*4+1];soft[p*4+2]=data[p*4+2];if(label[p]===best)soft[p*4+3]=data[p*4+3];}
  return {data:soft,info:si};
 });
}
await mkdir(OUT,{recursive:true});
const manifest=[];
for(const [name,[w,h,opaque,opt={}]] of Object.entries(ART)){
 const file=SRC+name+'.png';
 try{await stat(file);}catch{console.log('skip (no source):',name);continue;}
 let input;
 if(opaque)input=file;
 else{
  const {data,info}=opt.solidOnly?await largestSolid(file):await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  input=await sharp(data,{raw:info}).extract(await bbox(data,info,24)).png().toBuffer();
 }
 let img=sharp(input);
 if(opt.modulate)img=img.modulate(opt.modulate);
 const out=OUT+name+'.webp';
 const info=await img.resize(w,h,{fit:'inside',withoutEnlargement:true}).webp(opaque?{quality:80}:{quality:88,alphaQuality:90}).toFile(out);
 manifest.push({key:'art/stages/volcano/'+name,file:out.replace('public/',''),width:info.width,height:info.height,bytes:info.size,original:file});
 console.log(name,info.width+'x'+info.height,Math.round(info.size/1024)+'KB');
}
await writeFile(OUT+'manifest.json',JSON.stringify({date:'2026-11-16',generator:'Higgsfield gpt_image_2_6 (low, 1k)',assets:manifest},null,2));
