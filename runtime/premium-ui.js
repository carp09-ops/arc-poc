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
    const gauge=document.querySelector('.focus-gauge');
    const svg=gauge?.querySelector('svg');
    if(!gauge||!svg)return;
    const foundation=svg.querySelector('.gauge-foundation');
    const flex=svg.querySelector('.gauge-flex');
    const track=svg.querySelector('.gauge-track');
    const foundationPct=Math.max(0,Math.min(100,parseFloat(gauge.style.getPropertyValue('--foundation'))||80));
    const flexPct=Math.max(0,100-foundationPct);

    if(svg.dataset.premium!=='1'){
      svg.dataset.premium='1';
      const defs=document.createElementNS(NS,'defs');
      defs.innerHTML=`
        <linearGradient id="arcPremiumFoundationGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#2d6a52"/><stop offset=".52" stop-color="#4f9273"/><stop offset="1" stop-color="#79ad90"/>
        </linearGradient>
        <linearGradient id="arcPremiumFlexGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8da4a2"/><stop offset="1" stop-color="#becbc7"/>
        </linearGradient>`;
      svg.insertBefore(defs,svg.firstChild);
    }

    // A rising, continuous trajectory is the signature Arc. It intentionally avoids a speedometer shape.
    // Keep the SVG itself compositing-simple for iPhone WebKit; depth comes from the surrounding surface.
    const shape='M24 139 C76 158 88 71 145 64 C202 57 221 88 244 63 C258 48 270 36 296 35';
    [track,foundation,flex].forEach(path=>{if(path){path.setAttribute('d',shape);path.setAttribute('pathLength','100');path.removeAttribute('filter')}});
    if(track){track.setAttribute('stroke','#dfe3dc')}
    if(foundation){
      foundation.setAttribute('stroke','url(#arcPremiumFoundationGradient)');
      foundation.setAttribute('stroke-dasharray',`${Math.max(0,foundationPct-1)} ${Math.min(100,101-foundationPct)}`);
      foundation.removeAttribute('stroke-dashoffset');
    }
    if(flex){
      flex.setAttribute('stroke','url(#arcPremiumFlexGradient)');
      flex.setAttribute('stroke-dasharray',`${Math.max(0,flexPct-1)} ${Math.min(100,foundationPct+1)}`);
      flex.setAttribute('stroke-dashoffset',`-${Math.min(100,foundationPct+1)}`);
    }
    svg.setAttribute('aria-label',`Your Arc: ${Math.round(foundationPct)} percent Foundation and ${Math.round(flexPct)} percent Flex`);
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
        <path d="M89 114c20 5 42 5 62 0M91 161c19 6 39 6 58 0M92 248c18 7 38 7 56 0M88 292c21 8 43 8 64 0" fill="none" opacity=".28"/>
        <path d="M101 357c8 4 15 5 23 5M116 362c8 0 15-1 23-5M84 431c8 4 15 5 22 4M134 435c7 1 14 0 22-4" fill="none" opacity=".22"/>
        <path d="M120 96v136" fill="none" opacity=".12"/>
      </g>`;
  }

  function enhance(){
    document.documentElement.classList.add('arc-premium-ui');
    enhanceGauge();
    enhanceBody();
  }
  function scheduleEnhance(){requestAnimationFrame(()=>{enhance();requestAnimationFrame(enhance)});}

  preload();
  window.__arcPremiumEnhance=enhance;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnhance,{once:true});
  else scheduleEnhance();
  window.addEventListener('arc:rendered',scheduleEnhance);
  window.addEventListener('arc:auth-rendered',scheduleEnhance);
  window.addEventListener('arc:boot-complete',scheduleEnhance);
})();
