ARC ECLIPSE V5 — DROP-IN UPDATE

What this does
- Uses the new fiery asymmetric eclipse artwork in the Arc hero.
- Reveals only the real corona as progress increases.
- Adds a subtle continuous breathing/pulsing effect.
- Adds a stronger pulse while closing the Arc and a flare when entering In Your Arc.

Files included
- assets/fiery_asymmetric_solar_eclipse.png
- arc-eclipse-v5.css
- arc-eclipse-v5.js

How to integrate into the existing app
1. Copy fiery_asymmetric_solar_eclipse.png into your repo's /assets folder.
2. Add arc-eclipse-v5.css and arc-eclipse-v5.js into the project root (or your preferred asset location).
3. In app.js, AFTER the current eclipse styles/scripts, add:
   addStyle('./arc-eclipse-v5.css');
   import './arc-eclipse-v5.js?v=ready17';
4. In the Arc hero markup, ensure the eclipse element has one of these classes:
   .arc-eclipse OR .arc-hero-eclipse OR .arc-visual
5. Ensure the state/meta text exists somewhere within the same section using any of:
   .arc-state, .arc-consistency, [data-arc-state], [data-arc-meta]
6. Bump your cache/build version (ready17 or later) in:
   - index.html query strings
   - manifest.webmanifest start_url/icon queries
   - app.js BUILD constant
   - service-worker.js CACHE_VERSION and any shell imports

Recommended behavior mapping
- Build momentum -> low partial corona reveal
- Closing the Arc -> strong reveal, stronger pulse
- In Your Arc -> full reveal and flare animation on entry
- Learning -> keep small meta label under the stage text

Notes
- This file is an override and is meant to sit on top of your current ready16 structure.
- The JS reads the stage/meta text already rendered by your app and converts it to a progress value.
