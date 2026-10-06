/* SKETCHBENCH scoped offline runtime. GPL-3.0-only. */
const PREFIX='sketchbench:'+self.registration.scope+':',CACHE=PREFIX+'2.0.0-rc.1';
const ASSETS=['./','./index.html','./cad/worker.mjs','./cad/core.bundle.mjs','./vendor/occt.js','./vendor/replicad_single.wasm','./vendor/DejaVuSans.ttf'];
const URLS=new Set(ASSETS.map(p=>new URL(p,self.location.href).href));
// Installation is atomic: retain the current version if any asset is missing.
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);u.search='';u.hash='';if(e.request.method!=='GET'||!URLS.has(u.href))return;e.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(u.href);if(hit)return hit;const response=await fetch(e.request);if(response.ok)await cache.put(u.href,response.clone());return response;}));});
