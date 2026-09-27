// Shared deterministic workout generator — the client-side fallback when the
// AI edge function is unreachable, times out, or errors.
//
// Previously this logic lived (dead) inside core-app.js's submit handler,
// which edge-workouts.js disabled by cloning the form. It now lives here so
// both the primary flow and any retry path can reach it, and it is genuinely
// client-side: no edge-function call, no network AI dependency.
//
// The context_snapshot deliberately stores structured fields only — free-text
// limitations are NOT persisted (see data-minimization notes).
export const GENERATOR_VERSION = 'phase1-rules-v1';
export const GENERATOR_TIMEOUT_MS = 20000;

export function chooseRecommendedTier(energy, soreness, desired) {
  if (energy <= 2 || soreness >= 4) return 'restore';
  if (desired === 'push' && energy >= 4 && soreness <= 2) return 'push';
  return 'build';
}

export function exerciseLibrary(hasEquipment) {
  if (hasEquipment) return {
    restore: [['Mobility Flow', 2, '6 min'], ['Goblet Squat', 2, '10'], ['Incline Dumbbell Press', 2, '10'], ['Dead Bug', 2, '8 / side']],
    build: [['Goblet Squat', 3, '8–10'], ['Dumbbell Bench Press', 3, '8–10'], ['One-Arm Row', 3, '10 / side'], ['Romanian Deadlift', 3, '10'], ['Plank', 3, '30 sec']],
    push: [['Dumbbell Front Squat', 4, '8'], ['Dumbbell Bench Press', 4, '8'], ['Romanian Deadlift', 4, '8'], ['One-Arm Row', 4, '10 / side'], ['DB Thruster Finisher', 3, '10']]
  };
  return {
    restore: [['Mobility Flow', 2, '6 min'], ['Bodyweight Squat', 2, '10'], ['Incline Push-Up', 2, '8'], ['Dead Bug', 2, '8 / side']],
    build: [['Tempo Squat', 3, '12'], ['Push-Up', 3, '8–12'], ['Reverse Lunge', 3, '10 / side'], ['Glute Bridge', 3, '15'], ['Plank', 3, '30 sec']],
    push: [['Jump Squat', 4, '10'], ['Push-Up', 4, '10–15'], ['Walking Lunge', 4, '12 / side'], ['Single-Leg Glute Bridge', 3, '12 / side'], ['Mountain Climber', 4, '30 sec']]
  };
}

const CONFIGS = {
  restore: { title: 'Restore', focus: 'Mobility + Recovery', intensity: 'low', rationale: 'Move well, reduce friction and protect the training habit.' },
  build: { title: 'Build', focus: 'Strength + Full Body', intensity: 'moderate', rationale: 'A balanced session that moves strength forward without emptying the tank.' },
  push: { title: 'Push', focus: 'Strength + Conditioning', intensity: 'high', rationale: 'Use the energy you have today for a demanding, focused session.' }
};

export function recommendationSummary(tier) {
  return tier === 'restore'
    ? 'Recovery wins today. Keep the habit without forcing intensity.'
    : tier === 'push'
      ? 'You have the runway to press.'
      : 'Balanced work is the best fit for today.';
}

// payload: { energy, soreness, minutes, desired, limitations }
// Writes: readiness_checkins → workout_recommendation_sets →
// workout_options → workout_option_exercises. Returns { setId, options, summary }.
export async function generateDeterministicWorkouts({ supabase, userId, equipment, payload }) {
  const { energy, soreness, minutes, desired, limitations } = payload;
  const recommended = chooseRecommendedTier(energy, soreness, desired);

  const { data: checkin, error: checkinError } = await supabase
    .from('readiness_checkins')
    .insert({ user_id: userId, energy, soreness, available_minutes: minutes, desired_effort: desired, limitations })
    .select()
    .single();
  if (checkinError) throw checkinError;

  const summary = recommendationSummary(recommended);
  const { data: set, error: setError } = await supabase
    .from('workout_recommendation_sets')
    .insert({
      user_id: userId,
      checkin_id: checkin.id,
      recommendation_summary: summary,
      // Structured fields only: free-text limitations are not stored.
      context_snapshot: {
        generation_mode: 'deterministic',
        energy, soreness, minutes, desired,
        has_limitations: Boolean(limitations && String(limitations).trim())
      },
      generator_version: GENERATOR_VERSION
    })
    .select()
    .single();
  if (setError) throw setError;

  const equipmentList = Array.isArray(equipment) ? equipment : [];
  const durations = { restore: Math.min(minutes, 20), build: Math.min(minutes, 35), push: Math.min(minutes, 50) };
  const optionRows = Object.entries(CONFIGS).map(([tier, c]) => ({
    user_id: userId,
    recommendation_set_id: set.id,
    tier,
    title: c.title,
    focus: c.focus,
    duration_minutes: Math.max(15, durations[tier]),
    intensity: c.intensity,
    rationale: c.rationale,
    equipment: equipmentList,
    is_recommended: tier === recommended
  }));
  const { data: options, error: optionError } = await supabase
    .from('workout_options')
    .insert(optionRows)
    .select();
  if (optionError) throw optionError;

  const lib = exerciseLibrary(equipmentList.length > 0);
  const exerciseRows = [];
  options.forEach(o => (lib[o.tier] || lib.build).forEach((x, i) => exerciseRows.push({
    user_id: userId,
    workout_option_id: o.id,
    sort_order: i + 1,
    exercise_name: x[0],
    target_sets: x[1],
    target_reps: x[2]
  })));
  const { error: exerciseError } = await supabase.from('workout_option_exercises').insert(exerciseRows);
  if (exerciseError) throw exerciseError;

  return { setId: set.id, options, summary };
}
