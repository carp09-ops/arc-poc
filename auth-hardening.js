const recoveryMode = new URLSearchParams(window.location.search).get('recovery') === '1';

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

const observer = new MutationObserver(() => {
  forceRecoveryGate();
  mapLoginMessage();
});
observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'], characterData:true });

forceRecoveryGate();
mapLoginMessage();
setTimeout(forceRecoveryGate, 250);
setTimeout(forceRecoveryGate, 900);
