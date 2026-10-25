import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.SHARP_PATH||'D:/iscreammedia_sc34/1udangtangtang/node_modules/sharp');
const source='C:/Users/bongb/.codex/generated_images/01a169db-edc1-7f31-a82d-3f57a73f86e2/';
const files={
 'river-observatory-v2':'e3bc9dd7-8d3b-4f4d-aa1b-04f25dd98f5e',
 'river-canyon-v2':'6ef4ff60-94d4-4dc4-8e89-6ba0542da19c',
 'volcano-workshop-v2':'6bfc5277-2eaf-4445-956c-98a53799ada4',
 'volcano-caldera-v2':'29f340e7-19aa-49a8-ab5e-2222c266f22a',
 'rocks-crystal-cave-v2':'ad8e4ead-548c-406e-ba1a-3e539637da14',
 'rocks-quarry-atelier-v2':'1ed7affc-05f3-485a-ade2-b592710c47f3',
 'city-harbor-v2':'3871f1a1-e822-46b8-a612-e3936a6121e5',
 'city-message-square-v2':'1df448cb-8e77-4970-bebf-5686612c25ca',
 'safety-island-classroom-v2':'36988d17-17f2-47cc-88a8-b132df47a3b5',
 'safety-evacuation-garden-v2':'19b32ebf-a1eb-413e-861d-26960eefe8c7'
};
await mkdir('assets/raw-png/stage-backgrounds-20261024',{recursive:true});
await mkdir('public/assets/art',{recursive:true});
const assets=[];
for(const [key,id] of Object.entries(files)){
 const original=`assets/raw-png/stage-backgrounds-20261024/${key}.png`;
 await copyFile(`${source}exec-${id}.png`,original);
 const info=await sharp(original).resize(1600,900,{fit:'cover'}).webp({quality:88}).toFile(`public/assets/art/${key}.webp`);
 assets.push({key,file:`${key}.webp`,width:info.width,height:info.height,bytes:info.size,original});
 console.log(key,info.size+' bytes');
}
await writeFile('public/assets/art/stage-backgrounds.json',JSON.stringify({date:'2026-10-24',generator:'OpenAI built-in image generation',styleReference:'map-adventure.webp',assets},null,2));
