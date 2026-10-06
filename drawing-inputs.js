/* In-canvas measurements, with mouse and keyboard sharing one draft. GPL-3.0-only. */
let drawingLocks=[false,false],drawingDrag=null;
const dimensionTools=['rectangle','circle','line','polygon','rotatedRect'];
const drawingUnit=()=>prefs.units||'mm';
const drawingNumber=n=>String(Number((n/parseLength('1',drawingUnit())).toFixed(6)));
function drawingBasis(){
 const f=workFrame(),a=points.at(tool==='line'||tool==='polygon'?-1:0)||f.o;
 const u=tool==='rotatedRect'&&points.length>1?V.unit(V.sub(points[1],a)):f.u;
 const v=tool==='rotatedRect'?V.unit(V.cross(f.n,u)):f.v;
 const d=V.sub(hover||a,a),x=V.dot(d,u),y=V.dot(d,v);
 return {a,u,v,x,y,length:Math.hypot(x,y),angle:Math.atan2(y,x)*180/Math.PI};
}
function drawingValues(){
 const b=drawingBasis(),line=tool==='line'||tool==='polygon';
 let a=tool==='circle'||line?b.length:tool==='rotatedRect'&&points.length>1?V.len(V.sub(points[1],b.a)):Math.abs(b.x),c=line?b.angle:Math.abs(b.y);
 if(drawingLocks[0])a=parseLength($('#drawA').value,drawingUnit());
 if(drawingLocks[1])c=line?Number($('#drawB').value):parseLength($('#drawB').value,drawingUnit());
 if(!Number.isFinite(a)||a<=0||a>100000)throw Error('Enter a positive '+(line?'length':tool==='circle'?'radius':'width')+' up to 100,000 mm.');
 if(tool!=='circle'&&(!Number.isFinite(c)||(line?Math.abs(c)>360000:c<=0||c>100000)))throw Error(line?'Enter a finite angle in degrees.':'Enter a positive height up to 100,000 mm.');
 return {...b,size:a,second:c};
}
function drawingGeometry(){
 const b=drawingValues(),line=tool==='line'||tool==='polygon';
 if(line){const r=b.second*Math.PI/180;return [...points,V.add(b.a,V.add(V.mul(b.u,b.size*Math.cos(r)),V.mul(b.v,b.size*Math.sin(r))))];}
 if(tool==='circle')return circlePoints(b.a,V.add(b.a,V.mul(b.u,b.size)));
 const u=V.mul(b.u,b.size*(tool==='rotatedRect'?1:b.x<0?-1:1)),v=V.mul(b.v,b.second*(b.y<0?-1:1));
 return [b.a,V.add(b.a,u),V.add(b.a,V.add(u,v)),V.add(b.a,v)];
}
function updateDrawingPanel(){
 const active=dimensionTools.includes(tool);$('#drawingPanel').hidden=!active;
 if(!active)return;
 const line=tool==='line'||tool==='polygon',circle=tool==='circle',b=drawingBasis();
 $('#drawingTitle').textContent=toolDefs.find(t=>t[0]===tool)?.[1]+' dimensions';
 $('#drawALabel').textContent=(circle?'Radius':line?'Length':'Width')+' ('+drawingUnit()+')';
 $('#drawBLabel').textContent=line?'Angle from U (°)':'Height ('+drawingUnit()+')';$('#drawBField').hidden=circle;
 $('#drawAnchor').textContent=!points.length?'Click a starting point, then move the mouse or type dimensions.':tool==='rotatedRect'&&points.length<2?'Click a second point to set the edge direction.':'Type to lock a dimension. Enter applies; clear a field to size it with the mouse.';
 if(!drawingLocks[0])$('#drawA').value=points.length?drawingNumber(circle||line?b.length:tool==='rotatedRect'&&points.length>1?V.len(V.sub(points[1],b.a)):Math.abs(b.x)):'';
 if(!drawingLocks[1])$('#drawB').value=points.length?(line?String(Number(b.angle.toFixed(3))):drawingNumber(Math.abs(b.y))):'';
 for(let i=0;i<2;i++)$('#draw'+(i?'B':'A')).classList.toggle('dimensionLocked',drawingLocks[i]);
 $('#drawApply').textContent=line?'Add segment ↵':'Create shape ↵';
 $('#drawApply').disabled=cadBusy||!points.length||(tool==='rotatedRect'&&points.length<2);
 $('#drawFinish').hidden=!line;$('#drawFinish').disabled=points.length<(tool==='polygon'?3:2);
}
async function commitDrawing(){
 if(!dimensionTools.includes(tool)||cadBusy)return;
 try{
  if(!points.length)throw Error('Click the starting point on the workplane first.');
  if(tool==='rotatedRect'&&points.length<2)throw Error('Click a second point to set the edge direction first.');
  const ps=drawingGeometry();
  if(tool==='line'||tool==='polygon'){
   if(points.length>=1000)throw Error('Maximum 1,000 points. Finish this outline first.');
   points=ps;drawingLocks=[false,false];hover=null;$('#finish').hidden=false;$('#cancel').hidden=false;render();
  }else{const before=tool;await newProfile(ps,tool==='circle'?'Circle':tool==='rotatedRect'?'Rotated rectangle':'Rectangle');if(tool!==before)stage.focus();}
 }catch(e){$('#drawStatus').textContent=e.message;toast(e.message);}
}
const previewBeforeDimensions=previewPoints;previewPoints=function(){
 if(dimensionTools.includes(tool)&&points.length&&drawingLocks.some(Boolean))try{return drawingGeometry();}catch{}
 return previewBeforeDimensions();
};
const renderBeforeDimensions=render;render=function(){renderBeforeDimensions();updateDrawingPanel();};
const toolBeforeDimensions=setTool;setTool=function(key){drawingLocks=[false,false];drawingDrag=null;$('#drawStatus').textContent='';return toolBeforeDimensions(key);};
const clickBeforeDimensions=clickDraw;clickDraw=function(x,y){
 if(dimensionTools.includes(tool)&&points.length){
  if(tool==='rectangle'||tool==='circle'||drawingLocks.some(Boolean)){hover=pointerPoint(x,y,true);return commitDrawing();}
 }
 return clickBeforeDimensions(x,y);
};
const downBeforeDimensions=cadPointerDown;cadPointerDown=function(e,x,y){
 if(cadBusy)return true;
 if(e.button===0&&['rectangle','circle'].includes(tool)&&!points.length){
  clickDraw(x,y);if(points.length){drawingDrag={x,y,tool,moved:false};stage.setPointerCapture(e.pointerId);}return true;
 }
 if(e.button===0&&tool==='rotatedRect'&&points.length===2&&drawingLocks.some(Boolean)){hover=pointerPoint(x,y);commitDrawing();return true;}
 return downBeforeDimensions(e,x,y);
};
const moveBeforeDimensions=cadPointerMove;cadPointerMove=function(e,x,y){
 if(drawingDrag&&Math.hypot(x-drawingDrag.x,y-drawingDrag.y)>5)drawingDrag.moved=true;
 return moveBeforeDimensions(e,x,y);
};
const finishBeforeDimensions=finishInteraction;finishInteraction=function(cancel=false){
 if(drawingDrag){const d=drawingDrag;drawingDrag=null;if(cancel){points=[];hover=null;render();}else if(d.moved&&d.tool===tool)commitDrawing();return true;}
 return finishBeforeDimensions(cancel);
};
function changeDrawingInput(i){drawingLocks[i]=$('#draw'+(i?'B':'A')).value.trim()!=='';$('#drawStatus').textContent='';render();}
for(const [i,key]of ['A','B'].entries()){
 const input=$('#draw'+key);input.oninput=()=>changeDrawingInput(i);
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();commitDrawing();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setTool('select');stage.focus();}};
}
$('#drawApply').onclick=commitDrawing;$('#drawFinish').onclick=()=>finishProfile();$('#drawMouse').onclick=()=>{drawingLocks=[false,false];$('#drawStatus').textContent='';stage.focus();render();};$('#drawCancel').onclick=()=>setTool('select');
// Capture only the first numeric keystroke from the viewport; focused inputs
// retain normal editing, Tab navigation, unit suffixes and clipboard shortcuts.
function drawingKeydown(e){
 if(e.ctrlKey||e.metaKey||e.altKey||$('#dialog').open||e.target?.matches?.('input,textarea,select,button')||!dimensionTools.includes(tool)||!points.length)return;
 if(/^[0-9.]$/.test(e.key)){
  e.preventDefault();e.stopImmediatePropagation();$('#drawA').value=e.key;drawingLocks[0]=true;$('#drawA').focus();render();
 }else if(e.key==='Enter'&&['rectangle','circle','rotatedRect'].includes(tool)){
  e.preventDefault();e.stopImmediatePropagation();commitDrawing();
 }
}
document.addEventListener('keydown',drawingKeydown,true);
const numericBeforeDimensions=applyNumeric;applyNumeric=async function(){
 if(!dimensionTools.includes(tool))return numericBeforeDimensions();
 try{
  const parts=$('#numericDraw').value.split(/[,;]+/).map(s=>s.trim()),line=tool==='line'||tool==='polygon';
  if(parts.length>(tool==='circle'?1:2)||!parts[0]||tool==='rectangle'&&parts.length!==2)throw Error(tool==='rectangle'?'Enter width, height (for example 80mm, 40mm).':'Enter dimensions separated by a comma.');
  if(!points.length)points=[workFrame().o.slice()];
  $('#drawA').value=parts[0];drawingLocks[0]=true;
  if(parts[1]!==undefined){$('#drawB').value=parts[1];drawingLocks[1]=true;}else if(!line&&tool!=='circle')throw Error('Enter both width and height.');
  await commitDrawing();
 }catch(e){toast(e.message);}
};actions.applyNumeric=applyNumeric;
for(const key of ['rectangle','circle'])hints[key]='Click-drag or click two points. Type exact dimensions in the drawing panel; Enter creates the shape.';
