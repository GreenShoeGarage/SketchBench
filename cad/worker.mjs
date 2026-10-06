import init from '../vendor/occt.js';
import {configure,operate} from './core.bundle.mjs';
const ready=init({locateFile:p=>new URL('../vendor/'+p,import.meta.url).href}).then(oc=>{configure(oc);postMessage({ready:true});});
self.onmessage=async({data:{id,op,args}})=>{try{await ready;postMessage({id,result:await operate(op,args)});}catch(e){postMessage({id,error:e.message||String(e)});}};
ready.catch(e=>postMessage({fatal:e.message||String(e)}));
