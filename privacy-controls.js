import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

const TABLES = [
  'profiles',
  'weekly_targets',
  'body_measurements',
  'readiness_checkins',
  'workout_recommendation_sets',
  'workout_options',
  'workout_option_exercises',
  'workout_sessions',
  'workout_session_exercises',
  'workout_sets',
  'saved_workouts',
  'device_connections',
  'wearable_daily_metrics',
  'nutrition_sources',
  'nutrition_daily_summaries'
];

const $ = id => document.getElementById(id);

function toast(message, timeout = 3400) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove('show'), timeout);
}

function ensurePrivacyControls() {
  const panel = document.querySelector('#startingPointPanel .starting-point-panel');
  if (!panel || $('arcPrivacyControls')) return;

  const section = document.createElement('section');
  section.id = 'arcPrivacyControls';
  section.className = 'arc-privacy-controls';
  section.innerHTML = `
    <div class="arc-privacy-heading">
      <span class="eyebrow">Data & privacy</span>
      <h3>Your data stays yours.</h3>
      <p>Arc stores your account and progress data securely so it can power training, trends, and recommendations.</p>
    </div>

    <button id="exportArcData" class="starting-point-action privacy-action" type="button">
      <div><strong>Export my data</strong><span>Download a portable JSON copy of the data connected to your Arc account.</span></div><b>↓</b>
    </button>

    <button id="showArcPrivacy" class="starting-point-action privacy-action" type="button">
      <div><strong>How Arc uses my data</strong><span>See what is stored and what is shared when AI workout generation runs.</span></div><b>→</b>
    </button>

    <div id="arcPrivacyDetails" class="arc-privacy-details hidden">
      <p><strong>Stored by Arc</strong><br />Your profile, training history, readiness check-ins, body measurements, saved workouts, and any connected nutrition or wearable summaries are stored in Supabase and protected by account-level access controls.</p>
      <p><strong>Used for AI workouts</strong><br />When Arc generates an adaptive workout, it sends the workout context needed for that recommendation — such as your goal, equipment, readiness, recent training, and available wearable summaries — to OpenAI. Your Arc password is not sent to OpenAI.</p>
      <p><strong>Your choice</strong><br />Arc does not sell your personal data. You can export your data or permanently delete your Arc account and stored Arc data at any time.</p>
    </div>

    <button id="startDeleteArcAccount" class="starting-point-action delete-account-action" type="button">
      <div><strong>Delete account</strong><span>Permanently delete your Arc account and associated Arc data.</span></div><b>×</b>
    </button>

    <div id="deleteArcConfirm" class="delete-arc-confirm hidden">
      <p><strong>This cannot be undone.</strong><br />Your account, workouts, readiness history, body measurements, and connected Arc data will be permanently deleted.</p>
      <label>Type <strong>DELETE</strong> to confirm
        <input id="deleteArcConfirmInput" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" />
      </label>
      <div class="delete-arc-actions">
        <button id="confirmDeleteArcAccount" class="button arc-danger-button" type="button" disabled>Delete my account</button>
        <button id="cancelDeleteArcAccount" class="button" type="button">Cancel</button>
      </div>
    </div>`;

  panel.appendChild(section);

  $('showArcPrivacy')?.addEventListener('click', () => {
    $('arcPrivacyDetails')?.classList.toggle('hidden');
  });
  $('exportArcData')?.addEventListener('click', exportArcData);
  $('startDeleteArcAccount')?.addEventListener('click', () => {
    $('deleteArcConfirm')?.classList.remove('hidden');
    $('deleteArcConfirmInput')?.focus();
  });
  $('cancelDeleteArcAccount')?.addEventListener('click', resetDeleteConfirm);
  $('deleteArcConfirmInput')?.addEventListener('input', event => {
    const confirmed = event.target.value.trim() === 'DELETE';
    const button = $('confirmDeleteArcAccount');
    if (button) button.disabled = !confirmed;
  });
  $('confirmDeleteArcAccount')?.addEventListener('click', deleteArcAccount);
}

function resetDeleteConfirm() {
  $('deleteArcConfirm')?.classList.add('hidden');
  const input = $('deleteArcConfirmInput');
  if (input) input.value = '';
  const button = $('confirmDeleteArcAccount');
  if (button) button.disabled = true;
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Sign in again to manage your Arc data.');
  return data.user;
}

async function exportArcData() {
  const button = $('exportArcData');
  const original = button?.innerHTML;
  try {
    if (button) {
      button.disabled = true;
      button.innerHTML = '<div><strong>Preparing export…</strong><span>Collecting your Arc data securely.</span></div><b>…</b>';
    }

    const user = await currentUser();
    const results = await Promise.all(TABLES.map(async table => {
      const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
      if (error) throw new Error(`Could not export ${table}.`);
      return [table, data || []];
    }));

    const exportPayload = {
      product: 'Arc',
      exported_at: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email || null,
        created_at: user.created_at || null,
        last_sign_in_at: user.last_sign_in_at || null
      },
      data: Object.fromEntries(results)
    };

    const text = JSON.stringify(exportPayload, null, 2);
    const filename = `arc-data-${new Date().toISOString().slice(0,10)}.json`;
    const file = new File([text], filename, { type: 'application/json' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: 'Arc data export', files: [file] });
        toast('Your Arc export is ready.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Your Arc export is ready.');
  } catch (error) {
    toast(error.message || 'Arc could not export your data.');
  } finally {
    if (button) {
      button.disabled = false;
      if (original) button.innerHTML = original;
    }
  }
}

async function clearArcClientState() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (_) {}

  try {
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('arc')) localStorage.removeItem(key);
    });
  } catch (_) {}

  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('arc-')).map(key => caches.delete(key)));
  } catch (_) {}
}

async function deleteArcAccount() {
  const button = $('confirmDeleteArcAccount');
  if (!$('deleteArcConfirmInput') || $('deleteArcConfirmInput').value.trim() !== 'DELETE') return;

  const original = button?.textContent;
  try {
    if (button) {
      button.disabled = true;
      button.textContent = 'Deleting…';
    }

    await currentUser();
    const { data, error } = await supabase.functions.invoke('delete-account', {
      body: { confirm: 'DELETE' }
    });
    if (error || !data?.ok) throw new Error(data?.error || 'Arc could not delete your account.');

    await clearArcClientState();
    window.location.replace('./?account=deleted');
  } catch (error) {
    toast(error.message || 'Arc could not delete your account.');
    if (button) {
      button.disabled = false;
      button.textContent = original || 'Delete my account';
    }
  }
}

function install() {
  ensurePrivacyControls();
  const params = new URLSearchParams(window.location.search);
  if (params.get('account') === 'deleted') {
    setTimeout(() => {
      const message = $('loginMessage');
      if (message) message.textContent = 'Your Arc account and stored Arc data were deleted.';
    }, 50);
  }
}

window.addEventListener('DOMContentLoaded', install);
window.setTimeout(install, 50);
window.setTimeout(install, 500);
