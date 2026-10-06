/* Surface display helpers shared by WebGL and the Canvas fallback. GPL-3.0-only. */
let softwareFrame=null,softwareCanvas=null,softwareContext=null;
function renderSoftwareModel(){
 if(renderMode!=='wire'){
  if(!softwareCanvas){softwareCanvas=document.createElement('canvas');softwareContext=softwareCanvas.getContext('2d');}
  if(softwareCanvas.width!==canvas.width||softwareCanvas.height!==canvas.height){softwareCanvas.width=canvas.width;softwareCanvas.height=canvas.height;}
  softwareFrame=K.rasterTriangles(drawn,canvas.width,canvas.height,dpr,softwareFrame);
  softwareContext.putImageData(new ImageData(softwareFrame.pixels,canvas.width,canvas.height),0,0);
  fallback.drawImage(softwareCanvas,0,0,width,height);
 }
 for(const e of edgeHits)for(const [a,b]of (renderMode==='wire'?[[e.a,e.b]]:visibleEdgeParts(e,drawn)))line2(fallback,a,b,selected.has(e.o.id)?'#dc8050':prefs.theme!=='light'?'#b6cbb5':'#3e5448');
}
function sceneDepth(back){let depth=10;for(const o of doc.objects)if(objectVisible(o))for(const p of o.vertices)depth=Math.max(depth,Math.abs(V.dot(V.sub(p,camera.target),back)));return depth*1.1;}
function visibleEdgeParts(edge,triangles){
 const a=edge.a,b=edge.b,hidden=[];
 for(const t of triangles){if(t.shadow||(t.opacity??1)<.99)continue;
  const [p,q,r]=t.ps;
  if(Math.max(a[0],b[0])<Math.min(p[0],q[0],r[0])||Math.min(a[0],b[0])>Math.max(p[0],q[0],r[0])||Math.max(a[1],b[1])<Math.min(p[1],q[1],r[1])||Math.min(a[1],b[1])>Math.max(p[1],q[1],r[1]))continue;
  const den=(q[1]-r[1])*(p[0]-r[0])+(r[0]-q[0])*(p[1]-r[1]);if(Math.abs(den)<1e-9)continue;
  const bary=s=>{const u=((q[1]-r[1])*(s[0]-r[0])+(r[0]-q[0])*(s[1]-r[1]))/den,v=((r[1]-p[1])*(s[0]-r[0])+(p[0]-r[0])*(s[1]-r[1]))/den;return [u,v,1-u-v];},wa=bary(a),wb=bary(b);
  let lo=0,hi=1;
  for(let i=0;i<3;i++){const delta=wb[i]-wa[i];if(Math.abs(delta)<1e-12){if(wa[i]<-1e-9)hi=-1;}else if(delta>0)lo=Math.max(lo,(-1e-9-wa[i])/delta);else hi=Math.min(hi,(-1e-9-wa[i])/delta);}
  const da=wa.reduce((s,w,i)=>s+w*t.ps[i][2],0)-a[2]-1e-5,db=wb.reduce((s,w,i)=>s+w*t.ps[i][2],0)-b[2]-1e-5,dd=db-da;
  if(Math.abs(dd)<1e-12){if(da<=0)continue;}else if(dd>0)lo=Math.max(lo,-da/dd);else hi=Math.min(hi,-da/dd);
  if(hi>lo)hidden.push([lo,hi]);
 }
 hidden.sort((a,b)=>a[0]-b[0]);let start=0;const spans=[];
 for(const [lo,hi]of hidden){if(lo>start)spans.push([start,lo]);start=Math.max(start,hi);if(start>=1)break;}if(start<1)spans.push([start,1]);
 return spans.map(span=>span.map(t=>a.map((v,i)=>v+(b[i]-v)*t)));
}
function extrusionCapFace(m,n,d){return m.faces.findIndex(f=>V.dot(K.normal(m.vertices,f),V.mul(n,Math.sign(d)))>1-1e-6);}
