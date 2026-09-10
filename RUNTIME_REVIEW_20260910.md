# ARC Runtime Review — 2026-09-10

## Scope
Full review of the GitHub Pages boot path after Safari/iPad repeatedly rendered ARC and then returned to a blank page after background/resume. Netlify is intentionally excluded from this repair.

## Root architectural finding
ARC had evolved as a stack of versioned JavaScript patches. `app.js` rendered immediately, then several later files rendered again while the runtime was still installing. At the same time, multiple features used document-wide `MutationObserver` instances to decorate, replace, remove, and re-add DOM nodes. Authentication was also part of the critical script chain.

This created a startup/render storm rather than one deterministic boot. The design was especially fragile under iOS Safari lifecycle suspension/resume.

## High-risk findings

1. **Repeated load-time renders.** `v03`, `v031`, `v032`, `v033`, `v034`, `v041`, `v042`, `v05`, `v051`, `v052`, and `v06` can render during module installation. `v034` renders unconditionally.
2. **Observer feedback loops.** `v054`, `v061`, `v07`, `v071`, `v073`, and `v075` watched large portions of the document. `v071` could replace `.arc-passive-morning` from inside its own mutation callback; `v07` could re-add the teaser that `v071` removed.
3. **Auth blocked product boot.** The old entrypoint loaded the Supabase CDN before local product scripts. A slow or failed CDN could prevent ARC itself from executing.
4. **Unsafe auth callback.** The legacy cloud layer awaited cloud hydration inside `onAuthStateChange`, a pattern that can deadlock/re-enter auth work.
5. **Global Storage monkey patch.** The legacy cloud runtime replaced `Storage.prototype.setItem` to detect state writes, affecting every storage call on the page.
6. **Destructive version migration.** The old entrypoint removed `arcState` and `arcStarted` whenever `arcVersion` differed from `0.3.3`.
7. **Boot overlay dependency.** The previous Pages boot waited on a 23-stylesheet preload counter and the full script chain before releasing the screen.
8. **Divergent second entrypoint.** `go.html` independently booted an older ARC build, had its own destructive state reset, and used a blocking Supabase script.
9. **GitHub Pages reset-path bugs.** Recovery links that use `/` return to the host root rather than `/arc-poc/`.

## Repair written on `runtime-stability-review-20260910`

### Controlled render lifecycle
`runtime/gate.js` captures the base render after `app.js`, suppresses subsequent historical load-time renders while feature layers install, and emits `arc:rendered` after normal renders. `runtime/bootstrap.js` performs one controlled final render and has a bounded fail-open path.

### Event-driven feature decoration
The active runtime no longer loads the observer-heavy historical implementations for branding, Connected Body, Passive Morning, password recovery, or the 80/20 card. They are replaced by:

- `runtime/brand.js`
- `runtime/connected.js`
- `runtime/passive.js`
- `runtime/balance.js`
- `runtime/recovery.js`

These respond to explicit lifecycle events (`arc:rendered`, `arc:cloud-ready`, `arc:auth-rendered`, `arc:connected-opened`) rather than watching the entire document.

### Auth separated from product boot
`runtime/cloud.js` creates the ARC auth shield immediately, loads Supabase asynchronously with a fallback CDN, keeps `onAuthStateChange` synchronous, defers hydration outside the callback, removes the Storage prototype patch, removes automatic reload recovery, and emits explicit cloud lifecycle events.

If the auth library is slow or unavailable, the product scripts still finish. The user receives a visible retry state instead of a blank app.

### State safety
The entrypoint no longer clears valid ARC data on a version mismatch. If `arcState` contains malformed JSON, the exact string is backed up to `arcStateRecoveryBackup` and `arcState` is replaced with a safe `null` value so the app can boot and cloud hydration can restore state.

### Canonical entrypoint
`go.html` now redirects to `./` and preserves query/hash instead of running a second ARC application stack.

### Recovery path
`reset.html` dynamically loads Supabase, uses a bounded recovery-session check, keeps its auth callback synchronous, and returns to the GitHub Pages project root rather than the domain root.

## Legacy files intentionally retained but no longer active
The following files remain in the repository for history/rollback but are not loaded by the repaired `index.html`:

- `v053.js`
- `v054.js`
- `v061.js`
- `v07.js`
- `v071.js`
- `v073.js`
- `v075.js`

Their CSS remains active so the replacement runtime preserves the established ARC visual system.

## Remaining debt
The older product layers still contain load-time render calls and some module-load `save()` calls. The render gate neutralizes the load-time DOM churn without rewriting the feature logic in this stabilization pass. A later consolidation should fold the historical patch chain into a smaller set of first-class modules, but that is deliberately separated from restoring a reliable production POC.

## Release gates
The repair should not be promoted until:

1. JavaScript syntax checks pass for the active chain.
2. Stable runtime contains no `MutationObserver`.
3. Stable runtime does not monkey-patch Storage.
4. `onAuthStateChange` remains synchronous.
5. `index.html` has no destructive state reset and no blocking external auth script.
6. One final real-device Safari test covers cold load, sign-in/cloud hydrate, background/resume, and return to the same tab.
