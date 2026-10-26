// Shrinks a Meshy GLB for the web without touching its mesh.
// Usage: node scripts/prepare-models.mjs <raw.glb> <name>   → public/assets/models/<name>.glb
// Only the embedded textures are resized (Blender, image API only) and swapped back in;
// every vertex/index byte is copied as-is. Decimating Meshy meshes splits them along
// UV seams and the model looks torn, so geometry is never simplified here.
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const BLENDER=process.env.BLENDER||'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe';
const SIZE=1024;
const RESIZE=`import bpy,sys
a=sys.argv[sys.argv.index('--')+1:]
for f,data in zip(a[0::2],a[1::2]):
 img=bpy.data.images.load(f);img.colorspace_settings.is_data=data=='1'
 if max(img.size)>${SIZE}:img.scale(${SIZE},${SIZE})
 img.file_format='JPEG';img.save(filepath=f,quality=90 if data=='1' else 85)`;

const [src,name]=process.argv.slice(2);
if(!src||!name){console.log('사용법: node scripts/prepare-models.mjs <원본.glb> <이름>');process.exit(1);}
const buf=await readFile(src);
if(buf.readUInt32LE(0)!==0x46546c67)throw Error('GLB 머리글이 아니야');
const jsonLen=buf.readUInt32LE(12),json=JSON.parse(buf.subarray(20,20+jsonLen).toString('utf8')),bin=buf.subarray(20+jsonLen+8);
const view=i=>{const v=json.bufferViews[i];return bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);};

// Colour textures stay sRGB; normal / metal-rough maps are data and must not be colour-converted.
const dataImages=new Set();
for(const m of json.materials||[])for(const t of [m.normalTexture,m.occlusionTexture,m.pbrMetallicRoughness?.metallicRoughnessTexture])if(t)dataImages.add(json.textures[t.index].source);
const tmp=await mkdtemp(path.join(os.tmpdir(),'glb-'));
try{
 const args=[];
 for(const [i,img] of (json.images||[]).entries()){
  if(img.bufferView===undefined)continue;
  if(img.mimeType!=='image/jpeg'&&img.mimeType!=='image/png')throw Error(`지원하지 않는 텍스처 형식: ${img.mimeType}`);
  const f=path.join(tmp,`${i}.${img.mimeType==='image/png'?'png':'jpg'}`);
  await writeFile(f,view(img.bufferView));args.push(f,dataImages.has(i)?'1':'0');
 }
 if(args.length)execFileSync(BLENDER,['-b','--factory-startup','--python-expr',RESIZE,'--',...args],{stdio:'ignore'});
 const swapped=new Map();
 for(const [i,img] of (json.images||[]).entries())if(img.bufferView!==undefined){
  swapped.set(img.bufferView,await readFile(path.join(tmp,`${i}.${img.mimeType==='image/png'?'png':'jpg'}`)));img.mimeType='image/jpeg';
 }
 // Rebuild the binary chunk: geometry views verbatim, image views replaced, each 4-byte aligned.
 const parts=[];let offset=0;
 for(const [i,v] of json.bufferViews.entries()){
  const data=swapped.get(i)??view(i),pad=(4-offset%4)%4;
  if(pad)parts.push(Buffer.alloc(pad));offset+=pad;
  parts.push(data);v.byteOffset=offset;v.byteLength=data.length;offset+=data.length;
 }
 parts.push(Buffer.alloc((4-offset%4)%4));
 const outBin=Buffer.concat(parts);json.buffers=[{byteLength:outBin.length}];
 let outJson=Buffer.from(JSON.stringify(json));outJson=Buffer.concat([outJson,Buffer.alloc((4-outJson.length%4)%4,0x20)]);
 const head=Buffer.alloc(12);head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(12+8+outJson.length+8+outBin.length,8);
 const chunk=(len,type)=>{const b=Buffer.alloc(8);b.writeUInt32LE(len,0);b.writeUInt32LE(type,4);return b;};
 const out=path.join('public/assets/models',`${name}.glb`);
 await writeFile(out,Buffer.concat([head,chunk(outJson.length,0x4e4f534a),outJson,chunk(outBin.length,0x004e4942),outBin]));
 console.log(`${out} · ${Math.round(buf.length/1024)}KB → ${Math.round((12+16+outJson.length+outBin.length)/1024)}KB`);
}finally{await rm(tmp,{recursive:true,force:true});}
