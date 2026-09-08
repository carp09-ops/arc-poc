// Arc POC 0.4.1 — approved mockup translation + live Signal/history surfaces.
(function(){
  if(typeof S==='undefined') return;
  const hist=()=>S.history||{workouts:[],nutrition:[],body:[],activity:[],sleep:[],signals:[]};
  const fmtDate=(d)=>{try{return new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return d||''}};
  const todayKey=()=>new Date().toISOString().slice(0,10);
  const sum=(arr,key)=>arr.reduce((a,x)=>a+(+x[key]||0),0);
  const latest=(arr)=>arr&&arr.length?arr.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1):null;
  const signals=()=>{try{return window.ArcData?.evaluateSignals?.()||hist().signals||[]}catch(e){return hist().signals||[]}};
  const evidence=()=>{try{return window.ArcData?.evidenceStatus?.()||null}catch(e){return null}};

  today=function(){
    const p=S.profile||{},h=hist(),q=plan(),ev=evidence();
    const todayMeals=h.nutrition.filter(x=>x.date===todayKey()),todayAct=latest(h.activity.filter(x=>x.date===todayKey()));
    const body=latest(h.body),sigs=signals(),lead=sigs.find(x=>x.status==='active')||sigs[0];
    const completed=h.workouts.length,next=q.split[Math.min(completed,q.split.length-1)]||q.split[0]||'Full Body Strength';
    const cal=sum(todayMeals,'calories'),protein=sum(todayMeals,'protein'),steps=todayAct?.steps||S.logs?.steps||0;
    const bodyRows=body?[['Weight',body.weight,'lb'],['Waist',body.waist,'in'],['Hips',body.hips,'in']].filter(x=>x[1]!=null):[];
    shell(`<div class="v041-today">
      <div class="arc-brandbar"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>Arc</b><small>PROGRESS HAS A SHAPE</small></div><div class="profile-pill"><div><b>${esc(p.name||'Kimberly')}</b><span>BODY INTELLIGENCE</span></div><div class="avatar"></div></div></div>
      <section class="v041-hero"><div class="v041-hero-copy"><span class="v041-date">${new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</span><h1>Good morning, ${esc(p.name||'Kimberly')}.</h1><p>Here’s what matters today.</p><div class="v041-focus"><span class="eyebrow">Today’s focus</span><div class="v041-focus-grid"><div class="v041-focus-icon">↗</div><div><h2>${esc(next)}</h2><small>${p.duration||30} min · ${esc(p.location||'Your setup')}</small></div></div><button class="btn" data-go="train">Start Workout</button></div></div></section>
      <div class="v041-stats">
        <div class="v041-stat" data-go="nutrition"><span>◒</span><b>Nutrition</b><small>${todayMeals.length} meal${todayMeals.length===1?'':'s'} · ${cal||0} kcal · ${protein||0}g protein</small></div>
        <div class="v041-stat"><span>⌁</span><b>Activity</b><small>${steps?steps.toLocaleString()+' steps':'No movement logged yet'}</small></div>
        <div class="v041-stat" data-go="body"><span>◉</span><b>Body</b><small>${body?'Last check-in '+fmtDate(body.date):'No check-in yet'}</small></div>
        <div class="v041-stat" data-go="arc"><span>▥</span><b>Arc</b><small>${ev?ev.active+' of '+ev.total+' data streams':'Building context'}</small></div>
      </div>
      <div class="v041-dashboard">
        <div class="v041-panel"><span class="eyebrow">Today’s Meals</span><h3>${todayMeals.length?'Fuel with context':'Nothing logged yet'}</h3>${todayMeals.slice(-3).map(x=>`<div class="v041-meal-row"><div><b>${esc(x.name||'Food entry')}</b><small>${x.protein||0}g protein</small></div><span>${x.calories||0} kcal</span></div>`).join('')||'<p class="tiny muted">Add meals naturally. Arc cares more about repeat patterns than perfect days.</p>'}<button class="btn secondary" data-go="nutrition">${todayMeals.length?'View Nutrition':'Add a Meal'}</button></div>
        <div class="v041-panel"><span class="eyebrow">Body Snapshot</span><h3>${body?'Latest measurements':'Your baseline'}</h3>${bodyRows.map(x=>`<div class="v041-body-row"><div><b>${x[0]}</b><small>${fmtDate(body.date)}</small></div><span>${x[1]} ${x[2]}</span></div>`).join('')||'<p class="tiny muted">A dated check-in gives Arc something real to compare over time.</p>'}<button class="btn secondary" data-go="body">View Body</button></div>
        <div class="v041-panel"><span class="eyebrow">Arc Insights</span><h3>${lead?esc(lead.title):'Arc is watching'}</h3><p class="tiny muted">${lead?esc(lead.summary):'Keep logging naturally. Arc will surface a Signal only when there is enough repeated evidence.'}</p><div class="v041-signal-row"><div><b>${lead?.status==='active'?'Pattern emerging':'Current understanding'}</b><small>${lead?.confidence||ev?.label||'Learning'}</small></div><span>✦</span></div><button class="btn secondary" data-go="arc">Explore Your Arc</button></div>
      </div>
    </div>`,'today');
  };

  arc=function(){
    const p=S.profile||{},h=hist(),ev=evidence(),sigs=signals();
    const body=latest(h.body),firstBody=h.body.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];
    const waistDelta=body&&firstBody&&body.waist!=null&&firstBody.waist!=null?+(body.waist-firstBody.waist).toFixed(1):null;
    shell(`<div class="arc-brandbar"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>Arc</b><small>YOUR ARC</small></div><div class="profile-pill"><div><b>${esc(p.name||'Kimberly')}</b><span>YOUR STORY</span></div><div class="avatar"></div></div></div>
      <div class="arc-page-head"><span class="eyebrow">Your Arc</span><h1>A living explanation of what your body appears to be responding to.</h1><p class="muted">Signals are earned from repeated evidence. Arc separates what it knows from what it is still watching.</p></div>
      <div class="v041-arc-grid"><div>
        <div class="v041-signal-card ${sigs.some(x=>x.status==='active')?'positive':'watching'}"><span class="eyebrow">Current understanding</span><h2>${sigs.some(x=>x.status==='active')?'Early, meaningful patterns are emerging.':'Your story is still taking shape.'}</h2><p class="muted">${ev?`${ev.active} of ${ev.total} evidence streams are active. `:''}Arc will not turn a single day into a conclusion.</p></div>
        <div class="section-head"><div><span class="eyebrow">Signals</span><h3>What Arc sees</h3></div></div>
        ${sigs.length?sigs.map(s=>`<div class="v041-signal-card ${s.status==='active'?'positive':'watching'}"><span class="eyebrow">${s.status==='active'?'Positive trend':'Watching'}</span><h3>${esc(s.title)}</h3><p class="tiny muted">${esc(s.summary)}</p><div class="v041-signal-meta"><span>${esc((s.domains||[]).join(' + '))}</span><span>${s.windowDays||'—'} day window · ${esc(s.confidence||'Learning')}</span></div></div>`).join(''):`<div class="v041-signal-card watching"><h3>No strong Signal yet.</h3><p class="tiny muted">That restraint is intentional. More history creates better comparisons.</p></div>`}
      </div><div>
        <div class="v041-panel"><span class="eyebrow">Evidence</span><h3>What Arc can compare</h3><div class="v041-evidence">${Object.entries(ev?.streams||{}).map(([k,v])=>`<div><b>${k}</b><span>${v||0} ${k==='Nutrition'?'days':'records'}</span></div>`).join('')}</div></div>
        <div class="v041-panel"><span class="eyebrow">Recent Progress</span><h3>${waistDelta!=null?`Waist ${waistDelta<0?'down':'change'} ${Math.abs(waistDelta)} in`:'Waiting for a comparable body trend'}</h3>${body&&firstBody&&body.waist!=null&&firstBody.waist!=null?`<div class="v041-progress-mini"><svg viewBox="0 0 100 50" preserveAspectRatio="none"><polyline points="0,12 30,20 60,30 100,38"></polyline><circle cx="0" cy="12" r="1.8"></circle><circle cx="100" cy="38" r="1.8"></circle></svg></div><p class="tiny muted">${firstBody.waist} in on ${fmtDate(firstBody.date)} → ${body.waist} in on ${fmtDate(body.date)}</p>`:'<p class="tiny muted">Two or more body check-ins unlock a real trend comparison.</p>'}</div>
        <div class="v041-panel"><span class="eyebrow">Next unlock</span><h3>${h.body.length<2?'Add another body check-in.':h.workouts.length<3?'Complete another planned workout.':'Keep the routine repeatable.'}</h3><p class="tiny muted">The goal is not more data. It is enough evidence to answer “so what?”</p><button class="btn" data-go="body">View Your Body</button></div>
      </div></div>`,'arc');
  };

  if(S.screen==='today'||S.screen==='arc') render();
})();
