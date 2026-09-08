# Arc POC 0.1

**Progress has a shape.**

Mobile-first proof of concept for Arc. This build validates the core experience: onboarding → plan → track → understand → adjust.

## Test flows
- Complete onboarding and baseline reveal.
- Today → Start workout → finish workout.
- Today → Nutrition + → add a meal.
- Body → Update Measurements.
- Arc → review the seeded 30-day story and Signal.
- Community is intentionally a preview.

## GitHub Pages
This is a static app. Publish the `main` branch from `/ (root)` in **Settings → Pages**.

## Reset onboarding
Clear site/browser storage, or run `localStorage.removeItem('arcStarted')` in browser developer tools.

> POC 0.1 uses seeded/demo data and browser-local state only. It is not yet a real health-data store.
