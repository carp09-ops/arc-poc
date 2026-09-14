const CACHE_VERSION='arc-ready11';
const SHELL_CACHE=`${CACHE_VERSION}-shell`;
const RUNTIME_CACHE=`${CACHE_VERSION}-runtime`;

// Keep the complete first-party Arc shell available after the PWA has installed.
// Version query strings are intentionally omitted here; fetch matching below uses
// ignoreSearch so versioned resources remain available when the device is offline.
const PRECACHE=[
  './',
  './index.html',
  './manifest.webmanifest',
  './styles.css',
  './app.js',
  './core-roundout.css',
  './eclipse-arc.css',
  './eclipse-arc-motion.css',
  './arc-eclipse-v4.css',
  './training-roundout.css',
  './nutrition-plumbing.css',
  './readiness-sprint.css',
  './qa-enhancements.css',
  './starting-point.css',
  './arc-motion-bootstrap.css',
  './arc-icons.css',
  './arc-icon-details.css',
  './pwa-polish.css',
  './what-arc-sees.css',
  './privacy-controls.css',
  './startup-loading.js',
  './arc-motion-bootstrap.js',
  './readiness-sprint.js',
  './auth-hardening.js',
  './core-app.js',
  './edge-workouts.js',
  './qa-enhancements.js',
  './starting-point.js',
  './arc-roundout.js',
  './body-analytics.js',
  './training-roundout.js',
  './nutrition-plumbing.js',
  './arc-icons.js',
  './arc-icon-details.js',
  './pwa-polish.js',
  './what-arc-sees.js',
  './privacy-controls.js',
  './assets/arc-icon-180.png',
  './assets/arc-icon-192.png',
  './assets/arc-icon-512.png',
  './assets/arc-icon-maskable.svg',
  './assets/arc-eclipse-v4.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    // Cache entries individually so one transient failure does not invalidate
    // the entire offline shell.
    await Promise.allSettled(PRECACHE.map(url=>cache.add(url)));
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith('arc-')&&!key.startsWith(CACHE_VERSION))
        .map(key=>caches.delete(key))
    );
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
        if(fresh.ok){
          const cache=await caches.open(SHELL_CACHE);
          cache.put('./',fresh.clone()).catch(()=>{});
          cache.put('./index.html',fresh.clone()).catch(()=>{});
        }
        return fresh;
      }catch(_){
        return (await caches.match('./',{ignoreSearch:true})) ||
          (await caches.match('./index.html',{ignoreSearch:true})) ||
          Response.error();
      }
    })());
    return;
  }

  const destination=request.destination;
  const isStatic=['script','style','image','font','manifest'].includes(destination) ||
    /\.(?:js|css|png|svg|webp|woff2?|json|webmanifest)$/i.test(url.pathname);
  if(!isStatic) return;

  event.respondWith((async()=>{
    const runtime=await caches.open(RUNTIME_CACHE);
    const exact=await runtime.match(request);
    const shell=await caches.match(request,{ignoreSearch:true});
    const isBootstrap=/\/(?:app\.js|styles\.css|manifest\.webmanifest)$/i.test(url.pathname);

    if(isBootstrap){
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        if(fresh.ok) runtime.put(request,fresh.clone()).catch(()=>{});
        return fresh;
      }catch(_){
        return exact || shell || Response.error();
      }
    }

    const network=fetch(request).then(response=>{
      if(response.ok) runtime.put(request,response.clone()).catch(()=>{});
      return response;
    }).catch(()=>null);

    // Versioned local resources can fall back to their precached unversioned
    // equivalent. This is what makes a cold standalone launch resilient offline.
    return exact || shell || (await network) || Response.error();
  })());
});
