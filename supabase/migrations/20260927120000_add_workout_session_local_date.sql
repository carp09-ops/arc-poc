-- Timezone-safe day attribution for workouts.
--
-- The client records the user's local calendar day at completion time, so
-- adherence bucketing in arc_progress_28d never has to guess the user's
-- timezone from a UTC timestamp (which misattributes sessions completed
-- near midnight for non-UTC users).
--
-- The client writes this column defensively: if the migration has not been
-- applied yet, completion retries without local_date rather than failing.

alter table public.workout_sessions
  add column if not exists local_date date;

comment on column public.workout_sessions.local_date is
  'Local calendar day the workout was completed, as observed on the client. Prefer this over (completed_at at time zone ''UTC'')::date when bucketing adherence in arc_progress_28d.';

-- Best-effort backfill from the UTC timestamp. Rows completed near midnight
-- in non-UTC timezones may be off by one day until clients write local_date.
update public.workout_sessions
set local_date = (completed_at at time zone 'UTC')::date
where local_date is null
  and completed_at is not null;
