/* Radiant Horizon — renders Arc's existing visual progress as a reliable horizontal light line. */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.setAttribute('content','#0B1A2B');
function readProgress(g){const fill=parseFloat(g.style.getPropertyValue('--arc-fill'));if(Number.isFinite(fill))return clamp(fill,0,100);const angle=parseFloat(g.style.getPropertyValue('--progress'));if(Number.isFinite(angle))return clamp(angle/3,0,100);return 0}
// The gauge center now reads "82%" (strong) over the stage label (span):
// derive the stage name from the span, not the percentage.
function stateCopy(g,pct){const strong=g.querySelector('.arc-gauge-inner strong');const span=g.querySelector('.arc-gauge-inner span');const rawPct=(strong?.textContent||'').trim();const rawStage=(span?.textContent||'').trim();let stage=rawStage||'Build momentum';if(/build/i.test(stage))stage='Building momentum';if(/closing/i.test(stage))stage='Closing the Arc';if(/in your arc/i.test(stage))stage='In Your Arc';if(/learning/i.test(stage)&&pct<100)stage='Learning';return{stage,meta:rawPct}}
function ensure(g){let r=g.querySelector(':scope > .arc-radiant');if(!r){r=document.createElement('div');r.className='arc-radiant';r.setAttribute('aria-hidden','true');r.innerHTML='<div class="arc-radiant-line"><div class="arc-radiant-track"></div><div class="arc-radiant-fill"></div><div class="arc-radiant-marker"></div></div><div class="arc-radiant-status"><div class="arc-radiant-pct">0%</div><div class="arc-radiant-stage">Learning</div></div><div class="arc-radiant-caption"></div>';g.prepend(r)}return r}
function sync(g){const pct=readProgress(g),r=ensure(g),copy=stateCopy(g,pct);g.style.setProperty('--horizon-progress',`${pct}%`);g.setAttribute('role','img');g.setAttribute('aria-label',`${Math.round(pct)} percent Arc progress. ${copy.stage}.`);r.querySelector('.arc-radiant-pct').textContent=`${Math.round(pct)}%`;r.querySelector('.arc-radiant-stage').textContent=copy.stage;const caption=r.querySelector('.arc-radiant-caption');caption.textContent='Progress has a shape.'}
let raf=0;function syncAll(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;document.querySelectorAll('.arc-gauge').forEach(sync)})}
// Scoped observation: one attribute observer per gauge (style/class changes
// only) plus a childList watch for gauges added later. The previous
// document-wide observer fired on every DOM mutation on the page.
const observedGauges=new WeakSet();
function watchGauge(g){if(observedGauges.has(g))return;observedGauges.add(g);new MutationObserver(syncAll).observe(g,{attributes:true,attributeFilter:['style','class']})}
function scanGauges(){document.querySelectorAll('.arc-gauge').forEach(g=>{watchGauge(g)});syncAll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scanGauges,{once:true});else scanGauges();
new MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes){if(!(n instanceof Element))continue;if(n.matches('.arc-gauge'))watchGauge(n);n.querySelectorAll?.('.arc-gauge').forEach(watchGauge)}}}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',scanGauges);window.ArcRadiant={sync:syncAll};
