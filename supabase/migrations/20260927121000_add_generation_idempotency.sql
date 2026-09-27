-- Generation idempotency for the workout recommendation engine.
--
-- The client sends a per-submission idempotency_key with every
-- generate-workouts call (AI attempts share one key; the on-device
-- deterministic fallback uses the same key with a '-fallback' suffix).
-- The edge function returns the existing recommendation set on replay
-- instead of generating — and billing OpenAI for — a duplicate.
--
-- The edge function also degrades gracefully when this column does not
-- exist yet: it generates without the key rather than failing.

alter table public.workout_recommendation_sets
  add column if not exists idempotency_key text;

comment on column public.workout_recommendation_sets.idempotency_key is
  'Client-generated key per readiness submission. Replays with the same key within 24h return the original recommendation set instead of generating a duplicate.';

-- Partial unique index: historical rows have NULL keys and must not conflict
-- with each other, so only non-null keys participate in the constraint.
create unique index if not exists workout_recommendation_sets_user_idempotency_key_uidx
  on public.workout_recommendation_sets (user_id, idempotency_key)
  where idempotency_key is not null;
