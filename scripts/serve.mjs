import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv.includes('--dist')?'dist':'.');
const port=Number(process.env.PORT||5177);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const publicAsset=pathname.startsWith('/assets/')&&!process.argv.includes('--dist');
 const relative=pathname==='/'?'index.html':(publicAsset?'public':'')+pathname;
 const file=path.resolve(root,'.'+path.sep+relative.replace(/^[/\\]+/,''));
 if(!file.startsWith(root+path.sep)||pathname.includes('\0')){res.writeHead(403).end();return;}
 const allowed=pathname==='/'||pathname==='/index.html'||pathname.startsWith('/assets/')||pathname.startsWith('/src/')||pathname==='/sw.js';
 if(!allowed){res.writeHead(404).end('Not found');return;}
 const info=await stat(file);if(!info.isFile())throw Error();
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}});
server.listen(port,'127.0.0.1',()=>console.log(`GeoValley ready: http://localhost:${port}`));
