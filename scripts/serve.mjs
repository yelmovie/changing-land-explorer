import http from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv.includes('--dist')?'dist':'.');
const port=Number(process.env.PORT||5177);
const {version}=JSON.parse(await readFile('package.json','utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.mp3':'audio/mpeg','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.md':'text/markdown; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const publicAsset=pathname.startsWith('/assets/')&&!process.argv.includes('--dist');
 const relative=pathname==='/'?'index.html':(publicAsset?'public':'')+pathname;
 const file=path.resolve(root,'.'+path.sep+relative.replace(/^[/\\]+/,''));
 if(!file.startsWith(root+path.sep)||pathname.includes('\0')){res.writeHead(403).end();return;}
 const allowed=pathname==='/'||pathname==='/index.html'||pathname.startsWith('/assets/')||pathname.startsWith('/src/')||pathname==='/sw.js';
 if(!allowed){res.writeHead(404).end('Not found');return;}
 const info=await stat(file);if(!info.isFile())throw Error();
 const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
 if(/^(audio|video)\//.test(headers['Content-Type'])){
  headers['Accept-Ranges']='bytes';
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(match&&(match[1]||match[2])){
    start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]));
    end=match[1]&&match[2]?Math.min(end,Number(match[2])):end;
   }else start=info.size;
   if(!Number.isSafeInteger(start)||start>end||start>=info.size){res.writeHead(416,{...headers,'Content-Range':'bytes */'+info.size}).end();return;}
   status=206;headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;
  }
  res.writeHead(status,{...headers,'Content-Length':end-start+1});
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(file,{start,end});res.once('close',()=>stream.destroy());stream.on('error',()=>res.destroy()).pipe(res);return;
 }
 res.writeHead(200,headers);
 const data=await readFile(file);res.end(path.extname(file)==='.html'?data.toString('utf8').replace('<html lang="ko">',`<html lang="ko" data-app-version="${version}">`):data);
 }catch{res.writeHead(404).end('Not found');}});
server.listen(port,'127.0.0.1',()=>console.log(`GeoValley ready: http://localhost:${port}`));
