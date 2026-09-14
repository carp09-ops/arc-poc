import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

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
  return data.user;
}

function youtubeFormUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} proper form tutorial`)}`;
}

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
    .in('workout_option_id', ids)
    .order('sort_order');
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
      <div class="preview-move">
        <div>
          <strong>${escapeHTML(move.exercise_name)}</strong>
          <small>${move.target_sets || ''} sets · ${escapeHTML(move.target_reps || '')}</small>
        </div>
        <a class="form-link" href="${youtubeFormUrl(move.exercise_name)}" target="_blank" rel="noopener noreferrer">Form ↗</a>
      </div>`).join('');

    return `
      <article class="workout-card ${o.tier} ${o.is_recommended ? 'recommended' : ''}">
        ${o.is_recommended ? '<span class="recommend-badge">ARC RECOMMENDS</span>' : ''}
        <div class="workout-tier">${icons[o.tier] || '△'}</div>
        <h3>${escapeHTML(o.title)}</h3>
        <span class="workout-meta">${escapeHTML(o.focus || '')}</span>
        <div class="workout-points"><span>◷ ${o.duration_minutes} min</span><span>◇ ${escapeHTML(o.intensity)} intensity</span></div>
        <div class="why-box"><strong>${o.is_recommended ? 'Why Arc recommends this' : 'Why Arc offers this'}</strong><p>${escapeHTML(why)}</p></div>
        <p>${escapeHTML(o.rationale || '')}</p>
        <div class="workout-preview"><span>Workout preview</span>${preview || '<small>Preview unavailable.</small>'}</div>
        <button class="button ${o.is_recommended ? 'button-primary' : ''}" data-edge-start-option="${o.id}" data-edge-option-name="${escapeHTML(o.title)}">Choose ${escapeHTML(o.title)}</button>
      </article>`;
  }).join('');

  el.insertAdjacentHTML('beforebegin', `<p id="recommendationSummary" class="eyebrow" style="margin-top:18px">${escapeHTML(summary || '')}</p>`);
  el.querySelectorAll('[data-edge-start-option]').forEach(btn => {
    btn.addEventListener('click', () => startWorkout(btn.dataset.edgeStartOption, btn.dataset.edgeOptionName));
  });
}

async function startWorkout(optionId, name) {
  try {
    const user = await currentUser();
    const { data: session, error } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      source_option_id: optionId,
      name,
      status: 'in_progress',
      started_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;

    const { data: plan, error: planError } = await supabase.from('workout_option_exercises')
      .select('*').eq('workout_option_id', optionId).order('sort_order');
    if (planError) throw planError;

    const rows = plan.map(x => ({
      user_id: user.id,
      workout_session_id: session.id,
      sort_order: x.sort_order,
      exercise_name: x.exercise_name,
      notes: `Target: ${x.target_sets || ''} x ${x.target_reps || ''}`
    }));
    const { error: copyError } = await supabase.from('workout_session_exercises').insert(rows);
    if (copyError) throw copyError;

    renderActiveWorkout({ ...session, plan });
  } catch (error) {
    toast(error.message || 'Could not start workout.');
  }
}

function renderActiveWorkout(session) {
  $('workoutOptions')?.classList.add('hidden');
  document.getElementById('recommendationSummary')?.remove();
  const el = $('activeWorkout');
  if (!el) return;
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="active-workout-header">
      <div><span class="eyebrow">Live workout</span><h2>${escapeHTML(session.name)}</h2></div>
      <button id="edgeFavoriteActive" class="text-button">♡ Favorite</button>
    </div>
    <div class="exercise-log">${session.plan.map(x => `
      <div class="exercise-log-row">
        <div><strong>${escapeHTML(x.exercise_name)}</strong><small>${x.target_sets || ''} sets · ${escapeHTML(x.target_reps || '')}</small></div>
        <a class="form-link" href="${youtubeFormUrl(x.exercise_name)}" target="_blank" rel="noopener noreferrer">Watch form ↗</a>
      </div>`).join('')}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px">
      <button id="edgeCompleteWorkout" class="button button-primary">Complete workout</button>
      <button id="edgeAbandonWorkout" class="button">End without counting</button>
    </div>`;

  $('edgeFavoriteActive')?.addEventListener('click', async () => {
    try {
      const user = await currentUser();
      const { error } = await supabase.from('saved_workouts').insert({ user_id: user.id, workout_session_id: session.id });
      if (error && error.code !== '23505') throw error;
      $('edgeFavoriteActive').textContent = '♥ Favorited';
      toast('Workout saved to favorites.');
    } catch (error) {
      toast(error.message || 'Could not favorite workout.');
    }
  });

  $('edgeCompleteWorkout')?.addEventListener('click', () => finishWorkout(session.id, true));
  $('edgeAbandonWorkout')?.addEventListener('click', () => finishWorkout(session.id, false));
}

async function finishWorkout(sessionId, countsTowardArc) {
  try {
    const patch = countsTowardArc
      ? { status: 'completed', completed_at: new Date().toISOString(), counts_toward_arc: true }
      : { status: 'abandoned', completed_at: null, counts_toward_arc: false };
    const { error } = await supabase.from('workout_sessions').update(patch).eq('id', sessionId);
    if (error) throw error;
    toast(countsTowardArc ? 'Workout complete. The pattern moved forward.' : 'Workout ended without affecting your Arc.');
    setTimeout(() => window.location.reload(), 450);
  } catch (error) {
    toast(error.message || 'Could not update workout.');
  }
}

function install() {
  const original = $('readinessForm');
  if (!original || original.dataset.edgeWorkouts === 'true') return;

  const form = original.cloneNode(true);
  form.dataset.edgeWorkouts = 'true';
  original.replaceWith(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const submit = event.submitter;
    const originalText = submit?.textContent;
    if (submit) { submit.disabled = true; submit.textContent = 'Building your options…'; }

    try {
      const payload = {
        energy: Number(fd.get('energy')),
        soreness: Number(fd.get('soreness')),
        available_minutes: Number(fd.get('minutes')),
        desired_effort: fd.get('effort'),
        limitations: $('limitations')?.value.trim() || null
      };

      const { data, error } = await supabase.functions.invoke('generate-workouts', { body: payload });
      if (error) throw error;
      if (!data?.options?.length) throw new Error(data?.error || 'Arc could not build workouts right now.');

      await renderWorkoutOptions(data.options, data.summary, payload);
      toast('Three paths forward. You choose.');
    } catch (error) {
      toast(error.message || 'Arc could not build workouts right now.');
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = originalText; }
    }
  });
}

setTimeout(install, 0);