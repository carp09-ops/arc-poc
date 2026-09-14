# Arc — Phase 1

**Progress has a shape.**

This repository is the clean foundation for the new Arc web app.

## Product thesis
Arc helps people choose the right effort for today and understand whether that effort is producing meaningful progress over time.

**80 is the new 100.** Reaching 80% consistency means the user is *In Your Arc*: aggressive enough to make progress, flexible enough to sustain it.

## Phase 1 scope
- Arc consistency experience centered on the 80/20 philosophy
- Body measurement logging and progress analytics
- Daily readiness check-in with three AI-generated workout options: Restore, Build, Push
- Workout logging, favorites, and training analytics
- Wearable connections, beginning with a data model that supports Oura and Apple Health

## Deliberately out of scope
- Nutrition logging
- Community / social features
- Legacy signal engine concepts
- Legacy Arc POC UI or database schema

## Current state
The prior application code has been removed from `main`. The prior Supabase application schema has also been cleared. Supabase Auth is intentionally retained so existing login access can be reused.

Before implementation, see `docs/PRODUCT_FOUNDATION.md` and `docs/DATA_MODEL_DRAFT.md`.
