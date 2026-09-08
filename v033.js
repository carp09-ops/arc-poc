// Arc POC 0.3.3 — premium first-run experience: welcome, onboarding, baseline reveal.
welcome=function(){
  shell(`<div class="onboarding-shell welcome-v033">
    <div class="arc-brandbar intro-brand"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>PROGRESS HAS A SHAPE</small></div><span class="tiny muted">POC 0.3.3</span></div>
    <div class="intro-grid">
      <div class="intro-copy">
        <span class="eyebrow">Body Intelligence</span>
        <h1>Your body is always responding.</h1>
        <p class="intro-lede">To how you eat. How you move. How you train. How you recover.</p>
        <div class="intro-sequence">
          <div><i>01</i><span><b>See what’s changing.</b><small>Bring training, nutrition, movement and body data into one story.</small></span></div>
          <div><i>02</i><span><b>Understand what it means.</b><small>Arc waits for enough evidence before calling something a pattern.</small></span></div>
          <div><i>03</i><span><b>Adjust with confidence.</b><small>Build around what appears to work for your body—not generic rules.</small></span></div>
        </div>
        <button class="btn intro-cta" data-go="onboard">Build My Baseline →</button>
        <p class="tiny muted privacy-note">Private by default · Your POC data stays on this device</p>
      </div>
      <div class="intro-visual">
        <div class="intro-orbit orbit-one"></div><div class="intro-orbit orbit-two"></div>
        <div class="intro-body-line"></div>
        <div class="intro-signal s1"><span>TRAIN</span><b>Consistency</b></div>
        <div class="intro-signal s2"><span>BODY</span><b>Measurements</b></div>
        <div class="intro-signal s3"><span>FUEL</span><b>Nutrition</b></div>
        <div class="intro-center"><span>✦</span><b>YOUR ARC</b><small>Track less.<br>Understand more.</small></div>
      </div>
    </div>
  </div>`)
};

onboard=function(){
  const n=S.on,p=S.profile;
  const chapter=[
    ['Define success','What would you like to change?','Choose what matters. Your first selection becomes the primary goal Arc watches most closely.'],
    ['Your why','Why does this matter to you?','Optional, but useful context for keeping your plan connected to real life.'],
    ['Starting point','Give Arc a baseline.','These numbers are reference points—not grades. You can skip what you don’t want to track.'],
    ['Real life','What does a normal day look like?','Arc should fit the life you actually have, not the week you wish you had.'],
    ['Training','Build around your reality.','Choose a schedule you can repeat. Consistency gives Arc better evidence than perfection.'],
    ['Nutrition','Track on your terms.','Choose the level of detail that feels sustainable. More logging is not automatically better.']
  ][n-1];
  let content='';
  if(n===1) content=`<div class="field-block"><label>Your name</label><input id="name" class="input" placeholder="First name" value="${esc(p.name||'Kimberly')}"></div><div class="goal-grid">${goals.map((g,i)=>`<label class="goal-card"><input class="goal" type="checkbox" value="${g}" ${p.goals.includes(g)?'checked':''}><span class="goal-number">0${i+1}</span><b>${g}</b><small>${['Change body composition','Support lean mass','Build measurable capability','Improve work capacity','Feel more at home in your body','Support daily capacity','Build repeatable habits','Create a stronger foundation','Connect the dots'][i]}</small></label>`).join('')}</div>`;
  if(n===2) content=`<div class="why-card"><span class="eyebrow">Context, not pressure</span><textarea id="why" class="input why-input" rows="7" placeholder="I want to feel stronger, more confident, and have more energy for the life I care about...">${esc(p.why)}</textarea><div class="why-example"><span>Example</span><p>“I want to feel comfortable in my clothes again and have more energy with my family.”</p></div></div>`;
  if(n===3) content=`<div class="baseline-entry-grid"><div class="metric-entry"><span>01</span><label>Weight</label><div><input id="weight" class="input" type="number" step="0.1" value="${p.weight}" placeholder="—"><b>lb</b></div><small>Optional</small></div><div class="metric-entry"><span>02</span><label>Waist</label><div><input id="waist" class="input" type="number" step="0.1" value="${p.waist}" placeholder="—"><b>in</b></div><small>Optional</small></div></div><div class="measurement-note"><span>✦</span><div><b>The trend is the story.</b><p>One number can fluctuate. Arc becomes more useful when repeated measurements are viewed alongside your behaviors.</p></div></div>`;
  if(n===4) content=`<div class="choice-grid-v033">${['Mostly sitting','A mix of sitting and moving','Mostly moving','Very physical'].map((x,i)=>`<label class="select-card"><input name="life" value="${x}" type="radio" ${p.life===x?'checked':''}><span class="select-icon">${['▰','◫','↗','◆'][i]}</span><b>${x}</b></label>`).join('')}</div><div class="field-block sleep-block"><label>Typical sleep</label><select id="sleep" class="input">${['5 or less','6','7','8','9+'].map(x=>`<option ${p.sleep===x?'selected':''}>${x}</option>`).join('')}</select><small>hours / night</small></div>`;
  if(n===5) content=`<div class="training-two-col"><div><label class="field-label">Where do you train?</label><div class="choice-grid-v033 compact">${['Home','Gym','Home + Gym'].map((x,i)=>`<label class="select-card"><input name="locVisual" type="radio" data-location-choice="${x}" ${p.location===x?'checked':''}><span class="select-icon">${['⌂','▦','◐'][i]}</span><b>${x}</b></label>`).join('')}</div><label class="field-label">Experience</label><select id="experience" class="input">${['New — teach me everything','Know the basics','Experienced — give me control'].map(x=>`<option ${p.experience===x?'selected':''}>${x}</option>`).join('')}</select><input type="hidden" id="location" value="${esc(p.location)}"></div><div><label class="field-label">Realistically, how many days?</label><div class="number-pills">${[1,2,3,4,5].map(x=>`<button type="button" data-days="${x}" class="${p.days===x?'active':''}">${x}</button>`).join('')}</div><p class="tiny muted">${p.days} day${p.days===1?'':'s'} per week</p><label class="field-label duration-label">Time per workout</label><div class="number-pills duration-pills">${[20,30,45,60].map(x=>`<button type="button" data-duration="${x}" class="${p.duration===x?'active':''}">${x}<small>min</small></button>`).join('')}</div></div></div>`;
  if(n===6) content=`<div class="nutrition-mode-grid">${['Simple — better choices, less logging','Guided — calories + protein','Detailed — calories + macros','Not right now'].map((x,i)=>`<label class="nutrition-mode"><input name="nut" value="${x}" type="radio" ${p.nutrition===x?'checked':''}><div><span>${['LIGHT TOUCH','RECOMMENDED','FULL DETAIL','SKIP FOR NOW'][i]}</span><b>${x.split(' — ')[0]}</b><p>${['Focus on consistency without numbers.','Enough structure to create useful context.','Track calories, protein and macros.','Arc can still learn from training and body data.'][i]}</p></div></label>`).join('')}</div><div class="measurement-note"><span>✦</span><div><b>You control the depth.</b><p>Arc should earn a place in your routine. Tracking can become more detailed later if it adds value.</p></div></div>`;

  shell(`<div class="onboarding-shell">
    <div class="arc-brandbar intro-brand"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>BUILD YOUR BASELINE</small></div><span class="step-count">${String(n).padStart(2,'0')} / 06</span></div>
    <div class="onboard-progress"><i style="width:${n/6*100}%"></i></div>
    <div class="onboard-layout">
      <aside class="chapter-rail"><span class="eyebrow">Chapter ${String(n).padStart(2,'0')}</span><h1>${chapter[1]}</h1><p>${chapter[2]}</p><div class="chapter-list">${['Success','Why','Body','Life','Training','Nutrition'].map((x,i)=>`<div class="${i===n-1?'active':''} ${i<n-1?'done':''}"><i>${i<n-1?'✓':String(i+1).padStart(2,'0')}</i><span>${x}</span></div>`).join('')}</div></aside>
      <section class="onboard-content"><span class="eyebrow">${chapter[0]}</span>${content}<div class="onboard-actions"><button class="btn secondary back-btn" data-back>← Back</button><button class="btn next-btn" data-next>${n===6?'Build My Baseline →':'Continue →'}</button></div></section>
    </div>
  </div>`)
};

baseline=function(){
  const p=S.profile,q=plan();
  const primary=p.primary||p.goals[0]||'Improve overall health';
  const nutrition=String(p.nutrition||'Guided — calories + protein').split(' — ')[0];
  shell(`<div class="onboarding-shell reveal-shell">
    <div class="arc-brandbar intro-brand"><div class="arc-wordmark"><span class="arc-mini-mark"></span><b>ARC</b><small>YOUR STARTING POINT</small></div><span class="tiny muted">BASELINE READY</span></div>
    <div class="reveal-head"><span class="eyebrow">Your baseline is ready</span><h1>${esc(p.name||'Kimberly')}, this is where your Arc begins.</h1><p>Not a verdict. A hypothesis Arc can now test against what your body actually does.</p></div>
    <div class="reveal-grid">
      <div class="reveal-primary">
        <div class="baseline-visual"><div class="reveal-orbit r1"></div><div class="reveal-orbit r2"></div><div class="baseline-center"><span>✦</span><b>START</b><small>YOUR ARC</small></div><div class="baseline-tag bt1"><span>GOAL</span><b>${esc(primary)}</b></div><div class="baseline-tag bt2"><span>TRAIN</span><b>${p.days} × ${p.duration} min</b></div><div class="baseline-tag bt3"><span>FUEL</span><b>${esc(nutrition)}</b></div><div class="baseline-tag bt4"><span>BODY</span><b>${p.weight?p.weight+' lb':'Optional'}${p.waist?' · '+p.waist+' in waist':''}</b></div></div>
        ${p.why?`<div class="why-reveal"><span class="eyebrow">Why this matters</span><h3>“${esc(p.why)}”</h3></div>`:''}
      </div>
      <div class="reveal-detail">
        <div class="card first-focus"><span class="eyebrow">Your First Focus</span><h2>${q.focus}.</h2><p>For now, Arc needs repeatable behavior more than perfect behavior.</p><div class="focus-lines"><div><i>01</i><span><b>${p.days} planned strength sessions</b><small>${p.duration} minutes each · ${esc(p.location)}</small></span></div><div><i>02</i><span><b>${esc(nutrition)} nutrition</b><small>Enough context to begin spotting patterns.</small></span></div><div><i>03</i><span><b>Weekly body check-in</b><small>Trends matter more than daily fluctuations.</small></span></div></div></div>
        <div class="card signal hypothesis-card"><div class="signal-orb">✦</div><div><span class="eyebrow">Body Intelligence</span><h3>We’re starting with a hypothesis.</h3><p>Arc will watch what you do, how consistently you do it, and what changes. It will not call something a Signal until the evidence earns it.</p></div></div>
        <div class="learning-stages"><div><b>WEEK 1</b><span>Baseline</span><small>Collect context</small></div><div><b>WEEKS 2–4</b><span>Patterns</span><small>Compare behaviors</small></div><div><b>WEEK 4+</b><span>Signals</span><small>Earn confidence</small></div></div>
        <button class="btn start-arc-cta" data-start>Start My Arc →</button>
        <p class="center tiny muted">Your plan can change. That’s the point.</p>
      </div>
    </div>
  </div>`)
};

// Location selector is visual in 0.3.3; synchronize it to the existing 0.2 data model.
document.addEventListener('change',e=>{const x=e.target.closest('[data-location-choice]');if(x){S.profile.location=x.dataset.locationChoice;const hidden=document.querySelector('#location');if(hidden)hidden.value=x.dataset.locationChoice;save();}});

if(typeof S!=='undefined' && ['welcome','onboard','baseline'].includes(S.screen)) render();
