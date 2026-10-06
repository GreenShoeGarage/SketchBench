const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const source=fs.readFileSync(require('node:path').join(__dirname,'../cad-ui.js'),'utf8').split('async function cadTask')[0];
function setup(fetch=async()=>new Response('',{headers:{'Content-Type':'text/javascript'}})){
 const nodes=new Map(),workers=[],timers=new Map();let timerSequence=0;
 class Worker{constructor(url,options){this.url=url;this.options=options;workers.push(this);}terminate(){this.terminated=true;}postMessage(data){this.sent=data;}}
 const c=vm.createContext({Worker,URL,AbortController,fetch,console,location:{protocol:'https:'},document:{baseURI:'https://example.test/tools/sketchbench/'},$:key=>{if(!nodes.has(key))nodes.set(key,{});return nodes.get(key);},setTimeout:(fn,ms)=>{timers.set(++timerSequence,{fn,ms});return timerSequence;},clearTimeout:id=>timers.delete(id),sync(){}});
 vm.runInContext(source,c);return {run:s=>vm.runInContext(s,c),c,nodes,workers,timers};
}
test('shipped worker starts over HTTP and rejects malformed deployments',async()=>{
 const {stdout}=await promisify(execFile)(process.execPath,['--experimental-vm-modules',require('node:path').join(__dirname,'worker-http-runner.mjs')],{timeout:45000});
 assert.equal((stdout.match(/PASS:/g)||[]).length,5);
});
test('worker diagnostics distinguish missing files, forbidden assets, and wrong MIME',async()=>{
 for(const [status,type,pattern]of [[404,'text/html',/HTTP 404/],[403,'text/plain',/HTTP 403/],[200,'text/html',/server sends.*text\/html/],[200,'application/octet-stream',/server sends.*application\/octet-stream/],[200,'application/javascript; charset=utf-8',/blocked by CSP/]]){
  const e=setup(async()=>new Response('error',{status,headers:{'Content-Type':type}}));
  assert.match(await e.run('cadWorkerDiagnostic("https://example.test/worker.js","blocked by CSP")'),pattern);
 }
});
test('startup failure rejects pending operations and retry ignores stale worker responses',async()=>{
 let resolveFetch;const e=setup(()=>new Promise(r=>resolveFetch=r));e.run('initCAD()');const first=e.workers[0];
 assert.equal(first.url,'https://example.test/tools/sketchbench/cad/worker.js');
 const pending=e.run('cadCall("profile",{})');const rejected=assert.rejects(pending,/Solid worker failed/);
 first.onerror({message:''});await rejected;assert.ok(first.terminated);assert.equal(e.nodes.get('#cadRecovery').hidden,false);
 e.run('initCAD()');const second=e.workers[1];first.onmessage({data:{ready:true}});assert.equal(e.run('cadReady'),false);
 second.onmessage({data:{ready:true}});resolveFetch(new Response('',{status:404}));await new Promise(r=>setImmediate(r));
 assert.equal(e.run('cadReady'),true);assert.equal(e.run('cadFailure'),'');assert.equal(e.nodes.get('#cadRecovery').hidden,true);
 assert.equal(e.timers.size,0);
});
test('fatal WASM errors retain their details and a silent startup times out',()=>{
 const e=setup();e.run('initCAD()');e.workers[0].onmessage({data:{fatal:'HTTP 403: vendor/replicad_single.wasm'}});
 assert.match(e.nodes.get('#kernelState').textContent,/HTTP 403/);assert.equal(e.run('cadReady'),false);
 e.run('initCAD()');[...e.timers.values()].find(t=>t.ms===90000).fn();assert.match(e.run('cadFailure'),/90 seconds/);assert.ok(e.workers[1].terminated);
});
test('unsupported browser and file opening failures are actionable',()=>{
 const e=setup();e.run('location.protocol="file:";initCAD()');assert.match(e.run('cadFailure'),/HTTP or HTTPS/);assert.equal(e.workers.length,0);
 e.run('Worker=undefined;initCAD()');assert.match(e.run('cadFailure'),/Web Workers/);
});
