// ARC stable final bootstrap — one final product render, then release the boot screen.
(function(){
  const boot=document.getElementById('arc-boot');
  const status=document.getElementById('arc-boot-status');
  let finished=false;
  function text(v){if(status)status.textContent=v}
  function release(reason='ready'){
    if(finished)return;finished=true;
    try{document.documentElement.classList.add('arc-runtime-ready')}catch(e){}
    if(boot){boot.dataset.reason=reason;boot.classList.add('hide');setTimeout(()=>boot.remove(),300)}
  }
  function fatal(err){
    console.error('ARC bootstrap',err);
    try{window.__ARC_BOOTSTRAPPING=false;if(typeof render==='function')render()}catch(e){console.error('ARC fallback render',e)}
    const hasApp=!!document.querySelector('#app>*');
    if(hasApp){release('fallback-render');return}
    text('ARC hit a startup problem. Your saved data was not cleared.');
    if(boot){const inner=boot.querySelector('.arc-boot-inner');if(inner&&!inner.querySelector('[data-arc-boot-retry]')){const b=document.createElement('button');b.type='button';b.setAttribute('data-arc-boot-retry','');b.textContent='Retry ARC';b.style.cssText='margin-top:16px;border:1px solid #80663d;background:#17130e;color:#e7c182;border-radius:12px;padding:11px 16px;font-weight:700';inner.appendChild(b)}}
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-arc-boot-retry]'))location.reload()});
  window.addEventListener('error',e=>{if(!finished)console.error('ARC startup error',e.error||e.message)});
  window.addEventListener('unhandledrejection',e=>{if(!finished)console.error('ARC startup rejection',e.reason)});
  setTimeout(()=>{if(!finished){const hasApp=!!document.querySelector('#app>*');if(hasApp)release('watchdog');else fatal(new Error('startup watchdog'))}},8000);
  try{
    text('Building your Arc…');
    if(typeof window.__arcFinishBootstrap!=='function')throw new Error('runtime gate unavailable');
    window.__arcFinishBootstrap();
    if(!document.querySelector('#app>*'))throw new Error('final render produced no app DOM');
    requestAnimationFrame(()=>requestAnimationFrame(()=>release('ready')));
  }catch(e){fatal(e)}
})();