// Arc POC 0.3.2 — Train + Nutrition experience overhaul.
train=function(){
  const p=S.profile||{},l=S.logs||{},q=plan();
  const completed=Math.min(l.workouts||0,p.days||3);
  const nextIndex=Math.min(completed,Math.max(0,q.split.length-1));
  const next=q.split[nextIndex]||q.split[0]||'Full Body Strength';
  const pct=Math.round((completed/Math.max(1,p.days||3))*100);
  shell(`<div class="arc-brandbar"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div><div class="profile-pill"><div><b>${esc(p.name||'Kimberly')}</b><span>TRAIN WITH INTENT</span></div><div class="avatar"></div></div></div>
  <div class="train-head"><span class="eyebrow">Train</span><h1>Your plan should fit your life.</h1><p class="muted">Built around ${p.days||3} days, ${p.duration||30}-minute sessions and ${esc(p.location||'your setup')}.</p></div>
  <div class="train-layout">
    <div>
      <div class="training-progress-card"><div class="progress-copy"><span class="eyebrow">This week</span><h2>${completed} of ${p.days||3} complete</h2><p class="tiny muted">Progress comes from repeatable weeks—not perfect ones.</p></div><div class="week-ring" style="--week:${pct*3.6}deg"><div><b>${pct}%</b><span>complete</span></div></div></div>
      <div class="section-head"><div><span class="eyebrow">Your schedule</span><h3>Planned sessions</h3></div><span class="tiny muted">${p.duration||30} min each</span></div>
      <div class="session-list">${q.split.map((x,i)=>`<div class="session-row ${i<completed?'done':i===completed?'next':''}"><div class="session-status">${i<completed?'✓':i===completed?'▶':i+1}</div><div><b>${esc(x)}</b><span>${i<completed?'Completed':i===completed?'Up next':'Planned'} · ${esc(p.location||'Your setup')}</span></div><small>${p.duration||30} min</small></div>`).join('')}</div>
    </div>
    <div>
      <div class="next-workout-card"><div class="workout-glow"></div><span class="eyebrow">Next up</span><h2>${esc(next)}</h2><p>${p.duration||30} minutes · ${esc(p.experience||'Guided')}</p><div class="workout-meta"><span>5 exercises</span><span>Strength + control</span><span>Built for today</span></div><button class="btn" data-workout>Start Workout →</button></div>
      <div class="card coaching-card"><div class="coaching-icon">✦</div><div><span class="eyebrow">Arc coaching</span><h3>Leave room to succeed again.</h3><p class="tiny muted">Your plan is intentionally sized to be repeatable. Arc will watch completion, progression and recovery context before changing it.</p></div></div>
      <div class="section-head"><div><span class="eyebrow">Movement preview</span><h3>What’s inside</h3></div></div>
      <div class="exercise-preview-grid"><div class="exercise-preview"><div class="exercise-figure squat"></div><b>Goblet Squat</b><span>3 × 10</span></div><div class="exercise-preview"><div class="exercise-figure hinge"></div><b>Romanian Deadlift</b><span>3 × 10</span></div><div class="exercise-preview"><div class="exercise-figure rowmove"></div><b>Supported Row</b><span>3 × 12</span></div></div>
    </div>
  </div>`, 'train');
};

workout=function(){
  const p=S.profile||{};
  shell(`<div class="workout-top"><button class="back-chip" data-go="train">←</button><div><span class="eyebrow">Workout in progress</span><h2>Full Body Strength</h2></div><span class="workout-time">${p.duration||30} min</span></div>
  <div class="active-exercise-hero"><div class="active-figure"><div class="exercise-person"></div></div><div class="active-copy"><span class="eyebrow">Exercise 1 of 5</span><h1>Goblet Squat</h1><p class="muted">3 sets × 10 reps · Rest 60 sec</p><div class="cue-chips"><span>Chest tall</span><span>Knees track</span><span>Whole foot</span></div></div></div>
  <div class="set-card"><div class="set-head"><b>Set</b><b>Weight</b><b>Reps</b><b>Done</b></div>${[1,2,3].map((n,i)=>`<div class="set-line"><span>${n}</span><input inputmode="decimal" placeholder="lb" value="${i===0?'30':''}"><input inputmode="numeric" value="10"><button class="set-check">${i===0?'✓':'○'}</button></div>`).join('')}</div>
  <div class="card form-card"><span class="eyebrow">Form guide</span><h3>Control the descent. Own the position.</h3><p class="tiny muted">Arc keeps cues short while you train. Video tutorials and deeper coaching can live one tap away later.</p></div>
  <button class="btn" data-finish>Finish Workout →</button>`, null);
};

nutrition=function(){
  const p=S.profile||{},l=S.logs||{};
  const cal=l.cal||0,protein=l.protein||0;
  const calGuide=1750,proteinGuide=120;
  const calPct=Math.min(100,Math.round(cal/calGuide*100)),proteinPct=Math.min(100,Math.round(protein/proteinGuide*100));
  shell(`<div class="arc-brandbar"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div><div class="profile-pill"><div><b>${esc(p.name||'Kimberly')}</b><span>FUEL WITH CONTEXT</span></div><div class="avatar"></div></div></div>
  <div class="nutrition-head"><span class="eyebrow">Nutrition</span><h1>Fuel the pattern, not perfection.</h1><p class="muted">Today is one data point. Arc cares more about what repeats.</p></div>
  <div class="nutrition-layout">
    <div>
      <div class="fuel-summary"><div class="fuel-ring" style="--fuel:${calPct*3.6}deg"><div><b>${cal.toLocaleString()}</b><span>kcal logged</span><small>${calPct}% of guide</small></div></div><div class="fuel-copy"><span class="eyebrow">Today’s fuel</span><h2>${cal?'You’re building context.':'Nothing logged yet—and that’s okay.'}</h2><p class="tiny muted">Your current mode is ${esc((p.nutrition||'Guided — calories + protein').split(' — ')[0])}. The goal is useful awareness, not perfect tracking.</p></div></div>
      <div class="macro-card"><div class="macro-head"><span>Protein</span><b>${protein}g <small>/ ${proteinGuide}g guide</small></b></div><div class="macro-track"><i style="width:${proteinPct}%"></i></div><p class="tiny muted">Protein is one input Arc can eventually compare with training completion and recovery patterns.</p></div>
      <div class="section-head"><div><span class="eyebrow">Quick add</span><h3>Log without friction</h3></div></div>
      <div class="quick-log-card"><input id="food" class="input" placeholder="What did you eat?" value=""><div class="quick-log-grid"><label><span>Calories</span><input id="cals" class="input" type="number" inputmode="numeric" placeholder="0"></label><label><span>Protein</span><input id="prot" class="input" type="number" inputmode="numeric" placeholder="0 g"></label></div><button class="btn" data-addfood>Add to Today →</button></div>
    </div>
    <div>
      <div class="card signal nutrition-signal"><div class="signal-orb">✦</div><div><span class="eyebrow">Nutrition Intelligence</span><h2>${proteinPct>=75?'Protein is becoming a useful data point.':'Arc needs a little more history.'}</h2><p class="tiny muted">${proteinPct>=75?'Repeated protein and training logs can eventually reveal whether higher-protein days tend to align with stronger training consistency.':'Keep logging naturally. Arc won’t invent a pattern from a single day.'}</p><div class="confidence-row"><span>Signal status</span><b>${proteinPct>=75?'Watching':'Learning'}</b></div></div></div>
      <div class="card quiet-card"><span class="eyebrow">What matters today</span><div class="nutrition-priorities"><div><i>1</i><span><b>Get enough protein</b><small>Support training and satiety.</small></span></div><div><i>2</i><span><b>Eat normally</b><small>Useful data beats “perfect” data.</small></span></div><div><i>3</i><span><b>Keep perspective</b><small>Trends matter more than one meal.</small></span></div></div></div>
      <button class="btn secondary" data-go="today">Back to Today</button>
    </div>
  </div>`, 'today');
};

if(typeof S!=='undefined' && ['train','workout','nutrition'].includes(S.screen)) render();
