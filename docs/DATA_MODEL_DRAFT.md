# Arc Phase 1 — Implemented Data Model

**Status:** implemented in the Arc Supabase project and extended with provider-agnostic nutrition plumbing on September 14, 2026.

## Principles

1. **Events are the source of truth.** Analytics are derived from dated records.
2. **80% is success.** Arc is a consistency interpretation, not a generic health score.
3. **Canonical units.** Weight is stored in kilograms and circumference in centimeters; the UI converts to the user's preferred display units.
4. **Historical commitments remain historical.** Weekly targets are effective-dated so changing a future goal does not rewrite prior adherence.
5. **Generated plans and completed workouts are separate.** Recommendations are suggestions; sessions are the performance record.
6. **Wearables inform decisions.** Arc normalizes only the daily metrics needed for recommendations and insights.
7. **Nutrition is provider-agnostic context.** Arc stores normalized daily totals and does not depend on a specific logging vendor.
8. **User data is user-owned.** Every exposed user-data table has RLS and explicit Data API grants.
9. **Secrets stay out of public tables.** Provider OAuth secrets and model API keys must live behind protected server/edge boundaries.

## Implemented entities

### Identity and commitment
- `profiles` — one row per `auth.users` identity; display preferences, goal, experience and available equipment.
- `weekly_targets` — effective-dated workouts-per-week commitments.

### Body
- `body_measurements` — longitudinal weight, waist, hips, chest, arm and thigh events. Each check-in may contain any subset of measurements.

### Daily readiness and recommendations
- `readiness_checkins` — energy (1–5), soreness (1–5), time available, desired effort (`restore | build | push`) and optional limitations.
- `workout_recommendation_sets` — one generation event per readiness check-in, including a context snapshot and generator version.
- `workout_options` — Restore, Build and Push options belonging to a recommendation set.
- `workout_option_exercises` — structured prescription for each generated option.

### Actual training
- `workout_sessions` — planned / in-progress / completed / abandoned sessions. Only completed sessions with `counts_toward_arc = true` contribute to Arc adherence.
- `workout_session_exercises` — the copied exercise plan for the selected session so history remains stable if recommendation logic changes later.
- `workout_sets` — set-level reps, weight, time, distance, RPE and completion state for progression analytics.
- `saved_workouts` — favorites linked to a workout session.

### Wearables
- `device_connections` — connection metadata for `oura` and `apple_health`; no raw OAuth secrets.
- `wearable_daily_metrics` — normalized sleep, readiness, resting HR, HRV, steps, active calories and workout minutes by day/provider.

### Nutrition context
- `nutrition_sources` — provider metadata for `lose_it`, `apple_health`, `manual_import` or another future adapter. Supports OAuth, HealthKit, file-import and manual connection methods. No access tokens are stored in this public table.
- `nutrition_daily_summaries` — normalized daily totals: calories consumed, calorie target, protein, carbs, fat, fiber and water. Every row belongs to a source owned by the same user.

The normalized nutrition model deliberately avoids raw meals, foods, recipes or vendor-specific payloads. A direct Lose It! API adapter, Apple Health/HealthKit reader or file importer can all populate the same table.

## Arc calculation

Arc is **derived**, never stored as a mutable score.

The database view `arc_progress_28d` calculates a rolling window using the weekly target that was effective on each day:

`actual adherence % = completed qualifying workouts / expected workouts × 100`

Product states:

- `< 60%` → **Build Momentum**
- `60–79.9%` → **Closing the Arc**
- `>= 80%` → **In Your Arc**
- first 7 observed days → **Learning**

Visual completion:

`visual Arc % = min(100, actual adherence % / 80 × 100)`

That means **80% actual adherence fills 100% of the visual Arc**. Higher adherence remains useful information, but Arc never creates a “better than complete” score.

Nutrition does **not** alter this calculation. It is context for insights, not another component of the Arc score.

## Security baseline

- RLS is enabled on every user-data table in `public`.
- Ownership policies use `(select auth.uid()) = user_id` for both visibility and mutation checks.
- Nutrition daily rows use a composite source/user foreign key so one user cannot attach a nutrition row to another user's source.
- `anon` has no table access.
- `authenticated` has only `SELECT / INSERT / UPDATE / DELETE` on user tables and `SELECT` on `arc_progress_28d`.
- `arc_progress_28d` is a `security_invoker` view so underlying RLS remains authoritative.
- A private trigger creates `profiles` rows for new Auth identities; the trigger function is not exposed to browser roles.

## Recommendation generator

Workout generation runs behind the authenticated `generate-workouts` Edge Function. The function preserves the Restore / Build / Push structured contract and can use a model-backed path with a deterministic server fallback.

Nutrition may later be included as contextual input only when source quality and freshness are known. No model or provider secret may be embedded in client JavaScript.

## Intentionally out of scope

- native meal logging / food database
- community/social graph
- legacy signal engine
- progress photos
- meal plans
- coaching marketplace
