// Trims and encodes the 2026-10-25 design-upgrade props. Originals stay in image/generated-20261025-design/.
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const SRC='image/generated-20261025-design/',OUT='public/assets/art/ui/';
// name: [max width, max height, opaque]
const ART={
 'parchment-panel':[900,600],'paper-card':[640,280],'specimen-tray':[440,330],'notice-board':[760,580],
 'indoor-wall':[1280,720,true],'window-frame':[900,500],'glass-pane':[420,470],'dust-mask':[360,240],'warning-sign':[160,160],
 'certificate-frame':[1280,960],'school-floor':[1280,720,true],'flowerbed':[460,200],'broken-glass':[260,200],'fallen-shelf':[220,200],
 'exit-mat':[300,160],'playground':[220,220],'town-ground':[1280,720,true],'house-roof':[480,340],'brick-wall':[160,380],'utility-pole':[150,200],'time-knob':[200,200],'school-desk':[520,420],'dust-crust':[380,380]
};
async function bbox(file){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>60){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
await mkdir(OUT,{recursive:true});
const manifest=[];
for(const [name,[w,h,opaque]] of Object.entries(ART)){
 const file=SRC+name+'.png';
 try{await stat(file);}catch{console.log('skip (no source):',name);continue;}
 let img=sharp(file);
 if(!opaque)img=sharp(await sharp(file).extract(await bbox(file)).png().toBuffer());
 const out=OUT+name+'.webp';
 const info=await img.resize(w,h,{fit:'inside',withoutEnlargement:true}).webp(opaque?{quality:82}:{quality:88,alphaQuality:90}).toFile(out);
 manifest.push({key:'art/ui/'+name,file:out.replace('public/',''),width:info.width,height:info.height,bytes:info.size,original:file});
 console.log(name,info.width+'x'+info.height,Math.round(info.size/1024)+'KB');
}
await writeFile(OUT+'manifest.json',JSON.stringify({date:'2026-10-25',generator:'Higgsfield gpt_image_2_5 (high, 1k)',styleReference:['tool-box.webp','classroom.webp'],assets:manifest},null,2));
