// ARC locked-reference finalizer.
// Presentation only: converts the approved embedded Body artwork into a real <img>
// so iOS/WebKit decodes and paints it reliably. No state writes. No observers.
(function(){
  if(window.__ARC_SIGNATURE_FIXES)return;
  window.__ARC_SIGNATURE_FIXES=true;

  function walkRules(rules,visit){
    for(const rule of Array.from(rules||[])){
      try{visit(rule)}catch(e){}
      try{if(rule.cssRules)walkRules(rule.cssRules,visit)}catch(e){}
    }
  }

  function approvedBodyDataUrl(){
    if(window.__arcApprovedBodyDataUrl)return window.__arcApprovedBodyDataUrl;
    let found='';
    for(const sheet of Array.from(document.styleSheets||[])){
      try{
        walkRules(sheet.cssRules,rule=>{
          if(found||!rule.selectorText||!rule.style)return;
          if(!rule.selectorText.includes('.focus-body-map:before'))return;
          const bg=rule.style.backgroundImage||'';
          const match=bg.match(/url\(["']?(data:image\/webp;base64,[^)"']+)["']?\)/i);
          if(match?.[1])found=match[1];
        });
      }catch(e){}
      if(found)break;
    }
    if(found)window.__arcApprovedBodyDataUrl=found;
    return found;
  }

  function mountBodyArtwork(){
    const map=document.querySelector('.focus-body-map[data-signature-body="locked"],.focus-body-map');
    if(!map)return;
    map.dataset.signatureBody='locked';
    map.setAttribute('role','img');
    map.setAttribute('aria-label','Body measurement map: neck, shoulders, chest, arms, waist, hips, thighs and calves');

    let img=map.querySelector('.arc-body-locked-img');
    if(!img){
      const src=approvedBodyDataUrl();
      if(!src){map.dataset.bodyImageReady='missing';return;}
      img=document.createElement('img');
      img.className='arc-body-locked-img';
      img.alt='';
      img.decoding='async';
      img.loading='eager';
      img.src=src;
      img.addEventListener('load',()=>{map.dataset.bodyImageReady=img.naturalWidth>0?'1':'0'},{once:true});
      img.addEventListener('error',()=>{map.dataset.bodyImageReady='0'},{once:true});
      map.prepend(img);
    }
    if(img.complete)map.dataset.bodyImageReady=img.naturalWidth>0?'1':'0';
  }

  function normalizeSignatureLayout(){
    const hero=document.querySelector('.arc-insights-hero');
    const visual=hero?.querySelector('.arc-insights-visual');
    const eclipse=visual?.querySelector('.arc-eclipse-lock');
    if(hero&&visual&&eclipse){
      hero.dataset.signatureLayout='locked';
      visual.dataset.signatureLayout='flow';
    }
    mountBodyArtwork();
  }

  function schedule(){
    try{normalizeSignatureLayout()}catch(e){console.warn('ARC locked visual finalizer skipped',e)}
    requestAnimationFrame(()=>{try{normalizeSignatureLayout()}catch(e){}});
    setTimeout(()=>{try{normalizeSignatureLayout()}catch(e){}},40);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('arc:rendered',schedule);
  window.addEventListener('arc:auth-rendered',schedule);
  window.addEventListener('arc:boot-complete',schedule);
  window.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-focus-go],[data-arc-period],[data-focus-body-tab]'))schedule();
  },true);
  window.__arcSignatureFixesApply=normalizeSignatureLayout;
})();
