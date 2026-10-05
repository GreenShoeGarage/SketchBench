/* Nested coplanar sketch regions. GPL-3.0-only. */
const REGION_EPS=1e-5;
function sketchLoop(o){
 if(o.faces.length!==1)return null;
 const points=o.faces[0].map(i=>o.vertices[i]);
 try{const frame=K.frame(points);return {o,points,frame,area:Math.abs(points.reduce((s,p,i)=>s+V.dot(V.cross(V.sub(p,frame.o),V.sub(points[(i+1)%points.length],frame.o)),frame.n)/2,0))};}catch{return null;}
}
function preferProfileHit(candidate,current){
 const a=sketchLoop(candidate),b=sketchLoop(current);
 return a&&b&&a.area<b.area-REGION_EPS&&a.points.every(p=>Math.abs(K.local(p,b.frame)[2])<REGION_EPS);
}
function regionCross(a,b,p){return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);}
function regionOnEdge(p,a,b){return Math.abs(regionCross(a,b,p))<=REGION_EPS*Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]))&&p[0]>=Math.min(a[0],b[0])-REGION_EPS&&p[0]<=Math.max(a[0],b[0])+REGION_EPS&&p[1]>=Math.min(a[1],b[1])-REGION_EPS&&p[1]<=Math.max(a[1],b[1])+REGION_EPS;}
function regionPoint(p,loop){
 let inside=false;
 for(let i=0,j=loop.length-1;i<loop.length;j=i++){
  const a=loop[j],b=loop[i];if(regionOnEdge(p,a,b))return 0;
  if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside?1:-1;
}
function regionBoundariesMeet(a,b){
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
  if(regionOnEdge(p,r,s)||regionOnEdge(q,r,s)||regionOnEdge(r,p,q)||regionOnEdge(s,p,q))return true;
  if(regionCross(p,q,r)*regionCross(p,q,s)<0&&regionCross(r,s,p)*regionCross(r,s,q)<0)return true;
 }
 return false;
}
const regionContains=(outer,inner)=>inner.every(p=>regionPoint(p,outer)===1)&&!regionBoundariesMeet(outer,inner);
let regionScene=[],regionCache=new Map();
function sketchRegion(o,fi=0){
 if(fi!==0||o.faces.length!==1)return {holes:[],error:null};
 const scene=doc.objects.filter(m=>m.faces.length===1&&objectVisible(m)).map(m=>[m,m.vertices,m.faces]);
 if(scene.length!==regionScene.length||scene.some((row,i)=>row.some((v,j)=>v!==regionScene[i][j]))){regionScene=scene;regionCache.clear();}
 if(regionCache.has(o))return regionCache.get(o);
 const outer=sketchLoop(o),result={holes:[],error:null};if(!outer)return result;
 const boundary=outer.points.map(p=>K.local(p,outer.frame)),candidates=[];
 for(const [other]of scene){
  if(other.id===o.id)continue;const loop=sketchLoop(other);if(!loop)continue;
  const ps=loop.points.map(p=>K.local(p,outer.frame));if(ps.some(p=>Math.abs(p[2])>=REGION_EPS))continue;
  if(regionContains(boundary,ps))candidates.push({...loop,local:ps});
  else if(regionBoundariesMeet(boundary,ps))result.error='Touching or intersecting sketch outlines cannot form a border. Separate the outlines or hide the other profile first.';
 }
 // A region ends at its immediate inner loops. Deeper nested loops belong to the center region.
 result.holes=candidates.filter(a=>!candidates.some(b=>a!==b&&regionContains(b.local,a.local)));
 for(let i=0;i<result.holes.length;i++)for(let j=i+1;j<result.holes.length;j++)if(regionBoundariesMeet(result.holes[i].local,result.holes[j].local))result.error='Inner outlines overlap or touch. Separate them before extruding the border.';
 if(result.holes.length>16||outer.points.length+result.holes.reduce((n,h)=>n+h.points.length,0)>1000)result.error='Region extrusion supports up to 16 inner outlines and 1,000 outline vertices.';
 regionCache.set(o,result);return result;
}
function extrudeSketchRegion(mesh,fi,d,region=sketchRegion(mesh,fi)){
 if(region.error)throw Error(region.error);
 let solid=K.extrude(mesh,fi,d);if(!region.holes.length)return solid;
 // Carry cutters well beyond both caps to avoid nearly coincident sliver faces.
 const n=K.normal(mesh.vertices,mesh.faces[fi]),pad=Math.max(1,Math.abs(d)),sign=Math.sign(d);
 for(const hole of region.holes){
  const profile=K.profile(hole.points.map(p=>V.add(p,V.mul(n,-sign*pad))));
  if(V.dot(K.normal(profile.vertices,profile.faces[0]),n)<0)profile.faces[0].reverse();
  solid=K.boolean(solid,K.extrude(profile,0,d+sign*2*pad),'subtract');
 }
 if(doc.objects.reduce((sum,o)=>sum+o.vertices.length,0)-mesh.vertices.length+solid.vertices.length>150000)throw Error('Region extrusion would exceed the 150,000-vertex model limit.');
 return solid;
}
function selectedFaceLoops(o,fi){
 const outer=o.faces[fi]?.map(i=>o.vertices[i]);if(!outer)return [];
 const region=sketchRegion(o,fi);return [outer,...(region.error?[]:region.holes.map(h=>h.points))];
}
const inspectorBeforeRegions=updateInspector;
updateInspector=function(){
 inspectorBeforeRegions();const o=doc.objects.find(o=>o.id===selectedFace?.id);if(!o||objectLocked(o))return;
 const region=sketchRegion(o,selectedFace.face);
 if(region.error){$('#faceHint').textContent=region.error;$('#applyExtrude').disabled=true;}
 else if(region.holes.length){$('#faceHint').textContent=`Border region · ${region.holes.length} inner outline${region.holes.length===1?' stays':'s stay'} flat.`;}
};
