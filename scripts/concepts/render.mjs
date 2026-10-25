import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {clips,WIDTH,HEIGHT,FPS,SECONDS} from './scenes.mjs';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const ffmpeg=process.env.FFMPEG_PATH||'D:/iscreammedia_sc34/1udangtangtang/.tools/ffmpeg/ffmpeg.exe';
const output='public/assets/concepts';await mkdir(output,{recursive:true});
const only=process.argv.slice(2);
const metadata=Object.keys(clips).map(key=>({key,seconds:SECONDS,width:WIDTH,height:HEIGHT,muted:true}));
for(const [key,frame] of Object.entries(clips).filter(([key])=>!only.length||only.includes(key))){
 const mp4=`${output}/${key}.mp4`;
 const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${WIDTH}x${HEIGHT}`,'-framerate',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['pipe','ignore','pipe']});
 let error='';proc.stderr.on('data',d=>error+=d);const done=once(proc,'close');proc.stdin.on('error',()=>{});
 for(let f=0;f<FPS*SECONDS;f++){
  const pixels=await sharp(Buffer.from(frame(f/FPS))).ensureAlpha().raw().toBuffer();
  if(!proc.stdin.write(pixels))await once(proc.stdin,'drain');
 }
 proc.stdin.end();if((await done)[0]!==0)throw Error(error);
 const webm=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',mp4,'-an','-c:v','libvpx-vp9','-b:v','0','-crf','36','-deadline','realtime','-cpu-used','6',`${output}/${key}.webm`],{stdio:'ignore'});
 if((await once(webm,'close'))[0]!==0)throw Error(`WebM failed: ${key}`);
 await sharp(Buffer.from(frame(7.8))).webp({quality:85}).toFile(`${output}/${key}.webp`);
 console.log(`Rendered ${key}: ${SECONDS}s, MP4 + WebM + poster`);
}
await writeFile(`${output}/manifest.json`,JSON.stringify(metadata,null,2));
