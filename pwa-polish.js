const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;

document.body.classList.toggle('arc-ios',isIOS);
document.body.classList.toggle('arc-standalone',isStandalone);

function syncViewport(){
  const vv=window.visualViewport;
  const height=vv?.height||window.innerHeight;
  document.documentElement.style.setProperty('--arc-vvh',`${Math.round(height)}px`);
  const keyboardOpen=isIOS && window.innerHeight-height>140;
  document.body.classList.toggle('arc-keyboard-open',keyboardOpen);
}
syncViewport();
window.visualViewport?.addEventListener('resize',syncViewport);
window.visualViewport?.addEventListener('scroll',syncViewport);
window.addEventListener('orientationchange',()=>setTimeout(syncViewport,120));

if(isIOS){
  document.addEventListener('focusin',event=>{
    const target=event.target;
    if(!(target instanceof HTMLElement)) return;
    if(!target.matches('input,select,textarea,[contenteditable="true"]')) return;
    setTimeout(()=>target.scrollIntoView({block:'center',behavior:'smooth'}),220);
  });
}

function ensureUpdateToast(){
  let toast=document.getElementById('arcUpdateToast');
  if(toast) return toast;
  toast=document.createElement('aside');
  toast.id='arcUpdateToast';
  toast.className='arc-update-toast';
  toast.setAttribute('role','status');
  toast.innerHTML='<div class="arc-update-toast-copy"><strong>Arc update ready</strong><small>Refresh once to use the newest version.</small></div><button type="button">Refresh</button>';
  document.body.appendChild(toast);
  return toast;
}

function offerUpdate(worker){
  if(!worker) return;
  const toast=ensureUpdateToast();
  toast.classList.add('show');
  toast.querySelector('button')?.addEventListener('click',()=>{
    toast.querySelector('button').disabled=true;
    worker.postMessage({type:'SKIP_WAITING'});
  },{once:true});
}

if('serviceWorker' in navigator && location.protocol==='https:'){
  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register('./service-worker.js?v=ready7',{updateViaCache:'none'});
      if(registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker?.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller) offerUpdate(worker);
        });
      });
      // PWA sessions can live for days; quietly check when returning to the app.
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible') registration.update().catch(()=>{});
      });
    }catch(error){
      console.warn('Arc service worker unavailable',error);
    }
  });

  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing) return;
    refreshing=true;
    window.location.reload();
  });
}

// Standalone launches should always land at a clean scroll position unless a workout is actively resumed by Arc.
window.addEventListener('pageshow',event=>{
  if(event.persisted) syncViewport();
});
