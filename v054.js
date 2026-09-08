// Arc 0.5.4 — transparent brand runtime
(function(){
  function upgradeBrand(){
    document.querySelectorAll('.arc-brand-splash img').forEach(img=>{
      img.src='assets/arc-lockup-horizontal-transparent.svg';
      img.alt='Arc — Progress Has a Shape';
    });
    document.querySelectorAll('img[src*="arc-brand-wordmark"],img[src*="arc-brand-hero"],img[src*="arc-brand-mark"]').forEach(img=>{
      img.src=img.src.includes('wordmark')||img.src.includes('hero')?'assets/arc-lockup-horizontal-transparent.svg':'assets/arc-monogram-transparent.svg';
    });
  }
  const obs=new MutationObserver(upgradeBrand);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{upgradeBrand();obs.observe(document.body,{subtree:true,childList:true})});
  else{upgradeBrand();obs.observe(document.body,{subtree:true,childList:true})}
})();