// Arc POC 0.5.3 — approved 3D monogram brand integration.
(function(){
  if(typeof S==='undefined') return;
  const MARK='assets/arc-brand-mark.webp';
  const ICON='assets/arc-app-icon.webp';
  const baseShell=window.shell||shell;

  function brandify(){
    document.querySelectorAll('.arc-rail-brand').forEach(el=>{
      if(el.dataset.arcBrand053) return;
      el.dataset.arcBrand053='1';
      el.innerHTML=`<img class="arc-rail-mark" src="${MARK}" alt=""><div><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div>`;
    });

    document.querySelectorAll('.tool-top').forEach(el=>{
      if(el.querySelector('.arc-tool-mark')) return;
      const img=document.createElement('img');
      img.className='arc-tool-mark';
      img.src=MARK;
      img.alt='';
      const back=el.querySelector(':scope > button');
      if(back && back.nextSibling) el.insertBefore(img,back.nextSibling); else el.prepend(img);
    });

    const main=document.querySelector('.arc-app.with-chrome');
    const stage=main?.querySelector(':scope > .arc-stage');
    if(stage && !stage.querySelector(':scope > .arc-mobile-brandline')){
      const line=document.createElement('div');
      line.className='arc-mobile-brandline';
      line.innerHTML=`<img src="${MARK}" alt=""><div><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div>`;
      stage.prepend(line);
    }
  }

  shell=function(body,tab){
    baseShell(body,tab);
    brandify();
  };

  function showBrandSplash(){
    let shown=false;
    try{shown=sessionStorage.getItem('arcBrandSplash053')==='1'}catch(e){}
    if(shown) return;
    try{sessionStorage.setItem('arcBrandSplash053','1')}catch(e){}
    const splash=document.createElement('div');
    splash.className='arc-brand-splash';
    splash.innerHTML=`<div class="arc-splash-glow"></div><img src="${ICON}" alt="Arc"><div class="arc-splash-word"><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div>`;
    document.body.appendChild(splash);
    requestAnimationFrame(()=>splash.classList.add('show'));
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(()=>splash.classList.add('hide'),reduced?250:850);
    setTimeout(()=>splash.remove(),reduced?450:1250);
  }

  brandify();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',showBrandSplash,{once:true});
  else showBrandSplash();
})();
