/* Arc Living v1 — inline SVG progress renderer.
   Uses the existing Arc gauge and state text. No photographic eclipse layers. */

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

function readProgress(gauge){
  const direct=parseFloat(gauge.style.getPropertyValue('--living-progress'));
  if(Number.isFinite(direct)) return clamp(direct,0,100);

  const fill=parseFloat(gauge.style.getPropertyValue('--arc-fill'));
  if(Number.isFinite(fill)) return clamp(fill,0,100);

  const angle=parseFloat(gauge.style.getPropertyValue('--progress'));
  if(Number.isFinite(angle)) return clamp(angle/3.6,0,100);

  return 0;
}

function ensureLivingArc(gauge,index){
  if(!gauge) return;

  gauge.querySelectorAll(':scope > .arc-photo-corona, :scope > .arc-eclipse-stage').forEach(node=>node.remove());

  let svg=gauge.querySelector(':scope > .arc-living-svg');
  if(!svg){
    const gradientId=`arcLivingGradient-${index}`;
    svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('arc-living-svg');
    svg.setAttribute('viewBox','0 0 320 235');
    svg.setAttribute('aria-hidden','true');
    svg.innerHTML=`
      <defs>
        <linearGradient id="${gradientId}" x1="30" y1="210" x2="290" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#d2a95f"/>
          <stop offset="52%" stop-color="#f1d69a"/>
          <stop offset="100%" stop-color="#fff1c9"/>
        </linearGradient>
      </defs>
      <path class="arc-living-track" pathLength="100" d="M34 204 C36 101 94 34 160 34 C226 34 284 101 286 204"/>
      <path class="arc-living-glow" pathLength="100" d="M34 204 C36 101 94 34 160 34 C226 34 284 101 286 204"/>
      <path class="arc-living-progress" pathLength="100" d="M34 204 C36 101 94 34 160 34 C226 34 284 101 286 204" style="stroke:url(#${gradientId})"/>
      <circle class="arc-living-marker-halo" cx="34" cy="204" r="11"/>
      <circle class="arc-living-marker" cx="34" cy="204" r="5.5"/>
    `;
    const inner=gauge.querySelector(':scope > .arc-gauge-inner');
    if(inner) gauge.insertBefore(svg,inner);
    else gauge.prepend(svg);
  }
  return svg;
}

function syncGauge(gauge,index){
  const svg=ensureLivingArc(gauge,index);
  if(!svg) return;

  const pct=readProgress(gauge);
  const progress=svg.querySelector('.arc-living-progress');
  const glow=svg.querySelector('.arc-living-glow');
  const path=progress;
  const marker=svg.querySelector('.arc-living-marker');
  const halo=svg.querySelector('.arc-living-marker-halo');

  const dash=`${pct} ${100-pct}`;
  progress.style.strokeDasharray=dash;
  glow.style.strokeDasharray=dash;

  try{
    const total=path.getTotalLength();
    const point=path.getPointAtLength(total*(pct/100));
    [marker,halo].forEach(node=>{
      node.setAttribute('cx',point.x.toFixed(2));
      node.setAttribute('cy',point.y.toFixed(2));
    });
  }catch(_){/* SVG geometry is best-effort only. */}

  const complete=pct>=99.5;
  gauge.classList.toggle('is-living-complete',complete);
  halo.style.opacity=pct<=0?'.34':'1';
  marker.style.opacity=pct<=0?'.75':'1';
}

let frame=0;
function syncAll(){
  if(frame) return;
  frame=requestAnimationFrame(()=>{
    frame=0;
    document.querySelectorAll('.arc-gauge').forEach((gauge,index)=>syncGauge(gauge,index));
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',syncAll,{once:true});
else syncAll();

new MutationObserver(syncAll).observe(document.documentElement,{
  subtree:true,
  childList:true,
  characterData:true,
  attributes:true,
  attributeFilter:['style','class']
});

window.addEventListener('pageshow',syncAll);
window.ArcLiving={sync:syncAll};
