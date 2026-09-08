// Arc 0.5.3 — brand runtime
(function(){
  const splash=()=>{
    if(sessionStorage.getItem('arcBrandSplash'))return;
    sessionStorage.setItem('arcBrandSplash','1');
    const el=document.createElement('div');el.className='arc-brand-splash';el.innerHTML='<img src="assets/arc-brand-wordmark.webp" alt="Arc — Progress has a shape">';document.body.appendChild(el);setTimeout(()=>el.remove(),2200);
  };
  function brandChrome(){
    document.querySelectorAll('.arc-logo').forEach(x=>{if(!x.dataset.brand)x.dataset.brand='053'});
    document.querySelectorAll('.intro-brand').forEach(x=>x.classList.add('arc-brand-integrated'));
  }
  const oldRender=window.render;
  if(oldRender)window.render=function(){oldRender();brandChrome()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{brandChrome();splash()});else{brandChrome();splash()}
})();