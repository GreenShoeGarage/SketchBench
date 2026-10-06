import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {environment} from './harness.cjs';import init from '../node_modules/replicad-opencascadejs/dist/replicad_single.js';import {configure,operate} from '../cad/core.mjs';
configure(await init({wasmBinary:fs.readFileSync(new URL('../vendor/replicad_single.wasm',import.meta.url))}));
async function setup(){const e=environment();await e.run('load()');for(const f of ['cad-ui.js','shell-tool.js','precision-v2.js','assemblies.js','presentation.js','documentation-v2.js','display-v2.js','interaction-v2.js','drawing-inputs.js','workplane-split.js','native-examples.js','release-v2.js'])e.run(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));e.c.nativeOp=operate;e.run('cadReady=true;cadCall=(op,args)=>nativeOp(op,JSON.parse(JSON.stringify(args))); doc=newDocument(); prefs.snap=false;');return e;}
test('unit parser includes fractions and mixed feet/inches',async()=>{const e=await setup();assert.equal(e.run('parseLength("1/2in")'),12.7);assert.equal(e.run('parseLength("1 1/2in")'),38.099999999999994);assert.equal(e.run('parseLength("3ft 2in")'),965.2);assert.throws(()=>e.run('parseLength("1/0in")'));});
test('native solid edit, exact move, save migration and undo',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});e.run('edit(()=>addObject("Box",mesh)); edit(()=>K.transform(doc.objects[0],p=>V.add(p,[10,20,30])));');const o=e.run('doc.objects[0]');const changed=await operate('finish',{object:o,kind:'fillet',amount:2,edges:[0],mode:'constant'});assert.ok(changed.vertices.every(p=>p[0]>=9.999&&p[1]>=19.999&&p[2]>=29.999));e.run('doc=validateProject(JSON.parse(JSON.stringify(doc)));');assert.equal(e.run('!!doc.objects[0].cad'),true);e.run('undo()');assert.equal(e.run('K.bounds(doc.objects).lo[0]'),0);});
test('native face drawing and pushpull through controller',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});e.run('addObject("Box",mesh); const face=doc.objects[0].cad.faces.find(f=>f.normal[2]>.99); selectedFace={id:doc.objects[0].id,face:doc.objects[0].cad.faceMap.indexOf(face.index)}; faceWorkplane();');await e.run('newProfile([[10,10,30],[30,10,30],[30,25,30],[10,25,30]],"Rectangle")');assert.equal(e.run('doc.objects.length'),1);assert.ok(e.run('doc.objects[0].cad.faces.length')>6);e.run('const o=doc.objects[0],f=o.cad.faces.find(f=>Math.abs(f.center[0]-20)<.001&&Math.abs(f.center[1]-17.5)<.001&&Math.abs(f.center[2]-30)<.001); selectedFace={id:o.id,face:o.cad.faceMap.indexOf(f.index)}; $("#extrudeDistance").value=-30;');await e.run('applyExtrude()');assert.ok(Math.abs(e.run('doc.objects[0].cad.volume')-63000)<.01);});
test('linked definition edits update translated instance',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:10,d:10,h:10});e.run('addObject("Leg",mesh); actions.components(); $("#defineComponent").onclick();');const def=e.run('doc.definitions[0]');e.run('camera.target=[50,0,0]');const insert=e.run('$$(["[data-definition-insert]"][0])[0]');insert.onclick();e.run('openContext(); selected=new Set(doc.objects.filter(o=>o.component.instance===editContext.id).map(o=>o.id));edit(()=>editable()[0].color="#ff0000");');assert.equal(e.run('doc.objects.filter(o=>o.color==="#ff0000").length'),2);const data=e.run('validateProject(JSON.parse(JSON.stringify(doc)))');assert.equal(data.definitions.length,1);assert.ok(data.objects.every(o=>o.cad&&o.component));});
test('perspective ray matches planar projection and survives scene JSON',async()=>{const e=await setup();e.run('camera.perspective=true;camera.fov=55;camera.target=[0,0,0];prefs.plane="xy";');const p=e.run('const projected=project([12,5,0]);planePoint(projected[0],projected[1])');assert.ok(Math.hypot(p[0]-12,p[1]-5,p[2])<1e-7);e.run('doc.scenes=[{id:"scene",name:"Perspective",...sceneData()}];doc=validateProject(JSON.parse(JSON.stringify(doc)));');assert.equal(e.run('doc.scenes[0].camera.perspective'),true);});
test('enclosure sections form inner and outer loops and filled caps',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'enclosure',w:80,d:60,h:30,thickness:3});e.run('addObject("Enclosure",mesh);doc.section={enabled:true,axis:2,offset:15,keepPositive:false,fill:true};render();');assert.equal(e.run('sectionGeometry(doc.objects[0]).loops.length'),2);assert.ok(e.run('displayTriangles(doc.objects[0]).some(t=>t.sectionCap)'));assert.ok(e.run('displayTriangles(doc.objects[0]).every(t=>t.points.every(p=>p[2]<=15.00001))'));});
test('attached bounds dimensions update with native edits and report deleted references',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});e.run('addObject("Box",mesh);doc.annotations=[{id:"dim",label:"Width",points:[[0,0,0],[60,0,0]],attachment:{type:"bounds",object:doc.objects[0].id,axis:0}}];');e.c.resized=await operate('resize',{object:e.run('doc.objects[0]'),axis:0,size:80});e.run('edit(()=>Object.assign(doc.objects[0],resized));render();doc=validateProject(JSON.parse(JSON.stringify(doc)));');assert.equal(e.run('doc.annotations[0].points[1][0]'),80);e.run('edit(()=>doc.objects=[]);render()');assert.equal(e.run('doc.annotations[0].broken'),true);});
test('materials persist face assignments and reject unsafe texture payloads',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:20,d:20,h:20});e.run('addObject("Box",mesh);doc.materials=[{id:"mat",name:"Red",color:"#ff0000",opacity:.5,scale:50}];doc.objects[0].faceMaterials={0:"mat"};doc=validateProject(JSON.parse(JSON.stringify(doc)));render();');assert.equal(e.run('faceAppearance(doc.objects[0],0).color'),'#ff0000');assert.throws(()=>e.run('doc.materials[0].texture="data:image/svg+xml,<svg>";validateProject(doc)'));});
test('linked instances propagate native shape edits, member additions and deletions',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:10,d:10,h:10});e.run('addObject("Part",mesh);actions.components();$("#defineComponent").onclick();camera.target=[50,0,0];$$("[data-definition-insert]")[0].onclick();openContext();');e.c.rounded=await operate('finish',{object:e.run('doc.objects.find(o=>o.component.instance===editContext.id)'),kind:'fillet',mode:'constant',amount:1,edges:[0]});e.run('edit(()=>Object.assign(doc.objects.find(o=>o.component.instance===editContext.id),rounded));');const objects=e.run('doc.objects');assert.ok(Math.abs(objects[0].cad.volume-objects[1].cad.volume)<1e-7);assert.ok(Math.abs(objects[0].vertices[0][0]-objects[1].vertices[0][0])>40);e.run('edit(()=>addObject("New member",K.box(2,2,2)));');assert.equal(e.run('doc.objects.length'),4);assert.equal(e.run('doc.definitions[0].members.length'),2);e.run('edit(()=>doc.objects=doc.objects.filter(o=>!(o.component.instance===editContext.id&&o.name==="New member")));');assert.equal(e.run('doc.objects.length'),2);assert.equal(e.run('doc.definitions[0].members.length'),1);});
test('cancelled edge-tool preview cannot restore a stale result',async()=>{const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:10,d:10,h:10});e.run('addObject("Part",mesh);edgeSelection={id:doc.objects[0].id,indices:new Set([0])};edgeTool("fillet");');let resolve;e.c.delayed=new Promise(r=>resolve=r);e.run('cadCall=()=>delayed;');const pending=e.run('$("#finishPreview").onclick()');e.run('closeDialog()');resolve(e.c.mesh);await pending;assert.equal(e.run('cadPreview'),null);assert.equal(e.run('history.length'),0);});
test('analytic nested circles pick and extrude the annulus through the controller',async()=>{const e=await setup();e.c.outer=await operate('circleProfile',{radius:20,center:[0,0,0],normal:[0,0,1]});e.c.inner=await operate('circleProfile',{radius:10,center:[0,0,0],normal:[0,0,1]});e.run('addObject("Outer",outer);addObject("Inner",inner);setView("top");render();const p=project([15,0,0]);const h=hit(p[0],p[1]);selectHit(h);$("#extrudeDistance").value=10;');await e.run('applyExtrude()');assert.ok(Math.abs(e.run('doc.objects[0].cad.volume')-Math.PI*3000)<1e-3);assert.ok(e.run('doc.objects[1].cad.volume')<1e-6);});
test('angular and leader dimensions survive project round trip',async()=>{const e=await setup();e.run('doc.annotations=[{id:"angle",kind:"angle",label:"Corner",points:[[10,0,0],[0,0,0],[0,10,0]]},{id:"label",kind:"leader",label:"Cable entry",points:[[1,2,3],[8,9,10]]}];doc=validateProject(JSON.parse(JSON.stringify(doc)));render();');assert.match(e.run('annotationValue(doc.annotations[0])'),/90°/);assert.equal(e.run('annotationValue(doc.annotations[1])'),'Cable entry');});
test('new rectangle with a circular inner sketch extrudes an exact bored solid',async()=>{const e=await setup();await e.run('newProfile([[0,0,0],[60,0,0],[60,40,0],[0,40,0]],"Rectangle")');e.c.circle=await operate('circleProfile',{radius:5,center:[30,20,0],normal:[0,0,1]});e.run('edit(()=>addObject("Circle",circle));selectedFace={id:doc.objects[0].id,face:0};selected=new Set([doc.objects[0].id]);$("#extrudeDistance").value=20;');await e.run('applyExtrude()');assert.ok(Math.abs(e.run('doc.objects[0].cad.volume')-(60*40-Math.PI*25)*20)<.001);assert.equal(e.run('doc.objects[0].cad.edges.filter(e=>e.type==="CIRCLE").length'),2);});
test('perspective clipping rejects behind-camera surfaces',async()=>{const e=await setup();e.run('camera={az:0,el:0,scale:10,target:[0,0,0],perspective:true,fov:60};');const result=e.run('nearPolygon([[-1,1000,-1],[1,1000,-1],[0,1000,1]])');assert.equal(result.length,0);const clipped=e.run('nearPolygon([[-1,0,0],[1,0,0],[0,1000,1]])');assert.ok(clipped.length>=3);e.c.clipped=clipped;assert.ok(e.run('clipped.every(p=>nearDistance(p)>=-1e-8)'));});

test('native face grids align to world axes independently of tessellation and face position',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:80,d:60,h:40,position:[3,7,11]});
 e.run('addObject("Offset box",mesh);setView("iso");');const before=e.run('snapshot()');
 for(const face of e.c.mesh.cad.faces){
  let previous;
  for(let ti=0;ti<e.c.mesh.faces.length;ti++){
   if(e.c.mesh.cad.faceMap[ti]!==face.index)continue;
   e.run(`selectedFace={id:doc.objects[0].id,face:${ti}};faceWorkplane();`);
   const f=JSON.parse(e.run('JSON.stringify(workFrame())'));
   for(const a of [f.u,f.v])assert.ok(a.filter(x=>Math.abs(x)>1e-8).length===1);
   assert.ok(f.n.every((v,i)=>Math.abs(v-face.normal[i])<1e-8));
   const distance=face.center.reduce((s,v,i)=>s+v*face.normal[i],0);
   assert.ok(f.o.every((v,i)=>Math.abs(v-distance*face.normal[i])<1e-8));
   if(previous)assert.deepEqual(f,previous);previous=f;
   // Every rendered local line runs parallel to a projected world axis.
   assert.ok(e.run(`(()=>{const f=workFrame(),p=K.world([20,30,0],f),o=project(p);return [f.u,f.v].every(a=>{const i=a.findIndex(x=>Math.abs(x)>.9),axis=[0,0,0];axis[i]=1;const q=project(V.add(p,a)),r=project(V.add(p,axis));return Math.abs((q[0]-o[0])*(r[1]-o[1])-(q[1]-o[1])*(r[0]-o[0]))<1e-8;});})()`));
  }
 }
 assert.equal(e.run('snapshot()'),before);
});

test('tilted face grid is coplanar, orthonormal, and stable across triangles',async()=>{
 const e=await setup();
 const result=e.run(`(()=>{const a=[3,4,5],b=[13,4,15],c=[13,14,15],d=[3,14,5],f=alignedWorkFrame([a,b,c]),g=alignedWorkFrame([a,c,d]);return {f,g,local:[a,b,c,d].map(p=>K.local(p,f)),roundtrip:K.world(K.local(c,f),f)};})()`);
 for(const key of ['o','u','v','n'])for(let i=0;i<3;i++)assert.ok(Math.abs(result.f[key][i]-result.g[key][i])<1e-8);
 assert.ok(result.local.every(p=>Math.abs(p[2])<1e-8));assert.ok(result.roundtrip.every((v,i)=>Math.abs(v-[13,14,15][i])<1e-8));
 for(const key of ['u','v','n'])assert.ok(Math.abs(Math.hypot(...result.f[key])-1)<1e-8);
});

test('Shell preselects the clicked face, previews without mutation, applies, saves and undoes',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});
 e.run('addObject("Box",mesh);const top=doc.objects[0].cad.faces.find(f=>f.normal[2]>.99).index;selectedFace={id:doc.objects[0].id,face:doc.objects[0].cad.faceMap.indexOf(top)};actions.shell();');
 assert.equal(e.run('$$("[data-shell-face]").filter(b=>b.checked).length'),1);
 const before=e.run('snapshot()');await e.run('$("#shellPreview").onclick()');
 assert.equal(e.run('snapshot()'),before);assert.ok(Math.abs(e.run('cadPreview.mesh.cad.volume')-15552)<1e-6);
 e.run('$("#shellThickness").value="3";$("#shellThickness").oninput()');assert.equal(e.run('cadPreview'),null);
 await e.run('$("#shellApply").onclick()');assert.equal(e.nodes.get('dialog').open,false);
 assert.ok(Math.abs(e.run('doc.objects[0].cad.volume')-(72000-54*34*27))<1e-6);
 assert.ok(e.run('validateProject(JSON.parse(snapshot())).objects[0].cad.brep.includes("CASCADE Topology")'));
 e.run('undo()');assert.ok(Math.abs(e.run('doc.objects[0].cad.volume')-72000)<1e-6);
});

test('Shell closed mode works without a selected face and reports invalid thickness in the dialog',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});
 e.run('addObject("Box",mesh);selectedFace=null;actions.shell();$("#shellMode").value="closed";$("#shellMode").onchange();');
 assert.equal(e.nodes.get('shellOpenings').hidden,true);
 const before=e.run('snapshot()');await e.run('$("#shellPreview").onclick()');assert.ok(Math.abs(e.run('cadPreview.mesh.cad.volume')-19584)<1e-6);
 e.run('$("#shellThickness").value="25";$("#shellThickness").oninput();');await e.run('$("#shellApply").onclick()');
 assert.equal(e.run('snapshot()'),before);assert.equal(e.run('cadPreview'),null);assert.equal(e.nodes.get('dialog').open,true);
 assert.match(e.nodes.get('shellStatus').textContent,/Cannot shell/);
});

test('cancelled Shell apply and changed-settings previews cannot commit a late result',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});
 e.run('addObject("Box",mesh);selectedFace=null;actions.shell();$("#shellMode").value="closed";$("#shellMode").onchange();');
 let resolve;e.c.delayed=new Promise(r=>resolve=r);e.run('cadCall=()=>delayed;');
 const before=e.run('snapshot()'),pending=e.run('$("#shellApply").onclick()');e.run('closeDialog()');resolve(e.c.mesh);await pending;
 assert.equal(e.run('snapshot()'),before);assert.equal(e.run('cadPreview'),null);assert.equal(e.run('history.length'),0);
 e.run('actions.shell();$("#shellMode").value="closed";$("#shellMode").onchange();');e.c.delayed=new Promise(r=>resolve=r);
 const preview=e.run('$("#shellPreview").onclick()');e.run('$("#shellThickness").value="3";$("#shellThickness").oninput();');resolve(e.c.mesh);await preview;
 assert.equal(e.run('cadPreview'),null);assert.equal(e.run('snapshot()'),before);
});

test('drawing panel makes an exact negative-quadrant rectangle with unit-aware dimensions',async()=>{
 const e=await setup();e.run('setTool("rectangle");points=[[20,30,0]];hover=[-10,-20,0];$("#drawA").value="2in";changeDrawingInput(0);$("#drawB").value="1/2in";changeDrawingInput(1);');
 const ps=e.run('previewPoints()');assert.ok(Math.abs(ps[2][0]+30.8)<1e-8);assert.ok(Math.abs(ps[2][1]-17.3)<1e-8);
 await e.run('commitDrawing()');assert.equal(e.run('doc.objects.length'),1);
 const b=e.run('K.bounds(doc.objects)');assert.ok(Math.abs(b.size[0]-50.8)<1e-6);assert.ok(Math.abs(b.size[1]-12.7)<1e-6);assert.equal(e.run('tool'),'pushpull');
 e.run('undo()');assert.equal(e.run('doc.objects.length'),0);
});

test('exact drawing retains mouse dimensions, supports circle and angled line, and rejects bad input',async()=>{
 const e=await setup();e.run('setTool("rectangle");points=[[0,0,0]];hover=[19,35,0];$("#drawA").value="22mm";changeDrawingInput(0);');await e.run('commitDrawing()');assert.equal(e.run('K.bounds(doc.objects).size[1]'),35);
 e.run('setTool("circle");points=[[80,0,0]];hover=[85,0,0];$("#drawA").value="-2";changeDrawingInput(0);');const before=e.run('snapshot()');await e.run('commitDrawing()');assert.equal(e.run('snapshot()'),before);assert.match(e.nodes.get('drawStatus').textContent,/positive radius/);
 e.run('$("#drawA").value="1/2in";changeDrawingInput(0)');await e.run('commitDrawing()');assert.ok(Math.abs(e.run('doc.objects.at(-1).cad.edges[0].radius')-12.7)<1e-6);
 e.run('setTool("line");points=[[0,0,0]];hover=[10,10,0];$("#drawA").value="10mm";changeDrawingInput(0)');await e.run('commitDrawing()');assert.ok(Math.abs(e.run('points[1][0]')-Math.sqrt(50))<1e-6);
 e.run('$("#drawA").value="1in";changeDrawingInput(0);$("#drawB").value="90";changeDrawingInput(1)');await e.run('commitDrawing()');assert.ok(Math.abs(e.run('points[2][1]-points[1][1]')-25.4)<1e-6);
});

test('click-drag and two-click drawing still commit the mouse-sized native profiles',async()=>{
 const e=await setup();e.run('setTool("rectangle");setView("top");prefs.autoFacePlane=false;const start=project([0,0,0]);cadPointerDown({button:0,pointerId:1},start[0],start[1]);const end=project([45,25,0]);cadPointerMove({pointerId:1},end[0],end[1]);hover=pointerPoint(end[0],end[1]);');
 e.run('finishInteraction()');await new Promise(r=>setImmediate(r));assert.equal(e.run('doc.objects.length'),1);assert.ok(Math.abs(e.run('K.bounds(doc.objects).size[0]')-45)<1e-6);
 e.run('setTool("circle");const p=project([80,0,0]);cadPointerDown({button:0,pointerId:2},p[0],p[1]);finishInteraction();');assert.equal(e.run('points.length'),1);
 await e.run('const q=project([90,0,0]);clickDraw(q[0],q[1]);');assert.equal(e.run('doc.objects.length'),2);
});

test('numeric shortcut focuses the visible field, and rotated rectangle preserves its chosen edge direction',async()=>{
 const e=await setup();let stopped=false;e.c.keystroke={key:'8',target:{matches:()=>false},preventDefault(){},stopImmediatePropagation(){stopped=true;}};
 e.run('setTool("rectangle");points=[[0,0,0]];hover=[20,10,0];drawingKeydown(keystroke)');assert.ok(stopped);assert.equal(e.nodes.get('drawA').value,'8');assert.equal(e.run('drawingLocks[0]'),true);
 e.run('setTool("rotatedRect");points=[[0,0,0],[10,10,0]];hover=[-5,15,0];$("#drawA").value="20";changeDrawingInput(0);$("#drawB").value="10";changeDrawingInput(1);');const ps=e.run('drawingGeometry()');assert.ok(Math.abs(Math.hypot(...ps[1])-20)<1e-6);assert.ok(Math.abs(Math.hypot(...ps[2].map((n,i)=>n-ps[1][i]))-10)<1e-6);await e.run('commitDrawing()');assert.equal(e.run('doc.objects.length'),1);
});

test('workplane controls create a visible offset plane and keep new sketches on it',async()=>{
 const e=await setup();e.run('actions.workplane();$("#newWorkplane").value="xz";$("#workplaneOffset").value="1/2in";$("#useWorkplane").onclick();');
 assert.equal(e.nodes.get('dialog').open,false);assert.equal(e.run('prefs.elevation'),-12.7);assert.equal(e.run('prefs.autoFacePlane'),false);assert.equal(e.run('workplaneBackdrops().length'),1);
 assert.ok(e.run('workplaneBackdrops()[0].quad.every(p=>Math.abs(p[1]+12.7)<1e-8)'));
 e.run('setTool("rectangle");points=[workFrame().o.slice()];$("#drawA").value="30";changeDrawingInput(0);$("#drawB").value="20";changeDrawingInput(1);');await e.run('commitDrawing()');assert.ok(e.run('doc.objects[0].vertices.every(p=>Math.abs(p[1]+12.7)<1e-6)'));
 e.run('$("#workplaneVisibility").onclick()');assert.equal(e.run('workplaneBackdrops().length'),0);assert.equal(e.run('prefs.elevation'),-12.7);
});

test('workplane face picking sets a stable face plane and can be cancelled without changing geometry',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});e.run('addObject("Box",mesh);setView("top");render();actions.pickWorkplane();');
 const before=e.run('snapshot()');e.run('const p=project([20,20,30]);cadPointerDown({button:0},p[0],p[1]);');assert.equal(e.run('pickingWorkplane'),false);assert.equal(e.run('prefs.plane'),'face');assert.ok(Math.abs(e.run('workFrame().o[2]')-30)<1e-6);assert.equal(e.run('snapshot()'),before);
 e.run('actions.pickWorkplane();$("#cancelWorkplanePick").onclick();');assert.equal(e.run('pickingWorkplane'),false);
 e.run('$("#elevation").value="5";$("#elevation").onchange({target:$("#elevation")});');assert.equal(e.run('sketchHost'),null);assert.ok(Math.abs(e.run('workFrame().o[2]')-35)<1e-6);
});

async function setupSplit(){
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});
 e.run('addObject("Body",mesh);actions.splitBody();const o=doc.objects[0],first=o.cad.faces.find(f=>f.normal[2]>.99),second=o.cad.faces.find(f=>f.normal[2]<-.99);pickSplitFace({o,face:o.cad.faceMap.indexOf(first.index)});pickSplitFace({o,face:o.cad.faceMap.indexOf(second.index)});');return e;
}

test('Split Body previews without mutation, offsets from the first face, saves and undoes both parts',async()=>{
 const e=await setupSplit(),before=e.run('snapshot()');assert.equal(e.run('currentSplitPlane().o[2]'),15);assert.equal(e.nodes.get('splitSettings').hidden,false);
 await e.run('$("#splitPreview").onclick()');assert.equal(e.run('snapshot()'),before);assert.equal(e.run('splitWorkflow.result.parts.length'),2);
 e.run('$("#splitMode").value="distance";$("#splitMode").onchange();$("#splitDistance").value="7mm";$("#splitDistance").oninput();');assert.equal(e.run('splitWorkflow.result'),null);assert.equal(e.run('currentSplitPlane().o[2]'),23);
 await e.run('$("#splitApply").onclick()');assert.equal(e.run('splitWorkflow'),null);assert.equal(e.run('doc.objects.length'),3);assert.equal(e.run('doc.objects[0].visible'),false);assert.equal(e.run('selected.size'),2);assert.ok(Math.abs(e.run('doc.objects[1].cad.volume')-16800)<1e-6);
 assert.equal(e.run('validateProject(JSON.parse(snapshot())).objects.length'),3);e.run('undo()');assert.equal(e.run('doc.objects.length'),1);assert.equal(e.run('doc.objects[0].visible'),true);
});

test('Split Body rejects wrong faces and out-of-range values and ignores cancelled/stale results',async()=>{
 const e=await setupSplit();e.run('$("#splitSecond").onclick();const side=doc.objects[0].cad.faces.find(f=>f.normal[0]>.99);pickSplitFace({o:doc.objects[0],face:doc.objects[0].cad.faceMap.indexOf(side.index)});');assert.equal(e.run('splitWorkflow.faces.length'),1);assert.match(e.nodes.get('splitStatus').textContent,/parallel/);
 e.run('pickSplitFace({o:doc.objects[0],face:doc.objects[0].cad.faceMap.indexOf(second.index)});$("#splitMode").value="distance";$("#splitDistance").value="40";invalidateSplit();');assert.equal(e.nodes.get('splitApply').disabled,true);const before=e.run('snapshot()');await e.run('runBodySplit(true)');assert.equal(e.run('snapshot()'),before);
 e.run('$("#splitDistance").value="10";invalidateSplit()');let resolve;e.c.delayed=new Promise(r=>resolve=r);e.run('cadCall=()=>delayed');const pending=e.run('runBodySplit(true)');e.run('cancelPlaneWorkflows()');resolve({parts:[e.c.mesh,e.c.mesh]});await pending;assert.equal(e.run('snapshot()'),before);assert.equal(e.run('splitWorkflow'),null);
});

test('active face workplane and visibility survive preference reload; invalid frames are ignored',async()=>{
 const e=await setup();e.run('customFrame=alignedWorkFrame([[0,0,15],[1,0,16],[1,1,16]]);prefs.plane="face";prefs.elevation=5;prefs.showWorkplane=false;savePrefs();');
 const restored=environment(e.storage);await restored.run('load()');assert.equal(restored.run('prefs.plane'),'face');assert.equal(restored.run('prefs.showWorkplane'),false);assert.equal(restored.run('JSON.stringify(workFrame())'),e.run('JSON.stringify(workFrame())'));
 const bad=JSON.parse(e.storage.get('sketchbench-v1:/-prefs'));bad.faceFrame.u=[0,0,0];e.storage.set('sketchbench-v1:/-prefs',JSON.stringify(bad));const invalid=environment(e.storage);await invalid.run('load()');assert.equal(invalid.run('prefs.plane'),'xy');
});

test('Split Body updates linked component definitions without overlapping original members',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});e.run('addObject("Member",mesh);actions.components();$("#defineComponent").onclick();camera.target=[100,0,0];$$("[data-definition-insert]")[0].onclick();openContext();const o=doc.objects.find(o=>o.component.instance===editContext.id);selected=new Set([o.id]);actions.splitBody();const faces=[o.cad.faces.find(f=>f.normal[2]>.99),o.cad.faces.find(f=>f.normal[2]<-.99)];for(const f of faces)pickSplitFace({o,face:o.cad.faceMap.indexOf(f.index)});');
 await e.run('runBodySplit(true)');assert.equal(e.run('doc.objects.length'),4);assert.equal(e.run('doc.definitions[0].members.length'),2);assert.ok(e.run('doc.objects.every(o=>o.visible&&Math.abs(o.cad.volume-36000)<1e-6)'));
 e.run('undo()');assert.equal(e.run('doc.objects.length'),2);assert.equal(e.run('doc.definitions[0].members.length'),1);
});

test('Split Body discards results after input changes while calculation is pending',async()=>{
 const e=await setupSplit();let resolve;e.c.delayed=new Promise(r=>resolve=r);e.run('cadCall=()=>delayed');const before=e.run('snapshot()'),pending=e.run('runBodySplit(true)');e.run('$("#splitMode").value="distance";$("#splitDistance").value="6";invalidateSplit()');resolve({parts:[e.c.mesh,e.c.mesh]});await pending;
 assert.equal(e.run('snapshot()'),before);assert.equal(e.run('splitWorkflow.result'),null);assert.equal(e.run('currentSplitPlane().distance'),6);
});

test('compiled application initializes all workflow modules in its shipped script order',async()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1],e=environment(new Map(),source);await e.run('load()');
 assert.equal(e.run('typeof actions.splitBody'),'function');assert.equal(e.run('typeof actions.workplane'),'function');e.run('setTool("rectangle")');assert.equal(e.nodes.get('drawingPanel').hidden,false);assert.equal(e.run('workplaneBackdrops().length'),1);
});

test('Split Body accepts two real viewport face hits across opposing view buttons',async()=>{
 const e=await setup();e.c.mesh=await operate('primitive',{kind:'box',w:60,d:40,h:30});e.run('addObject("Body",mesh);selected.clear();selectedFace=null;actions.splitBody();setView("top");');const stage=e.nodes.get('stage');
 for(const [view,z]of [['top',30],['bottom',0]]){e.run(`setView("${view}");render()`);const p=e.run(`project([30,20,${z}])`);stage.events.pointerdown({target:stage,button:0,pointerId:1,clientX:p[0],clientY:p[1],preventDefault(){}});stage.events.pointerup({pointerId:1});}
 assert.equal(e.run('splitWorkflow.faces.length'),2);assert.equal(e.run('currentSplitPlane().distance'),15);assert.ok(e.run('splitWorkflow.source.cad.faces[splitWorkflow.faces[0]].normal[2]>.99'));
});
