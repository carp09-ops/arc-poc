-- ============================================================================
-- Arc RLS policy set — INTENDED, NOT YET RECONCILED AGAINST THE LIVE DATABASE
-- ============================================================================
--
-- DO NOT APPLY BLINDLY. This file documents the Row Level Security posture
-- the client code assumes: every query in the app is scoped with
-- .eq('user_id', <authenticated user's id>), so each table below grants
-- full row access to its owner and nothing to anyone else.
--
-- Why it is not a migration yet: the live policy definitions could not be
-- introspected from here (the PostgREST OpenAPI endpoint requires a secret
-- API key, which is not available in this environment). Before promoting
-- this to supabase/migrations/, reconcile against the live database:
--
--   1. In the Supabase dashboard (or psql): compare pg_policies for each
--      table below against the CREATE POLICY statements here.
--   2. Confirm every table has a non-nullable user_id uuid column.
--   3. Confirm arc_progress_28d is defined with security_invoker = true so
--      it respects these policies instead of running as the view owner.
--   4. Apply, then re-run the app's authenticated flows as two different
--      users and confirm neither can read the other's rows.
--
-- Conventions used below:
--   * One policy per table: "Owner full access" FOR ALL, USING/WITH CHECK
--     (auth.uid() = user_id). FOR ALL covers the app's select/insert/update/
--     delete usage; nothing in the client needs cross-user reads.
--   * Statements are idempotent (DROP IF EXISTS before CREATE) so the file
--     can be re-run safely during reconciliation.

-- ---------------------------------------------------------------- profiles
drop policy if exists "Owner full access" on public.profiles;
create policy "Owner full access" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------- weekly_targets
drop policy if exists "Owner full access" on public.weekly_targets;
create policy "Owner full access" on public.weekly_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------- body_measurements
drop policy if exists "Owner full access" on public.body_measurements;
create policy "Owner full access" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------- readiness_checkins
drop policy if exists "Owner full access" on public.readiness_checkins;
create policy "Owner full access" on public.readiness_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------- workout_recommendation_sets
drop policy if exists "Owner full access" on public.workout_recommendation_sets;
create policy "Owner full access" on public.workout_recommendation_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------- workout_options
drop policy if exists "Owner full access" on public.workout_options;
create policy "Owner full access" on public.workout_options
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------- workout_option_exercises
drop policy if exists "Owner full access" on public.workout_option_exercises;
create policy "Owner full access" on public.workout_option_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --------------------------------------------------------- workout_sessions
drop policy if exists "Owner full access" on public.workout_sessions;
create policy "Owner full access" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------- workout_session_exercises
drop policy if exists "Owner full access" on public.workout_session_exercises;
create policy "Owner full access" on public.workout_session_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------- workout_sets
drop policy if exists "Owner full access" on public.workout_sets;
create policy "Owner full access" on public.workout_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------- saved_workouts
drop policy if exists "Owner full access" on public.saved_workouts;
create policy "Owner full access" on public.saved_workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --------------------------------------------------- wearable_daily_metrics
drop policy if exists "Owner full access" on public.wearable_daily_metrics;
create policy "Owner full access" on public.wearable_daily_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------- nutrition_sources
drop policy if exists "Owner full access" on public.nutrition_sources;
create policy "Owner full access" on public.nutrition_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------- nutrition_daily_summaries
drop policy if exists "Owner full access" on public.nutrition_daily_summaries;
create policy "Owner full access" on public.nutrition_daily_summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- arc_progress_28d (view)
-- ============================================================================
-- The client reads this derived view for the Arc visualization. It must be
-- defined with security_invoker = true so the owner's RLS policies above
-- apply to the underlying rows instead of the view running with the
-- definer's privileges:
--
--   create or replace view public.arc_progress_28d
--   with (security_invoker = true) as ...
--
-- Day attribution: prefer workout_sessions.local_date (the client's local
-- calendar day) over (completed_at at time zone 'UTC')::date so adherence
-- never shifts for non-UTC users. See migration
-- 20260927120000_add_workout_session_local_date.sql.
--
-- The live view definition is NOT captured here (could not be introspected
-- without a secret key). Capture it with `pg_get_viewdef` before editing.
