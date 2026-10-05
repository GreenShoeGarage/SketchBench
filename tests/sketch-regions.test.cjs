const test=require('node:test'),assert=require('node:assert/strict'),{environment}=require('./harness.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
async function setup(){const e=environment();await tick();e.run("edit(()=>{addObject('Outer',K.profile([[0,0,0],[50,0,0],[50,60,0],[0,60,0]]));addObject('Inner',K.profile([[10,10,0],[40,10,0],[40,50,0],[10,50,0]]));});setView('iso');fit()");return e;}
function click(e,p,type='pointerdown'){const s=JSON.parse(e.run(`JSON.stringify(project(${JSON.stringify(p)}))`)),stage=e.nodes.get('stage');stage.events[type]({target:stage,clientX:s[0],clientY:s[1],button:0,pointerId:1,preventDefault(){}});}
const volume=(e,i=0)=>e.run(`K.stats(doc.objects[${i}]).volume`);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} != ${expected}`);

test('nested rectangles pick the border and center independently in either creation order',async()=>{
 const e=await setup();
 for(const view of ['top','iso'])for(const reverse of [false,true]){
  e.run(`setView('${view}');${reverse?'doc.objects.reverse();':''}render();setTool('select')`);
  click(e,[5,30,0]);assert.equal(e.run('chosen()[0].name'),'Outer');assert.equal(e.run('selected.size'),1);
  assert.equal(e.run('selectedFaceLoops(chosen()[0],0).length'),2);assert.match(e.nodes.get('faceHint').textContent,/Border region/);
  click(e,[25,30,0]);assert.equal(e.run('chosen()[0].name'),'Inner');assert.equal(e.run('selectedFaceLoops(chosen()[0],0).length'),1);
 }
});

test('numeric border extrusion makes a closed frame and preserves the flat center through undo and JSON reload',async()=>{
 const e=await setup(),inner=e.run('JSON.stringify(doc.objects[1])'),before=e.run('snapshot()');
 click(e,[5,30,0]);e.run("$('#extrudeDistance').value='20';applyExtrude()");
 near(volume(e),(50*60-30*40)*20);assert.ok(e.run('K.diagnose(doc.objects[0]).closed'));
 assert.equal(e.run('JSON.stringify(doc.objects[1])'),inner);assert.equal(e.run('K.facePatch(doc.objects[0],selectedFace.face).loops.length'),2);
 e.run('doc=validateProject(JSON.parse(snapshot()))');near(volume(e),36000);
 assert.ok(e.run('K.diagnose(K.parseSTL(new TextEncoder().encode(K.stl([doc.objects[0]])).buffer)).closed'));
 e.run('undo()');assert.equal(e.run('snapshot()'),before);e.run('undo(true)');near(volume(e),36000);
});

test('dragging the border excludes its center; cancelling restores both profiles',async()=>{
 const e=await setup(),before=e.run('snapshot()');e.run("setTool('pushpull');prefs.snap=false");click(e,[5,30,0]);
 const g=JSON.parse(e.run('JSON.stringify(gesture)')),stage=e.nodes.get('stage');
 stage.events.pointermove({clientX:g.x+g.screen[0]*15,clientY:g.y+g.screen[1]*15,pointerId:1});near(volume(e),27000);assert.equal(e.run('doc.objects[1].faces.length'),1);
 stage.events.pointercancel();assert.equal(e.run('snapshot()'),before);
 click(e,[5,30,0]);const h=JSON.parse(e.run('JSON.stringify(gesture)'));stage.events.pointermove({clientX:h.x+h.screen[0]*10,clientY:h.y+h.screen[1]*10,pointerId:1});stage.events.pointerup();near(volume(e),18000);
 e.run('undo()');assert.equal(e.run('snapshot()'),before);
});

test('center-only extrusion leaves the outer sketch flat',async()=>{
 const e=await setup();click(e,[25,30,0]);e.run("$('#extrudeDistance').value='8';applyExtrude()");near(volume(e,1),9600);assert.equal(e.run('doc.objects[0].faces.length'),1);
});

test('negative border extrusion works on an oblique plane with reversed inner winding',async()=>{
 const e=await setup();e.run("edit(()=>{for(const o of doc.objects)K.transform(o,p=>V.add(K.rotate(p,0,35),[7,11,19]));doc.objects[1].faces[0].reverse();});selected=new Set([doc.objects[0].id]);selectedFace={id:doc.objects[0].id,face:0};$('#extrudeDistance').value='-12';applyExtrude()");
 near(volume(e),21600);assert.ok(e.run('K.diagnose(doc.objects[0]).closed'));assert.ok(e.run('K.signedVolume(doc.objects[0])>0'));
});

test('multiple cutouts and deeper nested loops use only immediate boundaries',async()=>{
 const e=await setup();e.run("edit(()=>{doc.objects[1].vertices=[[5,5,0],[15,5,0],[15,15,0],[5,15,0]];addObject('Second',K.profile([[30,30,0],[40,30,0],[40,40,0],[30,40,0]]));addObject('Island',K.profile([[7,7,0],[13,7,0],[13,13,0],[7,13,0]]));});selected=new Set([doc.objects[0].id]);selectedFace={id:doc.objects[0].id,face:0};$('#extrudeDistance').value='5';applyExtrude()");
 near(volume(e),(3000-100-100)*5);assert.ok(e.run('K.diagnose(doc.objects[0]).closed'));assert.equal(e.run('doc.objects.filter(o=>o.faces.length===1).length'),3);
});

test('a circular inner outline makes a closed hole without moving the inner profile',async()=>{
 const e=await setup();e.run("edit(()=>{doc.objects[1].vertices=K.curve('circle',{a:8,n:32}).map(p=>V.add(p,[25,30,0]));doc.objects[1].faces=[doc.objects[1].vertices.map((_,i)=>i)];});selected=new Set([doc.objects[0].id]);selectedFace={id:doc.objects[0].id,face:0};$('#extrudeDistance').value='10';applyExtrude()");
 near(volume(e),(3000-32/2*8*8*Math.sin(2*Math.PI/32))*10);assert.ok(e.run('K.diagnose(doc.objects[0]).closed'));assert.equal(e.run('doc.objects[1].faces.length'),1);
});

test('hidden and noncoplanar profiles do not cut a region; locked inner sketches stay unchanged',async()=>{
 const e=await setup();assert.equal(e.run('sketchRegion(doc.objects[0]).holes.length'),1);
 e.run('doc.objects[1].visible=false');assert.equal(e.run('sketchRegion(doc.objects[0]).holes.length'),0);
 e.run("doc.objects[1].visible=true;edit(()=>doc.objects[1].vertices.forEach(p=>p[2]=3))");assert.equal(e.run('sketchRegion(doc.objects[0]).holes.length'),0);
 e.run("edit(()=>doc.objects[1].vertices.forEach(p=>p[2]=0));doc.objects[1].locked=true;selected=new Set([doc.objects[0].id]);selectedFace={id:doc.objects[0].id,face:0};$('#extrudeDistance').value='2';applyExtrude()");near(volume(e),3600);assert.equal(e.run('doc.objects[1].locked'),true);assert.equal(e.run('doc.objects[1].faces.length'),1);
});

test('touching and crossing outlines fail without mutating either sketch',async()=>{
 for(const points of [[[0,10,0],[40,10,0],[40,50,0],[0,50,0]],[[-10,20,0],[60,20,0],[60,40,0],[-10,40,0]]]){
  const e=await setup();e.run(`edit(()=>doc.objects[1].vertices=${JSON.stringify(points)});selected=new Set([doc.objects[0].id]);selectedFace={id:doc.objects[0].id,face:0};sync()`);
  const before=e.run('snapshot()');assert.equal(e.nodes.get('applyExtrude').disabled,true);e.run("$('#extrudeDistance').value='10';applyExtrude()");assert.equal(e.run('snapshot()'),before);
 }
});
