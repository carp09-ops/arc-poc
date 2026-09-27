# Arc backend-as-code

This directory versions the Supabase backend the PWA depends on: migrations,
edge functions, and the intended RLS posture. The goal is that the backend is
reviewable and redeployable from this repo — not only alive in the dashboard.

## Layout

- `migrations/` — ordered SQL migrations. Applied with `supabase db push`
  (or pasted into the dashboard SQL editor in filename order).
- `functions/` — edge function sources, deployed with
  `supabase functions deploy <name>`.
  - `generate-workouts` — workout recommendation engine. Tries OpenAI
    (`OPENAI_API_KEY` secret) with a 12s timeout, falls back to a
    deterministic rules engine. Now includes: per-submission idempotency
    keys, 10 generations/hour/user rate limiting, and a 25 AI
    generations/day/user cost cap (overflow gets the rules engine).
  - `delete-account` — deletes the auth user; relies on
    `profiles.user_id → auth.users` ON DELETE CASCADE plus cascading FKs
    from every user-owned table. Verify the cascade graph (below) before
    trusting this on a new project.
- `rls/policies.sql` — the INTENDED owner-only RLS policy set, derived from
  the client's access patterns. **Not reconciled against the live database —
  do not apply blindly.** See the header comment for the reconciliation
  checklist.
- `config.toml` — function config (`verify_jwt = true` on generate-workouts).

## What's captured vs. what's missing

Captured:
- The two migrations that predate this change set
  (`baseline_started_at`, weekly-target uniqueness).
- `20260927120000_add_workout_session_local_date.sql` — timezone-safe
  adherence attribution (client writes the local calendar day; backfills
  best-effort from the UTC timestamp).
- `20260927121000_add_generation_idempotency.sql` — `idempotency_key` column
  + partial unique index on `workout_recommendation_sets`.
- Full sources for both edge functions, including the new idempotency /
  rate-limit / cost-control logic in `generate-workouts`.

NOT captured (blocked: live definitions require a secret API key, which is
not available in this environment):
- The live RLS policy definitions (`rls/policies.sql` is the intended set,
  unverified).
- The `arc_progress_28d` view definition — capture with `pg_get_viewdef`
  before editing; it must keep `security_invoker = true` and should prefer
  `workout_sessions.local_date` for day bucketing.
- The `profiles` auto-creation trigger on `auth.users` (assumed to exist;
  verify with `\df` / the dashboard's Database → Triggers page).
- Grants and any service-role-only helper functions.

## Deploying the new edge function logic

The client already sends `idempotency_key` and degrades gracefully when the
new column is missing, so deploy in any order — but this order is cleanest:

1. Apply the two new migrations.
2. `supabase functions deploy generate-workouts` (needs `OPENAI_API_KEY`,
   `SUPABASE_URL`, and the publishable/secret key envs the function reads).

Until step 1 is done, the function's idempotency lookups no-op and every
call generates fresh — exactly today's behavior, no worse.
