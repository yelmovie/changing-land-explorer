// Mechanical sprite registration only; character artwork is generated separately.
// SHARP_PATH can point to an existing Sharp install on the current OS.
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {RIVER_WALK} from '../src/river-walk.js';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'sharp');
const source=process.argv[2]||'assets/raw-png/characters/river-walk-20261103/river-walk-final.png';
const out='public/assets/characters',{frameWidth:fw,frameHeight:fh}=RIVER_WALK;
const {width,height,hasAlpha}=await sharp(source).metadata();
if(!hasAlpha)throw Error('A transparent source sheet is required');
const cells=[];
for(let row=0;row<8;row++)for(let col=0;col<4;col++){
 const left=Math.round(col*width/4),top=Math.round(row*height/8);
 const w=Math.round((col+1)*width/4)-left,h=Math.round((row+1)*height/8)-top;
 const input=await sharp(source).extract({left,top,width:w,height:h}).png().toBuffer();
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=w,r=0,t=h,b=0,n=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*info.channels+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);n++;}
 if(n<1000)throw Error('Empty or damaged sprite cell '+row+','+col);
 l=Math.max(0,l-3);r=Math.min(w-1,r+3);t=Math.max(0,t-3);b=Math.min(h-1,b+2);
 cells.push({row,col,input,left:l,top:t,width:r-l+1,height:b-t+1,center:w/2,foot:b});
}
const scale=Math.min(132/Math.max(...cells.map(c=>c.height)),116/Math.max(...cells.map(c=>c.width)));
const sprites=[];
for(const c of cells){
 const width=Math.round(c.width*scale),height=Math.round(c.height*scale);
 const input=await sharp(c.input).extract({left:c.left,top:c.top,width:c.width,height:c.height}).resize(width,height).png().toBuffer();
 const left=Math.max(0,Math.min(fw-width,Math.round(fw/2+(c.left-c.center)*scale)));
 sprites.push({input,left:c.col*fw+left,top:c.row*fh+146-height});
}
await mkdir(out,{recursive:true});
const filename=out+'/river-walk.webp';
await sharp({create:{width:fw*4,height:fh*8,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(sprites).webp({quality:90,alphaQuality:100}).toFile(filename);
await writeFile(out+'/river-walk.json',JSON.stringify({image:'river-walk.webp',frameWidth:fw,frameHeight:fh,columns:4,rows:8,frames:32,directions:RIVER_WALK.directions,anchor:RIVER_WALK.origin,source,method:'OpenAI image generation; cropped, scaled, feet-aligned and WebP-encoded with Sharp',generated:'2026-11-03'},null,2)+'\n');
console.log(filename,fw*4+'x'+fh*8,(await stat(filename)).size+' bytes, 32 frames');

