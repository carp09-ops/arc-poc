// ARC Signature Visuals — locked to the approved eclipse + body-map mockups.
// Presentation only. Reads rendered values, never mutates ARC state.
(function(){
  if(window.__ARC_SIGNATURE_VISUALS)return;
  window.__ARC_SIGNATURE_VISUALS=true;

  const clamp=n=>Math.max(0,Math.min(100,Number(n)||0));

  function pointForPercent(percent,r=136,c=170){
    const a=(-90+(360*clamp(percent)/100))*Math.PI/180;
    return {x:c+r*Math.cos(a),y:c+r*Math.sin(a)};
  }

  function readArcPercents(scope){
    const visual=scope?.querySelector?.('.arc-insights-visual');
    if(visual){
      const fr=clamp(parseFloat(visual.style.getPropertyValue('--arc-foundation'))||80);
      return {fr,xr:100-fr};
    }
    const root=scope?.closest?.('.focus-arc')||scope;
    const labels=[...root?.querySelectorAll?.('.focus-gauge-labels b')||[]].map(x=>parseFloat(x.textContent));
    const fr=clamp(Number.isFinite(labels[0])?labels[0]:80);
    return {fr,xr:100-fr};
  }

  function eclipseSvg(fr){
    const end=pointForPercent(fr),guide=pointForPercent(80);
    return `<svg class="arc-eclipse-svg" viewBox="0 0 340 340" aria-hidden="true">
      <defs>
        <filter id="arcEclipseGlow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="arcEclipseCore" cx="50%" cy="44%" r="62%">
          <stop offset="0" stop-color="#1a2520"/><stop offset=".67" stop-color="#111a16"/><stop offset="1" stop-color="#09110e"/>
        </radialGradient>
      </defs>
      <circle class="arc-eclipse-outer-guide" cx="170" cy="170" r="154"/>
      <circle class="arc-eclipse-corona-soft" cx="170" cy="170" r="139"/>
      <circle class="arc-eclipse-ring-base" cx="170" cy="170" r="136" pathLength="100"/>
      <circle class="arc-eclipse-foundation" cx="170" cy="170" r="136" pathLength="100" stroke-dasharray="${fr} ${100-fr}"/>
      <circle class="arc-eclipse-flex" cx="170" cy="170" r="136" pathLength="100" stroke-dasharray="${100-fr} ${fr}" stroke-dashoffset="-${fr}"/>
      <circle class="arc-eclipse-core-disc" cx="170" cy="170" r="122" fill="url(#arcEclipseCore)"/>
      <circle class="arc-eclipse-guide-marker" cx="${guide.x.toFixed(2)}" cy="${guide.y.toFixed(2)}" r="4.3"/>
      <circle class="arc-eclipse-live-marker" cx="${end.x.toFixed(2)}" cy="${end.y.toFixed(2)}" r="6.7" filter="url(#arcEclipseGlow)"/>
    </svg>`;
  }

  function eclipseMarkup(fr,xr,compact=false){
    const f=Math.round(fr),x=Math.round(xr);
    return `<div class="arc-eclipse-lock ${compact?'compact':''}" data-signature-eclipse="1">
      ${compact?'':'<div class="arc-eclipse-eyebrow"><i></i><span>A HEALTHIER YOU</span></div>'}
      <div class="arc-eclipse-stage">
        ${compact?'':`<aside class="arc-eclipse-callout foundation"><span>FOUNDATION</span><b>${f}%</b><small>BUILD TODAY<br>A BRIGHTER YOU</small></aside>`}
        <div class="arc-eclipse-orb">
          ${eclipseSvg(fr)}
          <div class="arc-eclipse-center"><h3>Your Arc</h3><strong>${f}%</strong><span>FOUNDATION</span><i></i><small>CONSISTENT STEPS<br>BRIGHTER DAYS</small></div>
        </div>
        ${compact?'':`<aside class="arc-eclipse-callout flex"><span>FLEX</span><b>${x}%</b><small>BALANCE<br>KEEPS<br>YOU GOING</small></aside>`}
      </div>
      ${compact?'':`<div class="arc-eclipse-lower"><i></i><span>A BRIGHTER TOMORROW</span></div><div class="arc-eclipse-tagline">SMALL STEPS. A BRIGHTER YOU.<i></i></div>`}
    </div>`;
  }

  function lockTodayArc(){
    const hero=document.querySelector('.focus-today .arc-insights-hero');
    if(!hero)return;
    const {fr,xr}=readArcPercents(hero);
    const visual=hero.querySelector('.arc-insights-visual');
    if(visual&&!visual.querySelector('[data-signature-eclipse]'))visual.innerHTML=eclipseMarkup(fr,xr,false);
    hero.dataset.signatureVisual='eclipse';
  }

  function lockArcDetail(){
    const gauge=document.querySelector('.focus-arc .focus-gauge');
    if(!gauge)return;
    const {fr,xr}=readArcPercents(gauge);
    if(!gauge.querySelector('[data-signature-eclipse]'))gauge.innerHTML=eclipseMarkup(fr,xr,true);
    gauge.dataset.signatureVisual='eclipse';
  }

  function lockBody(){
    const map=document.querySelector('.focus-body-map');
    if(!map)return;
    map.dataset.signatureBody='locked';
    document.querySelector('.focus-body-visual')?.setAttribute('data-signature-body','locked');
  }

  function apply(){
    document.documentElement.classList.add('arc-signature-locked');
    lockTodayArc();
    lockArcDetail();
    lockBody();
  }
  function schedule(){
    try{apply()}catch(e){console.warn('ARC signature visual skipped',e)}
    requestAnimationFrame(()=>{try{apply()}catch(e){}});
    setTimeout(()=>{try{apply()}catch(e){}},0);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('arc:rendered',schedule);
  window.addEventListener('arc:auth-rendered',schedule);
  window.addEventListener('arc:boot-complete',schedule);
  window.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-focus-go],[data-arc-period],[data-focus-body-tab]'))schedule();
  },true);
  window.__arcSignatureVisualsApply=apply;
})();
