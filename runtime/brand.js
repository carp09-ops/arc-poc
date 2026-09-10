// ARC stable brand runtime — event driven, no document-wide MutationObserver.
(function(){
  const MARK='assets/arc-monogram-transparent.svg';
  const LOCKUP='assets/arc-lockup-horizontal-transparent.svg';
  const baseShell=window.shell;

  function brandify(){
    document.querySelectorAll('.arc-rail-brand').forEach(el=>{
      if(el.dataset.arcBrandStable==='1')return;
      el.dataset.arcBrandStable='1';
      el.innerHTML=`<img class="arc-rail-mark" src="${MARK}" alt=""><div><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div>`;
    });
    document.querySelectorAll('.tool-top').forEach(el=>{
      if(el.querySelector('.arc-tool-mark'))return;
      const img=document.createElement('img');img.className='arc-tool-mark';img.src=MARK;img.alt='';
      const back=el.querySelector(':scope > button');
      if(back&&back.nextSibling)el.insertBefore(img,back.nextSibling);else el.prepend(img);
    });
    const main=document.querySelector('.arc-app.with-chrome');
    const stage=main?.querySelector(':scope > .arc-stage');
    if(stage&&!stage.querySelector(':scope > .arc-mobile-brandline')){
      const line=document.createElement('div');line.className='arc-mobile-brandline';
      line.innerHTML=`<img src="${MARK}" alt=""><div><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div>`;
      stage.prepend(line);
    }
    document.querySelectorAll('img[src*="arc-brand-wordmark"],img[src*="arc-brand-hero"]').forEach(img=>{img.src=LOCKUP;});
    document.querySelectorAll('img[src*="arc-brand-mark"]').forEach(img=>{img.src=MARK;});
  }

  if(typeof baseShell==='function'){
    window.shell=function(){
      const out=baseShell.apply(this,arguments);
      if(!window.__ARC_BOOTSTRAPPING)brandify();
      return out;
    };
  }
  window.addEventListener('arc:rendered',brandify);
  window.addEventListener('arc:auth-rendered',brandify);
  if(!window.__ARC_BOOTSTRAPPING)brandify();
  window.ArcBrand={refresh:brandify};
})();