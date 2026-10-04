initGL();new ResizeObserver(resize).observe(stage);load();
if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('./sw.js').catch(()=>{});
