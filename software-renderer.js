/* Opaque triangle rasterizer for the Canvas fallback. GPL-3.0-only. */
(function(K){
'use strict';
function rasterTriangles(triangles,width,height,scale=1,buffer=null){
 if(!buffer||buffer.width!==width||buffer.height!==height)buffer={width,height,pixels:new Uint8ClampedArray(width*height*4),depth:new Float64Array(width*height)};
 const {pixels,depth}=buffer;pixels.fill(0);depth.fill(-Infinity);
 for(const triangle of triangles){
  const [a,b,c]=triangle.ps.map(p=>[p[0]*scale,p[1]*scale,p[2]]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-10)continue;
  const loX=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0])-.5)),hiX=Math.min(width-1,Math.floor(Math.max(a[0],b[0],c[0])-.5)),loY=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1])-.5)),hiY=Math.min(height-1,Math.floor(Math.max(a[1],b[1],c[1])-.5));
  const ux=(b[1]-c[1])/den,uy=(c[0]-b[0])/den,vx=(c[1]-a[1])/den,vy=(a[0]-c[0])/den,color=triangle.color.map(x=>Math.round(Math.max(0,Math.min(1,x))*255));
  for(let y=loY;y<=hiY;y++){
   let u=ux*(loX+.5-c[0])+uy*(y+.5-c[1]),v=vx*(loX+.5-c[0])+vy*(y+.5-c[1]);
   for(let x=loX;x<=hiX;x++,u+=ux,v+=vx){
    const w=1-u-v;if(u<-1e-8||v<-1e-8||w<-1e-8)continue;
    const z=u*a[2]+v*b[2]+w*c[2],i=y*width+x;if(z<depth[i]-1e-9)continue;depth[i]=z;const p=i*4;pixels[p]=color[0];pixels[p+1]=color[1];pixels[p+2]=color[2];pixels[p+3]=255;
   }
  }
 }
 return buffer;
}
K.rasterTriangles=rasterTriangles;
})(typeof module!=='undefined'?module.exports=require('./surfaces.js'):K);
