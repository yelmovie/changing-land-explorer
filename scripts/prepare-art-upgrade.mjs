import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const source='C:/Users/bongb/.codex/generated_images/01a169db-edc1-7f31-a82d-3f57a73f86e2/';
const files={
 'expedition-base':'7c11fdfa-4bdb-4030-87a8-d1920fdcf691',
 'discovery-observatory':'588d849f-205f-438f-a053-089f98e2aaa2',
 'river-sand-model':'105a6a3e-2951-4daf-8f59-1133a413637a',
 'volcano-mountain':'7ee8aa7f-229d-416b-b968-c68c7057be01',
 'volcano-syringe':'9eb190e2-6e52-4dd1-ab19-bbeeab686b08',
 'geologist-brush':'d6fd2db3-fd01-4fe7-9efc-544196c516d8',
 'safety-cushion':'868b1701-9390-414a-9ab3-305cfaa97c9d',
 'field-workbench':'15c9d2c1-ce58-4082-90aa-506da59cbf12',
 'expedition-medallion':'8c58f508-e0df-4bfb-8ef5-c532c6b50011',
 'volcano-tray':'e021178e-910b-4128-b2e2-6c1aa621d03e'
};
const backgrounds=new Set(['expedition-base','discovery-observatory','field-workbench']);
await mkdir('assets/raw-png/art-20261024',{recursive:true});
await mkdir('public/assets/art',{recursive:true});
const manifest=[];
for(const [name,id] of Object.entries(files)){
 const original=`assets/raw-png/art-20261024/${name}.png`;
 await copyFile(`${source}exec-${id}.png`,original);
 let pipeline=sharp(original);
 if(!backgrounds.has(name)&&name!=='river-sand-model')pipeline=pipeline.trim({threshold:8});
 const result=await pipeline.resize({width:backgrounds.has(name)?1672:name==='river-sand-model'?1200:700,withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(`public/assets/art/${name}.webp`);
 const meta=await sharp(`public/assets/art/${name}.webp`).metadata();
 manifest.push({name,file:`${name}.webp`,width:result.width,height:result.height,bytes:result.size,alpha:meta.hasAlpha,source:original});
 console.log(name,result.width+'x'+result.height,result.size+' bytes','alpha='+meta.hasAlpha);
}
await writeFile('public/assets/art/manifest.json',JSON.stringify({created:'2026-10-24',generator:'OpenAI built-in image generation',assets:manifest},null,2));
