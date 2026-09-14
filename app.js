import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const state = {
  user: null,
  profile: null,
  target: null,
  arc: null,
  measurements: [],
  workouts: [],
  wearable: [],
  activeView: 'today',
  activeSession: null
};

const $ = (id) => document.getElementById(id);
const authGate = $('authGate');
const setupGate = $('setupGate');
const app = $('app');
const toast = $('toast');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function poundsToKg(v) { return v ? Number(v) * 0.45359237 : null; }
function kgToPounds(v) { return v == null ? null : Number(v) / 0.45359237; }
function inchesToCm(v) { return v ? Number(v) * 2.54 : null; }
function cmToInches(v) { return v == null ? null : Number(v) / 2.54; }
function fmt(v, digits = 1) { return Number(v).toFixed(digits); }
function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

function setView(view) {
  state.activeView = view;
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active-view', el.id === `view-${view}`));
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-view], [data-view-target]');
  if (nav) setView(nav.dataset.view || nav.dataset.viewTarget);
});

function setDateGreeting() {
  const now = new Date();
  $('dateLabel').textContent = now.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });
  const hour = now.getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const name = state.profile?.display_name?.trim()?.split(' ')[0];
  $('greeting').textContent = `Good ${part}${name ? `, ${name}` : ''}.`;
  $('profileInitial').textContent = name?.[0]?.toUpperCase() || state.user?.email?.[0]?.toUpperCase() || 'A';
}

async function initialize() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) await enterApp(session.user);
  else showAuth();
}

function showAuth() {
  state.user = null;
  authGate.classList.remove('hidden');
  app.classList.add('hidden');
  setupGate.classList.add('hidden');
}

async function enterApp(user) {
  state.user = user;
  authGate.classList.add('hidden');
  app.classList.remove('hidden');
  await loadData();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginMessage').textContent = 'Signing in…';
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { $('loginMessage').textContent = error.message; return; }
  $('loginMessage').textContent = '';
  await enterApp(data.user);
});

$('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  showAuth();
});

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) showAuth();
});

async function loadData() {
  if (!state.user) return;
  const uid = state.user.id;
  const [profileRes, targetRes, arcRes, measurementsRes, workoutsRes, wearableRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('weekly_targets').select('*').eq('user_id', uid).order('starts_on', { ascending:false }).limit(1).maybeSingle(),
    supabase.from('arc_progress_28d').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('body_measurements').select('*').eq('user_id', uid).order('measured_at', { ascending:false }).limit(30),
    supabase.from('workout_sessions').select('*').eq('user_id', uid).eq('status','completed').order('completed_at', { ascending:false }).limit(20),
    supabase.from('wearable_daily_metrics').select('*').eq('user_id', uid).order('metric_date', { ascending:false }).limit(14)
  ]);

  const firstError = [profileRes,targetRes,arcRes,measurementsRes,workoutsRes,wearableRes].find(r => r.error)?.error;
  if (firstError) showToast(`Data error: ${firstError.message}`);

  state.profile = profileRes.data;
  state.target = targetRes.data;
  state.arc = arcRes.data;
  state.measurements = measurementsRes.data || [];
  state.workouts = workoutsRes.data || [];
  state.wearable = wearableRes.data || [];

  setDateGreeting();
  renderAll();
  if (!state.target) setupGate.classList.remove('hidden');
  else setupGate.classList.add('hidden');
}

$('setupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const uid = state.user.id;
  const equipment = $('setupEquipment').value.split(',').map(x => x.trim()).filter(Boolean);
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: uid,
    display_name: $('setupName').value.trim() || null,
    primary_goal: $('setupGoal').value.trim() || null,
    equipment,
    preferred_units: 'imperial',
    updated_at: new Date().toISOString()
  });
  if (profileError) { showToast(profileError.message); return; }
  const { error: targetError } = await supabase.from('weekly_targets').insert({
    user_id: uid,
    starts_on: localISODate(),
    workouts_per_week: Number($('setupTarget').value)
  });
  if (targetError) { showToast(targetError.message); return; }
  setupGate.classList.add('hidden');
  showToast('Your Arc is set.');
  await loadData();
});

function renderAll() {
  renderToday();
  renderArc();
  renderBody();
  renderRecentWorkouts();
}

function arcPresentation() {
  const a = state.arc;
  if (!a) return { actual:null, visual:0, state:'learning', headline:'Build the pattern.', copy:'Your Arc starts with your first week of intentional training.' };
  const actual = Number(a.adherence_pct || 0);
  const visual = Number(a.arc_completion_pct || 0);
  const map = {
    learning:['Build your baseline.','Arc is watching the pattern form. After seven days, consistency becomes meaningful.'],
    build_momentum:['Build momentum.','The target is still within reach. One deliberate session can change the shape of the week.'],
    closing_the_arc:['Closing the Arc.','You are close to the success zone. Keep the pressure on without chasing perfection.'],
    in_your_arc:['In your Arc.','Aggressive enough to make progress. Flexible enough to sustain it.']
  };
  const [headline,copy] = map[a.arc_state] || map.learning;
  return { actual, visual, state:a.arc_state, headline, copy };
}

function setGauge(el, visualPct) {
  const degrees = Math.max(0, Math.min(100, visualPct)) * 3;
  el.style.setProperty('--progress', `${degrees}deg`);
}

function renderToday() {
  const arc = arcPresentation();
  setGauge($('arcGauge'), arc.visual);
  $('arcPercent').textContent = arc.actual == null ? '—' : `${Math.round(arc.actual)}%`;
  $('arcGaugeLabel').textContent = arc.state === 'in_your_arc' ? 'SUCCESS' : arc.state === 'learning' ? 'BUILDING' : 'PROGRESS';
  $('heroHeadline').textContent = arc.headline;
  $('heroSubhead').textContent = arc.copy;
  $('consistencyMetric').textContent = arc.actual == null ? '—' : `${Math.round(arc.actual)}%`;
  $('workoutsMetric').textContent = state.arc?.completed_workouts ?? state.workouts.length;
  $('workoutsMetricSub').textContent = state.target ? `${state.target.workouts_per_week} planned per week` : 'Set your weekly target';

  if (state.measurements.length) {
    const latest = state.measurements[0];
    if (latest.weight_kg) {
      $('bodyMetric').textContent = `${fmt(kgToPounds(latest.weight_kg))} lb`;
      $('bodyMetricSub').textContent = 'Latest weight';
    } else {
      $('bodyMetric').textContent = 'Checked in';
      $('bodyMetricSub').textContent = new Date(latest.measured_at).toLocaleDateString();
    }
  } else {
    $('bodyMetric').textContent = 'No baseline';
    $('bodyMetricSub').textContent = 'Log a measurement';
  }
}

function renderRecentWorkouts() {
  const el = $('recentWorkouts');
  if (!state.workouts.length) { el.className='list-stack empty-state'; el.textContent='No workouts logged yet.'; return; }
  el.className='list-stack';
  el.innerHTML = state.workouts.slice(0,5).map(w => `<div class="list-row"><div><strong>${escapeHTML(w.name)}</strong><small>${new Date(w.completed_at).toLocaleDateString()}${w.perceived_effort ? ` · effort ${w.perceived_effort}/10` : ''}</small></div><span class="pill">Complete</span></div>`).join('');
}

function renderArc() {
  const arc = arcPresentation();
  setGauge($('arcLargeGauge'), arc.visual);
  $('arcLargePercent').textContent = arc.actual == null ? '—' : `${Math.round(arc.actual)}%`;
  $('arcStatePill').textContent = arc.state.split('_').map(x => x[0].toUpperCase()+x.slice(1)).join(' ');
  $('arcStateHeadline').textContent = arc.headline;
  $('arcStateCopy').textContent = arc.copy;
}

function measurementDelta(field, converter = x => x, unit = '') {
  const points = [...state.measurements].filter(x => x[field] != null).reverse();
  if (!points.length) return null;
  const current = converter(points.at(-1)[field]);
  const baseline = converter(points[0][field]);
  return { current, baseline, delta: current - baseline, unit };
}

function renderBody() {
  const summary = $('bodySummary');
  const items = [
    ['Weight',measurementDelta('weight_kg',kgToPounds,'lb')],
    ['Waist',measurementDelta('waist_cm',cmToInches,'in')],
    ['Hips',measurementDelta('hips_cm',cmToInches,'in')],
    ['Chest',measurementDelta('chest_cm',cmToInches,'in')]
  ];
  summary.innerHTML = items.map(([label,d]) => {
    if (!d) return `<article class="summary-card"><span>${label}</span><strong>—</strong><small>Need data</small></article>`;
    const delta = `${d.delta > 0 ? '+' : ''}${fmt(d.delta)} ${d.unit}`;
    return `<article class="summary-card"><span>${label}</span><strong>${fmt(d.current)} ${d.unit}</strong><small class="${d.delta <= 0 ? 'good' : 'attention'}">${delta} from baseline</small></article>`;
  }).join('');
  renderWeightChart();
  renderMeasurementHistory();
}

function renderWeightChart() {
  const el = $('weightChart');
  const points = [...state.measurements].filter(m => m.weight_kg != null).reverse();
  if (points.length < 2) { el.className='weight-chart empty-state'; el.textContent='Log at least two weight check-ins to see your trend.'; $('weightTrendLabel').textContent='Need data'; return; }
  el.className='weight-chart';
  const vals = points.map(p => kgToPounds(p.weight_kg));
  const min = Math.min(...vals)-2, max = Math.max(...vals)+2;
  const w=900,h=220,pad=24;
  const xy = vals.map((v,i) => ({ x:pad + (i/(vals.length-1))*(w-pad*2), y:pad + ((max-v)/(max-min))*(h-pad*2) }));
  const poly = xy.map(p=>`${p.x},${p.y}`).join(' ');
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Weight trend"><line class="grid-line" x1="${pad}" y1="55" x2="${w-pad}" y2="55"/><line class="grid-line" x1="${pad}" y1="110" x2="${w-pad}" y2="110"/><line class="grid-line" x1="${pad}" y1="165" x2="${w-pad}" y2="165"/><polyline class="trend-line" points="${poly}"/>${xy.map(p=>`<circle class="dot" cx="${p.x}" cy="${p.y}" r="5"/>`).join('')}</svg>`;
  const delta = vals.at(-1)-vals[0];
  $('weightTrendLabel').textContent = `${delta>0?'+':''}${fmt(delta)} lb`;
}

function renderMeasurementHistory() {
  const el = $('measurementHistory');
  if (!state.measurements.length) { el.className='table-wrap empty-state'; el.textContent='No measurements yet.'; return; }
  el.className='table-wrap';
  const val=(v,conv,unit)=>v==null?'—':`${fmt(conv(v))} ${unit}`;
  el.innerHTML=`<table class="measurement-table"><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>Hips</th><th>Chest</th><th>Arm</th><th>Thigh</th></tr></thead><tbody>${state.measurements.map(m=>`<tr><td>${new Date(m.measured_at).toLocaleDateString()}</td><td>${val(m.weight_kg,kgToPounds,'lb')}</td><td>${val(m.waist_cm,cmToInches,'in')}</td><td>${val(m.hips_cm,cmToInches,'in')}</td><td>${val(m.chest_cm,cmToInches,'in')}</td><td>${val(m.arm_cm,cmToInches,'in')}</td><td>${val(m.thigh_cm,cmToInches,'in')}</td></tr>`).join('')}</tbody></table>`;
}

$('toggleMeasurementForm').addEventListener('click',()=> $('measurementFormPanel').classList.toggle('hidden'));
$('measurementForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const read=(id,conv)=>$(id).value ? conv($(id).value) : null;
  const row={
    user_id:state.user.id,
    weight_kg:read('weightInput',poundsToKg),
    waist_cm:read('waistInput',inchesToCm),
    hips_cm:read('hipsInput',inchesToCm),
    chest_cm:read('chestInput',inchesToCm),
    arm_cm:read('armInput',inchesToCm),
    thigh_cm:read('thighInput',inchesToCm),
    note:$('measurementNote').value.trim()||null
  };
  if (![row.weight_kg,row.waist_cm,row.hips_cm,row.chest_cm,row.arm_cm,row.thigh_cm].some(v=>v!=null)) { showToast('Add at least one measurement.'); return; }
  const { error }=await supabase.from('body_measurements').insert(row);
  if(error){showToast(error.message);return;}
  $('measurementForm').reset(); $('measurementFormPanel').classList.add('hidden'); showToast('Measurement logged.'); await loadData();
});

function chooseRecommendedTier(energy,soreness,desired) {
  if (energy <= 2 || soreness >= 4) return 'restore';
  if (desired === 'push' && energy >= 4 && soreness <= 2) return 'push';
  return 'build';
}

function exerciseLibrary(hasEquipment) {
  if (hasEquipment) return {
    restore:[['Mobility Flow',2,'6 min'],['Goblet Squat',2,'10'],['Incline Dumbbell Press',2,'10'],['Dead Bug',2,'8 / side']],
    build:[['Goblet Squat',3,'8–10'],['Dumbbell Bench Press',3,'8–10'],['One-Arm Row',3,'10 / side'],['Romanian Deadlift',3,'10'],['Plank',3,'30 sec']],
    push:[['Dumbbell Front Squat',4,'8'],['Dumbbell Bench Press',4,'8'],['Romanian Deadlift',4,'8'],['One-Arm Row',4,'10 / side'],['DB Thruster Finisher',3,'10']]
  };
  return {
    restore:[['Mobility Flow',2,'6 min'],['Bodyweight Squat',2,'10'],['Incline Push-Up',2,'8'],['Dead Bug',2,'8 / side']],
    build:[['Tempo Squat',3,'12'],['Push-Up',3,'8–12'],['Reverse Lunge',3,'10 / side'],['Glute Bridge',3,'15'],['Plank',3,'30 sec']],
    push:[['Jump Squat',4,'10'],['Push-Up',4,'10–15'],['Walking Lunge',4,'12 / side'],['Single-Leg Glute Bridge',3,'12 / side'],['Mountain Climber',4,'30 sec']]
  };
}

$('readinessForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const energy=Number(fd.get('energy')), soreness=Number(fd.get('soreness')), minutes=Number(fd.get('minutes')), desired=fd.get('effort');
  const limitations=$('limitations').value.trim()||null;
  const recommended=chooseRecommendedTier(energy,soreness,desired);
  const { data:checkin,error:checkinError }=await supabase.from('readiness_checkins').insert({user_id:state.user.id,energy,soreness,available_minutes:minutes,desired_effort:desired,limitations}).select().single();
  if(checkinError){showToast(checkinError.message);return;}
  const summary=recommended==='restore'?'Recovery wins today. Keep the habit without forcing intensity.':recommended==='push'?'You have the runway to press.':'Balanced work is the best fit for today.';
  const { data:set,error:setError }=await supabase.from('workout_recommendation_sets').insert({user_id:state.user.id,checkin_id:checkin.id,recommendation_summary:summary,context_snapshot:{energy,soreness,minutes,desired,limitations},generator_version:'phase1-rules-v1'}).select().single();
  if(setError){showToast(setError.message);return;}
  const hasEquipment=(state.profile?.equipment||[]).length>0;
  const durations={restore:Math.min(minutes,20),build:Math.min(minutes,35),push:Math.min(minutes,50)};
  const configs={
    restore:{title:'Restore',focus:'Mobility + Recovery',intensity:'low',rationale:'Move well, reduce friction and protect the training habit.'},
    build:{title:'Build',focus:'Strength + Full Body',intensity:'moderate',rationale:'A balanced session that moves strength forward without emptying the tank.'},
    push:{title:'Push',focus:'Strength + Conditioning',intensity:'high',rationale:'Use the energy you have today for a demanding, focused session.'}
  };
  const optionRows=Object.entries(configs).map(([tier,c])=>({user_id:state.user.id,recommendation_set_id:set.id,tier,title:c.title,focus:c.focus,duration_minutes:Math.max(15,durations[tier]),intensity:c.intensity,rationale:c.rationale,equipment:state.profile?.equipment||[],is_recommended:tier===recommended}));
  const { data:options,error:optionError }=await supabase.from('workout_options').insert(optionRows).select();
  if(optionError){showToast(optionError.message);return;}
  const lib=exerciseLibrary(hasEquipment);
  const exerciseRows=[];
  options.forEach(o=>lib[o.tier].forEach((x,i)=>exerciseRows.push({user_id:state.user.id,workout_option_id:o.id,sort_order:i+1,exercise_name:x[0],target_sets:x[1],target_reps:x[2]})));
  const { error:exerciseError }=await supabase.from('workout_option_exercises').insert(exerciseRows);
  if(exerciseError){showToast(exerciseError.message);return;}
  renderWorkoutOptions(options,summary);
  showToast('Three paths forward. You choose.');
});

async function renderWorkoutOptions(options, summary) {
  const el=$('workoutOptions'); el.classList.remove('hidden'); $('activeWorkout').classList.add('hidden');
  const order={restore:0,build:1,push:2}; options.sort((a,b)=>order[a.tier]-order[b.tier]);
  const icons={restore:'◌',build:'△',push:'ϟ'};
  el.innerHTML=options.map(o=>`<article class="workout-card ${o.tier} ${o.is_recommended?'recommended':''}">${o.is_recommended?'<span class="recommend-badge">ARC RECOMMENDS</span>':''}<div class="workout-tier">${icons[o.tier]}</div><h3>${o.title}</h3><span class="workout-meta">${o.focus}</span><div class="workout-points"><span>◷ ${o.duration_minutes} min</span><span>◇ ${o.intensity} intensity</span></div><p>${o.rationale}</p><button class="button ${o.is_recommended?'button-primary':''}" data-start-option="${o.id}" data-option-name="${o.title}">Choose ${o.title}</button></article>`).join('');
  el.insertAdjacentHTML('beforebegin',`<p id="recommendationSummary" class="eyebrow" style="margin-top:18px">${escapeHTML(summary)}</p>`);
  el.querySelectorAll('[data-start-option]').forEach(btn=>btn.addEventListener('click',()=>startWorkout(btn.dataset.startOption,btn.dataset.optionName)));
}

async function startWorkout(optionId,name) {
  const { data:session,error }=await supabase.from('workout_sessions').insert({user_id:state.user.id,source_option_id:optionId,name,status:'in_progress',started_at:new Date().toISOString()}).select().single();
  if(error){showToast(error.message);return;}
  const { data:plan,error:planError }=await supabase.from('workout_option_exercises').select('*').eq('workout_option_id',optionId).order('sort_order');
  if(planError){showToast(planError.message);return;}
  const rows=plan.map(x=>({user_id:state.user.id,workout_session_id:session.id,sort_order:x.sort_order,exercise_name:x.exercise_name,notes:`Target: ${x.target_sets||''} x ${x.target_reps||''}`}));
  const { error:copyError }=await supabase.from('workout_session_exercises').insert(rows);
  if(copyError){showToast(copyError.message);return;}
  state.activeSession={...session,plan};
  renderActiveWorkout();
}

function renderActiveWorkout() {
  const s=state.activeSession, el=$('activeWorkout');
  if(!s){el.classList.add('hidden');return;}
  $('workoutOptions').classList.add('hidden');
  document.getElementById('recommendationSummary')?.remove();
  el.classList.remove('hidden');
  el.innerHTML=`<div class="active-workout-header"><div><span class="eyebrow">Live workout</span><h2>${escapeHTML(s.name)}</h2></div><button id="favoriteActive" class="text-button">♡ Favorite</button></div><div class="exercise-log">${s.plan.map(x=>`<div class="exercise-log-row"><strong>${escapeHTML(x.exercise_name)}</strong><small>${x.target_sets||''} sets · ${escapeHTML(x.target_reps||'')}</small></div>`).join('')}</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px"><button id="completeWorkout" class="button button-primary">Complete workout</button><button id="abandonWorkout" class="button">End without counting</button></div>`;
  $('favoriteActive').addEventListener('click',async()=>{
    const {error}=await supabase.from('saved_workouts').insert({user_id:state.user.id,workout_session_id:s.id});
    if(error && error.code!=='23505'){showToast(error.message);return;} showToast('Workout saved to favorites.'); $('favoriteActive').textContent='♥ Favorited';
  });
  $('completeWorkout').addEventListener('click',()=>finishWorkout(true));
  $('abandonWorkout').addEventListener('click',()=>finishWorkout(false));
}

async function finishWorkout(counts) {
  const s=state.activeSession; if(!s)return;
  const patch=counts?{status:'completed',completed_at:new Date().toISOString(),counts_toward_arc:true}:{status:'abandoned',completed_at:null,counts_toward_arc:false};
  const {error}=await supabase.from('workout_sessions').update(patch).eq('id',s.id);
  if(error){showToast(error.message);return;}
  state.activeSession=null; $('activeWorkout').classList.add('hidden'); $('readinessForm').reset(); showToast(counts?'Workout complete. The pattern moved forward.':'Workout ended without affecting your Arc.'); await loadData(); setView('today');
}

initialize();
