import {readdir} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import path from 'node:path';
async function walk(d){for(const x of await readdir(d,{withFileTypes:true})){const p=path.join(d,x.name);if(x.isDirectory())await walk(p);else if(/\.m?js$/.test(p)){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exitCode=1;}}}}
await walk('src');await walk('scripts');if(!process.exitCode)console.log('All JavaScript syntax checks passed.');
