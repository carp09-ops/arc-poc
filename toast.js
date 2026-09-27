// Single toast + friendly-error system for Arc.
//
// Previously four overlapping implementations rewrote error copy
// (core-app, edge-workouts, readiness-sprint, auth-hardening), with two of
// them driven by MutationObservers that could re-rewrite already-friendly
// text. All user-facing toasts go through toast() here; raw errors are mapped
// to friendly copy once, at the call site.
const $ = (id) => document.getElementById(id);

export function friendlyError(error, fallback = 'Arc hit a snag. Try that again.') {
  const raw = String(error?.message || error || '').toLowerCase();
  if (!raw) return fallback;
  if (raw.includes('invalid login credentials')) return 'That email or password is not right.';
  if (raw.includes('email not confirmed')) return 'Check your email and confirm your Arc account first.';
  if (raw.includes('user already registered')) return 'That email already has an Arc account. Sign in instead.';
  if (raw.includes('password') && raw.includes('least')) return 'Use a stronger password with at least 8 characters.';
  if (raw.includes('rate limit') || raw.includes('too many')) return 'Too many requests. Give Arc a minute, then try again.';
  if (raw.includes('failed to fetch') || raw.includes('networkerror') || raw.includes('network') || raw.includes('load failed'))
    return 'Arc cannot reach the server right now. Your entries stay safe on this device — try again in a moment.';
  if (raw.includes('duplicate key') && raw.includes('workout_sessions_one_in_progress'))
    return 'You already have a workout in progress. Arc will resume that session instead of starting a duplicate.';
  if (raw.includes('jwt') && (raw.includes('expired') || raw.includes('invalid')))
    return 'Your Arc session expired. Sign in again to keep going.';
  if (raw.includes('row-level security') || raw.includes('permission denied'))
    return 'Arc could not save that change. Try signing in again.';
  if (raw.startsWith('data error:'))
    return 'Arc could not load everything just now. Your saved data is safe — try again in a moment.';
  if (raw.includes('duplicate key')) return 'That action is already saved.';
  return error?.message || fallback;
}

let timer = null;

export function toast(message, timeout = 3000) {
  const el = $('toast');
  if (!el) return;
  el.textContent = friendlyError(message, message);
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), timeout);
}
