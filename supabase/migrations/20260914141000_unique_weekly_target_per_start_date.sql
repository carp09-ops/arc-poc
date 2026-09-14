alter table public.weekly_targets
add constraint weekly_targets_user_start_unique unique (user_id, starts_on);
