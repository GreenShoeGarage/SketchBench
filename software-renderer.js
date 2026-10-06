/* Opaque triangle rasterizer for the Canvas fallback. GPL-3.0-only. */
(function(K){
'use strict';
function rasterTriangles(triangles,width,height,scale=1,buffer=null){
 if(!buffer||buffer.width!==width||buffer.height!==height)buffer={width,height,pixels:new Uint8ClampedArray(width*height*4),depth:new Float64Array(width*height)};
 const {pixels,depth}=buffer;pixels.fill(0);depth.fill(-Infinity);
 const transparent=triangles.some(t=>(t.opacity??1)<.999);
 const accum=transparent?new Float32Array(width*height*4):null,remaining=transparent?new Float32Array(width*height).fill(1):null;
 for(const pass of (transparent?[0,1]:[0]))for(const triangle of triangles){
 const alpha=Math.max(0,Math.min(1,triangle.opacity??1));if((pass===0&&alpha<.999)||(pass===1&&alpha>=.999)||alpha===0)continue;
  const [a,b,c]=triangle.ps.map(p=>[p[0]*scale,p[1]*scale,p[2]]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-10)continue;
  const loX=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0])-.5)),hiX=Math.min(width-1,Math.floor(Math.max(a[0],b[0],c[0])-.5)),loY=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1])-.5)),hiY=Math.min(height-1,Math.floor(Math.max(a[1],b[1],c[1])-.5));
  const ux=(b[1]-c[1])/den,uy=(c[0]-b[0])/den,vx=(c[1]-a[1])/den,vy=(a[0]-c[0])/den,color=triangle.color.map(x=>Math.round(Math.max(0,Math.min(1,x))*255));
  for(let y=loY;y<=hiY;y++){
   let u=ux*(loX+.5-c[0])+uy*(y+.5-c[1]),v=vx*(loX+.5-c[0])+vy*(y+.5-c[1]);
   for(let x=loX;x<=hiX;x++,u+=ux,v+=vx){
    const w=1-u-v;if(u<-1e-8||v<-1e-8||w<-1e-8)continue;
    const z=u*a[2]+v*b[2]+w*c[2],i=y*width+x;if(z<depth[i]-1e-9)continue;if(pass===0)depth[i]=z;const p=i*4;let col=triangle.vertexColors?[0,1,2].map(k=>Math.max(0,Math.min(255,255*(u*triangle.vertexColors[0][k]+v*triangle.vertexColors[1][k]+w*triangle.vertexColors[2][k])))):color;if(triangle.texture&&triangle.uv){const uv=triangle.uv,tx=triangle.texture;let U=u*uv[0][0]+v*uv[1][0]+w*uv[2][0],W=u*uv[0][1]+v*uv[1][1]+w*uv[2][1];U=((U%1)+1)%1;W=((W%1)+1)%1;const j=(Math.floor((1-W)*tx.height)%tx.height*tx.width+Math.floor(U*tx.width))*4;col=[0,1,2].map(k=>Math.round(tx.data[j+k]*col[k]/255));}if(pass===1){for(let k=0;k<3;k++)accum[p+k]+=col[k]*alpha;accum[p+3]+=alpha;remaining[i]*=1-alpha;}else{pixels[p]=col[0];pixels[p+1]=col[1];pixels[p+2]=col[2];pixels[p+3]=255;}
   }
  }
 }
 if(transparent)for(let i=0;i<remaining.length;i++){const p=i*4,w=accum[p+3];if(!w)continue;const a=1-remaining[i],base=pixels[p+3]/255,out=a+base*(1-a);for(let k=0;k<3;k++)pixels[p+k]=(accum[p+k]/w*a+pixels[p+k]*base*(1-a))/out;pixels[p+3]=out*255;}
 return buffer;
}
K.rasterTriangles=rasterTriangles;
})(typeof module!=='undefined'?module.exports=require('./surfaces.js'):K);
