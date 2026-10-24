import {build} from 'esbuild';import fs from 'node:fs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
fs.mkdirSync('vendor',{recursive:true});fs.mkdirSync('licenses',{recursive:true});
for(const [from,to] of [['replicad_single.js','occt.js'],['replicad_single.wasm','replicad_single.wasm']])fs.copyFileSync('node_modules/replicad-opencascadejs/dist/'+from,'vendor/'+to);
for(const p of ['replicad','replicad-opencascadejs','opentype.js','flatbush','flatqueue','tiny-inflate','string.prototype.codepointat']){const f='node_modules/'+p+'/LICENSE';if(fs.existsSync(f))fs.copyFileSync(f,'licenses/'+p+'.txt');}
await build({entryPoints:['cad/core.mjs'],outfile:'cad/core.bundle.mjs',bundle:true,format:'esm',platform:'browser',minify:true});
// The deployed worker has no .mjs imports. Many static hosts do not assign
// JavaScript MIME types to .mjs, which prevents module workers from starting.
// Never reuse a worker URL across releases: page + worker must be one version.
await build({entryPoints:['cad/worker.mjs'],outfile:'cad/worker-'+version+'.js',bundle:true,format:'esm',platform:'browser',external:['node:module'],minify:true});
fs.rmSync('cad/worker.js',{force:true}); // Obsolete generated entry point from rc.2–rc.5.
