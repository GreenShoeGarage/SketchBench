/* SKETCHBENCH solid operations. GPL-3.0-only. All imported operations are data. */
import * as R from 'replicad';
let oc;
export function configure(kernel){oc=kernel;R.setOC(kernel);}
const tuple=v=>v.toTuple(),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function finite(n,name='Value'){if(!Number.isFinite(n)||Math.abs(n)>1e6)throw Error(name+' must be finite and within ±1,000,000 mm.');return n;}
function positive(n,name){finite(n,name);if(n<=0)throw Error(name+' must be positive.');return n;}
function load(o){if(!o?.cad?.brep)throw Error('This object is a mesh. Convert it to a solid first.');let s=R.deserializeShape(o.cad.brep);for(const m of o.cad.transforms||[]){const tr=new oc.gp_Trsf();tr.SetValues(...m);const t=new R.Transformation(tr),next=R.cast(t.transform(s.wrapped));s.delete();t.delete();s=next;}return s;}
function check(s){const a=new oc.BRepCheck_Analyzer(s.wrapped);let valid;try{valid=a.IsValid();}finally{a.delete();}if(!valid||s.isNull)throw Error('The operation did not produce valid geometry. The original is unchanged.');return s;}
function polygon(ps){if(!Array.isArray(ps)||ps.length<3||ps.length>1000||ps.some(p=>p.length!==3||p.some(n=>!Number.isFinite(n))))throw Error('Invalid profile.');return R.makePolygon(ps);}
function boundedFace(outer,holes){const raw=R.makeFace(outer,holes),fix=new oc.ShapeFix_Face(raw.wrapped);try{fix.FixOrientation();return new R.Face(fix.Face());}finally{raw.delete();fix.delete();}}
function faceFromLoops(loops){const fs=loops.map(polygon),outer=fs[0].outerWire(),holes=fs.slice(1).map(f=>f.outerWire());try{return boundedFace(outer,holes);}finally{fs.forEach(f=>f.delete());outer.delete();holes.forEach(w=>w.delete());}}
export function serialize(s,meta={}){
 check(s);const raw=s.mesh({tolerance:.12,angularTolerance:.22}),em=s.meshEdges({tolerance:.12,angularTolerance:.22}),fs=s.faces,es=s.edges;
 const faceIndex=new Map(fs.map((f,i)=>[f.hashCode,i])),edgeIndex=new Map(es.map((e,i)=>[e.hashCode,i]));
 const vertices=[],faces=[],faceMap=[],normals=[],edges=[],keyMap=new Map();
 const vertex=p=>{const k=p.map(n=>n.toFixed(7)).join(',');if(!keyMap.has(k)){keyMap.set(k,vertices.length);vertices.push(p);}return keyMap.get(k);};
 const ids=[];for(let i=0;i<raw.vertices.length;i+=3)ids.push(vertex(raw.vertices.slice(i,i+3)));
 for(const g of raw.faceGroups)for(let j=g.start;j<g.start+g.count;j+=3){const f=raw.triangles.slice(j,j+3).map(i=>ids[i]);if(new Set(f).size===3){faces.push(f);faceMap.push(faceIndex.get(g.faceId));normals.push(raw.triangles.slice(j,j+3).map(i=>raw.normals.slice(i*3,i*3+3)));}}
 if(!faces.length)throw Error('The operation removes all geometry. The original is unchanged.');
 const edgeInfo=es.map((e,i)=>({index:i,type:e.geomType,length:e.length,start:tuple(e.startPoint),end:tuple(e.endPoint),mid:tuple(e.pointAt(.5)),segments:[]}));
 for(const g of em.edgeGroups){const info=edgeInfo[edgeIndex.get(g.edgeId)];if(!info)continue;for(let j=g.start*3;j<(g.start+g.count)*3;j+=6){const a=em.lines.slice(j,j+3),b=em.lines.slice(j+3,j+6);if(b.length!==3)continue;const seg=[vertex(a),vertex(b)];edges.push(seg);info.segments.push(seg);}}
 for(const e of edgeInfo)if(e.type==='CIRCLE'){const curve=es[e.index],p=tuple(curve.pointAt(0)),q=tuple(curve.pointAt(.25)),r=tuple(curve.pointAt(.5)),u=q.map((v,i)=>v-p[i]),v=r.map((n,i)=>n-p[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],n=cross(u,v),d=2*dot(n,n);if(d>1e-20){e.center=add(p,mul(add(mul(cross(v,n),dot(u,u)),mul(cross(n,u),dot(v,v))),1/d));e.radius=Math.hypot(...p.map((v,i)=>v-e.center[i]));e.normal=mul(n,1/Math.hypot(...n));}}
 const faceInfo=fs.map((f,i)=>({index:i,type:f.geomType,center:tuple(f.center),normal:tuple(f.normalAt()),edges:f.edges.map(e=>edgeIndex.get(e.hashCode)).filter(i=>i!==undefined)}));
 for(const e of edgeInfo){const adjacent=faceInfo.filter(f=>f.edges.includes(e.index));try{const ns=adjacent.map(f=>tuple(fs[f.index].normalAt(e.mid)));e.smooth=ns.length===2&&dot(ns[0],ns[1])>.9999;}catch{e.smooth=false;}}
 let volume=null;try{volume=R.measureVolume(s.asShape3D());}catch{}
 if(volume>0)for(const e of edgeInfo)if(faceInfo.filter(f=>f.edges.includes(e.index)).length<2)e.smooth=true;
 const cad={brep:s.serialize(),faceMap,normals,normalIndices:faces.map(f=>f.slice()),faces:faceInfo,edges:edgeInfo,volume,...meta};
 fs.forEach(f=>f.delete());es.forEach(e=>e.delete());
 if(vertices.length>150000||faces.length>100000)throw Error('The result is too detailed for this viewport.');
 return {vertices,faces,edges,cad};
}
function selectedIndices(s,args){const es=s.edges;if(args.all){const fs=s.faces,adj=fs.map(f=>{const edges=f.edges,hashes=new Set(edges.map(e=>e.hashCode));edges.forEach(e=>e.delete());return hashes;}),indices=es.map((e,i)=>{const incident=fs.filter((f,j)=>adj[j].has(e.hashCode));if(incident.length!==2)return -1;try{return dot(tuple(incident[0].normalAt(e.pointAt(.5))),tuple(incident[1].normalAt(e.pointAt(.5))))<.9999?i:-1;}catch{return i;}}).filter(i=>i>=0);es.forEach(e=>e.delete());fs.forEach(f=>f.delete());if(!indices.length)throw Error('This solid has no sharp edges to treat.');return indices;}let result=[...new Set(args.edges||[])];if(!result.length)throw Error('Select at least one edge.');if(result.some(i=>!Number.isInteger(i)||!es[i]))throw Error('An edge reference no longer exists. Select it again.');
 if(args.chain){let changed=true;while(changed){changed=false;for(let i=0;i<es.length;i++){if(result.includes(i))continue;const e=es[i];for(const j of result){const q=es[j];for(const a of [0,1])for(const b of [0,1]){const p=tuple(e.pointAt(a)),r=tuple(q.pointAt(b)),t=tuple(e.tangentAt(a)),u=tuple(q.tangentAt(b));if(Math.hypot(...p.map((v,k)=>v-r[k]))<1e-5&&Math.abs(dot(t,u))>.9999){result.push(i);changed=true;break;}}if(result.includes(i))break;}}}}
 es.forEach(e=>e.delete());return result;
}
function edgeFinish(s,args){const chosen=selectedIndices(s,args),es=s.edges,fs=s.faces,set=new Set(chosen.map(i=>es[i].hashCode));let result;
 try{const amount=positive(args.amount,'Radius/distance');let radius=amount;
 if(args.kind==='fillet'&&args.mode==='variable')radius=[amount,positive(args.amount2,'End radius')];
 if(args.kind==='chamfer'&&args.mode!=='equal'){
 const ref=fs[args.referenceFace];if(!ref)throw Error('Select a reference face for asymmetric chamfers.');
 if(chosen.some(i=>!ref.edges.some(e=>e.isSame(es[i]))))throw Error('Every selected edge must border the reference face.');
 const selectedFace=f=>f.when(({element})=>element.isSame(ref));
 radius=args.mode==='angle'?{distance:amount,angle:positive(args.angle,'Angle'),selectedFace}:{distances:[amount,positive(args.amount2,'Second distance')],selectedFace};
 if(args.mode==='angle'&&args.angle>=90)throw Error('Chamfer angle must be between 0° and 90°.');
 }
 result=s[args.kind](e=>set.has(e.hashCode)?radius:null);return result;
 }finally{es.forEach(e=>e.delete());fs.forEach(f=>f.delete());}}
function splitWith(s,tools){const splitter=new oc.BRepAlgoAPI_Splitter(),a=new oc.NCollection_List_TopoDS_Shape(),b=new oc.NCollection_List_TopoDS_Shape();try{a.Append(s.wrapped);for(const t of tools)b.Append(t.wrapped);splitter.SetArguments(a);splitter.SetTools(b);splitter.Build();if(!splitter.IsDone())throw Error('Could not divide this face.');return R.cast(splitter.Shape());}finally{splitter.delete();a.delete();b.delete();}}
export async function operate(op,a={}){
 let s,result;const cleanup=[];const own=x=>(cleanup.push(x),x);
 try{
 if(op==='primitive'){
 const {kind}=a; if(kind==='box')result=R.makeBox([0,0,0],[positive(a.w,'Width'),positive(a.d,'Depth'),positive(a.h,'Height')]);
 else if(kind==='cylinder')result=R.makeCylinder(positive(a.r,'Radius'),positive(a.h,'Height'));
 else if(kind==='cone')result=R.revolution(own(polygon([[0,0,0],[positive(a.r,'Radius'),0,0],[0,0,positive(a.h,'Height')]])),[0,0,0],[0,0,1],360);
 else if(kind==='torus'){const r=positive(a.r,'Radius'),t=positive(a.thickness,'Tube radius');if(t>=r)throw Error('Tube radius must be smaller than major radius.');const wire=own(R.assembleWire([own(R.makeCircle(t,[r,0,0],[0,1,0]))]));result=R.revolution(own(R.makeFace(wire)),[0,0,0],[0,0,1],360);}
 else if(kind==='sphere')result=R.makeSphere(positive(a.r,'Radius'));
 else if(kind==='enclosure'){const w=positive(a.w,'Width'),d=positive(a.d,'Depth'),h=positive(a.h,'Height'),t=positive(a.thickness,'Wall');if(t*2>=Math.min(w,d)||t>=h)throw Error('Wall thickness is too large.');const outer=own(R.makeBox([0,0,0],[w,d,h])),inner=own(R.makeBox([t,t,t],[w-t,d-t,h+1]));result=outer.cut(inner);}
 else throw Error('Unknown primitive.');
 if(a.position)result=result.translate(a.position.map(n=>finite(n)));return serialize(result,{origin:{op,args:a}});
 }
 if(op==='convert'){
 const m=a.object;if(!m?.faces?.length||m.faces.length>5000)throw Error('Conversion supports closed meshes up to 5,000 faces.');const faces=m.faces.map(f=>own(polygon(f.map(i=>m.vertices[i]))));result=R.makeSolid(faces).simplify();if(R.measureVolume(result)<=1e-7)throw Error('The mesh does not enclose a solid.');return serialize(result,{converted:true});
 }
 if(op==='profile'){result=faceFromLoops(a.loops);return serialize(result);}
 if(op==='extrudeProfile'){const face=own(faceFromLoops(a.loops));result=R.basicFaceExtrusion(face,new R.Vector(mul(a.normal,finite(a.distance,'Distance'))));return serialize(result);}
 if(op==='text'){await R.loadFont(a.font);const sketch=R.drawText(String(a.text).slice(0,100),{fontSize:positive(a.size,'Text size')}).sketchOnPlane(new R.Plane(a.origin||[0,0,0],a.xDir||[1,0,0],a.normal||[0,0,1]));result=sketch.extrude(positive(a.depth,'Text depth'));return serialize(result);}
 if(op==='sweep'){const ps=a.path,path=own(R.assembleWire(ps.slice(1).map((p,i)=>own(R.makeLine(ps[i],p))))),sweep=loop=>R.genericSweep(own(own(polygon(loop)).outerWire()),path,{transitionMode:'right',forceProfileSpineOthogonality:true});result=sweep(a.loops[0]);for(const hole of a.loops.slice(1)){const cutter=own(sweep(hole)),prior=own(result);result=prior.cut(cutter);}return serialize(result);}
 if(op==='circleProfile'){const circle=own(R.makeCircle(positive(a.radius,'Radius'),a.center,a.normal)),wire=own(R.assembleWire([circle]));result=R.makeFace(wire);if(a.object){s=own(load(a.object));result=splitWith(s,[wire]);}return serialize(result);}
 if(op==='importSTEP'){result=await R.importSTEP(new Blob([a.text]));return serialize(result);}
 s=own(load(a.object));
 if(op==='exportSTEP')return {text:await s.blobSTEP().text()};
 if(op==='inspect')return {valid:!!check(s),volume:R.measureVolume(s),solids:s.solids.length,faces:s.faces.length,edges:s.edges.length};
 if(op==='finish'){
 result=edgeFinish(s,a);return serialize(result,{lastFeature:{base:s.serialize(),kind:a.kind,args:{...a,object:undefined}}});
 }
 if(op==='undoFeature'){result=load({cad:{brep:a.object.cad.lastFeature?.base||a.object.cad.brep,transforms:a.object.cad.transforms}});return serialize(result);}
 if(op==='editFeature'){const feature=a.object.cad.lastFeature;if(!feature)throw Error('No editable edge treatment on this object.');const base=own(load({cad:{brep:feature.base,transforms:a.object.cad.transforms}}));result=edgeFinish(base,{...feature.args,...a});return serialize(result,{lastFeature:{base:base.serialize(),kind:a.kind||feature.kind,args:{...feature.args,...a,object:undefined}}});}
 if(op==='boolean'){const b=own(load(a.other));result=s[{union:'fuse',subtract:'cut',intersect:'intersect',trim:'cut'}[a.kind]||'fuse'](b);}
 else if(op==='splitPlane'){const p=new R.Plane(a.origin||[0,0,0],a.xDir||null,a.normal||[0,0,1]),parts=s.split(p);return {parts:[parts.positive,parts.negative].filter(Boolean).map(x=>{own(x);return serialize(x);})};}
 else if(op==='splitFace'){const ps=a.points,wire=a.closed?own(polygon(ps)).outerWire():R.assembleWire(ps.slice(1).map((p,i)=>own(R.makeLine(ps[i],p))));own(wire);result=splitWith(s,[wire]);}
 else if(op==='offset'){const face=own(s.faces[a.face]);if(face.geomType!=='PLANE')throw Error('Offset requires a planar face.');const sketch=R.sketchFaceOffset(face,finite(a.distance));result=sketch.face();if(a.divide){own(result);result=splitWith(s,[own(result.outerWire())]);}}
 else if(op==='resize'){const axis=a.axis,bb=s.boundingBox.bounds,current=bb[1][axis]-bb[0][axis],delta=positive(a.size,'Size')-current,fs=s.faces;const f=fs.find(f=>f.geomType==='PLANE'&&tuple(f.normalAt())[axis]>.999&&Math.abs(tuple(f.center)[axis]-bb[1][axis])<1e-4);if(!f)throw Error('No planar end face on this axis. Use face Push/pull or uniform scale.');const vec=[0,0,0];vec[axis]=delta;const t=own(R.basicFaceExtrusion(f,new R.Vector(vec)));result=delta>0?s.fuse(t):s.cut(t);fs.forEach(f=>f.delete());}
 else if(op==='heal')result=s.clone().simplify();
 else if(op==='extrudeRegion'){const f=own(s.faces[a.face??0]),normal=tuple(f.normalAt()),existing=f.clone().innerWires(),outer=own(f.outerWire()),holes=[...existing,...(a.holes||[]).map(o=>o.cad?own(load(o)).faces[0].outerWire():own(polygon(o.faces[0].map(i=>o.vertices[i]))).outerWire())];holes.forEach(own);const face=own(boundedFace(outer,holes));result=R.basicFaceExtrusion(face,new R.Vector(mul(normal,a.distance)));}
 else if(op==='pushpull'){
 const f=own(s.faces[a.face]);if(!f||f.geomType!=='PLANE')throw Error('Push/pull requires a planar face.');let distance=finite(a.distance,'Distance'),normal=tuple(f.normalAt());if(a.targetPoint)distance=dot(a.targetPoint.map((v,i)=>v-f.center.toTuple()[i]),normal);if(a.targetFace!==undefined){const target=own(s.faces[a.targetFace]);distance=dot(target.center.toTuple().map((v,i)=>v-f.center.toTuple()[i]),normal);}
 if(Math.abs(distance)<1e-6)throw Error('Enter a nonzero distance.');const tool=own(R.basicFaceExtrusion(f,new R.Vector(mul(normal,distance))));result=s.solids.length?(distance>0?s.fuse(tool):s.cut(tool)):tool.clone();
 }
 else if(op==='profileOnSolid'){
 const f=own(faceFromLoops(a.loops)),tool=own(R.basicFaceExtrusion(f,new R.Vector(mul(a.normal,a.distance))));result=a.distance>0?s.fuse(tool):s.cut(tool);
 }
 else if(op==='transform'){
 result=s.clone();if(a.kind==='translate')result=result.translate(a.vector.map(n=>finite(n)));else if(a.kind==='rotate')result=result.rotate(finite(a.angle),a.center,a.axis);else if(a.kind==='scale')result=result.scale(positive(a.factor,'Scale'),a.center);else if(a.kind==='mirror')result=result.mirror(a.normal,a.center);else throw Error('Unknown transform.');
 }
 else if(op==='shell')result=s.shell(positive(a.thickness,'Thickness')*-1,f=>f.when(({element})=>s.faces[a.face]?.isSame(element)));
 if(!result)throw Error('Unsupported solid operation.');return serialize(result);
 }catch(e){if(globalThis.CAD_DEBUG)console.error(e.stack);throw Error(typeof e==='number'?'The kernel could not construct this geometry. Reduce the radius or distance, or change the selected edges.':e.message||String(e));}
 finally{if(result)try{result.delete();}catch{}for(const x of cleanup)try{x.delete();}catch{}}
}
