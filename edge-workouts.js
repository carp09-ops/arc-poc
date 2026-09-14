import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
let activeUserId = null;

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Your session has expired. Sign in again.');
  activeUserId = data.user.id;
  return data.user;
}

function youtubeFormUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} proper form tutorial`)}`;
}

function poundsToKg(v) { return v === '' || v == null ? null : Number(v) * 0.45359237; }
function kgToPounds(v) { return v == null ? '' : (Number(v) / 0.45359237).toFixed(1).replace('.0',''); }

function whyArcOffers(tier, context, isRecommended) {
  const energy = Number(context.energy);
  const soreness = Number(context.soreness);
  const minutes = Number(context.available_minutes);
  const desired = context.desired_effort;
  const prefix = isRecommended ? 'Arc recommends this because' : 'Arc keeps this option available because';
  if (tier === 'restore') {
    if (energy <= 2 || soreness >= 4) return `${prefix} you reported ${energy}/5 energy and ${soreness}/5 soreness. It protects the habit while lowering the cost of showing up.`;
    return `${prefix} consistency still counts on lighter days. This gives you a ${Math.min(minutes, 20)}-minute path that keeps momentum without forcing intensity.`;
  }
  if (tier === 'push') {
    if (energy >= 4 && soreness <= 2) return `${prefix} your ${energy}/5 energy and ${soreness}/5 soreness suggest you have room for a harder session today.`;
    return `${prefix} you may still want a higher-effort choice. Use it only if your warm-up confirms that your body feels ready.`;
  }
  if (desired === 'build') return `${prefix} you asked for a balanced effort, with ${minutes} minutes available. It is the middle path between recovery and an all-out day.`;
  return `${prefix} your ${energy}/5 energy, ${soreness}/5 soreness and ${minutes}-minute window support a productive middle-ground session.`;
}

async function loadExercisePreviews(options) {
  const ids = options.map(o => o.id).filter(Boolean);
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from('workout_option_exercises')
    .select('workout_option_id,sort_order,exercise_name,target_sets,target_reps')
    .in('workout_option_id', ids).order('sort_order');
  if (error) throw error;
  const grouped = new Map();
  for (const row of data || []) {
    if (!grouped.has(row.workout_option_id)) grouped.set(row.workout_option_id, []);
    grouped.get(row.workout_option_id).push(row);
  }
  return grouped;
}

async function renderWorkoutOptions(options, summary, context) {
  document.getElementById('recommendationSummary')?.remove();
  const el = $('workoutOptions');
  if (!el) return;
  el.classList.remove('hidden');
  $('activeWorkout')?.classList.add('hidden');
  const exerciseMap = await loadExercisePreviews(options);
  const order = { restore: 0, build: 1, push: 2 };
  const icons = { restore: '◌', build: '△', push: 'ϟ' };
  options.sort((a, b) => order[a.tier] - order[b.tier]);
  el.innerHTML = options.map(o => {
    const moves = exerciseMap.get(o.id) || [];
    const why = whyArcOffers(o.tier, context, o.is_recommended);
    const preview = moves.map(move => `
      <div class="preview-move"><div><strong>${escapeHTML(move.exercise_name)}</strong><small>${move.target_sets || ''} sets · ${escapeHTML(move.target_reps || '')}</small></div><a class="form-link" href="${youtubeFormUrl(move.exercise_name)}" target="_blank" rel="noopener noreferrer">Form ↗</a></div>`).join('');
    return `
      <article class="workout-card ${o.tier} ${o.is_recommended ? 'recommended' : ''}">
        ${o.is_recommended ? '<span class="recommend-badge">ARC RECOMMENDS</span>' : ''}
        <div class="workout-tier">${icons[o.tier] || '△'}</div><h3>${escapeHTML(o.title)}</h3><span class="workout-meta">${escapeHTML(o.focus || '')}</span>
        <div class="workout-points"><span>◷ ${o.duration_minutes} min</span><span>◇ ${escapeHTML(o.intensity)} intensity</span></div>
        <div class="why-box"><strong>${o.is_recommended ? 'Why Arc recommends this' : 'Why Arc offers this'}</strong><p>${escapeHTML(why)}</p></div>
        <p>${escapeHTML(o.rationale || '')}</p><div class="workout-preview"><span>Workout preview</span>${preview || '<small>Preview unavailable.</small>'}</div>
        <button class="button ${o.is_recommended ? 'button-primary' : ''}" data-edge-start-option="${o.id}" data-edge-option-name="${escapeHTML(o.title)}">Choose ${escapeHTML(o.title)}</button>
      </article>`;
  }).join('');
  el.insertAdjacentHTML('beforebegin', `<p id="recommendationSummary" class="eyebrow" style="margin-top:18px">${escapeHTML(summary || '')}</p>`);
  el.querySelectorAll('[data-edge-start-option]').forEach(btn => btn.addEventListener('click', () => startWorkout(btn.dataset.edgeStartOption, btn.dataset.edgeOptionName)));
}

async function startWorkout(optionId, name) {
  try {
    const user = await currentUser();
    const { data: session, error } = await supabase.from('workout_sessions').insert({user_id:user.id,source_option_id:optionId,name,status:'in_progress',started_at:new Date().toISOString()}).select().single();
    if (error) throw error;
    const { data: plan, error: planError } = await supabase.from('workout_option_exercises').select('*').eq('workout_option_id', optionId).order('sort_order');
    if (planError) throw planError;
    const rows = plan.map(x => ({user_id:user.id,workout_session_id:session.id,sort_order:x.sort_order,exercise_name:x.exercise_name,notes:`Target: ${x.target_sets || ''} x ${x.target_reps || ''}`}));
    const { data: copied, error: copyError } = await supabase.from('workout_session_exercises').insert(rows).select();
    if (copyError) throw copyError;
    const livePlan = (copied || []).sort((a,b)=>a.sort_order-b.sort_order).map((row,i)=>({...plan[i],session_exercise_id:row.id}));
    renderActiveWorkout({ ...session, plan: livePlan });
  } catch (error) { toast(error.message || 'Could not start workout.'); }
}

function parseTarget(notes='') {
  const match = String(notes).match(/Target:\s*(\d+)\s*x\s*(.+)$/i);
  return { target_sets: match ? Number(match[1]) : 3, target_reps: match ? match[2] : '' };
}

function isTimedTarget(target='') { return /sec|min|second|minute/i.test(String(target)); }

function setRowHTML(exercise, setNumber, existing = null) {
  const timed = isTimedTarget(exercise.target_reps);
  const reps = existing?.reps ?? '';
  const duration = existing?.duration_seconds ?? '';
  const weight = existing?.weight_kg == null ? '' : kgToPounds(existing.weight_kg);
  return `<div class="live-set-row ${existing?.completed ? 'set-complete' : ''}" data-exercise-id="${exercise.session_exercise_id}" data-set-number="${setNumber}" data-set-id="${existing?.id || ''}">
    <span class="set-number">${setNumber}</span>
    ${timed ? `<label><span>Seconds</span><input class="set-duration" type="number" min="0" inputmode="numeric" value="${duration}" placeholder="${escapeHTML(exercise.target_reps || '')}"></label>` : `<label><span>Reps</span><input class="set-reps" type="number" min="0" inputmode="numeric" value="${reps}" placeholder="${escapeHTML(exercise.target_reps || '')}"></label>`}
    <label><span>Weight lb</span><input class="set-weight" type="number" min="0" step="0.5" inputmode="decimal" value="${weight}" placeholder="—"></label>
    <label class="set-done"><input class="set-completed" type="checkbox" ${existing?.completed ? 'checked' : ''}><span>Done</span></label>
    <span class="set-save-state" aria-live="polite"></span>
  </div>`;
}

async function loadExistingSets(plan) {
  const ids = plan.map(x=>x.session_exercise_id).filter(Boolean);
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from('workout_sets').select('*').in('workout_exercise_id', ids).order('set_number');
  if (error) throw error;
  const map = new Map();
  for (const row of data || []) {
    if (!map.has(row.workout_exercise_id)) map.set(row.workout_exercise_id, []);
    map.get(row.workout_exercise_id).push(row);
  }
  return map;
}

async function renderActiveWorkout(session) {
  $('workoutOptions')?.classList.add('hidden');
  document.getElementById('recommendationSummary')?.remove();
  const el = $('activeWorkout');
  if (!el) return;
  el.classList.remove('hidden');
  let existingMap = new Map();
  try { existingMap = await loadExistingSets(session.plan || []); } catch (_) {}
  const exerciseHTML = (session.plan || []).map(x => {
    const targetSets = Math.max(1, Number(x.target_sets || 3));
    const existing = existingMap.get(x.session_exercise_id) || [];
    const rows = Array.from({length:targetSets},(_,i)=>setRowHTML(x,i+1,existing.find(s=>s.set_number===i+1))).join('');
    return `<section class="live-exercise-card"><div class="live-exercise-head"><div><strong>${escapeHTML(x.exercise_name)}</strong><small>Target · ${targetSets} sets · ${escapeHTML(x.target_reps || '')}</small></div><a class="form-link" href="${youtubeFormUrl(x.exercise_name)}" target="_blank" rel="noopener noreferrer">Watch form ↗</a></div><div class="live-sets-head"><span>Set</span><span>${isTimedTarget(x.target_reps)?'Time':'Reps'}</span><span>Weight</span><span>Complete</span></div><div class="live-sets">${rows}</div></section>`;
  }).join('');
  el.innerHTML = `<div class="active-workout-header"><div><span class="eyebrow">Live workout</span><h2>${escapeHTML(session.name)}</h2><p class="live-workout-help">Log only what matters. Arc autosaves completed sets as you go.</p></div><button id="edgeFavoriteActive" class="text-button">♡ Favorite</button></div>
    <div class="exercise-log live-exercise-log">${exerciseHTML}</div>
    <div id="workoutFinishArea" class="workout-finish-area"><button id="edgeCompleteWorkout" class="button button-primary">Complete workout</button><button id="edgeAbandonWorkout" class="button">End without counting</button></div>`;

  el.querySelectorAll('.live-set-row').forEach(row => {
    let timer;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(()=>saveSetRow(row),350); };
    row.querySelectorAll('input').forEach(input => input.addEventListener('change', schedule));
  });
  $('edgeFavoriteActive')?.addEventListener('click', async () => {
    try {
      const user = await currentUser();
      const { error } = await supabase.from('saved_workouts').insert({ user_id:user.id, workout_session_id:session.id });
      if (error && error.code !== '23505') throw error;
      $('edgeFavoriteActive').textContent='♥ Favorited'; toast('Workout saved to favorites.');
    } catch (error) { toast(error.message || 'Could not favorite workout.'); }
  });
  $('edgeCompleteWorkout')?.addEventListener('click', () => showCompletionPanel(session.id));
  $('edgeAbandonWorkout')?.addEventListener('click', () => finishWorkout(session.id,false));
}

async function saveSetRow(row) {
  try {
    const user = await currentUser();
    const completed = row.querySelector('.set-completed')?.checked || false;
    const repsValue = row.querySelector('.set-reps')?.value;
    const durationValue = row.querySelector('.set-duration')?.value;
    const weightValue = row.querySelector('.set-weight')?.value;
    const payload = {
      user_id:user.id,
      workout_exercise_id:row.dataset.exerciseId,
      set_number:Number(row.dataset.setNumber),
      reps:repsValue === undefined || repsValue === '' ? null : Number(repsValue),
      duration_seconds:durationValue === undefined || durationValue === '' ? null : Number(durationValue),
      weight_kg:weightValue === undefined || weightValue === '' ? null : poundsToKg(weightValue),
      completed
    };
    const state = row.querySelector('.set-save-state'); if (state) state.textContent='Saving…';
    let result;
    if (row.dataset.setId) result = await supabase.from('workout_sets').update(payload).eq('id',row.dataset.setId).select().single();
    else result = await supabase.from('workout_sets').insert(payload).select().single();
    if (result.error) throw result.error;
    row.dataset.setId = result.data.id;
    row.classList.toggle('set-complete',completed);
    if (state) { state.textContent='Saved'; setTimeout(()=>{ if(state.textContent==='Saved') state.textContent=''; },900); }
  } catch (error) { toast(error.message || 'Could not save set.'); }
}

function showCompletionPanel(sessionId) {
  const area = $('workoutFinishArea'); if (!area) return;
  area.innerHTML = `<div class="finish-card"><span class="eyebrow">Finish strong</span><h3>How did that feel?</h3><p>This is optional context, not another score to chase.</p><div class="effort-picker">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<label><input type="radio" name="sessionEffort" value="${n}"><span>${n}</span></label>`).join('')}</div><small class="effort-scale">Easy ← perceived effort → Max</small><label class="finish-note">Note <span>(optional)</span><input id="sessionNote" type="text" placeholder="Anything worth remembering?"></label><div class="finish-actions"><button id="confirmFinishWorkout" class="button button-primary">Finish & count it</button><button id="cancelFinishWorkout" class="text-button">Back to workout</button></div></div>`;
  $('confirmFinishWorkout')?.addEventListener('click', async ()=>{
    const effort = document.querySelector('input[name="sessionEffort"]:checked')?.value;
    await finishWorkout(sessionId,true,effort?Number(effort):null,$('sessionNote')?.value.trim()||null);
  });
  $('cancelFinishWorkout')?.addEventListener('click',()=>window.location.reload());
  area.scrollIntoView({behavior:'smooth',block:'center'});
}

async function finishWorkout(sessionId, countsTowardArc, perceivedEffort=null, notes=null) {
  try {
    const patch = countsTowardArc ? {status:'completed',completed_at:new Date().toISOString(),counts_toward_arc:true,perceived_effort:perceivedEffort,notes} : {status:'abandoned',completed_at:null,counts_toward_arc:false};
    const { error } = await supabase.from('workout_sessions').update(patch).eq('id',sessionId);
    if (error) throw error;
    toast(countsTowardArc ? 'Workout complete. The pattern moved forward.' : 'Workout ended without affecting your Arc.');
    setTimeout(()=>window.location.reload(),650);
  } catch (error) { toast(error.message || 'Could not update workout.'); }
}

async function resumeActiveWorkout() {
  try {
    const user = await currentUser();
    const { data: session, error } = await supabase.from('workout_sessions').select('*').eq('user_id',user.id).eq('status','in_progress').order('started_at',{ascending:false}).limit(1).maybeSingle();
    if (error || !session) return;
    const { data: exercises, error:exError } = await supabase.from('workout_session_exercises').select('*').eq('workout_session_id',session.id).order('sort_order');
    if (exError) return;
    let targets = [];
    if (session.source_option_id) {
      const { data } = await supabase.from('workout_option_exercises').select('*').eq('workout_option_id',session.source_option_id).order('sort_order');
      targets = data || [];
    }
    const plan = (exercises || []).map((row,i)=>{
      const parsed = parseTarget(row.notes);
      const target = targets[i] || {};
      return {session_exercise_id:row.id,exercise_name:row.exercise_name,target_sets:target.target_sets || parsed.target_sets,target_reps:target.target_reps || parsed.target_reps};
    });
    document.querySelector('[data-view="train"]')?.click();
    await renderActiveWorkout({...session,plan});
    toast('Resumed your in-progress workout.');
  } catch (_) {}
}

function install() {
  const original = $('readinessForm');
  if (!original || original.dataset.edgeWorkouts === 'true') return;
  const form = original.cloneNode(true);
  form.dataset.edgeWorkouts='true'; original.replaceWith(form);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const fd=new FormData(form); const submit=event.submitter; const originalText=submit?.textContent;
    if (submit) { submit.disabled=true; submit.textContent='Building your options…'; }
    try {
      const payload={energy:Number(fd.get('energy')),soreness:Number(fd.get('soreness')),available_minutes:Number(fd.get('minutes')),desired_effort:fd.get('effort'),limitations:$('limitations')?.value.trim()||null};
      const { data,error }=await supabase.functions.invoke('generate-workouts',{body:payload});
      if (error) throw error;
      if (!data?.options?.length) throw new Error(data?.error || 'Arc could not build workouts right now.');
      await renderWorkoutOptions(data.options,data.summary,payload); toast('Three paths forward. You choose.');
    } catch (error) { toast(error.message || 'Arc could not build workouts right now.'); }
    finally { if(submit){submit.disabled=false;submit.textContent=originalText;} }
  });
  window.setTimeout(resumeActiveWorkout,500);
}

setTimeout(install,0);