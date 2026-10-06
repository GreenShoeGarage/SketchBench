// Exercises the real pointer handlers with the DOM stub, not a browser renderer.
const test=require('node:test'),assert=require('node:assert/strict'),{environment}=require('./harness.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
const turnPixels=2*Math.PI/.008;
const read=(e,s)=>JSON.parse(e.run(`JSON.stringify(${s})`));
function near(a,b,epsilon=1e-8){assert.equal(a.length,b.length);a.forEach((v,i)=>assert.ok(Number.isFinite(v)&&Math.abs(v-b[i])<epsilon,`${v} != ${b[i]}`));}
function down(e,options={}){const stage=e.nodes.get('stage');stage.events.pointerdown({target:stage,clientX:400,clientY:300,pointerId:1,button:0,preventDefault(){},...options});}
function move(e,dx,dy){e.nodes.get('stage').events.pointermove({clientX:400+dx,clientY:300+dy,pointerId:1});}
function up(e){e.nodes.get('stage').events.pointerup();}
const frame=e=>read(e,'Object.values(basis()).flat()');

test('Left and Bottom buttons choose opposing views without changing the model or framing',async()=>{
 const e=environment();await tick();e.run("edit(()=>addObject('Box',K.box(80,60,40)));fit();");
 const before=e.run('snapshot()'),target=read(e,'camera.target'),scale=e.run('camera.scale');
 for(const [view,back,right,up]of [
  ['left',[-1,0,0],[0,-1,0],[0,0,1]],
  ['bottom',[0,0,-1],[1,0,0],[0,-1,0]]
 ]){
  const button=e.run(`$$('[data-view]').find(b=>b.dataset.view==='${view}')`);assert.ok(button);
  e.events.click({target:{closest:s=>s==='button'?button:null}});
  near(read(e,'basis().back'),back);near(read(e,'basis().right'),right);near(read(e,'basis().up'),up);
  assert.equal(e.nodes.get('viewLabel').textContent,view.toUpperCase());assert.ok(button.classList.contains('active'));
  assert.equal(e.run("$$('[data-view]').filter(b=>b.classList.contains('active')).length"),1);
  near(read(e,'camera.target'),target);assert.equal(e.run('camera.scale'),scale);
  assert.equal(e.run('Boolean(hit(width/2,height/2))'),true);
 }
 assert.equal(e.run('snapshot()'),before);
});

test('orbit completes full horizontal, vertical and diagonal turns in both directions',async()=>{
 const e=environment();await tick();e.run("edit(()=>addObject('Box',K.box(80,60,40)));fit();setTool('orbit')");
 const before=e.run('snapshot()'),target=read(e,'camera.target'),scale=e.run('camera.scale');
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
  e.run("setView('front')");const initial=frame(e);down(e);
  for(let step=1;step<=8;step++){
   move(e,dx*turnPixels*step/8,dy*turnPixels*step/8);
   assert.ok(frame(e).every(Number.isFinite));
   assert.equal(e.run('Boolean(hit(width/2,height/2))'),true);
   if(step===4&&(!dx||!dy))near(read(e,'basis().back'),initial.slice(0,3).map(v=>-v));
  }
  up(e);near(frame(e),initial);near(read(e,'camera.target'),target);assert.equal(e.run('camera.scale'),scale);
 }
 assert.equal(e.run('snapshot()'),before);
});

test('orbit passes smoothly through both poles and angle wrap boundaries',async()=>{
 const e=environment();await tick();e.run("setView('front');setTool('orbit')");const initialUp=read(e,'basis().up');down(e);
 for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,-Math.PI]){
  move(e,0,(angle-1e-5)/.008);const before=frame(e);
  move(e,0,angle/.008);const at=frame(e);
  move(e,0,(angle+1e-5)/.008);const after=frame(e);
  near(before,at,2e-5);near(at,after,2e-5);
  assert.ok(e.run('(()=>{const b=basis();return Object.values(b).every(v=>Math.abs(V.len(v)-1)<1e-10)&&Math.abs(V.dot(b.back,b.up))<1e-10&&Math.abs(V.dot(b.back,b.right))<1e-10&&V.len(V.sub(V.cross(b.right,b.up),b.back))<1e-10})()'));
 }
 move(e,0,Math.PI/.008);near(read(e,'basis().up'),initialUp.map(v=>-v));up(e);
 e.run("setView('top')");const top=frame(e);down(e);move(e,0,20);assert.ok(frame(e).some((v,i)=>Math.abs(v-top[i])>.1));up(e);
});

test('successive orbit drags keep rotating without a boundary jump or accumulated turns',async()=>{
 const e=environment();await tick();e.run("setView('iso');setTool('orbit')");const initial=frame(e);
 for(let i=0;i<40;i++){
  const before=frame(e);down(e);move(e,0,0);near(frame(e),before);
  move(e,turnPixels/4,-turnPixels/4);up(e);
  assert.ok(e.run('Math.abs(camera.az)<=Math.PI&&Math.abs(camera.el)<=Math.PI'));
 }
 near(frame(e),initial);
});

test('inverted camera pans in screen directions and survives saved-view restore',async()=>{
 const e=environment();await tick();e.run("setView('front');setTool('select')");const initialUp=read(e,'basis().up');down(e,{button:2});move(e,0,turnPixels/2);up(e);
 near(read(e,'basis().up'),initialUp.map(v=>-v));
 const inverted=frame(e),point=read(e,'project([23,19,11])');
 down(e,{button:2,shiftKey:true});move(e,36,-24);up(e);
 near(read(e,'project([23,19,11])'),[point[0]+36,point[1]-24,point[2]]);
 e.run("prefs.plane='xz';prefs.elevation=19");
 near(read(e,'(()=>{const s=project([23,19,11]);return planePoint(s[0],s[1])})()'),[23,19,11]);
 e.run("viewsDialog();$('#viewName').value='Upside down';$('#saveView').onclick();doc=validateProject(JSON.parse(snapshot()));setView('iso');viewsDialog();$$('[data-view-load]')[0].onclick()");
 near(frame(e),inverted);near(read(e,'project([23,19,11])'),[point[0]+36,point[1]-24,point[2]]);
});
