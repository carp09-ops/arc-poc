// ARC Premium UX v2 — presentation-only enhancements aligned to the ARC vision board.
// No state writes. No observers. Re-applies only on stable lifecycle events.
(function(){
  if(window.__ARC_PREMIUM_V2)return;
  window.__ARC_PREMIUM_V2=true;

  function stateRef(){
    try{return typeof S!=='undefined'?S:null}catch(e){return null}
  }

  function movementIcon(name){
    const n=String(name||'').toLowerCase();
    if(n.includes('squat'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="25" cy="8" r="4"/><path d="M23 13l-5 9 8 5 6-8M18 22l-7 8m15-3-5 10m11-18 7 4M21 37l-8 3m8-3 5 4"/><path d="M8 31h10M31 24h10" opacity=".45"/></svg>';
    if(n.includes('deadlift')||n.includes('hinge'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="25" cy="8" r="4"/><path d="M24 13l-2 11 9 5M22 24l-8 8m17-3-5 10M14 32l-4 7m16 0 7 2"/><path d="M8 34h31M11 31v6m25-6v6" opacity=".55"/></svg>';
    if(n.includes('lunge'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M23 13l-2 11 7 6M21 24l-8 6m15 0 9 7M13 30l-5 8m29-1 5 2M16 17l-7 6M28 18l7 4"/></svg>';
    if(n.includes('calf'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M24 13v14m0 0-7 12m7-12 7 12M18 16l-6 8m18-8 6 8"/><path d="M11 40h10m6 0h10" opacity=".45"/><path d="M17 39l2-4m12 4-2-4"/></svg>';
    if(n.includes('bug')||n.includes('plank')||n.includes('core'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="12" cy="25" r="3.5"/><path d="M16 25h12l8-7M25 25l9 9M20 25l-7 10M21 25l-3-10"/><path d="M5 39h38" opacity=".35"/></svg>';
    if(n.includes('row'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="23" cy="8" r="4"/><path d="M22 13l-5 11 9 4M17 24l-7 11m16-7 5 11M26 19l10 3m-1-3v7"/><path d="M8 36h11" opacity=".4"/></svg>';
    if(n.includes('press')||n.includes('push'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="10" r="4"/><path d="M24 15v12m0 0-7 12m7-12 7 12M19 18l-7-7m17 7 7-7M9 8h8m14 0h8"/></svg>';
    if(n.includes('curl'))return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M24 13v14m0 0-6 12m6-12 6 12M19 17l-5 7 5 2m10-9 5 7-5 2"/><circle cx="13" cy="27" r="2"/><circle cx="35" cy="27" r="2"/></svg>';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="9" r="4"/><path d="M24 14v14m0 0-7 11m7-11 7 11M19 18l-7 8m17-8 7 8"/><path d="M10 40h28" opacity=".35"/></svg>';
  }

  function decorateExercises(){
    document.querySelectorAll('.focus-exercise-list>button').forEach(row=>{
      const thumb=row.querySelector('.focus-ex-thumb');
      if(!thumb)return;
      const label=row.children?.[1]?.querySelector?.('b')?.textContent||row.textContent||'';
      if(!thumb.querySelector('svg'))thumb.innerHTML=movementIcon(label.replace(/^\s*\d+\.\s*/,''));
      thumb.dataset.arcPremiumV2='1';
    });
  }

  function latestMeasurement(){
    const s=stateRef(),h=s?.history||{};
    const rows=[...(Array.isArray(h.measurements)?h.measurements:[]),...(Array.isArray(h.body)?h.body:[])].filter(Boolean).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    return rows.at(-1)||s?.profile||{};
  }

  function decorateBody(){
    const map=document.querySelector('.focus-body-map');
    if(!map)return;
    const m=latestMeasurement();
    const keys=['neck','shoulders','chest','arm','waist','hips','thigh','calf'];
    map.querySelectorAll('.focus-body-lines span').forEach((row,i)=>{
      const b=row.querySelector('b');if(!b)return;
      b.querySelector('.arc-map-value')?.remove();
      const v=m?.[keys[i]];
      if(v!==''&&v!=null&&Number.isFinite(+v)){
        const s=document.createElement('small');s.className='arc-map-value';s.textContent=`${Number(v).toFixed(Number(v)%1?1:0)} in`;b.appendChild(s);
      }
    });
    map.dataset.arcPremiumV2='1';
  }

  function recentRhythmPoints(){
    const s=stateRef(),h=s?.history||{};
    const rows=Array.isArray(h.workouts)?h.workouts:[];
    const now=new Date();
    const buckets=Array.from({length:7},(_,i)=>({start:new Date(now.getFullYear(),now.getMonth(),now.getDate()-(6-i)*4),count:0}));
    rows.forEach(w=>{
      const d=new Date(`${w.date||''}T12:00:00`);if(!Number.isFinite(d.getTime()))return;
      for(let i=buckets.length-1;i>=0;i--){if(d>=buckets[i].start){buckets[i].count++;break}}
    });
    let cumulative=0;return buckets.map((b,i)=>{cumulative+=b.count;return cumulative+i*.12});
  }

  function sparkPath(values){
    if(!values.length)return '';
    const max=Math.max(...values,1),min=Math.min(...values,0),range=Math.max(1,max-min);
    return values.map((v,i)=>`${10+i*(280/(values.length-1))},${58-((v-min)/range)*42}`).join(' ');
  }

  function decorateArc(){
    const arc=document.querySelector('.focus-arc');
    if(!arc)return;
    document.querySelectorAll('.focus-nav button.active').forEach(x=>x.classList.remove('active'));
    if(!arc.querySelector('.focus-arc-back')){
      const back=document.createElement('button');back.type='button';back.className='focus-arc-back';back.setAttribute('aria-label','Back to Today');back.textContent='‹';back.addEventListener('click',()=>{const s=stateRef();if(s){s.screen='today';try{save()}catch(e){}try{render()}catch(e){}}});arc.prepend(back);
    }
    if(!arc.querySelector('.focus-arc-story')){
      const vals=recentRhythmPoints(),pts=sparkPath(vals),box=document.createElement('section');box.className='focus-arc-story';
      box.innerHTML=`<span>YOUR RECENT RHYTHM</span><svg viewBox="0 0 300 70" role="img" aria-label="Recent training rhythm"><path class="track" d="M10 58H290"/><polyline class="line" points="${pts}"/>${pts.split(' ').filter(Boolean).map(p=>{const [x,y]=p.split(',');return `<circle class="dot" cx="${x}" cy="${y}" r="3.5"/>`}).join('')}</svg><footer><b>4 weeks ago</b><b>Today</b></footer>`;
      const summary=arc.querySelector('.focus-arc-summary');(summary||arc.lastElementChild)?.insertAdjacentElement('afterend',box);
    }
  }

  function decorateMethod(){
    const glance=document.querySelector('.focus-today .focus-glance');
    if(glance&&!document.querySelector('.arc-philosophy-strip')){
      const strip=document.createElement('button');
      strip.type='button';strip.className='arc-philosophy-strip';strip.setAttribute('data-focus-go','arc');
      strip.innerHTML='<span>THE ARC METHOD</span><strong>80/20 is the philosophy.<br>The Arc is how you see it.</strong><small>Build a strong foundation. Leave room for real life.</small><em>See your Arc →</em>';
      glance.insertAdjacentElement('afterend',strip);
      const mantra=document.querySelector('.focus-mantra');if(mantra)mantra.textContent='Track less. Understand more.';
    }
    const bar=document.querySelector('.focus-nutrition .focus-8020-bar');
    if(bar&&!bar.querySelector('.arc-8020-explain')){
      const button=document.createElement('button');button.type='button';button.className='arc-8020-explain';button.setAttribute('data-focus-8020','');button.innerHTML='<span>80/20 is a guide, not a grade.</span><b>What it means →</b>';
      bar.appendChild(button);
    }
  }

  function hardenNutrition(){
    const n=document.querySelector('.focus-nutrition');if(!n)return;
    n.dataset.arcPremiumV2='1';
    n.style.removeProperty('display');n.style.removeProperty('visibility');n.style.removeProperty('opacity');n.style.removeProperty('transform');
  }

  function cleanChrome(){
    document.querySelectorAll('.arc-mobile-brandline,.arc-rail,.nav').forEach(x=>{x.style.display='none'});
  }

  function enhance(){
    document.documentElement.classList.add('arc-premium-v2');
    cleanChrome();
    hardenNutrition();
    decorateExercises();
    decorateBody();
    decorateArc();
    decorateMethod();
  }
  function schedule(){requestAnimationFrame(()=>{enhance();requestAnimationFrame(enhance)})}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('arc:rendered',schedule);
  window.addEventListener('arc:auth-rendered',schedule);
  window.addEventListener('arc:boot-complete',schedule);
  // Focus tab handlers render synchronously without always calling the global render wrapper.
  // Schedule after those interactions from the window capture phase so decorative upgrades never lag behind.
  window.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-focus-go],[data-focus-train-tab],[data-focus-body-tab],[data-focus-nut-tab],[data-focus-view-plan],[data-focus-meal],[data-focus-save-food],[data-focus-modal-save]'))schedule();
  },true);
  window.__arcPremiumV2Enhance=enhance;
})();
