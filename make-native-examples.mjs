import fs from 'node:fs';import init from './node_modules/replicad-opencascadejs/dist/replicad_single.js';import {configure,operate} from './cad/core.mjs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),K=require('./interchange.js');
configure(await init({wasmBinary:fs.readFileSync('vendor/replicad_single.wasm')}));
const box=await operate('primitive',{kind:'box',w:60,d:40,h:30});
const rounded=await operate('finish',{object:box,kind:'fillet',amount:4,mode:'constant',all:true});
const plate=await operate('primitive',{kind:'box',w:70,d:50,h:12}),bore=await operate('primitive',{kind:'cylinder',r:10,h:14,position:[35,25,-1]});
const drilled=await operate('boolean',{object:plate,other:bore,kind:'subtract'});
const beveled=await operate('finish',{object:drilled,kind:'chamfer',amount:1.5,mode:'equal',edges:drilled.cad.edges.filter(e=>e.type==='CIRCLE').map(e=>e.index)});
const enclosure=await operate('primitive',{kind:'enclosure',w:80,d:60,h:30,thickness:3});
const vertical=enclosure.cad.edges.filter(e=>e.type==='LINE'&&Math.abs(e.start[0]-e.end[0])<1e-5&&Math.abs(e.start[1]-e.end[1])<1e-5).map(e=>e.index);
const housing=await operate('finish',{object:enclosure,kind:'fillet',amount:2,mode:'constant',edges:vertical});
const models=[['rounded-block','Rounded block · R4',rounded,'#70b69b'],['chamfered-bore','Chamfered bore · 1.5 mm',beveled,'#d78362'],['filleted-enclosure','Inside & outside fillets · R2',housing,'#bf9b58']];
const documents=[],stats=[];fs.mkdirSync('verification',{recursive:true});
for(const [slug,name,mesh,color]of models){const object={...mesh,id:slug,name,color,visible:true,locked:false,group:null,layer:null},doc={app:'SKETCHBENCH',schema:3,version:'2.0.0-rc.1',projectId:'example-'+slug,name,units:'mm',objects:[object],layers:[],annotations:[],views:[],components:[],groups:[],definitions:[],materials:[],scenes:[]};documents.push(doc);fs.writeFileSync('examples/'+slug+'.sketchbench.json',JSON.stringify(doc));fs.writeFileSync('examples/'+slug+'.stl',K.stl([object]));fs.writeFileSync('examples/'+slug+'.glb',Buffer.from(K.glb([object])));fs.writeFileSync('examples/'+slug+'.step',(await operate('exportSTEP',{object})).text);stats.push({slug,volume:mesh.cad.volume,triangles:mesh.faces.length,surfaces:mesh.cad.faces.length,edges:mesh.cad.edges.length});}
fs.writeFileSync('native-examples.js','/* Generated from make-native-examples.mjs. GPL-3.0-only. */\nconst nativeExamples='+JSON.stringify(documents)+';\n');fs.writeFileSync('verification/native-example-stats.json',JSON.stringify(stats,null,2));console.log(stats);
