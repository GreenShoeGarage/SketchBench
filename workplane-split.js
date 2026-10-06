/* Visible reference planes and guided native body splitting. GPL-3.0-only. */
let pickingWorkplane=false,splitWorkflow=null;
if(typeof prefs.showWorkplane!=='boolean')prefs.showWorkplane=true;
const savePrefsBeforeWorkplanes=savePrefs;savePrefs=function(){prefs.faceFrame=customFrame?clone(customFrame):null;savePrefsBeforeWorkplanes();};
function workplaneName(){return (prefs.plane==='face'?'Face':prefs.plane.toUpperCase())+' · '+fmt(V.dot(workFrame().o,workFrame().n))+' mm';}
function planeGuide(frame,objects=[]){
 const target=K.local(objects.length?K.bounds(objects).center:camera.target,frame),samples=objects.flatMap(o=>o.vertices.map(p=>K.local(p,frame)));
 const half=objects.length?samples.reduce((r,p)=>Math.max(r,Math.abs(p[0]-target[0]),Math.abs(p[1]-target[1])),15)*1.2:Math.max(30,Math.min(50000,140/camera.scale));
 const quad=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>K.world([target[0]+u*half,target[1]+v*half,0],frame));
 return {frame,quad,half};
}
function splitFacePlane(first,second,mode,distance){
 if(first.type!=='PLANE'||second.type!=='PLANE')throw Error('Choose two planar, parallel faces.');
 if(first.index===second.index)throw Error('Choose a different face on the other side of the body.');
 let n=V.unit(first.normal);
 if(Math.abs(V.dot(n,V.unit(second.normal)))<1-1e-8)throw Error('The second face must be parallel to the first.');
 const signed=V.dot(V.sub(second.center,first.center),n),gap=Math.abs(signed);
 if(gap<1e-5)throw Error('These faces are on the same plane. Choose a face on the other side.');
 if(signed<0)n=V.mul(n,-1);
 const d=mode==='middle'?gap/2:distance;
 if(!Number.isFinite(d)||d<=1e-6||d>=gap-1e-6)throw Error('Enter a distance greater than 0 and less than '+fmt(gap)+' mm.');
 const origin=V.add(first.center,V.mul(n,d)),ref=Math.abs(n[0])<.9?[1,0,0]:[0,1,0],u=V.unit(V.sub(ref,V.mul(n,V.dot(ref,n))));
 return {o:origin,n,u,v:V.cross(n,u),gap,distance:d};
}
function currentSplitPlane(){
 const s=splitWorkflow;if(!s||s.faces.length!==2)return null;
 return splitFacePlane(...s.faces.map(i=>s.source.cad.faces[i]),$('#splitMode').value,$('#splitMode').value==='middle'?0:parseLength($('#splitDistance').value,drawingUnit()));
}
function workplaneBackdrops(){
 const planes=[];
 if(prefs.showWorkplane)planes.push({...planeGuide(workFrame()),color:'#658fb4',label:workplaneName()});
 try{const f=currentSplitPlane();if(f)planes.push({...planeGuide(f,[splitWorkflow.source]),color:'#da8045',label:'Split plane'});}catch{}
 return planes;
}
function updateWorkplaneControls(){
 $('#workplaneLabel').textContent=workplaneName();$('#workplaneVisibility').textContent=prefs.showWorkplane?'Hide plane':'Show plane';$('#workplaneVisibility').setAttribute('aria-pressed',String(prefs.showWorkplane));
 $('#workplanePickPanel').hidden=!pickingWorkplane;$('#splitPanel').hidden=!splitWorkflow;
 $('#autoFacePlane').checked=prefs.autoFacePlane!==false;
 if(splitWorkflow)updateSplitControls();
}
function drawPlaneAnnotation(guide){
 // Only annotate the visible parts of the frame. Solid surfaces still cover it.
 const {frame:f,half,color}=guide,origin=f.o,len=Math.min(half*.4,35/camera.scale);
 for(const [dir,label]of [[f.u,'U'],[f.v,'V'],[f.n,'N']]){
  const a=project(origin),b=project(V.add(origin,V.mul(dir,len)));
  for(const [p,q]of visibleEdgeParts({a,b},drawn))line2(ctx,p,q,color,2);
  const h=hit(b[0],b[1]);if(!h||b[2]>=h.depth-1e-5){ctx.fillStyle=color;ctx.font='bold 11px system-ui';ctx.fillText(label,b[0]+4,b[1]-3);}
 }
}
const renderBeforeWorkflows=render;render=function(){
 const state=splitWorkflow,originals=doc.objects;
 if(state?.result)doc.objects=doc.objects.flatMap(o=>o.id===state.id?state.result.parts.map((p,i)=>({...o,...p,id:o.id+'-split-preview-'+i,color:i%2?'#df9d64':'#6a9bbc'})):o);
 try{renderBeforeWorkflows();}finally{doc.objects=originals;}
 for(const guide of workplaneBackdrops())drawPlaneAnnotation(guide);
 if(state&&!state.result)for(const [order,index]of state.faces.entries()){
  const f=state.source.cad.faces[index];
  for(const edge of f.edges)for(const [i,j]of state.source.cad.edges[edge].segments){
   const a=project(state.source.vertices[i]),b=project(state.source.vertices[j]);
   for(const [p,q]of visibleEdgeParts({a,b},drawn))line2(ctx,p,q,order?'#bb70b5':'#448bc4',4);
  }
 }
 updateWorkplaneControls();
};
function cancelPlaneWorkflows(){pickingWorkplane=false;splitWorkflow=null;render();}
const toolBeforeWorkflows=setTool;setTool=function(key){pickingWorkplane=false;splitWorkflow=null;return toolBeforeWorkflows(key);};
function beginWorkplanePick(){
 if(cadBusy)return;closeDialog();setTool('select');selectionMode='face';pickingWorkplane=true;selectedFace=null;render();
}
function finishWorkplaneChange(){
 points=[];hover=null;drawingLocks=[false,false];drawingDrag=null;prefs.showWorkplane=true;
 $('#plane').value=prefs.plane;$('#elevation').value=prefs.elevation;
 if(prefs.plane!=='face'||Math.abs(prefs.elevation)>1e-6)sketchHost=null;
 savePrefs();render();
}
const facePlaneBeforeWorkflows=faceWorkplane;faceWorkplane=function(){
 facePlaneBeforeWorkflows();const source=doc.objects.find(o=>o.id===sketchHost?.id);if(source&&objectLocked(source))sketchHost=null;
 if(prefs.plane==='face'&&customFrame){prefs.showWorkplane=true;savePrefs();render();}
};actions.facePlane=()=>{prefs.autoFacePlane=false;faceWorkplane();};
function workplaneDialog(){
 cancelPlaneWorkflows();
 modal('Create / change workplane',`<p>The blue plane is where new shapes are drawn. U and V show its drawing axes; N points along its normal.</p><label>Reference plane<select id="newWorkplane"><option value="xy">XY · ground</option><option value="xz">XZ · front</option><option value="yz">YZ · side</option>${customFrame?'<option value="face">Last selected face plane</option>':''}</select></label><label>Offset along the plane normal (${drawingUnit()})<input id="workplaneOffset" value="0" placeholder="e.g. 10mm or 1/2in"></label><p id="workplaneStatus" role="status">Positive offsets follow N; negative offsets go the other way.</p><div class="inline"><button id="useWorkplane" class="primary">Use plane</button><button id="pickWorkplaneFace">Pick a model face</button></div><p>Using a plane keeps sketches on it. Enable “Auto align to clicked face” in Sketch setup to resume automatic face alignment.</p>`);
 $('#newWorkplane').value=prefs.plane;$('#workplaneOffset').value=drawingNumber(V.dot(workFrame().o,workFrame().n)-(prefs.plane==='face'?V.dot(customFrame.o,customFrame.n):0));
 $('#useWorkplane').onclick=()=>{try{
  const next=$('#newWorkplane').value,d=parseLength($('#workplaneOffset').value,drawingUnit());
  if(Math.abs(d)>100000)throw Error('Keep the plane offset within ±100,000 mm.');
  if(!['xy','xz','yz','face'].includes(next)||next==='face'&&!customFrame)throw Error('Pick a model face first.');
  prefs.plane=next;prefs.elevation=next==='xz'?-d:d;prefs.autoFacePlane=false;sketchHost=null;
  closeDialog();finishWorkplaneChange();toast('Workplane active · '+workplaneName());
 }catch(e){$('#workplaneStatus').textContent=e.message;}};
 $('#pickWorkplaneFace').onclick=beginWorkplanePick;
}
$('#workplaneVisibility').onclick=()=>{prefs.showWorkplane=!prefs.showWorkplane;savePrefs();render();};
$('#autoFacePlane').onchange=()=>{prefs.autoFacePlane=$('#autoFacePlane').checked;savePrefs();};
$('#cancelWorkplanePick').onclick=cancelPlaneWorkflows;
const planeChangeBeforeWorkflows=$('#plane').onchange;$('#plane').onchange=e=>{prefs.autoFacePlane=false;planeChangeBeforeWorkflows(e);finishWorkplaneChange();};
const elevationBeforeWorkflows=$('#elevation').onchange;$('#elevation').onchange=e=>{elevationBeforeWorkflows(e);finishWorkplaneChange();};
function beginSplitBody(){
 if(cadBusy)return;
 if(!doc.objects.some(o=>objectVisible(o)&&!objectLocked(o)&&o.cad?.volume>0))return toast('Add or convert a native solid before using Split Body.');
 closeDialog();setTool('select');selectionMode='face';edgeSelection={id:null,indices:new Set()};selectedFace=null;
 splitWorkflow={id:null,source:null,snapshot:snapshot(),faces:[],revision:0,result:null,status:'Click the first face on the body to split. Distances will start here.'};
 $('#splitMode').value='middle';$('#splitDistance').value='';render();
}
function updateSplitControls(){
 const s=splitWorkflow;if(!s)return;
 $('#splitBodyName').textContent=s.source?.name||'pick a body';$('#splitFirst').textContent=s.faces.length?'1 · Face '+(s.faces[0]+1):'1 · Pick first face';$('#splitSecond').textContent=s.faces.length===2?'2 · Face '+(s.faces[1]+1):'2 · Pick parallel face';
 $('#splitSettings').hidden=s.faces.length!==2;$('#splitDistanceField').hidden=$('#splitMode').value!=='distance';
 $('#splitDistanceLabel').textContent='Distance from first face ('+drawingUnit()+')';
 let valid=false;try{const f=currentSplitPlane();if(f){valid=true;$('#splitMeasure').textContent='Face spacing '+fmt(f.gap)+' mm · split '+fmt(f.distance)+' mm from face 1';}}catch(e){$('#splitMeasure').textContent=e.message;}
 $('#splitPreview').disabled=cadBusy||!valid;$('#splitApply').disabled=cadBusy||!valid;$('#splitFirst').disabled=cadBusy;$('#splitSecond').disabled=cadBusy||!s.faces.length;
 $('#splitStatus').textContent=s.status;
}
function pickSplitFace(h){
 const s=splitWorkflow;if(!s)return;
 try{
  if(!h?.o.cad||h.o.cad.volume<=0||h.face===null||objectLocked(h.o)||!objectVisible(h.o))throw Error('Click a planar face on an unlocked native solid.');
  if(s.faces.length&&h.o.id!==s.id)throw Error('Choose the second face on '+s.source.name+'. Right-drag to orbit to the other side.');
  if(h.o.component&&editContext?.id!==h.o.component.instance)throw Error('Open this component instance before splitting a body inside it.');
  const index=h.o.cad.faceMap[h.face],f=h.o.cad.faces[index];
  if(f?.type!=='PLANE')throw Error('Choose a planar face. Curved faces cannot define a constant spacing.');
  if(s.faces.length===2)return;
  if(s.faces.length){const plane=splitFacePlane(s.source.cad.faces[s.faces[0]],f,'middle');$('#splitDistance').value=drawingNumber(plane.distance);}
  else{s.id=h.o.id;s.source=clone(h.o);selected=new Set([h.o.id]);}
  s.faces.push(index);s.revision++;s.result=null;
  s.status=s.faces.length===1?'First face selected. Orbit, then click a parallel face on the other side.':'Orange plane shows the cut. Choose Midpoint or enter a distance from face 1.';
  selectedFace=null;render();
 }catch(e){s.status=e.message;render();}
}
function invalidateSplit(){const s=splitWorkflow;if(!s)return;s.revision++;s.result=null;s.status='Settings changed. The orange plane shows the new cut.';render();}
$('#splitMode').onchange=invalidateSplit;$('#splitDistance').oninput=invalidateSplit;
$('#splitFirst').onclick=()=>{if(!splitWorkflow||cadBusy)return;splitWorkflow.faces=[];splitWorkflow.id=null;splitWorkflow.source=null;splitWorkflow.status='Click the first face. Distances will start here.';splitWorkflow.result=null;splitWorkflow.revision++;render();};
$('#splitSecond').onclick=()=>{if(!splitWorkflow||cadBusy)return;splitWorkflow.faces=splitWorkflow.faces.slice(0,1);splitWorkflow.status='Click the second, parallel face.';splitWorkflow.result=null;splitWorkflow.revision++;render();};
$('#splitCancel').onclick=cancelPlaneWorkflows;
async function runBodySplit(commit){
 const s=splitWorkflow;if(!s)return;
 await cadTask('Splitting body',async()=>{
  const stamp=s.revision;
  try{
   const f=currentSplitPlane();if(!f)throw Error('Select both reference faces first.');
   s.status='Checking the split…';render();
   const result=s.result||await cadCall('splitBetweenFaces',{object:s.source,faces:s.faces.slice(),mode:$('#splitMode').value,distance:f.distance});
   if(splitWorkflow!==s||s.revision!==stamp)return;
   if(snapshot()!==s.snapshot)throw Error('The model changed. Cancel and select the body again.');
   s.result=result;
   if(commit){
    const source=doc.objects.find(o=>o.id===s.id);splitWorkflow=null;
    const ok=cadApply(()=>{
     // Linked definitions must replace the member, otherwise future instances
     // would contain both the original member and its split replacements.
     if(source.component)doc.objects=doc.objects.filter(o=>o.id!==source.id);else source.visible=false;
     const ids=[];
     for(const [i,part]of result.parts.entries()){
      const o=addObject(source.name+' part '+(i+1),part,source.color);o.group=source.group;o.layer=source.layer;if(source.material)o.material=source.material;ids.push(o.id);
     }
     selected=new Set(ids);selectedFace=null;edgeSelection={id:null,indices:new Set()};
    });
    if(ok)toast('Created '+result.parts.length+' solid bodies. '+(source.component?'Linked instances updated.':'The original is hidden.')+' Undo restores the original.');
   }else{s.status='Valid split · '+result.parts.length+' bodies · preview only. Apply to keep the result.';render();}
  }catch(e){if(splitWorkflow===s&&s.revision===stamp){s.result=null;s.status=e.message;render();}throw e;}
 });
 render();
}
$('#splitPreview').onclick=()=>runBodySplit(false);$('#splitApply').onclick=()=>runBodySplit(true);
const downBeforeWorkflows=cadPointerDown;cadPointerDown=function(e,x,y){
 if(cadBusy)return true;
 if(e.button===0&&(pickingWorkplane||splitWorkflow)){
  const h=hit(x,y);
  if(splitWorkflow){pickSplitFace(h);return true;}
  if(!h||h.face===null||h.o.cad&&h.o.cad.faces[h.o.cad.faceMap[h.face]]?.type!=='PLANE'){toast('Click a planar face to create the workplane.');return true;}
  selectedFace={id:h.o.id,face:h.face};selected=new Set([h.o.id]);prefs.autoFacePlane=false;faceWorkplane();pickingWorkplane=false;finishWorkplaneChange();sync();return true;
 }
 return downBeforeWorkflows(e,x,y);
};
const syncBeforeWorkflows=sync;sync=function(){
 if(splitWorkflow&&snapshot()!==splitWorkflow.snapshot){splitWorkflow=null;toast('Split Body cancelled because the model changed.');}
 syncBeforeWorkflows();
};
const modalBeforeWorkflows=modal;modal=function(title,html){pickingWorkplane=false;splitWorkflow=null;return modalBeforeWorkflows(title,html);};
function planeWorkflowKeydown(e){if(e.key==='Escape'&&(pickingWorkplane||splitWorkflow)&&!$('#dialog').open){e.preventDefault();e.stopImmediatePropagation();cancelPlaneWorkflows();stage.focus();}}
document.addEventListener('keydown',planeWorkflowKeydown,true);
Object.assign(actions,{workplane:workplaneDialog,pickWorkplane:beginWorkplanePick,splitBody:beginSplitBody});
workplaneBackdrops.ready=true;
