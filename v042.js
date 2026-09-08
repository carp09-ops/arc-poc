// Arc POC 0.4.2 — visual north-star translation from approved mockups.
(function(){
  if(typeof S==='undefined') return;
  const OLD_SHELL=window.shell||shell;
  nav=function(a){
    const items=[['today','⌂','Today'],['train','▥','Train'],['nutrition','⌑','Nutrition'],['body','◯','Body'],['arc','▥','Arc']];
    return `<nav class="arc-nav">${items.map(x=>`<button data-go="${x[0]}" class="${a===x[0]?'active':''}"><span>${x[1]}</span><b>${x[2]}</b></button>`).join('')}</nav>`;
  };
  shell=function(body,tab){
    const active=tab||S.screen;
    const showChrome=['today','train','nutrition','body','arc','community'].includes(active);
    app.innerHTML=`<main class="arc-app ${showChrome?'with-chrome':''}">${showChrome?`<aside class="arc-rail"><div class="arc-rail-brand"><b>Arc</b><small>PROGRESS HAS A SHAPE</small></div>${nav(active)}<div class="arc-rail-quote"><span>“</span><em>Progress is a series of small, consistent choices.</em></div></aside>`:''}<section class="arc-stage">${body}</section>${showChrome?`<div class="arc-mobile-nav">${nav(active)}</div>`:''}</main>`;window.scrollTo(0,0)
  };

  const H=()=>S.history||{workouts:[],nutrition:[],body:[],activity:[],signals:[]};
  const latest=(arr)=>arr&&arr.length?arr.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1):null;
  const day=()=>new Date().toISOString().slice(0,10);
  const sum=(arr,k)=>arr.reduce((a,x)=>a+(+x[k]||0),0);
  const sigs=()=>{try{return ArcData?.evaluateSignals?.()||H().signals||[]}catch(e){return H().signals||[]}};
  const ev=()=>{try{return ArcData?.evidenceStatus?.()}catch(e){return null}};

  today=function(){
    const p=S.profile||{},h=H(),q=plan(),e=ev(),signals=sigs();
    const meals=h.nutrition.filter(x=>x.date===day()),act=latest(h.activity.filter(x=>x.date===day())),body=latest(h.body);
    const cal=sum(meals,'calories'),protein=sum(meals,'protein'),steps=act?.steps||S.logs?.steps||0;
    const completed=h.workouts.length,next=q.split[Math.min(completed,q.split.length-1)]||q.split[0]||'Full Body Strength';
    const lead=signals.find(x=>x.status==='active')||signals[0];
    shell(`<div class="dash-head"><div><span class="dash-date">${new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}).toUpperCase()}</span><h1>Good morning, ${esc(p.name||'Kimberly')}.</h1><p>Here’s what matters today.</p></div><div class="profile-medallion"></div></div>
    <section class="cinema-hero"><div class="cinema-copy"><span class="eyebrow">Today’s Focus</span><h2>${esc(next)}</h2><p>${p.duration||30} min · ${q.split?.length||3} planned sessions this cycle</p><button class="btn hero-btn" data-go="train">Start Workout</button></div><div class="hero-message"><span>WHY IT MATTERS</span><p>${lead?esc(lead.summary):`You’re building consistency—the foundation Arc needs before it can interpret change.`}</p></div></section>
    <div class="dash-tiles"><button data-go="nutrition"><i>⌑</i><b>Nutrition</b><span>${meals.length} meals</span><small>${cal||0} kcal · ${protein||0}g protein</small></button><button data-steps><i>⌁</i><b>Activity</b><span>${steps?steps.toLocaleString():'—'}</span><small>steps today</small></button><button data-go="body"><i>◯</i><b>Body</b><span>${body?'Last check-in':'No check-in yet'}</span><small>${body?.date||'Add your first baseline'}</small></button><button data-go="arc"><i>▥</i><b>Arc</b><span>${e?`${e.active} of ${e.total}`:'Building'}</span><small>data streams</small></button></div>
    <div class="dash-grid"><section class="editorial-card meals-card"><div class="card-title"><h3>Today’s Meals</h3><button data-go="nutrition">View All →</button></div>${meals.length?meals.slice(-3).map(x=>`<div class="editorial-row"><div class="meal-thumb"></div><div><b>${esc(x.name||'Food entry')}</b><small>${x.protein||0}g protein</small></div><span>${x.calories||0} kcal</span></div>`).join(''):`<div class="empty-editorial">Nothing logged yet. One honest entry is more useful than a perfect day.</div>`}<button class="btn" data-go="nutrition">＋ Add a Meal</button></section>
    <section class="editorial-card"><div class="card-title"><h3>Body Snapshot</h3><button data-go="body">View →</button></div>${body?['weight','waist','hips','chest'].filter(k=>body[k]!=null).map(k=>`<div class="metric-row"><span>${k[0].toUpperCase()+k.slice(1)}</span><b>${body[k]} ${k==='weight'?'lb':'in'}</b></div>`).join(''):`<div class="empty-editorial">A dated body check-in unlocks real comparisons.</div>`}</section>
    <section class="editorial-card insight-card"><div class="card-title"><h3>Arc Insights</h3><button data-go="arc">View All →</button></div><span class="insight-icon">✦</span><h3>${lead?esc(lead.title):'Arc is watching.'}</h3><p>${lead?esc(lead.summary):'Keep logging naturally. Arc will surface a Signal only when repeated evidence earns it.'}</p><div class="insight-status"><span>Current understanding</span><b>${lead?.confidence||e?.label||'Learning'}</b></div></section></div>`, 'today');
  };

  train=function(){
    const p=S.profile||{},q=plan(),h=H(),done=h.workouts.length,next=q.split[Math.min(done,q.split.length-1)]||q.split[0];
    shell(`<div class="page-kicker"><span>TRAIN</span><h1>Build strength. Support your life.</h1><p>Your plan is sized around what you said you can realistically repeat.</p></div><section class="train-feature"><div class="train-photo"><div class="train-photo-shade"></div><span>NEXT UP</span><h2>${esc(next)}</h2><p>${p.duration||30} min · ${esc(p.location||'Your setup')}</p><button class="btn" data-workout>Start Workout</button></div><div class="weekly-card"><span class="eyebrow">This Week</span><h3>${Math.min(done,p.days||3)} of ${p.days||3} complete</h3><div class="week-dots">${Array.from({length:p.days||3},(_,i)=>`<i class="${i<done?'done':i===done?'next':''}">${i<done?'✓':i+1}</i>`).join('')}</div><p>Repeatable weeks matter more than perfect ones.</p></div></section><div class="session-stack">${q.split.map((x,i)=>`<div class="session-item ${i<done?'done':i===done?'next':''}"><span>${i<done?'✓':i+1}</span><div><b>${esc(x)}</b><small>${i<done?'Completed':i===done?'Up next':'Planned'} · ${p.duration||30} min</small></div><button ${i===done?'data-workout':''}>${i===done?'Start':'›'}</button></div>`).join('')}</div>`, 'train');
  };

  if(['today','train'].includes(S.screen)) render();
})();
