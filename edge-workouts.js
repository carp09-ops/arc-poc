import { supabase } from './supabase-client.js';
import { generateDeterministicWorkouts, GENERATOR_TIMEOUT_MS } from './deterministic-workouts.js';
import { toast } from './toast.js';


const $ = (id) => document.getElementById(id);
const escapeHTML = (value = '') => String(value).replace(/[&<>'\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
let activeUserId = null;
// Payload of the last generation attempt, kept so the user can retry the AI
// engine after a deterministic fallback without re-filling the form.
let lastGeneratorPayload = null;

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

async function renderWorkoutOptions(options, summary, context, source = 'ai') {
  document.getElementById('recommendationSummary')?.remove();
  document.getElementById('retryAiRow')?.remove();
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
  if (source === 'deterministic') {
    el.insertAdjacentHTML('afterend', `<div id="retryAiRow" class="retry-ai-row"><button class="text-button" id="retryAiGeneration" type="button">Try Arc AI again</button><small>Built on-device because Arc AI was unreachable.</small></div>`);
    $('retryAiGeneration')?.addEventListener('click', event => retryAiGeneration(event.currentTarget));
  }
  el.querySelectorAll('[data-edge-start-option]').forEach(btn => btn.addEventListener('click', () => startWorkout(btn.dataset.edgeStartOption, btn.dataset.edgeOptionName)));
}

async function startWorkout(optionId, name) {
  try {
    const user = await currentUser();
    // One active workout: resume the existing in-progress session instead of
    // inserting a second one (the old code hit the DB's duplicate-key guard
    // and showed a raw database error).
    const { data: existing, error: existingError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      await loadAndRenderSession(user.id, existing);
      toast('Resumed your in-progress workout.');
      return;
    }
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
    if (row.dataset.setId) result = await supabase.from('workout_sets').update(payload).eq('id',row.dataset.setId).eq('user_id',user.id).select().single();
    else result = await supabase.from('workout_sets').insert(payload).select().single();
    if (result.error) throw result.error;
    row.dataset.setId = result.data.id;
    row.classList.toggle('set-complete',completed);
    if (state) { state.textContent='Saved'; setTimeout(()=>{ if(state.textContent==='Saved') state.textContent=''; },900); }
  } catch (error) { toast(error.message || 'Could not save set.'); }
}

function showCompletionPanel(sessionId) {
  const area = $('workoutFinishArea'); if (!area) return;
  // The session id is stashed on the panel: the single finish owner is the
  // capture-phase handler in training-roundout.js (completeWithReceipt), which
  // reads it from here. Do NOT attach a second click listener to
  // #confirmFinishWorkout — it can never fire (the capture handler stops
  // propagation) and a duplicate owner is exactly how finishes got lost.
  area.dataset.sessionId = sessionId;
  area.innerHTML = `<div class="finish-card"><span class="eyebrow">Finish strong</span><h3>How did that feel?</h3><p>This is optional context, not another score to chase.</p><fieldset class="effort-picker"><legend>Perceived effort</legend>${[1,2,3,4,5,6,7,8,9,10].map(n=>`<label><input type="radio" name="sessionEffort" value="${n}"><span>${n}</span></label>`).join('')}</fieldset><small class="effort-scale">Easy ← perceived effort → Max</small><label class="finish-note">Note <span>(optional)</span><input id="sessionNote" type="text" placeholder="Anything worth remembering?"></label><div class="finish-actions"><button id="confirmFinishWorkout" class="button button-primary">Finish & count it</button><button id="cancelFinishWorkout" class="text-button">Back to workout</button></div></div>`;
  $('cancelFinishWorkout')?.addEventListener('click',()=>window.location.reload());
  area.scrollIntoView({behavior:'smooth',block:'center'});
}

function localISODate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// DIAGNOSTIC BUILD (ready34): see training-roundout.js. Remove after the save bug is fixed.
function renderEdgeWorkoutDiag(diag){
  try{
    const rows = Object.entries(diag).map(([k,v]) => {
      let val = (v && typeof v === 'object') ? JSON.stringify(v) : v;
      return `<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(139,163,183,.14);font-size:.74rem">`
        + `<span style="color:#8BA3B7;font-weight:700">${k}</span>`
        + `<span style="color:#F7F2E8;text-align:right;word-break:break-all">${val ?? '—'}</span></div>`;
    }).join('');
    const host = document.getElementById('workoutFinishArea') || document.getElementById('activeWorkout') || document.body;
    const html = `<div style="background:#0E2133;border:1px solid rgba(246,166,35,.4);border-radius:16px;padding:18px;margin:16px 0">`
      + `<div style="font-size:.68rem;font-weight:800;letter-spacing:.08em;color:#F6A623;margin-bottom:4px">DIAGNOSTIC — WORKOUT SAVE</div>`
      + `<p style="font-size:.76rem;color:#9FB0BE;margin:0 0 8px">The save failed. Screenshot this panel and send it to me.</p>`
      + rows + `</div>`;
    if (host === document.body) { const d = document.createElement('div'); d.innerHTML = html; host.prepend(d); }
    else host.innerHTML = html;
  }catch(_){}
}

async function finishWorkout(sessionId, countsTowardArc, perceivedEffort=null, notes=null) {
  const diag={path:'finishWorkout(edge)',build:'ready34',at:new Date().toISOString(),sessionId};
  try {
    const user = await currentUser();
    diag.authUid=user.id;
    try{diag.hasSession=!!(await supabase.auth.getSession()).data.session;}catch(_){diag.hasSession='?';}
    const patch = countsTowardArc
      ? { status:'completed', completed_at:new Date().toISOString(), local_date:localISODate(), counts_toward_arc:true, perceived_effort:perceivedEffort, notes }
      : { status:'abandoned', completed_at:null, counts_toward_arc:false };
    diag.patchKeys=Object.keys(patch).join(',');
    const runPatch = () => supabase.from('workout_sessions').update(patch).eq('id',sessionId).eq('user_id',user.id).select('id,status');
    const missingCol = (e) => {
      if (!e) return null;
      const m = /Could not find the '([^']+)' column/i.exec(e.message || '');
      if (e.code === 'PGRST204' && m && m[1] in patch) return m[1];
      if (e.code === '42703' && 'local_date' in patch) return 'local_date';
      return null;
    };
    let updRes = await runPatch();
    let attempts = 0, col;
    while ((col = missingCol(updRes.error)) && attempts < 4) {
      attempts++;
      delete patch[col]; diag['droppedColumn' + attempts] = col;
      updRes = await runPatch();
    }
    diag.updateAttemptRows=Array.isArray(updRes.data)?updRes.data.length:null;
    if (updRes.error) { diag.updateError=`${updRes.error.code||'?'}: ${updRes.error.message||'unknown'}`; throw updRes.error; }
    // PostgREST reports zero matched rows as success: re-read to prove the
    // write landed instead of claiming a finish that never persisted.
    const { data: check } = await supabase.from('workout_sessions').select('status').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    diag.verifyFound=!!check;diag.verifyStatus=check?.status??null;
    if (!check || check.status !== patch.status) throw new Error('Workout was not saved. Your logged sets are intact — please try finishing again.');
    toast(countsTowardArc ? 'Workout complete. The pattern moved forward.' : 'Workout ended without affecting your Arc.');
    setTimeout(()=>window.location.reload(),650);
  } catch (error) { diag.failure=error.message||'unknown'; try{console.log('[arc-diag]',JSON.stringify(diag));}catch(_){} renderEdgeWorkoutDiag(diag); toast(error.message || 'Could not update workout.'); }
}

async function resumeActiveWorkout() {
  try {
    const user = await currentUser();
    const { data: session, error } = await supabase.from('workout_sessions').select('*').eq('user_id',user.id).eq('status','in_progress').order('started_at',{ascending:false}).limit(1).maybeSingle();
    if (error || !session) return;
    document.querySelector('[data-view="train"]')?.click();
    await loadAndRenderSession(user.id, session);
    toast('Resumed your in-progress workout.');
  } catch (_) {}
}

// Shared loader for an existing in-progress session: user-scoped on every
// query, so a resumed session can never leak another user's rows.
async function loadAndRenderSession(userId, session) {
  const { data: exercises, error:exError } = await supabase.from('workout_session_exercises').select('*').eq('user_id',userId).eq('workout_session_id',session.id).order('sort_order');
  if (exError) throw exError;
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
  await renderActiveWorkout({...session,plan});
}

function install() {
  const form = $('readinessForm');
  if (!form || form.dataset.edgeWorkouts === 'true') return;
  // No form cloning: core-app's legacy submit listener is gone, so this is the
  // single submit handler. Cloning used to strip that listener — and with it,
  // any future listeners attached by other modules.
  form.dataset.edgeWorkouts = 'true';
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.submitting === '1') return; // duplicate-submission guard
    form.dataset.submitting = '1';
    const fd = new FormData(form);
    const submit = event.submitter;
    const originalText = submit?.textContent;
    if (submit) { submit.disabled = true; submit.textContent = 'Building your options…'; }
    const idempotencyKey = window.crypto?.randomUUID ? window.crypto.randomUUID() : `web-${Date.now()}`;
    try {
      const payload = {
        energy: Number(fd.get('energy')),
        soreness: Number(fd.get('soreness')),
        available_minutes: Number(fd.get('minutes')),
        desired_effort: fd.get('effort'),
        limitations: $('limitations')?.value.trim() || null,
        idempotency_key: idempotencyKey
      };
      const data = await invokeGenerator(payload);
      if (!data?.options?.length) throw new Error(data?.error || 'Arc could not build workouts right now.');
      lastGeneratorPayload = payload;
      await renderWorkoutOptions(data.options, data.summary, payload, 'ai');
      toast('Three paths forward. You choose.');
    } catch (error) {
      // Deterministic client-side fallback: the user always gets workouts,
      // even when the AI engine is unreachable, slow, or erroring.
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) throw error;
        const { data: profile } = await supabase.from('profiles').select('equipment').eq('user_id', userId).maybeSingle();
        const fallbackPayload = {
          energy: Number(fd.get('energy')),
          soreness: Number(fd.get('soreness')),
          available_minutes: Number(fd.get('minutes')),
          desired_effort: fd.get('effort'),
          limitations: $('limitations')?.value.trim() || null,
          idempotency_key: idempotencyKey
        };
        lastGeneratorPayload = fallbackPayload;
        // The fallback gets its own key suffix: AI attempts (original + retry)
        // share the base key so a late-persisting AI call can never duplicate,
        // while the on-device fallback can never be mistaken for an AI result.
        const result = await generateDeterministicWorkouts({
          supabase,
          userId,
          equipment: profile?.equipment,
          idempotencyKey: `${idempotencyKey}-fallback`,
          payload: {
            energy: fallbackPayload.energy,
            soreness: fallbackPayload.soreness,
            minutes: fallbackPayload.available_minutes,
            desired: fallbackPayload.desired_effort,
            limitations: fallbackPayload.limitations
          }
        });
        await renderWorkoutOptions(result.options, result.summary, fallbackPayload, 'deterministic');
        toast('Arc AI was unreachable, so Arc built these on-device. You can retry AI below.');
      } catch (fallbackError) {
        toast(fallbackError?.message || error?.message || 'Arc could not build workouts right now.');
      }
    } finally {
      form.dataset.submitting = '';
      if (submit) { submit.disabled = false; submit.textContent = originalText; }
    }
  });
  window.setTimeout(resumeActiveWorkout, 500);
}

// AI generation with a hard timeout: if the edge function hangs, we fall back
// to the deterministic generator instead of leaving the user on a spinner.
function invokeGenerator(payload) {
  // The timer is always cleared on settle: without this, every successful
  // generation left a live timer that later rejected an unobserved promise
  // (console noise) and the edge request had no cancellation story.
  // supabase-js functions.invoke does not expose an AbortSignal, so the
  // underlying request is left to complete; that is safe now because the
  // payload's idempotency key means a late response can only replay the
  // already-persisted recommendation set, never duplicate it.
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Arc AI timed out.')), GENERATOR_TIMEOUT_MS);
  });
  return Promise.race([
    supabase.functions.invoke('generate-workouts', { body: payload }).then(({ data, error }) => {
      if (error) throw error;
      return data;
    }),
    timeout
  ]).finally(() => { if (timer) clearTimeout(timer); });
}

// AI-regeneration affordance: after a deterministic fallback, one tap retries
// the AI engine for the same readiness answers — no re-filling the form.
// The ORIGINAL idempotency key is reused so a late-persisting first attempt
// can never produce a duplicate recommendation set.
async function retryAiGeneration(button) {
  if (!lastGeneratorPayload || button?.disabled) return;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Retrying Arc AI…';
  try {
    const data = await invokeGenerator(lastGeneratorPayload);
    if (!data?.options?.length) throw new Error(data?.error || 'Arc AI is still unavailable.');
    await renderWorkoutOptions(data.options, data.summary, lastGeneratorPayload, 'ai');
    toast('Arc AI is back. Three paths forward.');
  } catch (error) {
    toast(error?.message || 'Arc AI is still unavailable.');
    button.disabled = false;
    button.textContent = original;
  }
}

setTimeout(install,0);