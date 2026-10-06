const test=require('node:test'),assert=require('node:assert/strict'),K=require('../software-renderer.js');
const pixel=(frame,x,y)=>Array.from(frame.pixels.slice((y*frame.width+x)*4,(y*frame.width+x)*4+4));
test('software depth is resolved per pixel when triangles cross, regardless of drawing order',()=>{
 const red={ps:[[1,1,1],[11,1,11],[1,11,1]],color:[1,0,0]},blue={ps:[[1,1,5],[11,1,5],[1,11,5]],color:[0,0,1]};
 for(const triangles of [[red,blue],[blue,red]]){
  const frame=K.rasterTriangles(triangles,12,12);assert.deepEqual(pixel(frame,2,2),[0,0,255,255]);assert.deepEqual(pixel(frame,8,1),[255,0,0,255]);assert.deepEqual(pixel(frame,11,11),[0,0,0,0]);
 }
});
test('software pixels respect screen scaling and clear old geometry when the scene changes',()=>{
 const triangle={ps:[[1,1,3],[4,1,3],[1,4,3]],color:[.2,.4,.6]},frame=K.rasterTriangles([triangle],12,12,2);
 assert.deepEqual(pixel(frame,3,3),[51,102,153,255]);assert.deepEqual(pixel(frame,0,0),[0,0,0,0]);
 assert.equal(K.rasterTriangles([],12,12,2,frame),frame);assert.deepEqual(pixel(frame,3,3),[0,0,0,0]);assert.equal(frame.depth[3*12+3],-Infinity);
 const resized=K.rasterTriangles([triangle],6,6,1,frame);assert.notEqual(resized,frame);assert.equal(resized.pixels.length,144);assert.deepEqual(pixel(resized,1,1),[51,102,153,255]);
});
test('textures, smooth colors and transparency composite without order dependence',()=>{
 const shape={ps:[[0,0,3],[10,0,3],[0,10,3]],color:[1,1,1]},texture={...shape,uv:[[0,0],[0,0],[0,0]],texture:{width:1,height:1,data:new Uint8Array([20,150,70,255])}};assert.deepEqual(pixel(K.rasterTriangles([texture],10,10),2,2),[20,150,70,255]);
 const smooth={...shape,vertexColors:[[1,0,0],[0,1,0],[0,0,1]]};const p=pixel(K.rasterTriangles([smooth],10,10),2,2);assert.ok(p[0]>100&&p[1]>50&&p[2]>50);
 const glass={...shape,color:[1,0,0],opacity:.5},behind={...shape,ps:shape.ps.map(p=>[p[0],p[1],1]),color:[0,0,1]};for(const ts of [[glass,behind],[behind,glass]])assert.deepEqual(pixel(K.rasterTriangles(ts,10,10),2,2),[128,0,128,255]);
});
