const recoveryMode = new URLSearchParams(window.location.search).get('recovery') === '1';
let duplicateRecoveryQueued = false;
let toastRewriting = false;

function forceRecoveryGate() {
  if (!recoveryMode) return;
  document.getElementById('authGate')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  document.getElementById('setupGate')?.classList.add('hidden');
  document.getElementById('loginForm')?.classList.add('hidden');
  document.getElementById('arcAuthActions')?.classList.add('hidden');
  document.getElementById('arcSignupForm')?.classList.add('hidden');
  document.getElementById('arcForgotForm')?.classList.add('hidden');
  document.getElementById('arcResetForm')?.classList.remove('hidden');
}

function mapLoginMessage() {
  const el = document.getElementById('loginMessage');
  if (!el) return;
  const raw = (el.textContent || '').toLowerCase();
  if (raw.includes('invalid login credentials')) el.textContent = 'That email or password is not right.';
  else if (raw.includes('email not confirmed')) el.textContent = 'Check your email and confirm your Arc account first.';
  else if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('load failed')) el.textContent = 'Arc cannot reach the server right now. Check your connection and try again.';
}

function polishOperationalToast() {
  const toast = document.getElementById('toast');
  if (!toast || toastRewriting) return;
  const current = toast.textContent || '';
  const raw = current.toLowerCase();
  let next = current;
  if (raw.startsWith('data error:')) next = 'Arc could not load everything just now. Your saved data is safe — try again in a moment.';
  else if (raw.includes('jwt') && (raw.includes('expired') || raw.includes('invalid'))) next = 'Your Arc session expired. Sign in again to keep going.';
  else if (raw.includes('row-level security') || raw.includes('permission denied')) next = 'Arc could not save that change. Your account is safe; try signing in again.';
  else if (raw.includes('failed to fetch') || raw.includes('networkerror') || raw.includes('load failed')) next = 'You appear to be offline. Workout entries stay on this device until Arc reconnects.';
  if (next !== current) {
    toastRewriting = true;
    toast.textContent = next;
    toastRewriting = false;
  }
}

function recoverDuplicateWorkout() {
  const toast = document.getElementById('toast');
  if (!toast || duplicateRecoveryQueued) return;
  const raw = (toast.textContent || '').toLowerCase();
  if (!raw.includes('already have a workout in progress') && !raw.includes('workout_sessions_one_in_progress')) return;
  duplicateRecoveryQueued = true;
  toast.textContent = 'You already have a workout in progress. Resuming it now…';
  setTimeout(() => window.location.reload(), 900);
}

const observer = new MutationObserver(() => {
  forceRecoveryGate();
  mapLoginMessage();
  polishOperationalToast();
  recoverDuplicateWorkout();
});
observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'], characterData:true });

forceRecoveryGate();
mapLoginMessage();
polishOperationalToast();
recoverDuplicateWorkout();
setTimeout(forceRecoveryGate, 250);
setTimeout(forceRecoveryGate, 900);
