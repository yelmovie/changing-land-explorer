// Checks GLB files in public/assets/models against the budget in docs/3D-ASSETS.md.
// Usage: node scripts/check-models.mjs [file.glb ...]   (no args = every GLB in the folder)
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const DIR='public/assets/models';
const BUDGET={'rock-':6000,'volcano-':8000,'record-tower':15000,'tool-lens':3000,'tool-compass':3000,'tool-flag':3000,'tool-':4000,'river-':12000};
const MAX_TEXTURE=1024,MAX_KB=1500;

export function inspectGlb(buf){
 if(buf.readUInt32LE(0)!==0x46546c67)throw Error('GLB 머리글이 아니야');
 const jsonLen=buf.readUInt32LE(12),json=JSON.parse(buf.subarray(20,20+jsonLen).toString('utf8'));
 const bin=buf.subarray(20+jsonLen+8);
 let triangles=0;
 for(const mesh of json.meshes||[])for(const p of mesh.primitives){
  const mode=p.mode??4,count=p.indices!==undefined?json.accessors[p.indices].count:json.accessors[p.attributes.POSITION].count;
  triangles+=mode===4?count/3:mode===5||mode===6?count-2:0;
 }
 const textures=(json.images||[]).map(img=>{
  if(img.bufferView===undefined)return {uri:img.uri};
  const v=json.bufferViews[img.bufferView],b=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
  if(b[0]===0x89)return {type:'png',width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  for(let i=2;i<b.length;){const len=b.readUInt16BE(i+2);if(b[i+1]>=0xc0&&b[i+1]<=0xc3)return {type:'jpeg',width:b.readUInt16BE(i+7),height:b.readUInt16BE(i+5)};i+=2+len;}
  return {type:img.mimeType||'unknown'};
 });
 return {triangles:Math.round(triangles),textures,kb:Math.round(buf.length/1024)};
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const files=process.argv.slice(2).length?process.argv.slice(2):(await readdir(DIR).catch(()=>[])).filter(f=>f.endsWith('.glb')).map(f=>path.join(DIR,f));
 if(!files.length){console.log(`${DIR} 에 GLB가 아직 없어.`);process.exit(0);}
 let bad=0;
 for(const file of files){
  const name=path.basename(file),limit=Object.entries(BUDGET).find(([k])=>name.startsWith(k))?.[1]??5000;
  const r=inspectGlb(await readFile(file)),issues=[];
  if(r.triangles>limit)issues.push(`삼각형 ${r.triangles} > 예산 ${limit}`);
  for(const t of r.textures)if(t.width>MAX_TEXTURE||t.height>MAX_TEXTURE)issues.push(`텍스처 ${t.width}x${t.height} > ${MAX_TEXTURE}`);
  if(r.kb>MAX_KB)issues.push(`파일 ${r.kb}KB > ${MAX_KB}KB`);
  bad+=issues.length?1:0;
  console.log(`${issues.length?'WARN':'PASS'} ${name} · 삼각형 ${r.triangles}/${limit} · 텍스처 ${r.textures.map(t=>t.width?`${t.width}x${t.height}`:t.type||t.uri).join(', ')||'없음'} · ${r.kb}KB${issues.length?' · '+issues.join(', '):''}`);
 }
 if(bad)console.log('예산을 넘은 파일은 블렌더에서 Decimate·텍스처 축소 후 다시 GLB로 내보내.');
}
