// Executes the shipped worker in a browser-like JS global with real HTTP and
// real WASM. This is a Node VM integration test, not browser acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import vm from 'node:vm';

const code=await fs.readFile(new URL('../cad/worker.js',import.meta.url),'utf8');
const wasm=await fs.readFile(new URL('../vendor/replicad_single.wasm',import.meta.url));
let scenario='valid';const requests=[];
const server=http.createServer((req,res)=>{
 requests.push(req.url);
 if(req.url==='/nested/sketchbench/cad/worker.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(code);return;}
 if(req.url==='/nested/sketchbench/vendor/replicad_single.wasm'){
  const status=scenario==='missing'?404:scenario==='denied'?403:200;
  res.writeHead(status,{'Content-Type':scenario==='html'?'text/html':'application/octet-stream'});
  res.end(scenario==='valid'?wasm:scenario==='truncated'?wasm.subarray(0,32):Buffer.from('<html>Not the solid engine</html>'));return;
 }
 res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/nested/sketchbench/cad/worker.js`;
async function launch(){
 const messages=[],pending=[];
 const sandbox={URL,fetch,console,crypto,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout,AbortController,performance,WorkerGlobalScope:class{},location:{href:url},postMessage:m=>{messages.push(m);for(const p of [...pending])if(p.matches(m)){pending.splice(pending.indexOf(p),1);p.resolve(m);}}};
 sandbox.self=sandbox;const context=vm.createContext(sandbox);
 const response=await fetch(url),module=new vm.SourceTextModule(await response.text(),{context,initializeImportMeta:meta=>{meta.url=url;},importModuleDynamically:()=>{throw Error('Unexpected unbundled import');}});
 await module.link(()=>{throw Error('The shipped worker must not require JavaScript imports');});await module.evaluate();
 const wait=matches=>messages.find(matches)||new Promise(resolve=>pending.push({matches,resolve}));
 return {context,wait,messages};
}
try{
 const runtime=await launch(),startup=await runtime.wait(m=>m.ready||m.fatal);assert.ok(startup.ready,startup.fatal);
 let sequence=0;
 const call=async(op,args)=>{const id=++sequence;runtime.context.onmessage({data:{id,op,args}});const r=await runtime.wait(m=>m.id===id);if(r.error)throw Error(r.error);return r.result;};
 const profile=await call('profile',{loops:[[[0,0,0],[30,0,0],[30,20,0],[0,20,0]]]});
 const solid=await call('extrudeRegion',{object:profile,face:0,distance:10,holes:[]});
 assert.ok(Math.abs(solid.cad.volume-6000)<1e-6);
 for(const kind of ['fillet','chamfer']){
  const result=await call('finish',{object:solid,kind,amount:1,all:true,mode:kind==='fillet'?'constant':'equal'});
  assert.ok(result.cad.volume>5000&&result.cad.volume<6000);
  assert.ok((await call('inspect',{object:result})).valid);
 }
 assert.ok(!requests.some(p=>p.endsWith('.mjs')||p.endsWith('/occt.js')));
 console.log('PASS: nested HTTP deployment, binary MIME fallback, profile, extrusion, fillet, chamfer');
 for(const [name,pattern] of [['missing',/HTTP 404.*replicad_single.wasm/],['denied',/HTTP 403.*replicad_single.wasm/],['html',/Expected WebAssembly.*invalid file/],['truncated',/Cannot initialize WebAssembly/]]){
  scenario=name;const failed=await launch();assert.match((await failed.wait(m=>m.ready||m.fatal)).fatal,pattern);
  console.log('PASS: '+name+' WASM returns an actionable startup error');
 }
}finally{await new Promise(r=>server.close(r));}
