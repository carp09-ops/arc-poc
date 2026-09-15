/* Arc visual v8 — explicit DOM corona layer.
   Avoids pseudo-element/mask/SVG rendering differences on iOS Safari/PWA. */

const SRC='./assets/fiery_asymmetric_solar_eclipse.png?v=ready23';

function ensureCorona(gauge){
  if(!gauge || gauge.querySelector(':scope > .arc-photo-corona')) return;
  const img=document.createElement('img');
  img.className='arc-photo-corona';
  img.src=SRC;
  img.alt='';
  img.setAttribute('aria-hidden','true');
  img.decoding='async';
  img.draggable=false;
  const inner=gauge.querySelector(':scope > .arc-gauge-inner');
  if(inner) gauge.insertBefore(img,inner);
  else gauge.prepend(img);
}

function enhanceAll(){
  document.querySelectorAll('.arc-gauge').forEach(ensureCorona);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',enhanceAll,{once:true});
}else{
  enhanceAll();
}

const observer=new MutationObserver(enhanceAll);
observer.observe(document.documentElement,{childList:true,subtree:true});
