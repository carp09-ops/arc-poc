// ARC Premium UX — visual refinements only. Never mutates user state.
(function(){
  if(window.__ARC_PREMIUM_UI)return;
  window.__ARC_PREMIUM_UI=true;
  const NS='http://www.w3.org/2000/svg';
  const IMAGES=[
    'https://images.unsplash.com/photo-1782849206110-4a47f5acb1f0?auto=format&fit=crop&w=1400&q=88',
    'https://images.unsplash.com/photo-1639653818737-7e884dc84954?auto=format&fit=crop&w=1400&q=88',
    'https://images.unsplash.com/photo-1622637103261-ae624e188bd0?auto=format&fit=crop&w=1400&q=88',
    'https://images.unsplash.com/photo-1676666372076-8159112de234?auto=format&fit=crop&w=1400&q=88'
  ];

  function preload(){
    IMAGES.forEach(src=>{try{const img=new Image();img.decoding='async';img.referrerPolicy='no-referrer';img.src=src}catch(e){}});
  }

  function enhanceGauge(){
    const svg=document.querySelector('.focus-gauge svg');
    if(!svg||svg.dataset.premium==='1')return;
    svg.dataset.premium='1';
    const defs=document.createElementNS(NS,'defs');
    defs.innerHTML=`
      <linearGradient id="arcPremiumFoundationGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#2f6d55"/><stop offset=".48" stop-color="#4f9273"/><stop offset="1" stop-color="#79ad90"/>
      </linearGradient>
      <linearGradient id="arcPremiumFlexGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#83999a"/><stop offset="1" stop-color="#b4c2bf"/>
      </linearGradient>
      <filter id="arcPremiumGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.insertBefore(defs,svg.firstChild);
    const foundation=svg.querySelector('.gauge-foundation');
    const flex=svg.querySelector('.gauge-flex');
    if(foundation){foundation.setAttribute('stroke','url(#arcPremiumFoundationGradient)');foundation.setAttribute('filter','url(#arcPremiumGlow)')}
    if(flex)flex.setAttribute('stroke','url(#arcPremiumFlexGradient)');
  }

  function enhanceBody(){
    const svg=document.querySelector('.focus-body-map svg');
    if(!svg||svg.dataset.premium==='1')return;
    svg.dataset.premium='1';
    svg.setAttribute('viewBox','0 0 240 500');
    svg.innerHTML=`
      <defs>
        <linearGradient id="arcBodyFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e9ded0"/><stop offset=".46" stop-color="#d4c4b2"/><stop offset="1" stop-color="#b9cdbf"/>
        </linearGradient>
        <linearGradient id="arcBodyEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#648270"/><stop offset="1" stop-color="#365e4c"/>
        </linearGradient>
        <filter id="arcBodyShadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#2a493b" flood-opacity=".10"/>
        </filter>
      </defs>
      <g filter="url(#arcBodyShadow)" stroke="url(#arcBodyEdge)" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="120" cy="43" rx="22.5" ry="26" fill="url(#arcBodyFill)"/>
        <path d="M108 69c-1 7-5 10-13 14-16 8-23 23-25 43l-10 84c-2 17 12 22 18 7l14-65 2 88c1 22-4 40-8 64-4 24-4 51-5 78l-3 78c-1 20 16 25 22 6l17-139h6l17 139c6 19 23 14 22-6l-3-78c-1-27-1-54-5-78-4-24-9-42-8-64l2-88 14 65c6 15 20 10 18-7l-10-84c-2-20-9-35-25-43-8-4-12-7-13-14-7 5-17 8-24 8s-17-3-24-8Z" fill="url(#arcBodyFill)"/>
        <path d="M95 84c7 8 16 12 25 12s18-4 25-12" fill="none" opacity=".55"/>
        <path d="M120 96v136M100 145c13 5 27 5 40 0M96 225c15 8 33 8 48 0M86 303c9 7 19 10 31 10M123 313c12 0 22-3 31-10" fill="none" opacity=".18"/>
        <path d="M82 462c7 5 14 7 21 4M137 466c7 3 14 1 21-4" fill="none" opacity=".35"/>
      </g>`;
  }

  function enhance(){
    document.documentElement.classList.add('arc-premium-ui');
    enhanceGauge();
    enhanceBody();
  }
  function scheduleEnhance(){
    requestAnimationFrame(()=>{enhance();requestAnimationFrame(enhance)});
  }

  preload();
  window.__arcPremiumEnhance=enhance;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnhance,{once:true});
  else scheduleEnhance();
  // Stable runtime dispatches lifecycle events on window, not document.
  window.addEventListener('arc:rendered',scheduleEnhance);
  window.addEventListener('arc:auth-rendered',scheduleEnhance);
  window.addEventListener('arc:boot-complete',scheduleEnhance);
})();
