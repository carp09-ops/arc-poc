# Arc Phase 1 — Data Model Draft

**Status:** architecture draft only. The production `public` schema is intentionally empty until this model is approved.

## Principles
1. **Events are the source of truth.** Analytics are derived from dated records.
2. **80% is success.** The Arc is a consistency interpretation, not a generic health score.
3. **Store canonical units.** Weight is stored in kilograms and circumference in centimeters; UI converts to the user's preferred units.
4. **Keep generated plans reproducible.** Store the inputs/version used to generate a workout recommendation.
5. **Wearable data informs the experience; it does not become the product.** Normalize only the metrics Arc actually needs.
6. **User data is user-owned.** Every exposed table gets RLS and explicit grants.
7. **Provider secrets never live in public tables.** OAuth tokens belong in a protected secret/private store.

## Proposed Phase 1 entities

### `profiles`
One row per authenticated user.

Key fields:
- `user_id uuid` PK → `auth.users.id`
- `display_name text`
- `unit_system text` (`imperial` | `metric`)
- `timezone text`
- `weekly_workout_target smallint`
- `primary_goal text`
- `equipment jsonb`
- `training_preferences jsonb`
- timestamps

### `weekly_targets`
Snapshots the user's intended training frequency so historical Arc calculations do not change when preferences change later.

Key fields:
- `id uuid`
- `user_id uuid`
- `week_start date`
- `target_workouts smallint`
- unique (`user_id`, `week_start`)

### `body_measurements`
A longitudinal measurement event. Every measurement except timestamp/user may be nullable.

Key fields:
- `id uuid`
- `user_id uuid`
- `measured_at timestamptz`
- `weight_kg numeric`
- `waist_cm numeric`
- `hips_cm numeric`
- `chest_cm numeric`
- `arm_cm numeric`
- `thigh_cm numeric`
- `notes text`

No separate analytics table is required initially. Baseline, latest, deltas, and trends are derived from these events.

### `readiness_checkins`
The short questionnaire that answers: **How are you showing up today?**

Key fields:
- `id uuid`
- `user_id uuid`
- `created_at timestamptz`
- `energy smallint` (1–5)
- `soreness smallint` (1–5)
- `available_minutes smallint`
- `desired_effort text` (`restore` | `build` | `push`)
- `limitations text`
- `context_snapshot jsonb`

`context_snapshot` may record the normalized wearable values and user preferences used at generation time; it is evidence/reproducibility data, not the source of truth for wearable metrics.

### `workout_recommendation_sets`
One AI generation event produced from one readiness check-in.

Key fields:
- `id uuid`
- `user_id uuid`
- `readiness_checkin_id uuid`
- `generated_at timestamptz`
- `prompt_version text`
- `model_provider text`
- `model_name text`
- `generation_summary text`

### `workout_options`
Exactly three recommendations belong to a recommendation set: Restore, Build, Push.

Key fields:
- `id uuid`
- `recommendation_set_id uuid`
- `tier text` (`restore` | `build` | `push`)
- `title text`
- `summary text`
- `duration_minutes smallint`
- `intensity text`
- `focus text`
- `equipment jsonb`
- unique (`recommendation_set_id`, `tier`)

### `workout_option_exercises`
Structured prescription behind each generated option.

Key fields:
- `id uuid`
- `workout_option_id uuid`
- `position smallint`
- `exercise_name text`
- `prescribed_sets smallint`
- `rep_range text`
- `duration_seconds integer`
- `rest_seconds integer`
- `notes text`

### `workout_sessions`
The actual training event. Analytics come from sessions, not generated options.

Key fields:
- `id uuid`
- `user_id uuid`
- `source_option_id uuid nullable`
- `started_at timestamptz`
- `completed_at timestamptz`
- `status text` (`planned` | `in_progress` | `completed` | `abandoned`)
- `duration_minutes smallint`
- `perceived_effort smallint nullable`
- `notes text`

When a generated option is chosen, the prescribed exercise structure is copied into the session log so history remains stable even if generation logic changes later.

### `workout_exercises`
Exercises actually performed in a session.

Key fields:
- `id uuid`
- `workout_session_id uuid`
- `position smallint`
- `exercise_name text`
- `notes text`

### `workout_sets`
Fine-grained performance history.

Key fields:
- `id uuid`
- `workout_exercise_id uuid`
- `set_number smallint`
- `reps integer nullable`
- `weight_kg numeric nullable`
- `duration_seconds integer nullable`
- `distance_meters numeric nullable`
- `completed boolean`

This supports strength volume, PRs, duration, and exercise-level progression without redesigning the database later.

### `saved_workouts`
A reusable favorite. Phase 1 can intentionally use a versioned JSON snapshot because completed-session analytics do not depend on this table.

Key fields:
- `id uuid`
- `user_id uuid`
- `source_session_id uuid nullable`
- `name text`
- `plan_snapshot jsonb`
- `created_at timestamptz`

### `device_connections`
Connection metadata only; never raw access/refresh tokens.

Key fields:
- `id uuid`
- `user_id uuid`
- `provider text` (`oura` | `apple_health`)
- `status text`
- `scopes text[]`
- `external_user_id text nullable`
- `last_synced_at timestamptz nullable`
- `metadata jsonb`

### `wearable_daily_metrics`
Normalized daily context Arc actually uses.

Key fields:
- `id uuid`
- `user_id uuid`
- `metric_date date`
- `provider text`
- `sleep_minutes integer nullable`
- `readiness_score numeric nullable`
- `resting_hr_bpm numeric nullable`
- `hrv_ms numeric nullable`
- `steps integer nullable`
- `active_calories numeric nullable`
- `workout_minutes integer nullable`
- unique (`user_id`, `metric_date`, `provider`)

## The Arc calculation
Do **not** store a mutable "Arc score" as the source of truth.

For a rolling 28-day window:

`adherence % = completed qualifying workouts / expected workouts × 100`

Expected workouts are derived from the historical `weekly_targets` rows covering the window, prorated by day when necessary.

Product interpretation:
- `< 60%` → **Build momentum**
- `60–79.9%` → **Closing the Arc**
- `>= 80%` → **In Your Arc**

Visual completion is normalized so 80% adherence fills 100% of the Arc:

`visual fill % = min(100, adherence % / 80 × 100)`

The UI should still show the real adherence number. A user at 82% sees **82% — In Your Arc**, not a fake 100% metric.

Extra workouts may be reported in supporting analytics, but the Arc adherence display should cap at 100% so overtraining is not gamified.

## Derived analytics — no tables yet
- workouts per week
- 28-day consistency
- total training minutes
- training volume by exercise / movement
- personal records
- body measurement deltas and trend lines
- readiness selections over time
- Restore / Build / Push mix
- wearable context trends

Add persisted aggregates only if performance later requires them.

## Security baseline for implementation
- RLS enabled on every `public` table
- ownership policy uses `auth.uid() = user_id`
- update policies include both `USING` and `WITH CHECK`
- explicit Data API grants are created only for required roles/actions
- no provider token or service key is exposed to the browser
- AI generation should happen through a protected server/edge boundary, not with a secret embedded in client code

## Intentionally not modeled in Phase 1
- nutrition
- community/social graph
- legacy signal engine
- progress photos
- meal plans
- coaching marketplace

These can be added later without contaminating the Phase 1 core.
