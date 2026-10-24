import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import init from '../vendor/occt.js';import {configure,operate} from '../cad/core.bundle.mjs';
const {version}=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
test('shipped kernel bundle executes native geometry',async()=>{configure(await init({wasmBinary:fs.readFileSync(new URL('../vendor/replicad_single.wasm',import.meta.url))}));const box=await operate('primitive',{kind:'box',w:30,d:20,h:10});const round=await operate('finish',{object:box,kind:'fillet',amount:1,all:true,mode:'constant'});assert.ok(round.cad.volume<6000&&round.cad.volume>5800);assert.ok((await operate('inspect',{object:round})).valid);});
test('offline manifest covers worker dependency tree and only intercepts its own assets',()=>{const handlers={},scope='https://example.test/tools/sketchbench/',ctx=vm.createContext({URL,self:{registration:{scope},location:{href:scope+'sw.js'},addEventListener:(k,fn)=>handlers[k]=fn}});vm.runInContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),ctx);const paths=vm.runInContext('ASSETS',ctx);for(const p of paths){if(p==='./')continue;assert.ok(fs.existsSync(new URL('../'+p,import.meta.url)),p);}for(const p of ['cad/worker-'+version+'.js','vendor/replicad_single.wasm','vendor/DejaVuSans.ttf'])assert.ok(paths.includes('./'+p));let caught=false;handlers.fetch({request:{method:'GET',url:'https://example.test/other-app/index.html'},respondWith:()=>caught=true});assert.equal(caught,false);});

test('versioned worker bypasses a legacy cache even when query cache-busting does not',()=>{
 const handlers={},scope='https://example.test/sketchbench/',ctx=vm.createContext({URL,self:{registration:{scope},location:{href:scope+'sw.js'},addEventListener:(k,fn)=>handlers[k]=fn},caches:{open:async()=>({match:async()=>({release:'old worker'})})}});
 vm.runInContext(fs.readFileSync(new URL('fixtures/sw-rc.4.js',import.meta.url),'utf8'),ctx);
 let caught=false;const send=url=>{caught=false;handlers.fetch({request:{method:'GET',url},respondWith:()=>caught=true});return caught;};
 assert.equal(send(scope+'cad/worker.js?v='+version),true);
 assert.equal(send(scope+'cad/worker-'+version+'.js'),false);
});
test('offline runtime serves only its own version of the worker',async()=>{
 const handlers={},scope='https://example.test/tools/sketchbench/',lookups=[],cached={body:'current worker'};
 const ctx=vm.createContext({URL,self:{registration:{scope},location:{href:scope+'sw.js'},addEventListener:(k,fn)=>handlers[k]=fn},caches:{open:async()=>({match:async url=>{lookups.push(url);return cached;}})}});
 vm.runInContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),ctx);
 for(const path of ['cad/worker.js','cad/worker-2.0.0-rc.4.js','../other-app/index.html']){
  let response;handlers.fetch({request:{method:'GET',url:new URL(path,scope).href},respondWith:p=>response=p});assert.equal(response,undefined);
 }
 let response;const worker=scope+'cad/worker-'+version+'.js';
 handlers.fetch({request:{method:'GET',url:worker},respondWith:p=>response=p});
 assert.equal(await response,cached);assert.deepEqual(lookups,[worker]);
});
