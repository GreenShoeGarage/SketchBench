import init from '../vendor/occt.js';
import {configure,operate} from './core.mjs';
// Fetch explicitly so missing files, HTML fallbacks, and denied requests keep
// their useful error details. Byte instantiation also works when a host serves
// .wasm as application/octet-stream instead of application/wasm.
const wasmURL=new URL('../vendor/replicad_single.wasm',import.meta.url).href;
const ready=(async()=>{
 if(typeof WebAssembly==='undefined')throw Error('This browser does not support WebAssembly. Update the browser to use solid tools.');
 postMessage({status:'Downloading solid engine…'});
 let response;
 try{response=await fetch(wasmURL,{credentials:'same-origin'});}
 catch(e){throw Error('Cannot download '+wasmURL+'. '+(e.message||String(e)));}
 if(!response.ok)throw Error('Solid engine file returned HTTP '+response.status+': '+wasmURL+'. Check that the file is uploaded and accessible.');
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(bytes.length<8||![0,97,115,109,1,0,0,0].every((v,i)=>bytes[i]===v))throw Error('Expected WebAssembly but received an invalid file from '+wasmURL+'. Check for a missing upload, HTML redirect, or blocked asset request.');
 postMessage({status:'Starting solid engine…'});
 try{configure(await init({wasmBinary:bytes,locateFile:p=>new URL('../vendor/'+p,import.meta.url).href}));}
 catch(e){throw Error('Cannot initialize WebAssembly: '+(e.message||String(e)));}
 postMessage({ready:true});
})();
self.onmessage=async({data:{id,op,args}})=>{try{await ready;postMessage({id,result:await operate(op,args)});}catch(e){postMessage({id,error:e.message||String(e)});}};
ready.catch(e=>postMessage({fatal:e.message||String(e)}));
