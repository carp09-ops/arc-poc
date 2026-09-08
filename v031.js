// Arc POC 0.3.1 — Today + Arc visual overhaul.
today=function(){
  const p=S.profile||{},l=S.logs||{},q=plan();
  const next=q.split[Math.min(l.workouts,q.split.length-1)]||q.split[0];
  const evidence=l.workouts+l.bodyChecks+(l.cal>0?1:0)+(l.steps>0?1:0);
  const learningPct=Math.min(92,Math.max(12,evidence*17));
  const proteinPct=Math.min(100,Math.round((l.protein||0)/120*100));
  shell(`<div class="arc-brandbar"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div><div class="profile-pill"><div><b>${esc(p.name||'Kimberly')}</b><span>STRONGER YOU</span></div><div class="avatar"></div></div></div>
  <div class="today-hero"><span class="eyebrow">Today</span><h1>Good morning, ${esc(p.name||'Kimberly')}.</h1><p class="muted">Here’s what matters most for your body today.</p></div>
  <div class="today-layout">
    <div>
      <div class="card signal hero-signal"><div class="signal-orb">✦</div><div><span class="eyebrow">Body Intelligence</span><h2>${evidence<4?'Arc is learning your baseline.':'A pattern is beginning to take shape.'}</h2><p class="muted">${evidence<4?'Keep giving Arc context. Workouts, nutrition, movement and body check-ins help turn isolated numbers into a story.':'Your recent consistency is starting to create enough context for Arc to compare your actions with how your body responds.'}</p><div class="signal-progress"><div class="row tiny"><span>Learning your pattern</span><b>${learningPct}%</b></div><div class="bar"><i style="width:${learningPct}%"></i></div></div></div></div>
      <div class="section-head"><div><span class="eyebrow">Your Plan</span><h3>Today’s focus</h3></div><span class="tiny muted">Built for ${p.duration||30} min</span></div>
      <div class="action-stack">
        <div class="card action-card"><div class="action-icon">↗</div><div class="action-copy"><span>WORKOUT</span><b>${esc(next)}</b><small>${p.duration||30} min · ${esc(p.location||'Your setup')}</small></div><button class="round-action" data-go="train">▶</button></div>
        ${!String(p.nutrition||'').startsWith('Not')?`<div class="card action-card"><div class="action-icon">◒</div><div class="action-copy"><span>NUTRITION</span><b>${(l.cal||0).toLocaleString()} kcal logged</b><small>${l.protein||0}g protein · ${proteinPct}% of guide</small></div><button class="round-action" data-go="nutrition">＋</button></div>`:''}
        <div class="card action-card"><div class="action-icon">⌁</div><div class="action-copy"><span>ACTIVITY</span><b>${l.steps?(l.steps.toLocaleString()+' steps'):'Add today’s movement'}</b><small>Movement adds context to recovery and progress.</small></div><button class="round-action secondary-round" data-steps>＋</button></div>
      </div>
    </div>
    <div>
      <div class="section-head"><div><span class="eyebrow">At a glance</span><h3>Your current Arc</h3></div><button class="text-action" data-go="arc">View story →</button></div>
      <div class="arc-score-card">
        <div class="arc-ring" style="--arc:${learningPct*3.6}deg"><div><b>${learningPct}</b><span>context</span></div></div>
        <div class="arc-score-copy"><span class="eyebrow">Building your baseline</span><h3>Consistency creates clarity.</h3><p class="tiny muted">The more complete the picture, the more useful your Signals become.</p></div>
      </div>
      <div class="mini-metrics"><div><span>WORKOUTS</span><b>${l.workouts||0}</b><small>logged</small></div><div><span>CHECK-INS</span><b>${l.bodyChecks||0}</b><small>body</small></div><div><span>PROTEIN</span><b>${l.protein||0}g</b><small>today</small></div><div><span>STEPS</span><b>${l.steps?l.steps.toLocaleString():'—'}</b><small>today</small></div></div>
      <div class="card quiet-card"><span class="eyebrow">Your Why</span><h3>${p.why?`“${esc(p.why)}”`:'Build a body you understand—not one you have to guess about.'}</h3><p class="tiny muted">Your goal stays in the background. Your data helps guide the path.</p></div>
    </div>
  </div>`, 'today');
};

arc=function(){
  const p=S.profile||{},l=S.logs||{};
  const enough=l.workouts>=3&&l.bodyChecks>=2;
  const context=Math.min(92,Math.max(12,(l.workouts+l.bodyChecks+(l.cal>0?1:0)+(l.steps>0?1:0))*17));
  const title=enough?'Your progress is starting to connect.':'Your story is still taking shape.';
  shell(`<div class="arc-brandbar"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div><div class="profile-pill"><div><b>${esc(p.name||'Kimberly')}</b><span>YOUR STORY</span></div><div class="avatar"></div></div></div>
  <div class="arc-page-head"><span class="eyebrow">Your Arc</span><h1>${title}</h1><p class="muted">Not a scoreboard. A living explanation of what your body appears to be responding to.</p></div>
  <div class="arc-story-layout">
    <div>
      <div class="arc-visual-card"><div class="arc-path"><div class="path-line"></div><div class="path-node n1"><b>Start</b><span>${p.weight?p.weight+' lb':'Baseline'}</span></div><div class="path-node n2"><b>Training</b><span>${l.workouts||0} logged</span></div><div class="path-node n3"><b>Body</b><span>${l.bodyChecks||0} check-ins</span></div><div class="path-node n4 active"><b>Now</b><span>${context}% context</span></div></div><div class="arc-legend"><span>Actions</span><span>Body changes</span><span>Signals</span></div></div>
      <div class="section-head"><div><span class="eyebrow">Key moments</span><h3>Your timeline</h3></div></div>
      <div class="story-timeline">
        <div class="story-event"><i></i><div><b>Baseline created</b><p>${p.weight?p.weight+' lb · ':''}${p.waist?'Waist '+p.waist+' in · ':''}${p.days||3} planned training days</p></div></div>
        ${l.workouts?`<div class="story-event"><i></i><div><b>Training became real</b><p>${l.workouts} planned workout${l.workouts===1?'':'s'} completed.</p></div></div>`:''}
        ${l.bodyChecks?`<div class="story-event"><i></i><div><b>Your body added context</b><p>${l.bodyChecks} measurement check-in${l.bodyChecks===1?'':'s'} recorded.</p></div></div>`:''}
        ${l.cal?`<div class="story-event"><i></i><div><b>Nutrition joined the story</b><p>${l.cal.toLocaleString()} kcal and ${l.protein||0}g protein logged today.</p></div></div>`:''}
      </div>
    </div>
    <div>
      <div class="card signal insight-feature"><span class="eyebrow">✦ What Arc knows so far</span><h2>${enough?'Consistency may be becoming your strongest signal.':'There isn’t enough evidence for a strong Signal yet.'}</h2><p class="muted">${enough?'Your completed workouts and body check-ins are beginning to overlap enough for Arc to watch how consistency relates to body change.':'That restraint is intentional. Arc should earn confidence before telling you what a pattern means.'}</p><div class="confidence-row"><span>Confidence</span><b>${enough?'Early':'Learning'}</b></div></div>
      <div class="card"><span class="eyebrow">Evidence map</span><div class="evidence-list"><div><span>Training</span><b>${l.workouts||0} logs</b></div><div><span>Body</span><b>${l.bodyChecks||0} check-ins</b></div><div><span>Nutrition</span><b>${l.cal?'Present':'Waiting'}</b></div><div><span>Activity</span><b>${l.steps?'Present':'Waiting'}</b></div></div></div>
      <div class="card quiet-card"><span class="eyebrow">Next unlock</span><h3>${l.bodyChecks<2?'Add another body check-in.':l.workouts<3?'Complete another planned workout.':'Keep logging consistently.'}</h3><p class="tiny muted">Arc needs repeated evidence before a pattern becomes a useful Signal.</p></div>
      <button class="btn" data-go="body">View Your Body →</button>
    </div>
  </div>`, 'arc');
};

if(typeof S!=='undefined' && (S.screen==='today'||S.screen==='arc')) render();
