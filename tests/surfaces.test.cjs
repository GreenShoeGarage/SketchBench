const test=require('node:test'),assert=require('node:assert/strict'),K=require('../surfaces.js'),{environment}=require('./harness.cjs');
const outer=[[0,0,0],[50,0,0],[50,60,0],[0,60,0]],inner=[[10,10,0],[40,10,0],[40,50,0],[10,50,0]],near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`),topFace=m=>m.faces.findIndex(f=>K.normal(m.vertices,f)[2]>.999);
const tick=()=>new Promise(r=>setImmediate(r));
test('direct frame extrusion has all walls and consistent topology across positive and negative heights',()=>{
 let topology;
 for(const height of [1,2,5,10,40,500,-1,-20]){
  const m=K.extrudeLoops(outer,[inner],height);assert.ok(K.diagnose(m,true).closed);near(K.stats(m).volume,1800*Math.abs(height));
  const signature=[m.vertices.length,m.faces.length];if(topology)assert.deepEqual(signature,topology);else topology=signature;
  for(const n of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]])assert.ok(m.faces.some(f=>K.V.dot(K.normal(m.vertices,f),n)>.999));
 }
});
test('pulling any part of a frame cap moves the entire connected cap and preserves the opening',()=>{
 let m=K.extrudeLoops(outer,[inner],20),fi=topFace(m);assert.equal(K.facePatch(m,fi).loops.length,2);
 const patch=K.facePatch(m,fi);assert.ok(patch.faces.length>1);
 for(const face of patch.faces){const next=K.extrude(m,face,10);near(K.stats(next).volume,54000);assert.ok(K.diagnose(next,true).closed);assert.ok(K.facePatch(next,face).vertices.every(i=>Math.abs(next.vertices[i][2]-30)<1e-8));}
 m=K.extrude(m,fi,-5);near(K.stats(m).volume,27000);assert.throws(()=>K.extrude(m,fi,-15),/collapses|invalid/);
});
test('older boolean-generated and imported triangulated caps also pull as whole surfaces',()=>{
 const base=K.extrude(K.profile(outer),0,20),cut=K.extrude(K.profile(inner.map(p=>K.V.add(p,[0,0,-20]))),0,60),old=K.boolean(base,cut,'subtract');
 const imported=K.parseSTL(new TextEncoder().encode(K.stl([old])).buffer);
 for(const source of [old,imported]){const fi=topFace(source),out=K.extrude(source,fi,5);near(K.stats(out).volume,45000);assert.ok(K.diagnose(out,true).closed);}
});
test('clean feature edges keep boundaries and creases while hiding coplanar triangulation',()=>{
 const frame=K.extrudeLoops(outer,[inner],20),length=edges=>edges.reduce((s,[a,b])=>s+K.V.len(K.V.sub(frame.vertices[a],frame.vertices[b])),0);
 near(length(K.featureEdges(frame)),880);assert.ok(length(K.edges(frame))>880);
 const box=K.parseSTL(new TextEncoder().encode(K.stl([K.box(10,10,10)])).buffer);assert.equal(K.featureEdges(box).length,12);assert.equal(K.facePatch(box,topFace(box)).faces.length,2);
});
test('concave outlines with multiple holes retain exact volume and a closed shell',()=>{
 const outline=[[0,0,0],[80,0,0],[80,40,0],[40,40,0],[40,80,0],[0,80,0]],holes=[[[5,5,0],[15,5,0],[15,15,0],[5,15,0]],[[5,50,0],[25,50,0],[25,70,0],[5,70,0]]];
 const m=K.extrudeLoops(outline,holes,12);near(K.stats(m).volume,(4800-100-400)*12);assert.ok(K.diagnose(m,true).closed);assert.equal(K.facePatch(m,topFace(m)).loops.length,3);
});
test('standard views keep Z up, and top view has X right and Y up',async()=>{
 const e=environment();await tick();
 for(const view of ['iso','front','right']){e.run(`setView('${view}')`);assert.ok(e.run('project([0,0,10])[1]<project([0,0,0])[1]'));}
 e.run("setView('top')");assert.ok(e.run('project([10,0,0])[0]>project([0,0,0])[0]'));assert.ok(e.run('project([0,10,0])[1]<project([0,0,0])[1]'));
});
test('numeric and pointer pulls continue from the complete frame cap, and rollback restores it',async()=>{
 const e=environment();await tick();e.run(`edit(()=>addObject('Frame',K.extrudeLoops(${JSON.stringify(outer)},[${JSON.stringify(inner)}],20)));selectedFace={id:doc.objects[0].id,face:doc.objects[0].faces.findIndex(f=>K.normal(doc.objects[0].vertices,f)[2]>.99)};$('#extrudeDistance').value='10';applyExtrude()`);
 near(e.run('K.stats(doc.objects[0]).volume'),54000);e.run("setTool('pushpull');prefs.snap=false;setView('iso');fit()");const s=JSON.parse(e.run('JSON.stringify(project([5,30,30]))')),stage=e.nodes.get('stage');
 stage.events.pointerdown({target:stage,clientX:s[0],clientY:s[1],button:0,pointerId:1,preventDefault(){}});const g=JSON.parse(e.run('JSON.stringify(gesture)'));assert.equal(g.type,'extrude');
 stage.events.pointermove({clientX:g.x+g.screen[0]*5,clientY:g.y+g.screen[1]*5,pointerId:1});near(e.run('K.stats(doc.objects[0]).volume'),63000);stage.events.pointercancel();near(e.run('K.stats(doc.objects[0]).volume'),54000);
});
test('software fallback clips rear edges at opaque faces without hiding coplanar or front edges',async()=>{
 const e=environment();await tick();const triangles=[{ps:[[-1,-1,1],[1,-1,1],[1,1,1]]},{ps:[[-1,-1,1],[1,1,1],[-1,1,1]]}];e.c.clipTriangles=triangles;
 const spans=JSON.parse(e.run('JSON.stringify(visibleEdgeParts({a:[-2,0,0],b:[2,0,0]},clipTriangles))'));assert.equal(spans.length,2);near(spans[0][0][0],-2);near(spans[0][1][0],-1);near(spans[1][0][0],1);near(spans[1][1][0],2);
 for(const z of [1,2])assert.equal(e.run(`visibleEdgeParts({a:[-2,0,${z}],b:[2,0,${z}]},clipTriangles).length`),1);
});
