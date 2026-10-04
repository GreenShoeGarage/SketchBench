// Software samples of the actual WebGL draw batches. This is not a GPU/browser test.
const test=require('node:test'),assert=require('node:assert/strict'),{environment}=require('./harness.cjs');
const tick=()=>new Promise(r=>setImmediate(r));

function sampleRenderer(){
 let data=[],depth=1,color=[0,0,0],clearColor=color,depthWrite=true;
 const enabled=new Set([16]);
 const gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,LINES:4,TRIANGLES:8,DEPTH_TEST:16,POLYGON_OFFSET_FILL:32,ARRAY_BUFFER:64,FLOAT:128,DYNAMIC_DRAW:256,
  enable:flag=>enabled.add(flag),disable:flag=>enabled.delete(flag),depthMask:flag=>depthWrite=flag,
  clearColor:(...c)=>clearColor=c.slice(0,3),clear:mask=>{if(mask&1)color=clearColor;if(mask&2&&depthWrite)depth=1;},
  bufferData:(_,value)=>data=Array.from(value),bindBuffer(){},enableVertexAttribArray(){},vertexAttribPointer(){},polygonOffset(){},
  drawArrays(mode,first,count){
   const vertex=i=>data.slice((first+i)*6,(first+i+1)*6);
   const paint=(z,c)=>{const d=z*.5+.5;if(d<0||d>1)return;if(!enabled.has(16)||d<=depth){color=c;if(enabled.has(16)&&depthWrite)depth=d;}};
   for(let i=0;i<count;i+=mode===4?2:3){
    const a=vertex(i),b=vertex(i+1);
    if(mode===4){
     const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;if(den<1e-16)continue;
     const t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/den));
     if(Math.hypot(a[0]+t*dx,a[1]+t*dy)<1e-5)paint(a[2]+t*(b[2]-a[2]),a.slice(3));
    }else{
     const c=vertex(i+2),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-12)continue;
     const u=((b[1]-c[1])*-c[0]+(c[0]-b[0])*-c[1])/den,v=((c[1]-a[1])*-c[0]+(a[0]-c[0])*-c[1])/den,w=1-u-v;
     if(Math.min(u,v,w)>=-1e-6)paint(u*a[2]+v*b[2]+w*c[2]+(enabled.has(32)?1e-6:0),a.slice(3));
    }
   }
  },pixel:()=>color
 };
 return gl;
}
async function setup(){const e=environment();await tick();const gl=sampleRenderer();e.c.renderProbe=gl;e.run("gl=renderProbe;gpu={buffer:{},p:0,c:1};fallback=null;renderMode='solid';edit(()=>addObject('Box',K.box(40,40,20),'#336699'));selected.clear();selectedFace=null;camera.target=[20,20,10];camera.scale=3");return {e,gl};}
function nearColor(actual,expected){actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-5,`sample ${actual} != ${expected}`));}

test('opaque faces cover the workplane grid from above, below, sides and a tilted face plane',async()=>{
 const {e,gl}=await setup();
 for(const setup of [
  "camera.az=0;camera.el=Math.PI/2;prefs.plane='xy';prefs.elevation=0",
  "camera.az=0;camera.el=-Math.PI/2;prefs.plane='xy';prefs.elevation=0",
  "camera.az=Math.PI;camera.el=0;prefs.plane='xz';prefs.elevation=-10",
  "camera.az=Math.PI/2;camera.el=0;prefs.plane='yz';prefs.elevation=50",
  "camera.az=.5;camera.el=-.6;prefs.plane='face';prefs.elevation=0;customFrame={o:V.add(camera.target,V.mul(basis().back,50)),u:basis().right,v:basis().up,n:basis().back}"
 ]){e.run(setup+';render()');nearColor(gl.pixel(),[.2,.4,.6]);}
});

test('grid remains visible in empty space, holes and wireframe while model depth stays correct',async()=>{
 const {e,gl}=await setup(),grid=[213/255,219/255,207/255];
 e.run("camera.az=0;camera.el=-Math.PI/2;prefs.plane='xy';prefs.elevation=0;doc.objects[0].visible=false;render()");nearColor(gl.pixel(),grid);
 e.run("doc.objects[0].visible=true;renderMode='wire';render()");nearColor(gl.pixel(),grid);
 e.run("renderMode='solid';const cut=K.cylinder(5,40,24);K.transform(cut,p=>V.add(p,[20,20,-10]));Object.assign(doc.objects[0],K.boolean(doc.objects[0],cut,'subtract'));render()");nearColor(gl.pixel(),grid);
 e.run("doc.objects=[];const near=K.box(40,40,10);K.transform(near,p=>V.add(p,[0,0,-20]));doc.objects.push(makeObject('Near',near,'#cc6633'));doc.objects.push(makeObject('Far',K.box(40,40,20),'#336699'));render()");nearColor(gl.pixel(),[.8,.4,.2]);
});
