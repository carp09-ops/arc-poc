# Arc — Phase 1

**Progress has a shape.**

Arc is a mobile-first health and training web app built around a simple philosophy:

> **80 is the new 100.**

The goal is aggressive consistency without requiring perfection. Reaching 80% adherence completes the visual Arc and means the user is **In Your Arc**.

## Phase 1 product

- **Today** — Arc status, rolling consistency, body snapshot, recent training, and one dominant CTA: *How do you feel today?*
- **Train** — a fast readiness check-in that returns three distinct workout paths: **Restore / Build / Push**.
- **Body** — longitudinal body measurements stored canonically in metric units, with imperial display support and trend analytics.
- **Arc** — the 80/20 philosophy expressed as a derived 28-day adherence experience; no stored mystery score.
- **Connections** — the integration surface for Oura and Apple Health.
- **Workouts** — sessions can be started, completed, abandoned without counting, and favorited.

## Current implementation

The prior Arc application code and application schema were removed before Phase 1 began. Supabase Auth was intentionally retained so existing login access could be reused.

The current web shell is connected to the new Supabase schema with RLS enabled on every user-data table. Workout generation now runs through the protected `generate-workouts` Supabase Edge Function instead of direct client-side recommendation writes.

The generator has two execution paths:

1. **Model path** — when `OPENAI_API_KEY` is configured in the Supabase function environment, Arc requests strict structured workout output from **GPT-5.6 Luna**.
2. **Safe fallback** — if the secret is not configured or model generation fails validation, the Edge Function falls back automatically to the deterministic server rules engine.

The browser never receives the model key, and both paths persist the same recommendation contract so the UI and analytics remain stable.

## Data model principles

- Events are the source of truth; dashboards are derived.
- Historical weekly commitments are immutable snapshots.
- Body measurements are stored in canonical metric units.
- Generated workout options are separate from completed workout sessions.
- Wearable data is normalized into daily metrics instead of recreating vendor apps.
- OAuth secrets and model secrets are never stored in public application tables or browser code.
- Arc status is derived from completed qualifying workouts versus the user's historical commitment.

## Arc calculation

For the active rolling window:

- **0–59% actual adherence:** Build Momentum
- **60–79%:** Closing the Arc
- **80%+:** In Your Arc

The visual Arc completion is `actual adherence / 80`, capped at 100%. Therefore **80% actual adherence renders as a fully completed Arc**. Higher adherence can still be shown as information, but does not create a better-than-complete score.

## Source layout

- `app.js` — lightweight module loader
- `core-app.js` — Phase 1 application shell and non-generator workflows
- `edge-workouts.js` — authenticated readiness/workout flow that invokes the Edge Function
- `supabase/functions/generate-workouts/index.ts` — protected workout generator
- `supabase/config.toml` — Edge Function auth configuration

## Deliberately out of scope

- Nutrition logging
- Community / social features
- Legacy signal engine concepts
- Legacy POC UI or database schema

See `docs/PRODUCT_FOUNDATION.md` and `docs/DATA_MODEL_DRAFT.md` for the product and modeling rationale.
