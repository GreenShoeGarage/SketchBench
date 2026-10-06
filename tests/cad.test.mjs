import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import init from '../node_modules/replicad-opencascadejs/dist/replicad_single.js';import {configure,operate} from '../cad/core.mjs';
configure(await init({wasmBinary:fs.readFileSync(new URL('../vendor/replicad_single.wasm',import.meta.url))}));
const box=await operate('primitive',{kind:'box',w:60,d:40,h:30});
test('native box mesh and exact volume',{concurrency:false},async()=>{assert.equal(box.cad.volume,72000);assert.equal(box.cad.edges.length,12);assert.equal(box.cad.faceMap.length,box.faces.length);assert.equal((await operate('inspect',{object:box})).valid,true);});
test('fillet all twelve edges and serialize round trip',async()=>{const x=await operate('finish',{object:box,kind:'fillet',amount:3,all:true,mode:'constant'});assert.ok(x.cad.volume<72000&&x.cad.volume>70000);assert.equal((await operate('inspect',{object:x})).valid,true);assert.ok(x.cad.faces.length>6);assert.ok(x.faces.length<15000);const restored=await operate('undoFeature',{object:x});assert.equal(restored.cad.volume,72000);});
test('variable-radius fillet and editable feature',async()=>{const x=await operate('finish',{object:box,kind:'fillet',amount:2,amount2:4,edges:[0],mode:'variable'});assert.ok(x.cad.volume<72000);const y=await operate('editFeature',{object:x,amount:3,amount2:5});assert.ok(y.cad.volume<x.cad.volume);});
test('equal, two-distance, and angle chamfers',async()=>{for(const mode of ['equal','two','angle']){const x=await operate('finish',{object:box,kind:'chamfer',amount:2,amount2:3,angle:30,edges:[0],mode,referenceFace:0});assert.ok(x.cad.volume<72000);assert.equal((await operate('inspect',{object:x})).valid,true);}});
test('oversized radius rejects without modifying source',async()=>{const before=JSON.stringify(box);await assert.rejects(operate('finish',{object:box,kind:'fillet',amount:100,all:true}));assert.equal(JSON.stringify(box),before);});
test('thin wall enclosure internal and external fillets',async()=>{const body=await operate('primitive',{kind:'enclosure',w:80,d:60,h:30,thickness:3});const vertical=body.cad.edges.filter(e=>e.type==='LINE'&&Math.abs(e.start[0]-e.end[0])<1e-5&&Math.abs(e.start[1]-e.end[1])<1e-5).map(e=>e.index);const x=await operate('finish',{object:body,kind:'fillet',amount:2,edges:vertical});assert.equal((await operate('inspect',{object:x})).valid,true);});
test('circular hole chamfer after boolean',async()=>{const cyl=await operate('primitive',{kind:'cylinder',r:5,h:32,position:[30,20,-1]});const b=await operate('boolean',{object:box,other:cyl,kind:'subtract'});const x=await operate('finish',{object:b,kind:'chamfer',amount:1,mode:'equal',edges:b.cad.edges.filter(e=>e.type==='CIRCLE').map(e=>e.index)});assert.ok(x.cad.volume<b.cad.volume);});
test('draw on face, select region, push through opening',async()=>{const split=await operate('splitFace',{object:box,points:[[10,10,30],[30,10,30],[30,25,30],[10,25,30]],closed:true});assert.ok(split.cad.faces.length>6);const region=split.cad.faces.find(f=>f.type==='PLANE'&&Math.abs(f.center[0]-20)<1e-4&&Math.abs(f.center[1]-17.5)<1e-4&&Math.abs(f.center[2]-30)<1e-4);assert.ok(region);const cut=await operate('pushpull',{object:split,face:region.index,distance:-30});assert.ok(Math.abs(cut.cad.volume-63000)<.01);});
test('face divider heals, plane split and STEP export',async()=>{const split=await operate('splitFace',{object:box,points:[[0,20,30],[60,20,30]],closed:false});assert.ok(split.cad.faces.length>6);const healed=await operate('heal',{object:split});assert.equal(healed.cad.faces.length,6);const halves=await operate('splitPlane',{object:box,origin:[0,0,15],normal:[0,0,1]});assert.equal(halves.parts.length,2);assert.ok(Math.abs(halves.parts.reduce((v,p)=>v+p.cad.volume,0)-72000)<.01);const text=(await operate('exportSTEP',{object:box})).text;assert.ok(text.includes('ISO-10303-21'));});
test('cone, torus, circle extrusion, offset and planar resize',async()=>{for(const kind of ['cone','torus']){const m=await operate('primitive',{kind,r:20,h:30,thickness:4});assert.ok(m.cad.volume>0);assert.ok((await operate('inspect',{object:m})).valid);}const circle=await operate('circleProfile',{radius:10,center:[0,0,0],normal:[0,0,1]});const cylinder=await operate('extrudeRegion',{object:circle,distance:20,holes:[]});assert.ok(Math.abs(cylinder.cad.volume-Math.PI*2000)<1e-5);const split=await operate('offset',{object:box,face:5,distance:-3,divide:true});assert.ok(split.cad.faces.length>6);const resized=await operate('resize',{object:box,axis:0,size:80});assert.ok(Math.abs(resized.cad.volume-96000)<1e-5);});
test('analytic inner circle survives region extrusion',async()=>{const outer=await operate('circleProfile',{radius:20,center:[0,0,0],normal:[0,0,1]}),inner=await operate('circleProfile',{radius:10,center:[0,0,0],normal:[0,0,1]});const m=await operate('extrudeRegion',{object:outer,holes:[inner],distance:10});assert.ok(Math.abs(m.cad.volume-Math.PI*3000)<1e-4);});
test('native swept path and bundled-font text',async()=>{const tube=await operate('sweep',{loops:[[[0,-2,-2],[0,2,-2],[0,2,2],[0,-2,2]]],path:[[0,0,0],[20,0,0],[20,20,0]]});assert.ok(tube.cad.volume>500);const font=fs.readFileSync(new URL('../vendor/DejaVuSans.ttf',import.meta.url));const text=await operate('text',{text:'GSG',size:10,depth:2,font:font.buffer.slice(font.byteOffset,font.byteOffset+font.byteLength)});assert.ok(text.cad.volume>10);});
test('moved fillet remains at its new location when edited and removed',async()=>{const moved={...structuredClone(box),cad:{...structuredClone(box.cad),transforms:[[1,0,0,100,0,1,0,20,0,0,1,30]]}},f=await operate('finish',{object:moved,kind:'fillet',mode:'constant',amount:2,edges:[0]}),edit=await operate('editFeature',{object:f,amount:3}),plain=await operate('undoFeature',{object:edit});for(const m of [f,edit,plain]){assert.ok(Math.min(...m.vertices.map(p=>p[0]))>=99.999);assert.ok(Math.min(...m.vertices.map(p=>p[2]))>=29.999);}assert.ok(Math.abs(plain.cad.volume-72000)<.01);});
test('sweeping a hollow profile retains its hole',async()=>{const path=[[0,0,0],[30,0,0]],outer=[[0,-5,-5],[0,5,-5],[0,5,5],[0,-5,5]],inner=[[0,-2,-2],[0,2,-2],[0,2,2],[0,-2,2]],m=await operate('sweep',{loops:[outer,inner],path});assert.ok(Math.abs(m.cad.volume-2520)<.01);});
test('extruding a native face preserves holes already present in its BREP',async()=>{const p=await operate('profile',{loops:[[[0,0,0],[20,0,0],[20,20,0],[0,20,0]],[[5,5,0],[15,5,0],[15,15,0],[5,15,0]]]});const s=await operate('extrudeRegion',{object:p,distance:10});assert.ok(Math.abs(s.cad.volume-3000)<.0001);});
test('all-edge fillet excludes cylindrical seam edges',async()=>{const c=await operate('primitive',{kind:'cylinder',r:12,h:20});const f=await operate('finish',{object:c,kind:'fillet',amount:2,mode:'constant',all:true});assert.ok(f.cad.volume<c.cad.volume);assert.equal((await operate('inspect',{object:f})).valid,true);});

test('inward shell removes a chosen face and preserves outside dimensions',async()=>{
 const before=JSON.stringify(box),top=box.cad.faces.find(f=>f.normal[2]>.99).index;
 const hollow=await operate('shell',{object:box,faces:[top],thickness:2});
 assert.ok(Math.abs(hollow.cad.volume-(60*40*30-56*36*28))<1e-6);
 for(let axis=0;axis<3;axis++){
  assert.ok(Math.abs(Math.min(...hollow.vertices.map(p=>p[axis])))<1e-6);
  assert.ok(Math.abs(Math.max(...hollow.vertices.map(p=>p[axis]))-[60,40,30][axis])<1e-6);
 }
 assert.ok(hollow.cad.faces.some(f=>f.normal[2]>.99&&Math.abs(f.center[2]-2)<1e-6));
 assert.equal((await operate('inspect',{object:hollow})).solids,1);assert.equal(JSON.stringify(box),before);
});
test('shell supports side openings and multiple opposite openings',async()=>{
 const left=box.cad.faces.find(f=>f.normal[0]<-.99).index;
 const side=await operate('shell',{object:box,face:left,thickness:2});
 assert.ok(Math.abs(side.cad.volume-(72000-58*36*26))<1e-6);
 const ends=box.cad.faces.filter(f=>Math.abs(f.normal[2])>.99).map(f=>f.index);
 const tube=await operate('shell',{object:box,faces:ends,thickness:2});
 assert.ok(Math.abs(tube.cad.volume-(60*40-56*36)*30)<1e-6);
 assert.equal((await operate('inspect',{object:tube})).valid,true);
});
test('closed hollow subtracts an interior cavity instead of returning a smaller solid',async()=>{
 const closed=await operate('shell',{object:box,closed:true,thickness:2});
 assert.ok(Math.abs(closed.cad.volume-(72000-56*36*26))<1e-6);
 assert.equal(closed.cad.faces.length,12);
 const sphere=await operate('primitive',{kind:'sphere',r:20});
 const ball=await operate('shell',{object:sphere,closed:true,thickness:2});
 assert.ok(Math.abs(ball.cad.volume-4*Math.PI/3*(20**3-18**3))<1e-5);
 assert.equal((await operate('inspect',{object:ball})).valid,true);
});
test('cylindrical shell retains analytic round walls and translated source placement',async()=>{
 const cylinder=await operate('primitive',{kind:'cylinder',r:15,h:40});
 const top=cylinder.cad.faces.find(f=>f.type==='PLANE'&&f.normal[2]>.99).index;
 cylinder.cad.transforms=[[1,0,0,100,0,1,0,-30,0,0,1,7]];
 const cup=await operate('shell',{object:cylinder,faces:[top],thickness:2});
 assert.ok(Math.abs(cup.cad.volume-Math.PI*(15**2*40-13**2*38))<1e-5);
 assert.equal(cup.cad.faces.filter(f=>f.type==='CYLINDRE').length,2);
 assert.ok(Math.abs(Math.min(...cup.vertices.map(p=>p[2]))-7)<1e-6);
 assert.ok(Math.min(...cup.vertices.map(p=>p[0]))>=84.999);
});
test('shell rejects excessive thickness and invalid openings without changing input',async()=>{
 const top=box.cad.faces.find(f=>f.normal[2]>.99).index,before=JSON.stringify(box);
 for(const args of [{faces:[top],thickness:25},{closed:true,thickness:25},{faces:[],thickness:2},{faces:[999],thickness:2},{faces:box.cad.faces.map(f=>f.index),thickness:2},{faces:[top],thickness:0},{faces:[top],thickness:-1},{faces:[top],thickness:NaN}])await assert.rejects(operate('shell',{object:box,...args}));
 assert.equal(JSON.stringify(box),before);
});

test('shell hollows filleted boxes when the thick-solid builder returns unchanged or invalid geometry',async()=>{
 const plain=await operate('primitive',{kind:'box',w:80,d:60,h:40});
 const edge=plain.cad.edges.find(e=>e.type==='LINE'&&e.start[2]>39&&e.end[2]>39).index;
 for(const all of [false,true]){
  const rounded=await operate('finish',{object:plain,kind:'fillet',amount:3,mode:'constant',edges:[edge],all});
  const top=rounded.cad.faces.find(f=>f.type==='PLANE'&&f.normal[2]>.99).index;
  const hollow=await operate('shell',{object:rounded,faces:[top],thickness:2});
  assert.ok(hollow.cad.volume>0&&hollow.cad.volume<rounded.cad.volume/2);
  assert.equal((await operate('inspect',{object:hollow})).valid,true);
  assert.equal((await operate('inspect',{object:hollow})).solids,1);
  if(all){
   const closed=await operate('shell',{object:rounded,closed:true,thickness:2});
   assert.ok(Math.abs(closed.cad.volume-hollow.cad.volume-74*54*2)<1e-5);
  }
 }
});

test('two-face splits use midpoint or a distance from the first face in either order',async()=>{
 const bottom=box.cad.faces.find(f=>f.normal[2]<-.99).index,top=box.cad.faces.find(f=>f.normal[2]>.99).index;
 for(const faces of [[bottom,top],[top,bottom]]){
  const middle=await operate('splitBetweenFaces',{object:box,faces,mode:'middle'});
  assert.equal(middle.parts.length,2);for(const p of middle.parts){assert.ok(Math.abs(p.cad.volume-36000)<1e-6);assert.ok((await operate('inspect',{object:p})).valid);}
  const off=await operate('splitBetweenFaces',{object:box,faces,mode:'distance',distance:7});
  assert.ok(Math.abs(off.parts[0].cad.volume-60*40*7)<1e-6);assert.ok(Math.abs(off.parts[1].cad.volume-60*40*23)<1e-6);
  assert.ok(Math.abs(off.plane.origin[2]-(faces[0]===bottom?7:23))<1e-6);
 }
});

test('two-face split resolves native transforms, cylinders, and filleted bodies',async()=>{
 const c=Math.cos(Math.PI/6),s=Math.sin(Math.PI/6),moved=structuredClone(box);
 moved.cad.transforms=[[c,0,s,100,0,1,0,-20,-s,0,c,30]];
 const faces=[box.cad.faces.find(f=>f.normal[2]<-.99).index,box.cad.faces.find(f=>f.normal[2]>.99).index];
 const result=await operate('splitBetweenFaces',{object:moved,faces,mode:'distance',distance:8});
 assert.ok(Math.abs(result.parts[0].cad.volume-19200)<1e-5);assert.ok(Math.abs(result.plane.normal[0]-s)<1e-6);assert.ok(Math.abs(result.plane.normal[2]-c)<1e-6);
 for(const body of [await operate('primitive',{kind:'cylinder',r:12,h:30}),await operate('finish',{object:box,kind:'fillet',amount:2,all:true})]){
  const faces=[body.cad.faces.find(f=>f.type==='PLANE'&&f.normal[2]<-.99).index,body.cad.faces.find(f=>f.type==='PLANE'&&f.normal[2]>.99).index];
  const r=await operate('splitBetweenFaces',{object:body,faces,mode:'middle'});
  assert.equal(r.parts.length,2);assert.ok(Math.abs(r.parts.reduce((s,p)=>s+p.cad.volume,0)-body.cad.volume)<.001);
 }
});

test('invalid two-face and outside-plane splits preserve the source',async()=>{
 const before=JSON.stringify(box),top=box.cad.faces.find(f=>f.normal[2]>.99).index,bottom=box.cad.faces.find(f=>f.normal[2]<-.99).index,side=box.cad.faces.find(f=>f.normal[0]>.99).index;
 for(const args of [{faces:[top,top]},{faces:[top,side]},{faces:[top,999]},{faces:[top,bottom],mode:'distance',distance:0},{faces:[top,bottom],mode:'distance',distance:30},{faces:[top,bottom],mode:'distance',distance:31},{faces:[top,bottom],mode:'distance',distance:NaN}])await assert.rejects(operate('splitBetweenFaces',{object:box,mode:'middle',...args}));
 for(const z of [-5,0,30,50])await assert.rejects(operate('splitPlane',{object:box,origin:[0,0,z],normal:[0,0,1]}));
 const cyl=await operate('primitive',{kind:'cylinder',r:10,h:20});await assert.rejects(operate('splitBetweenFaces',{object:cyl,faces:[cyl.cad.faces.find(f=>f.type!=='PLANE').index,cyl.cad.faces.find(f=>f.type==='PLANE').index],mode:'middle'}),/planar/);
 assert.equal(JSON.stringify(box),before);
});
