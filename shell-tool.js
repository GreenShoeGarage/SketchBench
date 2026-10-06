/* Inward solid shell preview and face openings. GPL-3.0-only. */
function shellFaceLabel(face){
 const names=[['Left','Right'],['Front','Back'],['Bottom','Top']];
 const axis=face.normal.findIndex(n=>Math.abs(n)>.9999);
 const direction=face.type==='PLANE'&&axis>=0?names[axis][face.normal[axis]>0?1:0]:({CYLINDRE:'Cylindrical',SPHERE:'Spherical',CONE:'Conical',TORUS:'Toroidal'}[face.type]||face.type.toLowerCase().replaceAll('_',' '));
 return 'Face '+(face.index+1)+' · '+direction;
}
function shellDialog(){
 let o;try{o=oneSolid();}catch(e){toast(e.message);return;}
 const source=clone(o),clicked=selectedFace?.id===o.id?o.cad.faceMap[selectedFace.face]:null;
 modal('Hollow solid · Shell',`<p>Create walls inside this solid. Its outside dimensions stay the same.</p><div class="formgrid"><label>Wall thickness (mm)<input id="shellThickness" type="number" min="0.001" step="0.5" value="2"></label><label>Openings<select id="shellMode"><option value="open">Remove checked faces</option><option value="closed">Closed hollow · keep every face</option></select></label></div><div id="shellOpenings"><p>Check one or more faces to remove. View turns the model toward a face.</p><div class="shellFaceList">${o.cad.faces.map(f=>`<div class="shellFaceRow"><label class="check"><input type="checkbox" data-shell-face="${f.index}">${esc(shellFaceLabel(f))}</label><button data-shell-view="${f.index}" aria-label="View face ${f.index+1}">View</button></div>`).join('')}</div><small id="shellFaceCount"></small></div><p id="shellClosedNote" hidden>Use a section view to inspect the enclosed cavity.</p><p id="shellStatus" role="status">Preview checks the wall geometry before applying.</p><div class="inline"><button id="shellPreview">Preview</button><button id="shellApply" class="primary">Apply</button><button id="shellCancel">Cancel</button></div>`);
 const epoch=edgeDialogEpoch,live=()=>epoch===edgeDialogEpoch&&$('#dialog').open;
 let result=null,lastKey='',revision=0;
 const checkboxes=$$('[data-shell-face]');
 for(const b of checkboxes)b.checked=+b.dataset.shellFace===clicked;
 const values=()=>({object:source,thickness:+$('#shellThickness').value,closed:$('#shellMode').value==='closed',faces:checkboxes.filter(b=>b.checked).map(b=>+b.dataset.shellFace)});
 const update=()=>{
  const closed=$('#shellMode').value==='closed';$('#shellOpenings').hidden=closed;$('#shellClosedNote').hidden=!closed;
  const count=checkboxes.filter(b=>b.checked).length;$('#shellFaceCount').textContent=count+' face'+(count===1?'':'s')+' selected for removal';
 };
 const invalidate=()=>{revision++;result=null;lastKey='';cadPreview=null;update();$('#shellStatus').textContent='Settings changed. Preview or Apply to calculate.';render();};
 $('#shellThickness').oninput=invalidate;$('#shellMode').onchange=invalidate;
 for(const b of checkboxes)b.onchange=invalidate;
 for(const b of $$('[data-shell-view]'))b.onclick=()=>{
  if(cadBusy)return;cadPreview=null;
  const f=source.cad.faces[+b.dataset.shellView];selectedFace={id:o.id,face:source.cad.faceMap.indexOf(f.index)};
  camera.az=Math.atan2(f.normal[0],f.normal[1]);camera.el=Math.asin(Math.max(-1,Math.min(1,f.normal[2])));camera.target=f.center.slice();
  $('#viewLabel').textContent='FACE '+(f.index+1);$$('[data-view]').forEach(b=>b.classList.remove('active'));render();
 };
 const run=async commit=>{
  if(!live())return;
  await cadTask('Shelling solid',async()=>{
   const args=values(),stamp=revision,key=JSON.stringify({thickness:args.thickness,closed:args.closed,faces:args.closed?[]:args.faces});
   try{
    if(!Number.isFinite(args.thickness)||args.thickness<=0)throw Error('Enter a positive wall thickness in millimeters.');
    if(!args.closed&&!args.faces.length)throw Error('Check at least one opening face, or choose Closed hollow.');
    $('#shellStatus').textContent='Calculating walls…';
    const mesh=result&&key===lastKey?result:await cadCall('shell',args);
    if(!live()||stamp!==revision)return;
    if(doc.objects.find(x=>x.id===o.id)!==o||o.cad.brep!==source.cad.brep||JSON.stringify(o.cad.transforms)!==JSON.stringify(source.cad.transforms))throw Error('The source solid changed. Close Shell and select it again.');
    result=mesh;lastKey=key;
    if(commit){
     cadPreview=null;cadApply(()=>{Object.assign(o,mesh);selectedFace=null;edgeSelection={id:null,indices:new Set()};});
     closeDialog();toast('Shell applied · '+fmt(args.thickness)+' mm walls. Undo restores the original solid.');
    }else{
     selectedFace=null;cadPreview={id:o.id,mesh};render();$('#shellStatus').textContent='Valid shell · '+fmt(mesh.cad.volume)+' mm³ of material · preview only';
    }
   }catch(e){if(live()&&stamp===revision){result=null;lastKey='';cadPreview=null;$('#shellStatus').textContent=e.message;render();}throw e;}
  });
 };
 $('#shellPreview').onclick=()=>run(false);$('#shellApply').onclick=()=>run(true);$('#shellCancel').onclick=()=>closeDialog();update();
}
actions.shell=shellDialog;
