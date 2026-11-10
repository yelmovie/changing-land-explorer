// Technical atlas packing only: the eight distinct poses come from image generation.
// Usage: node scripts/prepare-river-combat-v2.mjs /path/to/generated.png
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=process.argv[2];if(!source)throw new Error('Pass the generated River pose sheet PNG.');
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const rects=[[0,0,444,443],[444,0,444,443],[888,0,502,443],[1390,0,384,443],[0,443,444,444],[444,443,444,444],[888,443,444,444],[1332,443,442,444]];
const names=['ready','windup','pulse','follow-through','hurt','recover','cheer','victory'];
const frames=[],composite=[];const scale=173/370;
for(let n=0;n<rects.length;n++){
 const [left,top,width,height]=rects[n];let x0=width,y0=height,x1=0,y1=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[((top+y)*info.width+left+x)*4+3]>35){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const crop={left:left+x0,top:top+y0,width:x1-x0+1,height:y1-y0+1};
 const w=Math.round(crop.width*scale),h=Math.round(crop.height*scale);
 // Register body/feet rather than the extended scanning pulse to avoid horizontal jumps.
 const foot=[240,668,1104,1575,249,683,1121,1560][n];
 const ox=Math.round(128-(foot-crop.left)*scale),oy=225-h;
 const pixels=await sharp(source).extract(crop).resize(w,h).png().toBuffer();
 composite.push({input:pixels,left:n%4*256+ox,top:Math.floor(n/4)*256+oy});frames.push({index:n,name:names[n],column:n%4,row:Math.floor(n/4),sourceRect:crop,sourceFootX:foot});
}
const file='public/assets/art/river-combat-v2.webp';
await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(composite).webp({quality:90,alphaQuality:100}).toFile(file);
const meta=await sharp(file).metadata();
await writeFile('public/assets/art/river-combat-v2.json',JSON.stringify({name:'River exploration pulse',file:'river-combat-v2.webp',width:meta.width,height:meta.height,frameWidth:256,frameHeight:256,columns:4,rows:2,anchor:[.5,225/256],alpha:true,generator:'OpenAI built-in image generation',created:'2026-11-10',method:'Eight generated poses, cropped and feet-registered with one shared scale. No synthetic intermediate poses.',sourceSha256:createHash('sha256').update(data).digest('hex'),frames},null,2)+'\n');
console.log(file,meta.width,meta.height);
