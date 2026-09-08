# Arc 0.4 — Longitudinal Data Foundation

Arc’s product promise depends on comparing behaviors with body response over time. This document defines the local POC data shape so the UI can evolve without requiring another data-model rewrite before Supabase.

## Core principle

Events are dated records. Aggregates are derived views.

Do not make `workouts: 4`, `bodyChecks: 2`, or `calories: 1600` the source of truth. Keep the underlying records and calculate summaries from them.

## State shape

```js
S = {
  meta: {
    dataVersion: '0.4',
    createdAt,
    updatedAt,
    lastSignalEvaluation
  },
  profile: {
    name,
    goals,
    primary,
    why,
    life,
    sleep,
    location,
    experience,
    days,
    duration,
    nutrition,
    preferences: {
      activities: [],
      equipment: []
    }
  },
  history: {
    workouts: [],
    nutrition: [],
    body: [],
    activity: [],
    sleep: [],
    signals: []
  }
}
```

## Workout event

```js
{
  id,
  date,
  completedAt,
  name,
  durationMin,
  planned,
  completed,
  exercises: [],
  volume,
  notes
}
```

Future `exercises` should contain exercise-level sets and progression data instead of putting every set at workout level.

## Nutrition event

```js
{
  id,
  date,
  loggedAt,
  name,
  meal,
  calories,
  protein,
  carbs,
  fat
}
```

A daily calorie or protein total is derived by grouping entries by `date`.

## Body check-in

```js
{
  id,
  date,
  loggedAt,
  weight,
  waist,
  hips,
  chest,
  thigh,
  arm,
  note
}
```

Every measurement is optional. Signals should require the fields they actually use rather than assuming a complete check-in.

## Activity event

```js
{
  id,
  date,
  loggedAt,
  steps,
  activeMinutes,
  distanceMiles,
  source
}
```

`source` prepares the model for manual entry, Apple Health, wearables, or imports.

## Sleep event

```js
{
  id,
  date,
  loggedAt,
  hours,
  quality,
  source
}
```

## Signal record

```js
{
  id,
  title,
  status,       // watching | active
  confidence,   // Early | Moderate (POC vocabulary)
  summary,
  evidence: {},
  domains: [],
  windowDays,
  evaluatedAt
}
```

Signals are deterministic in the POC. The UI should distinguish:

- **Learning** — insufficient evidence
- **Watching** — enough data to compare, not enough to make a strong observation
- **Active Signal** — rule threshold satisfied

Never use causal language from observational data. Prefer “associated with,” “tended to,” “appears,” and “may.”

## POC 0.4 Signal rules

### Scale plateau + waist improvement

Window: 14 days

Requirements:
- at least 2 body check-ins with weight and waist
- absolute weight change < 1%
- waist decrease >= 0.5 in

Output: **The scale isn’t telling the whole story.**

### Plan fit

Window: 21 days

Requirements:
- planned frequency comes from profile training days
- at least 3 completed workouts
- 85%+ estimated adherence promotes the observation from watching to active

Output: **Your schedule is becoming testable.**

### Strength progression

Window: 28 days

Requirements:
- at least 4 workouts containing comparable volume
- later-half average volume > early-half average by 10%

Output: **You’re getting stronger.**

### Protein pattern

Window: 28 days

Requirements:
- at least 3 logged workout days with protein
- at least 3 logged non-workout days with protein

Output compares average protein on workout vs other logged days. It does not claim protein caused workout performance.

### Activity baseline

Window: 14 days

Requirements:
- at least 7 days with steps

Output reports average movement as a baseline, not a target.

## Debug / test data

Open the POC with `?debug=1` to expose the hidden **ARC LAB** panel.

It can:
- seed 7, 14, 30, or 60 days of realistic local data
- evaluate the Signal engine immediately
- reset historical data
- display evidence and generated Signal states

This gives product testing a way to validate month-long experiences without waiting a month.

## Supabase mapping later

The local arrays intentionally map cleanly to future tables:

- `profiles`
- `workouts`
- `workout_exercises`
- `workout_sets`
- `nutrition_entries`
- `body_checkins`
- `activity_entries`
- `sleep_entries`
- `signals`
- `signal_evidence`

The browser state remains the POC source of truth until cloud persistence is intentionally introduced.
