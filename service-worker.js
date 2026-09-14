const CACHE_VERSION='arc-ready7';
const SHELL_CACHE=`${CACHE_VERSION}-shell`;
const RUNTIME_CACHE=`${CACHE_VERSION}-runtime`;
const APP_ROOT='./';
const PRECACHE=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/arc-icon-180.png',
  './assets/arc-icon-192.png',
  './assets/arc-icon-512.png',
  './assets/arc-eclipse-v4.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('arc-')&&!key.startsWith(CACHE_VERSION)).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        const cache=await caches.open(SHELL_CACHE);
        cache.put('./',fresh.clone()).catch(()=>{});
        return fresh;
      }catch(_){
        return (await caches.match('./')) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  const destination=request.destination;
  const isStatic=['script','style','image','font','manifest'].includes(destination) || /\.(?:js|css|png|svg|webp|woff2?|json|webmanifest)$/i.test(url.pathname);
  if(!isStatic) return;

  event.respondWith((async()=>{
    const cache=await caches.open(RUNTIME_CACHE);
    const cached=await cache.match(request);
    const network=fetch(request).then(response=>{
      if(response.ok) cache.put(request,response.clone()).catch(()=>{});
      return response;
    }).catch(()=>null);
    return cached || (await network) || Response.error();
  })());
});
