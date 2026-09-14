alter table public.profiles add column if not exists baseline_started_at timestamptz;

update public.profiles
set baseline_started_at = coalesce(baseline_started_at, created_at, now())
where baseline_started_at is null;

alter table public.profiles alter column baseline_started_at set default now();
alter table public.profiles alter column baseline_started_at set not null;

comment on column public.profiles.baseline_started_at is
  'User-controlled starting line for body and setup comparisons. Resetting preserves historical events and moves this timestamp forward.';
