/* Connected surfaces and direct profile extrusion. GPL-3.0-only. */
(function(K){
'use strict';
const {V}=K,EPS=1e-5,key=p=>p.map(v=>v.toFixed(7)).join(',');
let cache=new WeakMap();
function topology(m){
 let t=cache.get(m);if(t&&t.vertices===m.vertices&&t.faces===m.faces&&t.edges===m.edges)return t;
 const ids=m.vertices.map(key),normals=m.faces.map(f=>K.normal(m.vertices,f)),edgeMap=new Map();
 m.faces.forEach((f,fi)=>f.forEach((a,i)=>{const b=f[(i+1)%f.length],k=[ids[a],ids[b]].sort().join('|');if(!edgeMap.has(k))edgeMap.set(k,[]);edgeMap.get(k).push({fi,a,b});}));
 const adjacent=m.faces.map(()=>new Set()),features=[];
 for(const es of edgeMap.values()){
  const [a,b]=es,same=es.length===2&&V.dot(normals[a.fi],normals[b.fi])>1-1e-9&&m.faces[b.fi].every(i=>Math.abs(V.dot(V.sub(m.vertices[i],m.vertices[a.a]),normals[a.fi]))<EPS);
  if(same){adjacent[a.fi].add(b.fi);adjacent[b.fi].add(a.fi);}else features.push([a.a,a.b]);
 }
 features.push(...(m.edges||[]));t={vertices:m.vertices,faces:m.faces,edges:m.edges,ids,normals,edgeMap,adjacent,features,patches:new Map()};cache.set(m,t);return t;
}
function facePatch(m,fi){
 if(!m.faces[fi])throw Error('Select a face.');const t=topology(m);if(t.patches.has(fi))return t.patches.get(fi);
 const faces=new Set([fi]),queue=[fi];while(queue.length){for(const next of t.adjacent[queue.pop()])if(!faces.has(next)){faces.add(next);queue.push(next);}}
 const boundary=[];for(const es of t.edgeMap.values()){const own=es.filter(e=>faces.has(e.fi));if(own.length===1)boundary.push(own[0]);}
 const starts=new Map();boundary.forEach((e,i)=>{const k=t.ids[e.a];if(!starts.has(k))starts.set(k,[]);starts.get(k).push(i);});
 const used=new Set(),loops=[];
 for(let i=0;i<boundary.length;i++){
  if(used.has(i))continue;const loop=[],first=t.ids[boundary[i].a];let current=i,closed=false;
  while(current!==undefined&&!used.has(current)){const e=boundary[current];used.add(current);loop.push(m.vertices[e.a]);const end=t.ids[e.b];if(end===first){closed=true;break;}current=(starts.get(end)||[]).find(j=>!used.has(j));}
  if(closed&&loop.length>=3)loops.push(loop);
 }
 const patch={faces:[...faces],vertices:[...new Set([...faces].flatMap(i=>m.faces[i]))],loops,normal:t.normals[fi]};for(const i of faces)t.patches.set(i,patch);return patch;
}
const previousExtrude=K.extrude;
K.extrude=function(mesh,fi,d){
 if(mesh.faces.length===1)return previousExtrude(mesh,fi,d);
 if(!Number.isFinite(d)||Math.abs(d)<EPS)throw Error('Enter a nonzero extrusion distance.');
 const patch=facePatch(mesh,fi);if(patch.faces.length===1)return previousExtrude(mesh,fi,d);
 if(!K.diagnose(mesh).closed)throw Error('Push/pull needs a closed, consistently oriented solid.');
 if(K.triangles(mesh).length>1200)throw Error('Direct face editing is limited to 1,200 triangles.');
 const moved=new Set(patch.vertices.map(i=>key(mesh.vertices[i]))),m=JSON.parse(JSON.stringify(mesh)),oldNormals=topology(mesh).normals;
 m.vertices=m.vertices.map(p=>moved.has(key(p))?V.add(p,V.mul(patch.normal,d)):p);
 if(m.faces.some((f,i)=>V.dot(K.normal(m.vertices,f),oldNormals[i])<.01))throw Error('This distance collapses or reverses a face. Try a smaller distance.');
 const after=K.diagnose(m,true);if(!after.closed||after.nonplanar||after.intersections||K.signedVolume(m)<=EPS)throw Error('This push/pull would create invalid geometry. Try a smaller distance.');
 return m;
};
function extrudeLoops(outer,holes,d){
 if(!Number.isFinite(d)||Math.abs(d)<EPS)throw Error('Enter a nonzero extrusion distance.');
 const frame=K.frame(outer),loops=[outer,...holes].map(ps=>ps.map(p=>K.local(p,frame))),levels=[...new Set(loops.flatMap(ps=>ps.map(p=>p[1])))].sort((a,b)=>a-b),vertices=[],faces=[],map=new Map();
 if(loops.some(ps=>ps.some(p=>Math.abs(p[2])>EPS)))throw Error('All extrusion outlines must be on one plane.');
 const vertex=p=>{const k=key(p);if(!map.has(k)){map.set(k,vertices.length);vertices.push(K.world(p,frame));}return map.get(k);};
 function face(ps){const clean=ps.filter((p,i)=>V.len(V.sub(p,ps[(i+1)%ps.length]))>1e-8);if(clean.length>=3&&V.len(K.normal(clean,clean.map((_,i)=>i)))>.5)faces.push(clean.map(vertex));}
 // Split the planar region into exact trapezoids between successive vertex heights.
 // Even/odd spans leave inner loops empty; caps and walls share one welded mesh.
 for(let k=0;k<levels.length-1;k++){
  const lo=levels[k],hi=levels[k+1];if(hi-lo<1e-8)continue;const mid=(lo+hi)/2,cuts=[];
  for(const ps of loops)for(let i=0;i<ps.length;i++){
   const a=ps[i],b=ps[(i+1)%ps.length];if((a[1]>mid)===(b[1]>mid))continue;
   const x=y=>a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);cuts.push({mid:x(mid),lo:x(lo),hi:x(hi)});
  }
  cuts.sort((a,b)=>a.mid-b.mid);if(cuts.length%2)throw Error('The sketch region could not be closed.');
  for(let i=0;i<cuts.length;i+=2){const l=cuts[i],r=cuts[i+1];if(r.mid-l.mid<1e-8)continue;const cap=[[l.lo,lo,0],[r.lo,lo,0],[r.hi,hi,0],[l.hi,hi,0]];
   face(d>0?cap.slice().reverse():cap);const top=cap.map(p=>[p[0],p[1],d]);face(d>0?top:top.reverse());
  }
  if(faces.length>4000)throw Error('This sketch is too complex for direct region extrusion. Simplify its outlines.');
 }
 loops.forEach((ps,index)=>{
  const area=ps.reduce((s,a,i)=>s+a[0]*ps[(i+1)%ps.length][1]-ps[(i+1)%ps.length][0]*a[1],0);
  if((area>0)!==(index===0))ps.reverse();
  for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length],side=[[a[0],a[1],0],[b[0],b[1],0],[b[0],b[1],d],[a[0],a[1],d]];face(d>0?side:side.reverse());}
 });
 const m=K.stitch({vertices,faces,edges:[]}),check=K.diagnose(m);
 if(!check.closed||check.nonplanar)throw Error('The region could not form a valid closed solid. The sketch was preserved.');
 K.validateMesh(m);return m;
}
Object.assign(K,{facePatch,featureEdges:m=>topology(m).features,extrudeLoops,clearSurfaceCache:()=>cache=new WeakMap()});
})(typeof module!=='undefined'?module.exports=require('./solids.js'):K);
