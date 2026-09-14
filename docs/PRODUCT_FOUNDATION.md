# Arc Phase 1 — Product Foundation

## Core promise
Arc helps the user answer two questions:
1. **What is the right amount of effort for me today?**
2. **Is my effort working over time?**

## 80/20 philosophy
80% is not an incomplete score. **80% is success.**

The product should reward sustained, aggressive consistency without turning health into a perfection game.

Suggested experience states:
- **Below 60%** — Build momentum
- **60–79%** — Closing the Arc
- **80–100%** — In Your Arc

The visual Arc can be fully achieved at 80% while still showing the user's actual adherence percentage.

## Phase 1 information architecture
### Today
- Hero Arc / current consistency state
- Primary CTA: **How do you feel today?**
- Lightweight progress context from recent workouts, body trend, wearable inputs and, when available, nutrition context

### Train
- Fast daily readiness questionnaire
- Three generated choices: **Restore / Build / Push**
- User selects the workout; Arc advises rather than dictates
- Workout execution and logging
- Save workout as a favorite

### Body
- Log measurements
- Trend charts
- Change from baseline and recent period

### Arc
- Explain consistency and progress trends in plain language
- Combine training, body, wearable and nutrition context without manufacturing a vague health score

### Connections
- Oura
- Apple Health / Apple Watch
- Nutrition sources such as Lose It!, Apple Health or file import
- Connection settings should live outside the primary daily navigation

## Nutrition design rule
Nutrition is **context, not another logging workflow**.

- Users should continue logging food in the tool they already use.
- Arc stores normalized daily totals only when a source is available.
- Direct Lose It! access is optional, not foundational.
- Apple Health and file import are valid alternate paths.
- Nutrition does **not** change workout-consistency Arc completion.
- Arc may use nutrition context for longitudinal insights once enough reliable data exists.
- No meal database, barcode scanner, recipe builder or duplicate calorie-entry flow belongs in Arc.

## UX principles
- Mobile-first web app
- Calm, premium, nature-inspired visual system
- Alpine green, slate blue, warm stone/sand, restrained champagne/bronze accents
- Mountains and natural landscapes are environmental backdrops, not decorative clutter
- One dominant action per screen
- Progress over pressure
- Explain recommendations when useful
- Never punish a user visually for choosing Restore
- More connected data should reduce user effort, not create more screens

## What we are intentionally not carrying forward
- Native meal logging / food database
- Community
- Broad legacy onboarding
- Legacy signal library
- Old POC page structure
- Old local-state assumptions

Reusable engineering ideas are allowed, but no old product behavior should be inherited accidentally.
