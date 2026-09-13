const BASE=new URL('./',self.location.href);
const PREFIX='iskra-'+BASE.pathname.replace(/[^a-z0-9]/gi,'_')+'-';
const CACHE=PREFIX+'iphone-v6';
const HOME=BASE.href;
const ASSETS=['./','index.html','style.css','readability.css','play.css','arena.css','iphone.css','app.js','course.js','logic.js','progress.js','play-content.js','gameplay.js','math-view.js','arena.js','arena-ui.js','auto-advance.js','assets/iskra.png','assets/glade.png','assets/chest.png','favicon.svg','manifest.webmanifest','assets/icon-192.png','assets/icon-512.png','assets/manrope-regular.ttf','assets/manrope-bold.ttf','assets/stix-two-math.ttf'].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(['localhost','127.0.0.1'].includes(url.hostname)){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));return;}
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok&&response.headers.get('content-type')?.includes('text/html')){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(HOME,copy)));}
      return response;
    }).catch(()=>caches.match(HOME)));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
