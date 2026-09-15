const BUILD='ready25';
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;

function syncDisplayMode(){
  const standalone=isStandalone();
  document.body.classList.toggle('arc-ios',isIOS);
  document.body.classList.toggle('arc-standalone',standalone);
  document.documentElement.dataset.arcDisplayMode=standalone?'standalone':'browser';
}
syncDisplayMode();
window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',syncDisplayMode);

function syncViewport(){
  const vv=window.visualViewport;
  const height=vv?.height||window.innerHeight;
  document.documentElement.style.setProperty('--arc-vvh',`${Math.round(height)}px`);
  const keyboardOpen=isIOS && !!vv && window.innerHeight-height>140;
  document.body.classList.toggle('arc-keyboard-open',keyboardOpen);
}
syncViewport();
window.visualViewport?.addEventListener('resize',syncViewport);
window.visualViewport?.addEventListener('scroll',syncViewport);
window.addEventListener('resize',syncViewport,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(syncViewport,140));

if(isIOS){
  document.addEventListener('focusin',event=>{
    const target=event.target;
    if(!(target instanceof HTMLElement)) return;
    if(!target.matches('input,select,textarea,[contenteditable="true"]')) return;
    document.body.classList.add('arc-field-focused');
    setTimeout(()=>target.scrollIntoView({block:'center',behavior:'smooth'}),220);
  });
  document.addEventListener('focusout',()=>{
    setTimeout(()=>document.body.classList.remove('arc-field-focused'),120);
  });
}

function ensureUpdateToast(){
  let toast=document.getElementById('arcUpdateToast');
  if(toast) return toast;
  toast=document.createElement('aside');
  toast.id='arcUpdateToast';
  toast.className='arc-update-toast';
  toast.setAttribute('role','status');
  toast.setAttribute('aria-live','polite');
  toast.innerHTML='<div class="arc-update-toast-copy"><strong>Arc update ready</strong><small>Your workout data is safe. Refresh once to use the newest version.</small></div><button type="button">Refresh</button>';
  document.body.appendChild(toast);
  return toast;
}

function offerUpdate(worker){
  if(!worker) return;
  const toast=ensureUpdateToast();
  toast.classList.add('show');
  const button=toast.querySelector('button');
  if(!button||button.dataset.bound==='1') return;
  button.dataset.bound='1';
  button.addEventListener('click',()=>{
    button.disabled=true;
    button.textContent='Refreshing…';
    worker.postMessage({type:'SKIP_WAITING'});
  });
}

if('serviceWorker' in navigator && location.protocol==='https:'){
  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register(`./service-worker.js?v=${BUILD}`,{updateViaCache:'none'});
      if(registration.waiting&&navigator.serviceWorker.controller) offerUpdate(registration.waiting);

      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker?.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller) offerUpdate(worker);
        });
      });

      const checkForUpdate=()=>registration.update().catch(()=>{});
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible') checkForUpdate();
      });
      window.addEventListener('pageshow',()=>{
        if(document.visibilityState==='visible') checkForUpdate();
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

window.addEventListener('pageshow',event=>{
  syncDisplayMode();
  syncViewport();
  if(event.persisted) document.body.classList.remove('arc-keyboard-open','arc-field-focused');
});
