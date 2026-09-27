// Single source of truth for the asset version tag.
//
// Previously auth-entry.js (ready15), readiness-sprint.js (ready3) and
// arc-icons.js (ready28) each carried their own stale tag, so email links,
// the day-boundary reload and icon URLs pointed at old ?v= values.
// Import { BUILD } from here instead of defining a local tag.
export const BUILD = 'ready37';
