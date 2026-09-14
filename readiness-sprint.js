import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const BUILD = 'ready3';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = (id) => document.getElementById(id);
const baseUrl = `${window.location.origin}${window.location.pathname}`;
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const bootDate = localDate();
let arcUserId = null;
let arcObserverInstalled = false;

function ensureReadyStyles() {
  if (document.querySelector('link[data-arc-ready-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `./readiness-sprint.css?v=${BUILD}`;
  link.dataset.arcReadyStyle = '1';
  document.head.appendChild(link);
}
ensureReadyStyles();

function toast(message, timeout = 3200) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), timeout);
}

function friendlyError(error, fallback = 'Arc hit a snag. Try that again.') {
  const raw = String(error?.message || error || '').toLowerCase();
  if (raw.includes('invalid login credentials')) return 'That email or password is not right.';
  if (raw.includes('email not confirmed')) return 'Check your email and confirm your Arc account first.';
  if (raw.includes('user already registered')) return 'That email already has an Arc account. Sign in instead.';
  if (raw.includes('password') && raw.includes('least')) return 'Use a stronger password with at least 8 characters.';
  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('load failed')) return 'Arc cannot reach the server right now. Your in-progress workout entries stay safe on this device.';
  if (raw.includes('duplicate key') && raw.includes('workout_sessions_one_in_progress')) return 'You already have a workout in progress. Arc will resume that session instead of starting a duplicate.';
  if (raw.includes('duplicate key')) return 'That action is already saved.';
  return error?.message || fallback;
}

function setButtonBusy(button, busy, busyText = 'Working…') {
  if (!button) return;
  if (busy) {
    if (!button.dataset.readyOriginal) button.dataset.readyOriginal = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy','true');
    button.textContent = busyText;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.readyOriginal) {
      button.innerHTML = button.dataset.readyOriginal;
      delete button.dataset.readyOriginal;
    }
  }
}

function authMode(mode) {
  const login = $('loginForm');
  const signup = $('arcSignupForm');
  const forgot = $('arcForgotForm');
  const reset = $('arcResetForm');
  [login, signup, forgot, reset].forEach(el => el?.classList.add('hidden'));
  ({ login, signup, forgot, reset }[mode])?.classList.remove('hidden');
  const actions = $('arcAuthActions');
  if (actions) actions.classList.toggle('hidden', mode !== 'login');
}

function installAuthUI() {
  const card = document.querySelector('#authGate .auth-card');
  const login = $('loginForm');
  if (!card || !login || $('arcSignupForm')) return;

  const actions = document.createElement('div');
  actions.id = 'arcAuthActions';
  actions.className = 'arc-auth-actions';
  actions.innerHTML = `<button type="button" id="arcShowSignup" class="text-button">Create account</button><span>·</span><button type="button" id="arcShowForgot" class="text-button">Forgot password?</button>`;
  login.insertAdjacentElement('afterend', actions);

  const signup = document.createElement('form');
  signup.id = 'arcSignupForm';
  signup.className = 'stack-form hidden arc-auth-secondary';
  signup.innerHTML = `
    <div class="arc-auth-heading"><span class="eyebrow">New to Arc</span><h3>Create your account.</h3><p>Your starting point comes next.</p></div>
    <label>Email<input id="arcSignupEmail" type="email" autocomplete="email" required /></label>
    <label>Password<input id="arcSignupPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
    <label>Confirm password<input id="arcSignupConfirm" type="password" autocomplete="new-password" minlength="8" required /></label>
    <button class="button button-primary" type="submit">Create my Arc <span>→</span></button>
    <p id="arcSignupMessage" class="form-message" role="status"></p>
    <button type="button" class="text-button" data-auth-back>← Back to sign in</button>`;
  actions.insertAdjacentElement('afterend', signup);

  const forgot = document.createElement('form');
  forgot.id = 'arcForgotForm';
  forgot.className = 'stack-form hidden arc-auth-secondary';
  forgot.innerHTML = `
    <div class="arc-auth-heading"><span class="eyebrow">Account recovery</span><h3>Reset your password.</h3><p>We’ll send a secure recovery link.</p></div>
    <label>Email<input id="arcForgotEmail" type="email" autocomplete="email" required /></label>
    <button class="button button-primary" type="submit">Send reset link <span>→</span></button>
    <p id="arcForgotMessage" class="form-message" role="status"></p>
    <button type="button" class="text-button" data-auth-back>← Back to sign in</button>`;
  signup.insertAdjacentElement('afterend', forgot);

  const reset = document.createElement('form');
  reset.id = 'arcResetForm';
  reset.className = 'stack-form hidden arc-auth-secondary';
  reset.innerHTML = `
    <div class="arc-auth-heading"><span class="eyebrow">Secure recovery</span><h3>Choose a new password.</h3><p>Use at least 8 characters.</p></div>
    <label>New password<input id="arcResetPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
    <label>Confirm password<input id="arcResetConfirm" type="password" autocomplete="new-password" minlength="8" required /></label>
    <button class="button button-primary" type="submit">Update password <span>→</span></button>
    <p id="arcResetMessage" class="form-message" role="status"></p>`;
  forgot.insertAdjacentElement('afterend', reset);

  $('arcShowSignup')?.addEventListener('click', () => authMode('signup'));
  $('arcShowForgot')?.addEventListener('click', () => {
    if ($('loginEmail')?.value) $('arcForgotEmail').value = $('loginEmail').value;
    authMode('forgot');
  });
  card.querySelectorAll('[data-auth-back]').forEach(btn => btn.addEventListener('click', () => authMode('login')));

  signup.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = $('arcSignupMessage');
    const button = signup.querySelector('button[type="submit"]');
    const email = $('arcSignupEmail').value.trim();
    const password = $('arcSignupPassword').value;
    const confirm = $('arcSignupConfirm').value;
    if (password !== confirm) { message.textContent = 'Those passwords do not match.'; return; }
    setButtonBusy(button, true, 'Creating…');
    message.textContent = '';
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${baseUrl}?auth=confirmed&v=${BUILD}` }
      });
      if (error) throw error;
      if (data.session) {
        message.textContent = 'Account created. Opening your Arc…';
        setTimeout(() => window.location.replace(`${baseUrl}?v=${BUILD}`), 500);
      } else {
        message.textContent = 'Check your email to confirm your account, then Arc will bring you back here.';
      }
    } catch (error) {
      message.textContent = friendlyError(error, 'Could not create your account.');
    } finally { setButtonBusy(button, false); }
  });

  forgot.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = $('arcForgotMessage');
    const button = forgot.querySelector('button[type="submit"]');
    const email = $('arcForgotEmail').value.trim();
    setButtonBusy(button, true, 'Sending…');
    message.textContent = '';
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}?recovery=1&v=${BUILD}`
      });
      if (error) throw error;
      message.textContent = 'Reset link sent. Check your email.';
    } catch (error) {
      message.textContent = friendlyError(error, 'Could not send the reset link.');
    } finally { setButtonBusy(button, false); }
  });

  reset.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = $('arcResetMessage');
    const button = reset.querySelector('button[type="submit"]');
    const password = $('arcResetPassword').value;
    const confirm = $('arcResetConfirm').value;
    if (password !== confirm) { message.textContent = 'Those passwords do not match.'; return; }
    setButtonBusy(button, true, 'Updating…');
    message.textContent = '';
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      message.textContent = 'Password updated. Opening your Arc…';
      setTimeout(() => window.location.replace(`${baseUrl}?v=${BUILD}`), 650);
    } catch (error) {
      message.textContent = friendlyError(error, 'Could not update your password.');
      setButtonBusy(button, false);
    }
  });

  if (new URLSearchParams(location.search).get('recovery') === '1') authMode('reset');
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user?.id) arcUserId = session.user.id;
  if (event === 'PASSWORD_RECOVERY') {
    installAuthUI();
    authMode('reset');
  }
  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
    installArcObserver();
  }
});

async function hydrateUserId() {
  try {
    const { data } = await supabase.auth.getUser();
    arcUserId = data?.user?.id || arcUserId;
  } catch (_) {}
}

function parseDegrees(el) {
  const raw = el?.style?.getPropertyValue('--progress') || getComputedStyle(el || document.documentElement).getPropertyValue('--progress') || '0';
  const num = Number.parseFloat(raw);
  return Number.isFinite(num) ? num : 0;
}

function pulseArc(strong = false) {
  document.querySelectorAll('.arc-gauge').forEach(gauge => {
    gauge.classList.remove('arc-progress-pulse','arc-progress-pulse-strong');
    void gauge.offsetWidth;
    gauge.classList.add(strong ? 'arc-progress-pulse-strong' : 'arc-progress-pulse');
    setTimeout(() => gauge.classList.remove('arc-progress-pulse','arc-progress-pulse-strong'), 1250);
  });
}

function flareArc() {
  document.querySelectorAll('.arc-gauge').forEach(gauge => {
    gauge.classList.remove('arc-threshold-flare');
    void gauge.offsetWidth;
    gauge.classList.add('arc-threshold-flare');
    setTimeout(() => gauge.classList.remove('arc-threshold-flare'), 2100);
  });
}

function updateClosingState(deg) {
  document.querySelectorAll('.arc-gauge').forEach(gauge => gauge.classList.toggle('arc-closing', deg >= 270 && deg < 359.5));
}

async function handleArcChange() {
  const hero = $('arcGauge');
  if (!hero) return;
  await hydrateUserId();
  const deg = Math.max(0, Math.min(360, parseDegrees(hero)));
  updateClosingState(deg);
  const key = `arc:last-progress:${arcUserId || 'anon'}`;
  const stored = localStorage.getItem(key);
  const previous = stored == null ? null : Number(stored);
  localStorage.setItem(key, String(deg));
  if (previous == null || !Number.isFinite(previous)) return;
  if (deg > previous + 0.25) {
    pulseArc(deg - previous >= 45);
    if (previous < 359.5 && deg >= 359.5) flareArc();
  }
}

function installArcObserver() {
  if (arcObserverInstalled) return;
  const hero = $('arcGauge');
  if (!hero) { setTimeout(installArcObserver, 350); return; }
  arcObserverInstalled = true;
  let queued;
  const observer = new MutationObserver(() => {
    clearTimeout(queued);
    queued = setTimeout(handleArcChange, 40);
  });
  observer.observe(hero, { attributes:true, attributeFilter:['style','class'] });
  handleArcChange();
}

function installNetworkBanner() {
  if ($('arcNetworkBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'arcNetworkBanner';
  banner.className = 'arc-network-banner hidden';
  banner.setAttribute('role','status');
  document.body.appendChild(banner);
  const render = () => {
    if (navigator.onLine) {
      banner.classList.add('hidden');
      banner.textContent = '';
      syncVisibleWorkoutDrafts();
    } else {
      banner.textContent = 'Offline · workout entries stay on this device and will sync when you reconnect.';
      banner.classList.remove('hidden');
    }
  };
  window.addEventListener('online', () => { render(); toast('Back online. Arc is syncing your workout.'); });
  window.addEventListener('offline', render);
  render();
}

const DRAFT_PREFIX = 'arc:workout-draft:';
function draftKey(row) { return row?.dataset?.exerciseId ? `${DRAFT_PREFIX}${row.dataset.exerciseId}:${row.dataset.setNumber}` : null; }
function snapshotRow(row) {
  return {
    reps: row.querySelector('.set-reps')?.value ?? null,
    duration: row.querySelector('.set-duration')?.value ?? null,
    weight: row.querySelector('.set-weight')?.value ?? null,
    completed: row.querySelector('.set-completed')?.checked || false,
    updated_at: Date.now()
  };
}
function saveDraft(row) {
  const key = draftKey(row); if (!key) return;
  try { localStorage.setItem(key, JSON.stringify(snapshotRow(row))); } catch (_) {}
}
function clearDraft(row) {
  const key = draftKey(row); if (!key) return;
  try { localStorage.removeItem(key); } catch (_) {}
}
function applyDraft(row, shouldSync = navigator.onLine) {
  const key = draftKey(row); if (!key || row.dataset.draftRestored === '1') return;
  let draft;
  try { draft = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { draft = null; }
  if (!draft) return;
  row.dataset.draftRestored = '1';
  const reps = row.querySelector('.set-reps');
  const duration = row.querySelector('.set-duration');
  const weight = row.querySelector('.set-weight');
  const completed = row.querySelector('.set-completed');
  if (reps && draft.reps != null) reps.value = draft.reps;
  if (duration && draft.duration != null) duration.value = draft.duration;
  if (weight && draft.weight != null) weight.value = draft.weight;
  if (completed) completed.checked = !!draft.completed;
  row.classList.toggle('set-complete', !!draft.completed);
  if (shouldSync) setTimeout(() => (completed || reps || duration || weight)?.dispatchEvent(new Event('change', { bubbles:true })), 180);
}
function syncVisibleWorkoutDrafts() {
  document.querySelectorAll('.live-set-row').forEach(row => {
    row.dataset.draftRestored = '';
    applyDraft(row, true);
  });
}

function installWorkoutDraftResilience() {
  document.addEventListener('input', (event) => {
    const row = event.target.closest?.('.live-set-row');
    if (row) saveDraft(row);
  }, true);
  document.addEventListener('change', (event) => {
    const row = event.target.closest?.('.live-set-row');
    if (row) saveDraft(row);
  }, true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      const saveState = target?.closest?.('.set-save-state') || (target?.classList?.contains('set-save-state') ? target : null);
      if (saveState?.textContent?.trim() === 'Saved') {
        const row = saveState.closest('.live-set-row');
        if (row) clearDraft(row);
      }
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('.live-set-row')) applyDraft(node);
        node.querySelectorAll?.('.live-set-row').forEach(row => applyDraft(row));
      });
    }
  });
  observer.observe(document.body, { childList:true, subtree:true, characterData:true });
}

function installDuplicateGuards() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-edge-start-option]');
    if (!button) return;
    if (button.dataset.arcStarting === '1') {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    button.dataset.arcStarting = '1';
    button.disabled = true;
    button.dataset.startText = button.textContent;
    button.textContent = 'Starting…';
    setTimeout(() => {
      if (!button.isConnected) return;
      button.dataset.arcStarting = '';
      button.disabled = false;
      if (button.dataset.startText) button.textContent = button.dataset.startText;
    }, 5000);
  }, true);

  const guarded = new Set(['loginForm','setupForm','measurementForm']);
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!guarded.has(form?.id)) return;
    if (form.dataset.arcSubmitLock === '1') {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    form.dataset.arcSubmitLock = '1';
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    setTimeout(() => {
      form.dataset.arcSubmitLock = '';
      if (submit?.isConnected) submit.disabled = false;
    }, 4200);
  }, true);
}

function installFriendlyToastMapper() {
  const el = $('toast'); if (!el) return;
  let rewriting = false;
  new MutationObserver(() => {
    if (rewriting) return;
    const current = el.textContent || '';
    const friendly = friendlyError(current, current);
    if (friendly && friendly !== current) {
      rewriting = true;
      el.textContent = friendly;
      rewriting = false;
    }
  }).observe(el, { childList:true, characterData:true, subtree:true });
}

function installDayBoundaryGuard() {
  const check = () => {
    if (localDate() !== bootDate) window.location.replace(`${baseUrl}?v=${BUILD}&day=${localDate()}`);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  const now = new Date();
  const next = new Date(now);
  next.setHours(24,0,2,0);
  setTimeout(check, Math.max(1000, next - now));
}

function installInviteAction() {
  const observer = new MutationObserver(() => {
    const panel = document.querySelector('.starting-point-panel');
    if (!panel || $('arcInviteSomeone')) return;
    const button = document.createElement('button');
    button.id = 'arcInviteSomeone';
    button.className = 'starting-point-action arc-invite-action';
    button.innerHTML = `<div><strong>Invite someone to Arc</strong><span>Share the app so they can create their own private account and starting point.</span></div><b>↗</b>`;
    panel.querySelector('#resetBaseline')?.insertAdjacentElement('afterend', button);
    button.addEventListener('click', async () => {
      const shareData = { title:'Arc — Progress has a Shape', text:'Try Arc — aggressive consistency without perfection.', url:`${baseUrl}?v=${BUILD}` };
      try {
        if (navigator.share) await navigator.share(shareData);
        else {
          await navigator.clipboard.writeText(shareData.url);
          toast('Arc invite link copied.');
        }
      } catch (error) {
        if (error?.name !== 'AbortError') toast('Could not share the invite right now.');
      }
    });
  });
  observer.observe(document.body, { childList:true, subtree:true });
}

function installAppStatus() {
  const status = document.createElement('div');
  status.id = 'arcBuildStamp';
  status.hidden = true;
  status.dataset.build = BUILD;
  document.body.appendChild(status);
}

installAuthUI();
installNetworkBanner();
installWorkoutDraftResilience();
installDuplicateGuards();
installFriendlyToastMapper();
installDayBoundaryGuard();
installInviteAction();
installAppStatus();
hydrateUserId().then(installArcObserver);

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    installAuthUI();
    installArcObserver();
    if (localDate() !== bootDate) window.location.replace(`${baseUrl}?v=${BUILD}&day=${localDate()}`);
  }
});
