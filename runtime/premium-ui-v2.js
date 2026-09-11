// ARC Premium UX v2 — presentation-only enhancements aligned to the ARC vision board.
// No state writes. No observers. Re-applies only on stable lifecycle events.
(function(){
  if(window.__ARC_PREMIUM_V2)return;
  window.__ARC_PREMIUM_V2=true;

  let arcPeriod='today';

  function stateRef(){
    try{return typeof S!=='undefined'?S:null}catch(e){return null}
  }

  function escHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function localDateKey(date=new Date()){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function weekStart(date=new Date()){
    const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    const delta=d.getDay()===0?6:d.getDay()-1;
    d.setDate(d.getDate()-delta);
    return d;
  }

  function planForDate(date){
    const plan=window.ArcNutrition?.plan;
    return plan?.[date.getDay()]||null;
  }

  function nutritionForDate(date){
    const s=stateRef();
    const day=s?.nutritionV1?.days?.[localDateKey(date)];
    if(!day)return {foundation:0,flex:0,total:0,events:0};
    const p=planForDate(date);
    let foundation=0,flex=0,events=0;
    const meals=day.meals&&typeof day.meals==='object'?day.meals:{};
    if(Array.isArray(p?.meals)){
      p.meals.forEach(m=>{
        const r=meals[m.id]||{};
        if(!r.logged)return;
        const portion=Number(r.portion)||1;
        const calories=Math.max(0,Math.round((Number(m.cal)||0)*(r.swap?.98:1)*portion));
        foundation+=calories;
        events++;
      });
    }else{
      Object.values(meals).forEach(r=>{if(r?.logged){foundation+=Math.max(0,Number(r.calories)||0);events++;}});
    }
    (Array.isArray(day.custom)?day.custom:[]).forEach(item=>{
      const calories=Math.max(0,Number(item?.calories)||0);
      if(String(item?.balance||'').toLowerCase()==='foundation')foundation+=calories;else flex+=calories;
      if(calories>0)events++;
    });
    return {foundation,flex,total:foundation+flex,events};
  }

  function todayNutrition(){
    try{
      const b=window.Arc8020?.breakdown?.();
      if(b&&Number.isFinite(Number(b.total))){
        return {foundation:Math.max(0,Number(b.foundation)||0),flex:Math.max(0,Number(b.flex)||0),total:Math.max(0,Number(b.total)||0),events:Number(b.total)>0?1:0};
      }
    }catch(e){}
    return nutritionForDate(new Date());
  }

  function weekNutrition(){
    const start=weekStart();
    const total={foundation:0,flex:0,total:0,events:0,days:0};
    for(let i=0;i<7;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      if(d>new Date())break;
      const x=localDateKey(d)===localDateKey()?todayNutrition():nutritionForDate(d);
      total.foundation+=x.foundation;total.flex+=x.flex;total.total+=x.total;total.events+=x.events;
      if(x.total>0)total.days++;
    }
    return total;
  }

  function weekWorkoutRhythm(){
    const s=stateRef(),rows=Array.isArray(s?.history?.workouts)?s.history.workouts:[],start=weekStart().getTime();
    const done=rows.filter(w=>w?.completed!==false&&new Date(`${w?.date||localDateKey()}T12:00:00`).getTime()>=start).length;
    const target=Math.max(1,Number(s?.profile?.days)||3);
    const fallback=Math.min(Math.max(0,Number(s?.logs?.workouts)||0),target);
    const completed=done||fallback;
    return {completed:Math.min(completed,target),target,remaining:Math.max(0,target-completed)};
  }

  function bodySignal(){
    const s=stateRef(),h=s?.history||{};
    const rows=[...(Array.isArray(h.measurements)?h.measurements:[]),...(Array.isArray(h.body)?h.body:[])].filter(Boolean).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    const latest=rows.at(-1);
    if(!latest?.date)return {due:true,label:'Baseline not set'};
    const last=new Date(`${latest.date}T12:00:00`),next=new Date(last.getTime()+7*86400000),due=new Date()>=next;
    return {due,label:due?'Check-in due':`Check-in ${next.toLocaleDateString(undefined,{weekday:'short'})}`};
  }

  function arcSnapshot(period=arcPeriod){
    const nutrition=period==='week'?weekNutrition():todayNutrition();
    const has=nutrition.total>0;
    const foundation=has?Math.max(0,Math.min(100,nutrition.foundation/nutrition.total*100)):80;
    const flex=100-foundation;
    const workouts=weekWorkoutRhythm(),body=bodySignal(),steps=Math.max(0,Number(stateRef()?.logs?.steps)||0);
    let state='Limited Signal';
    if(has){
      if(foundation>=76&&foundation<=86)state=workouts.completed>0?'Building Momentum':'Balanced';
      else if(foundation>86)state='Strong Foundation';
      else state='Flex Trending Up';
    }
    return {period,nutrition,has,foundation,flex,workouts,body,steps,state};
  }

  function arcInsight(snapshot){
    const w=snapshot.workouts;
    if(!snapshot.has){
      return {
        headline:'Your Arc is ready to take shape.',
        copy:'ARC needs only a little real-life input to start showing the pattern. No perfect day required.',
        next:'Log your next meal normally',route:'nutrition',
        evidence:`Nutrition: limited signal · Training: ${w.completed}/${w.target} sessions · ${snapshot.body.label}`
      };
    }
    if(snapshot.foundation<70){
      return {
        headline:'Flex is taking more of the shape right now.',
        copy:w.remaining>0?'Nutrition is driving most of the shift while your training rhythm still has room to build.':'Nutrition is driving most of the shift, while your training rhythm is holding steady.',
        next:'Make the next meal Foundation-led',route:'nutrition',
        evidence:`Nutrition: ${Math.round(snapshot.foundation)}% Foundation / ${Math.round(snapshot.flex)}% Flex · Training: ${w.completed}/${w.target} sessions`
      };
    }
    if(w.remaining>0){
      const workoutName=(()=>{try{const q=plan();return q?.split?.[Math.min(w.completed,Math.max(0,(q?.split?.length||1)-1))]||'your planned session'}catch(e){return 'your planned session'}})();
      return {
        headline:snapshot.foundation<=90?'Your Arc is balanced. Training is the clearest next lever.':'Your Foundation is strong. Training is the clearest next lever.',
        copy:`Your 80/20 balance is in a sustainable range. Completing ${workoutName} would strengthen the week without tightening everything else.`,
        next:`Complete ${workoutName}`,route:'train',
        evidence:`Nutrition: ${Math.round(snapshot.foundation)}% Foundation / ${Math.round(snapshot.flex)}% Flex · Training: ${w.completed}/${w.target} sessions`
      };
    }
    if(snapshot.body.due){
      return {
        headline:'Your Arc is holding steady.',
        copy:'Nutrition and training are giving ARC a strong pattern. A body check-in would add context without changing the plan.',
        next:'Take your body check-in',route:'body',
        evidence:`Nutrition: ${Math.round(snapshot.foundation)}% Foundation / ${Math.round(snapshot.flex)}% Flex · Training: complete · Body: check-in due`
      };
    }
    if(snapshot.steps&&snapshot.steps<5000){
      return {
        headline:'Your Arc is balanced. Keep the day easy.',
        copy:'The fundamentals are handled. A little movement can support the shape without turning today into another workout.',
        next:'Keep the day sustainable',route:'today',
        evidence:`Nutrition: ${Math.round(snapshot.foundation)}% Foundation / ${Math.round(snapshot.flex)}% Flex · Training: complete · Movement: ${Math.round(snapshot.steps).toLocaleString()} steps`
      };
    }
    return {
      headline:'Your Arc is balanced.',
      copy:'The fundamentals are in place and there is still room for real life. Consistency—not restriction—is shaping the progress.',
      next:'Stay with your current rhythm',route:'today',
      evidence:`Nutrition: ${Math.round(snapshot.foundation)}% Foundation / ${Math.round(snapshot.flex)}% Flex · Training: ${w.completed}/${w.target} sessions · ${snapshot.body.label}`
    };
  }

  function arcPoint(percent){
    const p=Math.max(0,Math.min(100,percent))/100,angle=Math.PI-Math.PI*p,r=124,cx=160,cy=164;
    return {x:cx+r*Math.cos(angle),y:cy-r*Math.sin(angle)};
  }

  function arcHeroMarkup(){
    const snap=arcSnapshot(),insight=arcInsight(snap),fr=Math.round(snap.foundation),xr=Math.round(snap.flex),target=arcPoint(80);
    const periodLabel=snap.period==='week'?'THIS WEEK':'TODAY';
    return `<section class="arc-insights-hero" data-arc-period-active="${snap.period}">
      <div class="arc-insights-topline"><div><span>YOUR ARC</span><small>Progress has a shape.</small></div><div class="arc-period-toggle" role="group" aria-label="Arc period"><button type="button" data-arc-period="today" class="${snap.period==='today'?'active':''}">Today</button><button type="button" data-arc-period="week" class="${snap.period==='week'?'active':''}">This Week</button></div></div>
      <div class="arc-insights-state"><span>${periodLabel}</span><h2>${escHtml(snap.state)}</h2><p>80/20 is the philosophy. The Arc is how you see it.</p></div>
      <div class="arc-insights-visual" style="--arc-foundation:${fr};--arc-flex:${xr}">
        <svg viewBox="0 0 320 186" role="img" aria-label="${fr}% Foundation and ${xr}% Flex. 80% Foundation and 20% Flex is the guide.">
          <path class="arc-target-track" pathLength="100" d="M36 164 A124 124 0 0 1 284 164"/>
          <path class="arc-target-foundation" pathLength="100" stroke-dasharray="80 20" d="M36 164 A124 124 0 0 1 284 164"/>
          <path class="arc-target-flex" pathLength="100" stroke-dasharray="20 80" stroke-dashoffset="-80" d="M36 164 A124 124 0 0 1 284 164"/>
          <path class="arc-live-foundation" pathLength="100" stroke-dasharray="${fr} ${100-fr}" d="M36 164 A124 124 0 0 1 284 164"/>
          <path class="arc-live-flex" pathLength="100" stroke-dasharray="${xr} ${100-xr}" stroke-dashoffset="-${fr}" d="M36 164 A124 124 0 0 1 284 164"/>
          <circle class="arc-target-marker" cx="${target.x.toFixed(1)}" cy="${target.y.toFixed(1)}" r="4.5"/>
        </svg>
        <div class="arc-insights-center"><span>${snap.has?`${fr}<i>/</i>${xr}`:'80<i>/</i>20'}</span><small>${snap.has?'ACTUAL':'GUIDE'}</small></div>
      </div>
      <div class="arc-insights-legend"><div><i class="foundation"></i><span>Foundation</span><b>${fr}%</b></div><div><i class="flex"></i><span>Flex</span><b>${xr}%</b></div><small><i></i> 80/20 guide</small></div>
      <article class="arc-insight-card"><header><span>ARC INSIGHT</span><small>${escHtml(snap.state)}</small></header><h3>${escHtml(insight.headline)}</h3><p>${escHtml(insight.copy)}</p><button type="button" class="arc-next-move" data-arc-next="${escHtml(insight.route)}"><span>BEST NEXT MOVE</span><b>${escHtml(insight.next)}</b><em>→</em></button><button type="button" class="arc-evidence-toggle" data-arc-evidence aria-expanded="false">Why ARC says this <span>＋</span></button><div class="arc-insight-evidence"><span>WHAT'S SHAPING IT</span><p>${escHtml(insight.evidence)}</p></div></article>
    </section>`;
  }

  function decorateArcHero(){
    const page=document.querySelector('.focus-today');
    if(!page)return;
    page.querySelector('.arc-insights-hero')?.remove();
    const greeting=page.querySelector('.focus-greeting');
    if(!greeting)return;
    greeting.insertAdjacentHTML('afterend',arcHeroMarkup());
    const focusCard=page.querySelector('.focus-primary-card');
    if(focusCard){
      focusCard.classList.add('arc-secondary-focus');
      if(!focusCard.previousElementSibling?.classList?.contains('arc-secondary-label')){
        const label=document.createElement('div');label.className='arc-secondary-label';label.innerHTML='<span>TODAY\'S FOCUS</span><small>The move that shapes the Arc next.</small>';focusCard.before(label);
      }
    }
    page.querySelector('.focus-why')?.classList.add('arc-secondary-why');
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
      // Keep the semantic body-part label pure. The measurement is a sibling so screen readers,
      // tests and future interaction logic can reliably read "Neck", "Waist", etc. by itself.
      row.querySelector('.arc-map-value')?.remove();
      const v=m?.[keys[i]];
      if(v!==''&&v!=null&&Number.isFinite(+v)){
        const value=document.createElement('small');
        value.className='arc-map-value';
        value.textContent=`${Number(v).toFixed(Number(v)%1?1:0)} in`;
        value.setAttribute('aria-label',`${b.textContent.trim()} ${value.textContent}`);
        b.insertAdjacentElement('afterend',value);
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
    document.querySelectorAll('.arc-philosophy-strip').forEach(x=>x.remove());
    if(glance){
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
    decorateArcHero();
    decorateExercises();
    decorateBody();
    decorateArc();
    decorateMethod();
  }
  function safeEnhance(){try{enhance()}catch(e){console.warn('ARC premium enhancement skipped',e)}}
  function schedule(){
    // Run once now for lifecycle events that fire after a completed render, then again after
    // the current interaction frame for Focus actions that replace the screen synchronously.
    safeEnhance();
    setTimeout(safeEnhance,0);
    requestAnimationFrame(()=>{safeEnhance();requestAnimationFrame(safeEnhance)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('arc:rendered',schedule);
  window.addEventListener('arc:auth-rendered',schedule);
  window.addEventListener('arc:boot-complete',schedule);
  // Focus tab handlers render synchronously without always calling the global render wrapper.
  // Schedule after those interactions from the window capture phase so decorative upgrades never lag behind.
  window.addEventListener('click',e=>{
    const period=e.target?.closest?.('[data-arc-period]');
    if(period){
      e.preventDefault();
      arcPeriod=period.getAttribute('data-arc-period')==='week'?'week':'today';
      decorateArcHero();
      return;
    }
    const evidence=e.target?.closest?.('[data-arc-evidence]');
    if(evidence){
      e.preventDefault();
      const card=evidence.closest('.arc-insight-card'),open=card?.classList.toggle('evidence-open');
      evidence.setAttribute('aria-expanded',open?'true':'false');
      const glyph=evidence.querySelector('span');if(glyph)glyph.textContent=open?'−':'＋';
      return;
    }
    const next=e.target?.closest?.('[data-arc-next]');
    if(next){
      e.preventDefault();
      const route=next.getAttribute('data-arc-next')||'today';
      const nav=document.querySelector(`.focus-nav [data-focus-go="${CSS.escape(route)}"]`);
      if(nav){nav.click();return}
    }
    if(e.target?.closest?.('[data-focus-go],[data-focus-train-tab],[data-focus-body-tab],[data-focus-nut-tab],[data-focus-view-plan],[data-focus-meal],[data-focus-save-food],[data-focus-modal-save]'))schedule();
  },true);
  window.__arcPremiumV2Enhance=enhance;
  window.__arcSnapshot=arcSnapshot;
})();
